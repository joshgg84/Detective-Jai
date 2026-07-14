// script.js - Detective Jai Web Interface
// ============================================
// CONFIGURATION
// ============================================

let BOT_API_URL = '/api/chat';

// ============================================
// DOM REFERENCES
// ============================================

const DOM = {
    scammerCount: document.getElementById('scammerCount'),
    chatInput: document.getElementById('chatInput'),
    helpSearch: document.getElementById('helpSearch')
};

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
        console.log('⚠️ Using default API URL:', BOT_API_URL);
    }
}

// ============================================
// LOAD STATS
// ============================================

async function loadStats() {
    if (!DOM.scammerCount) return;

    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        DOM.scammerCount.textContent = data.scammers || '--';
    } catch (err) {
        console.log('⚠️ Stats unavailable');
        DOM.scammerCount.textContent = '--';
    }
}

// ============================================
// HELP PAGE: FILTER SEARCH
// ============================================

function filterHelp() {
    const filter = DOM.helpSearch?.value.toLowerCase() || '';
    const items = document.querySelectorAll('.help-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(filter) ? 'block' : 'none';
    });
}

// ============================================
// HELP PAGE: INIT SEARCH LISTENER
// ============================================

function initHelpSearch() {
    if (DOM.helpSearch) {
        DOM.helpSearch.addEventListener('input', filterHelp);
    }
}

// ============================================
// CHAT PAGE: FOCUS INPUT
// ============================================

function focusChatInput() {
    if (DOM.chatInput) {
        DOM.chatInput.focus();
    }
}

// ============================================
// PAGE DETECTION
// ============================================

function isChatPage() {
    return window.location.pathname.includes('chat') || 
           document.getElementById('chatMessages') !== null;
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Load config and stats
    await loadConfig();
    await loadStats();

    // Page-specific setup
    if (isChatPage()) {
        focusChatInput();
    }

    // Help page search
    initHelpSearch();

    console.log('🕵️ Detective Jai initialized');
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}