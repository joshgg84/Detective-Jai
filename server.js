// server.js - Detective Jai Frontend Backend

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DETECTION_API_URL = process.env.DETECTION_API_URL || 'https://scam-detection-vcn3.onrender.com';

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors());
app.use(express.json());

// Serve all static files from the 'public' folder
// This automatically handles: index.html, chat.html, help.html, contact.html, privacy.html, style.css, script.js, etc.
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    dotfiles: 'ignore'
}));

// ============================================
// API ROUTES
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
// 404 HANDLER (Optional but recommended)
// ============================================

// Handle any requests that don't match a static file or API route
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🕵️ Detective Jai Frontend Backend');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Detection API: ${DETECTION_API_URL}`);
    console.log('📄 Pages:');
    console.log(`   - Home: http://localhost:${PORT}/`);
    console.log(`   - Chat: http://localhost:${PORT}/chat.html`);
    console.log(`   - Help: http://localhost:${PORT}/help.html`);
    console.log(`   - Contact: http://localhost:${PORT}/contact.html`);
    console.log(`   - Privacy: http://localhost:${PORT}/privacy.html`);
    console.log('========================================');
});