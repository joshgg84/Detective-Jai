// chat.js - Detective Jai Web Chat
// Complete working version with simple formatting

// ============================================
// CONFIGURATION
// ============================================

// Use relative path - works with your server.js
const API_URL = '/api/chat';

// ============================================
// DOM ELEMENTS
// ============================================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatTyping = document.getElementById('chatTyping');

// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    showTyping(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, userId: 'web_user' })
        });

        const data = await response.json();
        showTyping(false);

        if (data.success && data.response) {
            addMessage(data.response, 'bot');
        } else if (data.error) {
            addMessage('⚠️ ' + data.error, 'bot');
        } else {
            addMessage('⚠️ Unexpected response. Please try again.', 'bot');
        }
    } catch (err) {
        showTyping(false);
        console.error('Error:', err);
        addMessage('⚠️ Connection error. Please try again.', 'bot');
    }
}

// ============================================
// QUICK COMMAND
// ============================================

function quickCommand(text) {
    chatInput.value = text;
    sendMessage();
}

// ============================================
// ADD MESSAGE
// ============================================

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Convert newlines to <br>
    let formattedText = text.replace(/\n/g, '<br>');

    // Bold: *text* to <strong>text</strong>
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Italic: _text_ to <em>text</em>
    formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');

    // Code: `text` to <code>text</code>
    formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');

    // Bullets: • or - at start of line
    formattedText = formattedText.replace(/^[•\-]\s/gm, '• ');

    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ============================================
// TYPING INDICATOR
// ============================================

function showTyping(show) {
    chatTyping.style.display = show ? 'flex' : 'none';
}

// ============================================
// CLEAR CHAT
// ============================================

function clearChat() {
    chatMessages.innerHTML = '';
    addMessage('👋 Chat cleared! How can I help you today?', 'bot');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ============================================
// FOCUS INPUT ON LOAD
// ============================================

chatInput.focus();