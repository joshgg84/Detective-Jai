// chat.js - Detective Jai Web Chat (No API Keys)

// ============================================
// CONFIGURATION
// ============================================

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

    addMessage(message, 'user');
    chatInput.value = '';
    showTyping(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
console.log('💬 Detective Jai Chat is ready!');