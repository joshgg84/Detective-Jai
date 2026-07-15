// server.js - Detective Jai Website Backend
// Calls the bot API for scam detection

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Your bot API URL (Render service URL)
const BOT_API_URL = process.env.BOT_API_URL || 'https://scam-detection-vcn3.onrender.com';

// ============================================
// 📁 ENSURE DATA DIRECTORY EXISTS
// ============================================

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory');
}

// ============================================
// DATA STORAGE (Users with Language Preference)
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
// 💬 CHAT API — Calls Bot API
// ============================================

app.post('/api/chat', async (req, res) => {
    const { message, userId, language } = req.body;
    
    if (!message) {
        return res.status(400).json({
            success: false,
            error: 'Message is required'
        });
    }

    console.log(`📨 Chat: ${message.substring(0, 50)}...`);

    try {
        // Call the bot API for scam detection
        const response = await axios.post(`${BOT_API_URL}/api/chat`, {
            message: message,
            userId: userId || 'web_user'
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000 // 60 seconds (Render free tier cold start)
        });

        let reply = response.data.response;

        // If language is pidgin, try to translate the response
        if (language === 'pidgin' && reply) {
            reply = convertToPidgin(reply);
        }

        res.json({
            success: true,
            response: reply,
            language: language || 'en'
        });
        
    } catch (err) {
        console.error('Chat error:', err.message);
        
        // Fallback response if bot API is down
        const fallback = getFallbackResponse(message, language);
        res.json({
            success: true,
            response: fallback,
            fallback: true
        });
    }
});

// ============================================
// PIDGIN TRANSLATION (Simple)
// ============================================

function convertToPidgin(text) {
    const translations = {
        '🚨 *ALERT!*': '🚨 *WAHALA!*',
        '⚠️ *CLEAR*': '⚠️ *KLEAR*',
        'is a REPORTED SCAMMER': 'na SCAMMER wey people don report',
        'has no reports': 'no report yet',
        'Do not send money': 'No send money',
        'Block immediately': 'Block am immediately',
        'Still be cautious': 'Still dey careful',
        'Thank you for your testimonial': 'Thank you for your testimony',
        'God bless you': 'God bless you',
        'Help Others Stay Safe': 'Help others stay safe',
        'Scammers': 'Scammers',
        'reported': 'wey dem report',
        'TRUSTED NUMBER': 'TRUSTED NUMBER'
    };
    
    let pidgin = text;
    for (const [english, pidginText] of Object.entries(translations)) {
        pidgin = pidgin.replace(new RegExp(english, 'g'), pidginText);
    }
    return pidgin;
}

// ============================================
// FALLBACK RESPONSE (When Bot API is Down)
// ============================================

function getFallbackResponse(message, language = 'en') {
    const lower = message.toLowerCase();
    
    // Check for phone number
    const numberMatch = message.match(/(\+234[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4}|0[789][01]\d{8})/);
    if (numberMatch) {
        return `✅ Checking number ${numberMatch[0]}...\n\nThis number has no reports. Still be cautious.`;
    }
    
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return "👋 Hello! I'm Detective Jai. How can I help you today?\n\nTry:\n• Check a number: 'check 08012345678'\n• Check a message: 'check this message: ...'\n• Report: 'report 08012345678'";
    }
    
    if (lower.includes('help') || lower.includes('what can you do')) {
        return `📚 *WHAT I CAN DO*\n\n• Check numbers: "check 08012345678"\n• Check messages: "check this message: URGENT..."\n• Check links: "check link: https://..."\n• Report scammers: "report 08012345678"\n• Loan advice: "I need a loan of ₦..."\n• Stats: "how many scammers"\n• Learn scams: "what is phishing"\n\nJust type naturally!`;
    }
    
    if (lower.includes('report')) {
        const number = message.match(/(\+234[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{4}|0[789][01]\d{8})/);
        if (number) {
            return `📢 Thank you for reporting ${number[0]}.\n\nAdmin will review this number.`;
        }
        return "📢 To report a scammer, send: 'report 08012345678'";
    }
    
    if (lower.includes('stats') || lower.includes('how many')) {
        return `📊 I have caught scammers so far.\n\nReport suspicious numbers to help me catch more!`;
    }
    
    return `🤔 I'm not sure I understand.\n\nTry:\n• "check 08012345678"\n• "report 08012345678"\n• "help"\n• "what is phishing"`;
}

// ============================================
// LANGUAGE PREFERENCE ENDPOINT
// ============================================

app.post('/api/user/language', (req, res) => {
    const { userId, language } = req.body;
    
    if (!userId || !language) {
        return res.status(400).json({
            success: false,
            error: 'User ID and language are required'
        });
    }
    
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            error: 'User not found'
        });
    }
    
    users[userIndex].preferredLanguage = language;
    writeUsers(users);
    
    res.json({
        success: true,
        message: 'Language preference updated',
        language: language
    });
});

// ============================================
// CONFIG ENDPOINT
// ============================================

app.get('/api/config', (req, res) => {
    res.json({
        botApiUrl: `${BOT_API_URL}/api/chat`,
        requiresApiKey: false,
        websiteUrl: `https://${req.get('host')}`,
        supportedLanguages: ['en', 'pidgin', 'yo', 'ha']
    });
});

// ============================================
// STATS ENDPOINT
// ============================================

app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${BOT_API_URL}/api/stats`, { timeout: 5000 });
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
        preferredLanguage: 'en',
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
        user: { 
            id: user.id, 
            fullName: user.fullName, 
            email: user.email,
            preferredLanguage: user.preferredLanguage || 'en'
        }
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
        user: { 
            id: user.id, 
            fullName: user.fullName, 
            email: user.email, 
            phone: user.phone,
            preferredLanguage: user.preferredLanguage || 'en'
        }
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
        preferredLanguage: user.preferredLanguage || 'en',
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
    console.log('🕵️ Detective Jai Website Backend');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Bot API: ${BOT_API_URL}`);
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
    console.log(`👥 Users: ${readUsers().length} registered`);
    console.log('========================================');
});