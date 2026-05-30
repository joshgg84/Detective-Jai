// server.js - Detective Jai Web Service
// Calls your bot's API gateway at scam-detection.onrender.com

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Your bot's API gateway
const BOT_API_URL = process.env.BOT_API_URL || 'https://scam-detection.onrender.com/api/chat';

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== API PROXY ==========
// Forward all chat requests to your bot's API gateway
app.post('/api/chat', async (req, res) => {
    const { message, userId } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userId: userId || 'web_user' })
        });
        
        const data = await response.json();
        res.json(data);
        
    } catch (err) {
        console.error('Error calling bot API:', err.message);
        res.status(503).json({ 
            error: 'Bot service unavailable. Please try again or use our Telegram bot.',
            telegram: 'https://t.me/Det_jai_bot'
        });
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'Detective Jai Web'
    });
});

// ========== STATS PROXY ==========
app.get('/api/stats', async (req, res) => {
    try {
        const response = await fetch('https://scam-detection.onrender.com/api/stats');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.json({ scammers: '--', error: 'Unable to fetch' });
    }
});

// ========== SPA FALLBACK ==========
// Send index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log('========================================');
    console.log('🕵️ Detective Jai Web Service');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Bot API: ${BOT_API_URL}`);
    console.log('========================================');
});