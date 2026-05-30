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
app.post('/api/chat', async (req, res) => {
    const { message, userId } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    // Set timeout for Render free tier (can take 30-50 seconds to wake up)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 70000);
    
    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userId: userId || 'web_user' }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        res.json(data);
        
    } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error calling bot API:', err.message);
        
        // Friendly message when bot is waking up or unavailable
        res.status(503).json({ 
            response: `⚠️ *Bot is waking up...*\n\nOur scam detector runs on a free server. The first request takes **30-50 seconds** to wake up.\n\n🔄 Please wait a moment and try again.\n\n📱 *Or use our Telegram bot instantly:*\n@JoshuaGiwaBot\n\nThank you for your patience! 🇳🇬`
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
        res.json({ scammers: '--', error: 'Bot waking up. Try again.' });
    }
});

// ========== SPA FALLBACK ==========
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