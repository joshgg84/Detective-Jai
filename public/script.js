// script.js - Detective Jai Web Interface
// Updated for simple formatting from natural.js

let BOT_API_URL = '/api/chat'; // fallback

// ============================================
// LOAD CONFIGURATION
// ============================================

async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        BOT_API_URL = config.botApiUrl || '/api/chat';
        console.log('✅ Bot API URL:', BOT_API_URL);
    } catch (err) {
        console.log('⚠️ Using default API URL');
    }
}

// ============================================
// LOAD STATS (Only runs on pages with #scammerCount)
// ============================================

async function loadStats() {
    const statsElement = document.getElementById('scammerCount');
    if (!statsElement) return;

    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        if (data.scammers) {
            statsElement.innerText = data.scammers;
        }
    } catch (err) {
        console.log('⚠️ Stats not available');
        statsElement.innerText = '--';
    }
}

// ============================================
// CHAT FUNCTIONS
// ============================================

function isChatPage() {
    return document.getElementById('chatMessages') !== null;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';
    showTyping(true);

    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, userId: 'web_user' })
        });

        const data = await response.json();
        showTyping(false);

        if (data.response) {
            // Simple formatting - just display as plain text with line breaks
            addFormattedMessage(data.response, 'bot');
        } else if (data.error) {
            addMessage(`⚠️ ${data.error}\n\n📱 Try our Telegram bot: @JoshuaGiwaBot`, 'bot');
        } else {
            addMessage('⚠️ Unexpected response. Please try again.', 'bot');
        }
    } catch (err) {
        showTyping(false);
        console.error('❌ Fetch error:', err);
        addMessage('⚠️ Connection error. Please try again. Telegram bot: @JoshuaGiwaBot', 'bot');
    }
}

function quickCommand(command) {
    const input = document.getElementById('chatInput');
    if (!input) return;
    input.value = command;
    sendMessage();
}

// ============================================
// MESSAGE DISPLAY - Simple Formatting
// ============================================

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Simple formatting: just handle line breaks
    let formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    // Convert simple bullets (• or -) to styled bullets
    formattedText = formattedText.replace(/^[•\-]\s/gm, '• ');

    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addFormattedMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Handle simple formatting with line breaks
    let formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');

    // Convert simple bullets (• or -) to styled bullets
    formattedText = formattedText.replace(/^[•\-]\s/gm, '• ');

    // Convert bold: *text* to <strong>text</strong>
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Convert italic: _text_ to <em>text</em>
    formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');

    // Convert code: `text` to <code>text</code>
    formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');

    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showTyping(show) {
    const typingDiv = document.getElementById('chatTyping');
    if (!typingDiv) return;
    typingDiv.style.display = show ? 'flex' : 'none';
}

function clearChat() {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    messagesDiv.innerHTML = '';
    addMessage("👋 Chat cleared! I'm here to help you detect scams and give loan advice. What do you need?", 'bot');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ============================================
// HELP PAGE SEARCH
// ============================================

function filterHelp() {
    const input = document.getElementById('helpSearch');
    if (!input) return;

    const filter = input.value.toLowerCase();
    const items = document.querySelectorAll('.help-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? 'block' : 'none';
    });
}

// ============================================
// INITIALIZATION
// ============================================

loadConfig().then(() => {
    loadStats();
});

if (isChatPage()) {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
}

const helpSearch = document.getElementById('helpSearch');
if (helpSearch) {
    helpSearch.addEventListener('input', filterHelp);
}