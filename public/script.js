// script.js - Detective Jai Web Interface
// Works with the multi-page setup (index.html, chat.html, help.html, contact.html, privacy.html)

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
    if (!statsElement) return; // Only run on pages that have the stats element

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
// CHAT FUNCTIONS (Only run on chat page)
// ============================================

function isChatPage() {
    return document.getElementById('chatMessages') !== null;
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return; // Only run on chat page

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
            addMessage(data.response, 'bot');
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

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    let formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

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
    addMessage("👋 Chat cleared! Type /help to see commands or ask me about any suspicious message.", 'bot');
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

// Load config and stats
loadConfig().then(() => {
    loadStats();
});

// If on chat page, focus the input
if (isChatPage()) {
    const input = document.getElementById('chatInput');
    if (input) input.focus();
}

// If on help page, setup search listener
const helpSearch = document.getElementById('helpSearch');
if (helpSearch) {
    helpSearch.addEventListener('input', filterHelp);
}