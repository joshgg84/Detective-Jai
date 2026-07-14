// chat.js - Detective Jai Web Chat

// ============================================
// CONFIGURATION
// ============================================

const API_URL = '/api/chat';
let API_KEY = '';

// ============================================
// DOM ELEMENTS
// ============================================

const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatTyping = document.getElementById('chatTyping');

// ============================================
// SET API KEY (Auto-fetch from server)
// ============================================

async function setApiKey() {
    try {
        const response = await fetch('/api/key');
        const data = await response.json();
        
        if (data.success && data.apiKey) {
            API_KEY = data.apiKey;
            console.log('✅ API Key set successfully!');
        } else {
            console.error('❌ No API key available:', data.error);
            addMessage('⚠️ No API key available. Please generate one at /ddds/generate', 'bot');
        }
    } catch (err) {
        console.error('Failed to fetch API key:', err);
        addMessage('⚠️ Could not load API key. Please refresh or contact admin.', 'bot');
    }
}

// Call the function when page loads
setApiKey();

// ============================================
// FUNCTION TO SET API KEY MANUALLY (for debugging)
// ============================================

function setApiKeyManually(key) {
    if (key && key.length > 0) {
        API_KEY = key;
        console.log('✅ API Key set manually!');
        return true;
    } else {
        console.error('❌ Invalid API key');
        return false;
    }
}

// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    if (!API_KEY) {
        addMessage('⚠️ API key not set. Please wait or contact administrator.', 'bot');
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

console.log('💡 To set API key manually, type: setApiKeyManually("your-key-here")');