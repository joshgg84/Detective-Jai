// Point to your bot's API URL (Render URL of the bot service)
const BOT_API_URL = 'https://scam-detection-vcn3.onrender.com/api/chat';

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    if (!message) return;
    
    addMessage(message, 'user');
    input.value = '';
    
    try {
        const response = await fetch(BOT_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message, userId: 'web_user' })
        });
        const data = await response.json();
        addMessage(data.response || 'No response', 'bot');
    } catch (err) {
        addMessage('⚠️ Connection error. Try Telegram bot: @JoshuaGiwaBot', 'bot');
    }
}

function addMessage(text, sender) {
    const messagesDiv = document.getElementById('messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});