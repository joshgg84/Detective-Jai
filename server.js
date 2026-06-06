// server.js - Detective Jai Website (Express Web Service)

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Get bot API URL from environment variable
const BOT_API_URL = process.env.BOT_API_URL || 'https://scam-detection-vcn3.onrender.com/api/chat';

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Make BOT_API_URL available to frontend via a config endpoint
app.get('/api/config', (req, res) => {
    res.json({ botApiUrl: BOT_API_URL });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('🕵️ Detective Jai Website');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📡 Bot API: ${BOT_API_URL}`);
    console.log('========================================');
});