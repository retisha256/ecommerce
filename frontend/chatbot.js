document.addEventListener("DOMContentLoaded", () => {
    // Remove any existing chatbot first
    const existingContainer = document.getElementById('novuna-chatbot-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    // Determine API Base URL for Chatbot
    const apiUrl = typeof window.api !== 'undefined' && window.api.API_BASE_URL
        ? window.api.API_BASE_URL
        : `http://${window.location.hostname || 'localhost'}:5003/api`;

    // Inject CSS if not linked
    if (!document.querySelector('link[href*="chatbot.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "chatbot.css";
        document.head.appendChild(link);
    }

    // Inject Font Awesome if not present
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css";
        document.head.appendChild(fa);
    }

    // HTML Structure
    const chatbotHTML = `
        <div id="novuna-chatbot-container">
            <div id="novuna-chatbot-window">
                <div id="novuna-chatbot-header">
                    <div class="title">
                        <i class="fas fa-robot"></i> Novuna AI
                    </div>
                    <div class="close-btn" id="novuna-chatbot-close">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
                <div id="novuna-chatbot-messages">
                    <div class="chatbot-msg bot">Hi 😊! I'm Novuna AI. How can I help you today?</div>
                </div>
                <div id="novuna-chatbot-input-area">
                    <input type="text" id="novuna-chatbot-input" placeholder="Ask something..." autocomplete="off">
                    <button id="novuna-chatbot-send"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
            <div id="novuna-chatbot-toggle">
                <i class="fas fa-comment-dots"></i>
            </div>
        </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Elements
    const toggleBtn = document.getElementById("novuna-chatbot-toggle");
    const closeBtn = document.getElementById("novuna-chatbot-close");
    const chatWindow = document.getElementById("novuna-chatbot-window");
    const messagesContainer = document.getElementById("novuna-chatbot-messages");
    const chatInput = document.getElementById("novuna-chatbot-input");
    const sendBtn = document.getElementById("novuna-chatbot-send");

    if (!toggleBtn || !closeBtn || !chatWindow) {
        console.error("Chatbot elements not found!");
        return;
    }

    // Event Listeners for UI
    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.add('active');
        // Keep toggle button visible
        toggleBtn.style.display = 'flex';
        if (chatInput) chatInput.focus();
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.remove('active');
        // Keep toggle button visible
        toggleBtn.style.display = 'flex';
    });

    // Send Message Logic
    const appendMessage = (text, sender) => {
        if (!messagesContainer) return;
        
        const msgDiv = document.createElement("div");
        msgDiv.className = `chatbot-msg ${sender}`;
        msgDiv.innerText = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const handleSendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        chatInput.value = '';

        try {
            // Include locally cached products
            let localProducts = [];
            try {
                localProducts = JSON.parse(localStorage.getItem('adminProducts') || '[]');
            } catch (err) { }

            const response = await fetch(`${apiUrl}/chatbot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, localProducts })
            });

            const data = await response.json();
            if (data.success && data.reply) {
                appendMessage(data.reply, 'bot');
            } else {
                appendMessage("I'm sorry, I encountered an error answering that.", 'bot');
            }
        } catch (error) {
            console.error("Chatbot API error:", error);
            appendMessage("I couldn't reach the server. Please try again later.", 'bot');
        }
    };

    if (sendBtn) {
        sendBtn.addEventListener('click', handleSendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSendMessage();
            }
        });
    }

    console.log("Chatbot initialized successfully!");
});