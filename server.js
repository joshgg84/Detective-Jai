// server.js - Detective Jai Full Backend
const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DETECTION_API_URL = process.env.DETECTION_API_URL || 'https://scam-detection-vcn3.onrender.com';

// ============================================
// DATA STORAGE
// ============================================

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE));
    } catch {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// EXPLICIT ROUTES — Define admin.html first!
// ============================================

// Admin page (must come before static)
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    dotfiles: 'ignore'
}));

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
// API ENDPOINTS (Chat & Stats)
// ============================================

app.get('/api/config', (req, res) => {
    res.json({
        botApiUrl: `${DETECTION_API_URL}/api/chat`
    });
});

app.get('/api/stats', async (req, res) => {
    try {
        const response = await axios.get(`${DETECTION_API_URL}/api/stats`, { timeout: 5000 });
        res.json(response.data);
    } catch (err) {
        console.error('❌ Stats fetch error:', err.message);
        res.json({ scammers: 0 });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const response = await axios.post(`${DETECTION_API_URL}/api/chat`, req.body, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        res.json(response.data);
    } catch (err) {
        console.error('❌ Chat proxy error:', err.message);

        if (err.response) {
            res.status(err.response.status).json({
                error: err.response.data?.error || 'Backend error',
                response: '⚠️ The detection service returned an error. Please try again.'
            });
        } else if (err.code === 'ECONNABORTED') {
            res.status(504).json({
                error: 'Request timeout',
                response: '⏰ The detection service took too long to respond. Please try again.'
            });
        } else {
            res.status(500).json({
                error: 'Connection error',
                response: '⚠️ Could not connect to the detection service. Please try again later.'
            });
        }
    }
});

// ============================================
// ADMIN — VIEW ALL USERS (With Password Protection)
// ============================================

app.get('/api/admin/users', (req, res) => {
    const password = req.query.password;

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
    console.log(`📍 URL: http://localhost:${PORT}`);
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
    console.log(`👥 Users: ${readUsers().length} registered`);
    console.log('========================================');
});