// script.js - Detective Jai Web Interface

const BOT_API_URL = '/api/chat';
const STATS_API_URL = '/api/stats';

let isWaiting = false;
let waitingMessageId = null;

// Load stats on page load
async function loadStats() {
    try {
        const response = await fetch(STATS_API_URL);
        const data = await response.json();
        if (data.scammers) {
            document.getElementById('scammerCount').innerText = data.scammers;
        }
    } catch (err) {
        console.log('Stats not available');
        document.getElementById('scammerCount').innerText = '--';
    }
}

// Send message to API
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message || isWaiting) return;

    // Add user message to chat
    addMessage(message, 'user');
    input.value = '';
    
    // Show waiting message
    isWaiting = true;
    waitingMessageId = addMessageWithId("⏳ *Bot is waking up...*\n\nOur scam detector is on a free server. First request takes **30-50 seconds**.\n\nPlease wait... 🙏", 'bot');

    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, userId: 'web_user' })
        });

        const data = await response.json();
        isWaiting = false;
        
        if (waitingMessageId) {
            removeMessage(waitingMessageId);
            waitingMessageId = null;
        }
        
        if (data.response) {
            addMessage(data.response, 'bot');
        } else if (data.error) {
            addMessage(`⚠️ ${data.error}\n\n📱 Try our Telegram bot: @JoshuaGiwaBot`, 'bot');
        } else {
            addMessage('⚠️ Unexpected response. Please try again.', 'bot');
        }
    } catch (err) {
        isWaiting = false;
        if (waitingMessageId) {
            removeMessage(waitingMessageId);
            waitingMessageId = null;
        }
        addMessage('⚠️ Connection error. Please try again or use our Telegram bot: @JoshuaGiwaBot', 'bot');
    }
}

function quickCommand(command) {
    document.getElementById('chatInput').value = command;
    sendMessage();
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Format markdown-like text
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

function addMessageWithId(text, sender) {
    const messagesDiv = document.getElementById('chatMessages');
    const msgId = 'msg_' + Date.now() + '_' + Math.random();
    const messageDiv = document.createElement('div');
    messageDiv.id = msgId;
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
    return msgId;
}

function removeMessage(msgId) {
    const messageDiv = document.getElementById(msgId);
    if (messageDiv) {
        messageDiv.remove();
    }
}

function showTyping(show) {
    const typingDiv = document.getElementById('chatTyping');
    typingDiv.style.display = show ? 'flex' : 'none';
}

function clearChat() {
    const messagesDiv = document.getElementById('chatMessages');
    messagesDiv.innerHTML = '';
    addMessage("👋 Chat cleared! Type /help to see commands or ask me about any suspicious message.", 'bot');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Load stats when page loads
loadStats();

// Focus input on load
document.getElementById('chatInput').focus();