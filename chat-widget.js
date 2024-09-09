document.addEventListener('DOMContentLoaded', function() {
    const chatWidget = document.createElement('div');
    chatWidget.className = 'chat-container';
    chatWidget.innerHTML = `
        <div class="chat-icon" id="chat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
                <path fill-rule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clip-rule="evenodd" />
            </svg>
            <span class="chat-text">Chat about Ghaith Platform</span>
        </div>
        <div class="ChatApp" id="chat-window">
            <div class="chat-window">
                <div class="chat-header">
                    <button class="expand-button" id="expand-chat">⊕</button>
                    <button class="close-button" id="close-chat">✕</button>
                </div>
                <div class="chat-body" id="chat-body"></div>
                <div class="chat-footer">
                    <input type="text" id="chat-input" placeholder="Type a message...">
                    <button id="send-message">Send</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(chatWidget);

    const chatIcon = document.getElementById('chat-icon');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const expandChat = document.getElementById('expand-chat');
    const chatBody = document.getElementById('chat-body');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');

    let isExpanded = false;
    let socket = null;
    let currentBotMessage = null;

    // Generate a unique session ID
    if (!sessionStorage.getItem('chatSessionId')) {
        sessionStorage.setItem('chatSessionId', Date.now().toString());
    }
    const sessionId = sessionStorage.getItem('chatSessionId');

    // Load chat state from sessionStorage
    const chatState = JSON.parse(sessionStorage.getItem(`chatState_${sessionId}`)) || {};
    isExpanded = chatState.isExpanded || false;
    const isChatOpen = chatState.isChatOpen || false;
    const messages = chatState.messages || [];

    function saveChatState() {
        sessionStorage.setItem(`chatState_${sessionId}`, JSON.stringify({
            isExpanded,
            isChatOpen: chatWindow.classList.contains('open'),
            messages: Array.from(chatBody.children).map(msg => ({
                text: msg.textContent,
                sender: msg.classList.contains('user') ? 'user' : 'bot'
            }))
        }));
    }

    function setChatState() {
        if (isExpanded) {
            chatWindow.classList.add('expanded');
            expandChat.textContent = '⊖';
        }
        if (isChatOpen) {
            chatWindow.classList.add('open');
            chatIcon.style.display = 'none';
        }
        messages.forEach(msg => addMessage(msg.text, msg.sender));
    }

    chatIcon.addEventListener('click', function() {
        chatWindow.classList.add('open');
        chatIcon.style.display = 'none';
        if (!socket) {
            connectWebSocket();
        }
        saveChatState();
    });

    closeChat.addEventListener('click', function() {
        chatWindow.classList.remove('open');
        chatIcon.style.display = 'flex';
        saveChatState();
    });

    expandChat.addEventListener('click', function() {
        isExpanded = !isExpanded;
        chatWindow.classList.toggle('expanded', isExpanded);
        expandChat.textContent = isExpanded ? '⊖' : '⊕';
        saveChatState();
    });

    function addMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender);
        messageElement.textContent = message;
        chatBody.appendChild(messageElement);
        chatBody.scrollTop = chatBody.scrollHeight;
        saveChatState();
        return messageElement;
    }

    function updateLastBotMessage(message) {
        if (currentBotMessage) {
            currentBotMessage.textContent += message;
            chatBody.scrollTop = chatBody.scrollHeight;
        } else {
            currentBotMessage = addMessage(message, 'bot');
        }
        saveChatState();
    }

    function connectWebSocket() {
        socket = new WebSocket('ws://64.227.181.204/ws/chat/');

        socket.onopen = function(e) {
            console.log("WebSocket connection established");
            if (messages.length === 0) {
                addMessage("Hello! I am here to assist you on behalf of the Ghaith platform. Are you looking for financial help or interested in making a donation?", 'bot');
            }
        };

        socket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.sender === 'bot') {
                updateLastBotMessage(data.message);
            } else if (data.message === '\n') {
                currentBotMessage = null;
            }
        };

        socket.onclose = function(event) {
            console.log("WebSocket connection closed");
            socket = null;
        };

        socket.onerror = function(error) {
            console.log(`WebSocket error: ${error.message}`);
        };
    }

    sendMessage.addEventListener('click', function() {
        const message = chatInput.value.trim();
        if (message && socket && socket.readyState === WebSocket.OPEN) {
            addMessage(message, 'user');
            socket.send(JSON.stringify({message: message}));
            chatInput.value = '';
            currentBotMessage = null;
        }
    });

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage.click();
        }
    });

    // Set initial chat state
    setChatState();

    // Connect WebSocket if chat is open
    if (isChatOpen && !socket) {
        connectWebSocket();
    }
});