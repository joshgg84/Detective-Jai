// chat.js - Detective Jai Web Chat
// API key is provided by the developer/admin

// ============================================
// CONFIGURATION
// ============================================

const API_URL = '/api/chat';

// The developer must set this manually or through a secure process
// This can be loaded from a server-side config or environment variable
let API_KEY = ''; // Will be set by the developer

// ============================================
// DOM ELEMENTS
// ============================================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatTyping = document.getElementById('chatTyping');

// ============================================
// SET API KEY (Called by developer/admin)
// ============================================

function setApiKey(key) {
    API_KEY = key;
    console.log('✅ API Key set');
}

// For development, you can set it here (but better to get it from server)
// The developer would call this function with the key

// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Check if API key is set
    if (!API_KEY) {
        addMessage('⚠️ API key not set. Please contact the administrator.', 'bot');
        return;
    }

    addMessage(message, 'user');
    chatInput.value = '';
    showTyping(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                message: message,
                userId: 'web_user'
            })
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

    let formattedText = text.replace(/\n/g, '<br>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/_(.*?)_/g, '<em>$1</em>');
    formattedText = formattedText.replace(/`(.*?)`/g, '<code>$1</code>');

    contentDiv.innerHTML = formattedText;
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping(show) {
    chatTyping.style.display = show ? 'flex' : 'none';
}

function clearChat() {
    chatMessages.innerHTML = '';
    addMessage('👋 Chat cleared!', 'bot');
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ============================================
// INITIALIZATION
// ============================================

chatInput.focus();

// The developer must set the API key
// Example: setApiKey('generated-key-from-ddds');