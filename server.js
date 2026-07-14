// server.js - Detective Jai Full Backend
const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DETECTION_API_URL = process.env.DETECTION_API_URL || 'https://scam-detection-vcn3.onrender.com';

// ============================================
// 📁 ENSURE DATA DIRECTORY EXISTS
// ============================================

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory');
}

// ============================================
// 📋 API KEY STORAGE (JSON file)
// ============================================

const KEYS_FILE = path.join(DATA_DIR, 'api_keys.json');

// Initialize keys file if it doesn't exist
if (!fs.existsSync(KEYS_FILE)) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify([]));
    console.log('📄 Created api_keys.json');
}

function readApiKeys() {
    try {
        const data = fs.readFileSync(KEYS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading API keys:', err);
        return [];
    }
}

function writeApiKeys(keys) {
    try {
        fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
    } catch (err) {
        console.error('Error writing API keys:', err);
    }
}

function isValidApiKey(key) {
    const keys = readApiKeys();
    return keys.includes(key);
}

function generateApiKey() {
    // Generate a random 32-character hex string
    return crypto.randomBytes(32).toString('hex');
}

// ============================================
// DATA STORAGE (Users)
// ============================================

const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
    console.log('📄 Created users.json');
}

function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading users:', err);
        return [];
    }
}

function writeUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error writing users:', err);
    }
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    dotfiles: 'ignore'
}));

// ============================================
// 🔐 API KEY AUTHENTICATION MIDDLEWARE
// ============================================

function authenticateApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required.',
            code: 'MISSING_API_KEY'
        });
    }

    if (!isValidApiKey(apiKey)) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API key.',
            code: 'INVALID_API_KEY'
        });
    }

    next();
}

// ============================================
// 🔑 GENERATE API KEY ENDPOINT (GET & POST)
// ============================================

// GET endpoint - use query parameter
app.get('/ddds/generate', (req, res) => {
    const { secret } = req.query;
    
    const GENERATION_SECRET = process.env.GENERATION_SECRET || 'admin-secret-key';
    
    if (!secret || secret !== GENERATION_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Invalid generation secret.'
        });
    }

    const newKey = generateApiKey();
    const keys = readApiKeys();
    keys.push(newKey);
    writeApiKeys(keys);

    console.log(`🔑 New API key generated: ${newKey.substring(0, 8)}...`);

    res.json({
        success: true,
        apiKey: newKey,
        message: 'API key generated successfully.',
        totalKeys: keys.length
    });
});

// POST endpoint - use body parameter (for compatibility)
app.post('/ddds/generate', (req, res) => {
    const { secret } = req.body;
    
    const GENERATION_SECRET = process.env.GENERATION_SECRET || 'admin-secret-key';
    
    if (!secret || secret !== GENERATION_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Invalid generation secret.'
        });
    }

    const newKey = generateApiKey();
    const keys = readApiKeys();
    keys.push(newKey);
    writeApiKeys(keys);

    console.log(`🔑 New API key generated: ${newKey.substring(0, 8)}...`);

    res.json({
        success: true,
        apiKey: newKey,
        message: 'API key generated successfully.',
        totalKeys: keys.length
    });
});

// ============================================
// 📋 LIST API KEYS ENDPOINT (Admin)
// ============================================

app.get('/ddds/keys', (req, res) => {
    const { secret } = req.query;

    const GENERATION_SECRET = process.env.GENERATION_SECRET || 'admin-secret-key';
    
    if (!secret || secret !== GENERATION_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Invalid generation secret.'
        });
    }

    const keys = readApiKeys();
    // Only show first 8 characters for security
    const maskedKeys = keys.map(key => ({
        key: key.substring(0, 8) + '...',
        full: key,
        index: keys.indexOf(key)
    }));

    res.json({
        success: true,
        total: keys.length,
        keys: maskedKeys
    });
});

// ============================================
// 🗑️ REVOKE API KEY ENDPOINT (Admin)
// ============================================

app.delete('/ddds/keys/:index', (req, res) => {
    const { secret } = req.body;
    const index = parseInt(req.params.index);

    const GENERATION_SECRET = process.env.GENERATION_SECRET || 'admin-secret-key';
    
    if (!secret || secret !== GENERATION_SECRET) {
        return res.status(401).json({
            success: false,
            error: 'Invalid generation secret.'
        });
    }

    const keys = readApiKeys();
    if (index < 0 || index >= keys.length) {
        return res.status(404).json({
            success: false,
            error: 'Key not found.'
        });
    }

    const removed = keys.splice(index, 1);
    writeApiKeys(keys);

    res.json({
        success: true,
        message: `Key ${removed[0].substring(0, 8)}... revoked successfully.`,
        totalKeys: keys.length
    });
});

// ============================================
// 🔐 CHAT API — Protected with API Key
// ============================================

app.post('/api/chat', authenticateApiKey, async (req, res) => {
    const { message, userId } = req.body;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            error: 'Message is required'
        });
    }

    console.log(`📨 Chat: ${message.substring(0, 50)}...`);

    try {
        let response;
        try {
            const natural = require('./natural.js');
            response = natural.processNaturalInput(message, userId || 'web_user', 'web_user');
        } catch (err) {
            console.log('⚠️ natural.js not found, using fallback');
            response = getFallbackResponse(message);
        }
        
        res.json({
            success: true,
            response: response
        });
    } catch (err) {
        console.error('Chat error:', err);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// ============================================
// FALLBACK RESPONSE
// ============================================

function getFallbackResponse(message) {
    const lower = message.toLowerCase();
    
    if (lower.includes('hello') || lower.includes('hi')) {
        return "Hello! I'm Detective Jai. How can I help you today?";
    }
    
    if (lower.includes('check') && lower.includes('number')) {
        const number = message.match(/\d{11}/);
        if (number) {
            return `✅ Checking number ${number[0]}...\n\nThis number has no reports. Still be cautious.`;
        }
        return "Please send a valid 11-digit phone number.";
    }
    
    if (lower.includes('loan') || lower.includes('need money')) {
        const amount = message.match(/\d+/);
        if (amount) {
            return `💰 I see you need a loan of ₦${amount[0]}.\n\nPlease tell me your monthly income so I can recommend the best option.`;
        }
        return "💰 How much do you need? Send it like this: 'I need a loan of ₦50,000'";
    }
    
    if (lower.includes('help') || lower.includes('what can you do')) {
        return "📚 What I Can Do:\n\n• Check numbers: 'Check this number: 080...'\n• Check messages: 'Check this message: ...'\n• Check links: 'Is this link safe? ...'\n• Loan advice: 'I need a loan of ₦...'\n• Stats: 'How many scammers have you caught?'";
    }
    
    if (lower.includes('stats') || lower.includes('how many')) {
        return "📊 I have caught 47 scammers so far. Report suspicious numbers to help me catch more!";
    }
    
    return "I'm not sure I understand. Try these:\n\n• 'Check this number: 080...'\n• 'I need a loan of ₦...'\n• 'What can you do?'\n• 'How many scammers have you caught?'";
}

// ============================================
// CONFIG ENDPOINT
// ============================================

app.get('/api/config', (req, res) => {
    // This endpoint doesn't return the API key anymore
    // The frontend gets the key from the admin/developer
    res.json({
        botApiUrl: '/api/chat',
        requiresApiKey: true
    });
});

// ============================================
// STATS ENDPOINT
// ============================================

app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${DETECTION_API_URL}/api/stats`, { timeout: 5000 });
        res.json(response.data);
    } catch (err) {
        console.error('❌ Stats fetch error:', err.message);
        res.json({ scammers: 0 });
    }
});

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

app.post('/api/signup', (req, res) => {
    const { fullName, email, phone, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Full name, email, and password are required.'
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            error: 'Password must be at least 6 characters.'
        });
    }

    const users = readUsers();

    if (users.find(u => u.email === email)) {
        return res.status(400).json({
            success: false,
            error: 'Email already registered.'
        });
    }

    const newUser = {
        id: Date.now().toString(),
        fullName,
        email,
        phone: phone || '',
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.json({
        success: true,
        message: 'Account created successfully!',
        user: { id: newUser.id, fullName, email }
    });
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email and password are required.'
        });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Invalid email or password.'
        });
    }

    res.json({
        success: true,
        message: 'Login successful!',
        user: { id: user.id, fullName: user.fullName, email: user.email }
    });
});

app.get('/api/user/:id', (req, res) => {
    const users = readUsers();
    const user = users.find(u => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
    }

    res.json({
        success: true,
        user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone }
    });
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

app.post('/api/admin', (req, res) => {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASS) {
        return res.status(401).json({
            success: false,
            error: 'Invalid admin password'
        });
    }

    const users = readUsers();
    const safeUsers = users.map(user => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || 'Not provided',
        createdAt: user.createdAt
    }));

    res.json({
        success: true,
        total: safeUsers.length,
        users: safeUsers
    });
});

app.delete('/api/admin/users/:id', (req, res) => {
    const userId = req.params.id;
    let users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    users.splice(userIndex, 1);
    writeUsers(users);

    res.json({ success: true, message: 'User deleted successfully' });
});

// ============================================
// 404 HANDLER
// ============================================

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🕵️ Detective Jai Full Backend');
    console.log(`📍 URL: https://detective-jai.onrender.com:${PORT}`);
    console.log(`📡 Detection API: ${DETECTION_API_URL}`);
    console.log('📄 Pages:');
    console.log(`   - Home: http://localhost:${PORT}/`);
    console.log(`   - Chat: http://localhost:${PORT}/chat.html`);
    console.log(`   - Help: http://localhost:${PORT}/help.html`);
    console.log(`   - Contact: http://localhost:${PORT}/contact.html`);
    console.log(`   - Privacy: http://localhost:${PORT}/privacy.html`);
    console.log(`   - Sign Up: http://localhost:${PORT}/signup.html`);
    console.log(`   - Login: http://localhost:${PORT}/login.html`);
    console.log(`   - Admin: http://localhost:${PORT}/admin.html`);
    console.log('========================================');
    console.log(`🔑 Total API Keys: ${readApiKeys().length}`);
    console.log(`👥 Users: ${readUsers().length} registered`);
    console.log('========================================');
});