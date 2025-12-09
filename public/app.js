// ===========================
// Protocol Message Types
// ===========================
const MessageType = {
    CONNECTION_REQUEST: 'CONNECTION_REQUEST',
    CONNECTION_ACK: 'CONNECTION_ACK',
    JOIN_ROOM: 'JOIN_ROOM',
    LEAVE_ROOM: 'LEAVE_ROOM',
    SEND_MESSAGE: 'SEND_MESSAGE',
    BROADCAST_MESSAGE: 'BROADCAST_MESSAGE',
    USER_JOINED: 'USER_JOINED',
    USER_LEFT: 'USER_LEFT',
    TYPING_INDICATOR: 'TYPING_INDICATOR',
    HEARTBEAT: 'HEARTBEAT',
    ERROR: 'ERROR'
};

// ===========================
// Application State
// ===========================
class ChatApp {
    constructor() {
        this.ws = null;
        this.sessionId = null;
        this.username = null;
        this.currentRoom = null;
        this.typingTimeout = null;
        this.isTyping = false;
        this.heartbeatInterval = null;

        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        // Screens
        this.loginScreen = document.getElementById('loginScreen');
        this.chatScreen = document.getElementById('chatScreen');

        // Login elements
        this.usernameInput = document.getElementById('usernameInput');
        this.roomInput = document.getElementById('roomInput');
        this.joinBtn = document.getElementById('joinBtn');

        // Chat elements
        this.roomNameEl = document.getElementById('roomName');
        this.connectionStatusEl = document.getElementById('connectionStatus');
        this.currentUsernameEl = document.getElementById('currentUsername');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.leaveBtn = document.getElementById('leaveBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.typingText = document.getElementById('typingText');
        this.toastContainer = document.getElementById('toastContainer');
    }

    attachEventListeners() {
        // Login
        this.joinBtn.addEventListener('click', () => this.handleJoin());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoin();
        });
        this.roomInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleJoin();
        });

        // Chat
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        this.messageInput.addEventListener('input', () => this.handleTyping());
        this.leaveBtn.addEventListener('click', () => this.leaveRoom());
    }

    // ===========================
    // WebSocket Connection
    // ===========================
    connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.updateConnectionStatus('Connected', true);
            this.sendConnectionRequest();
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showToast('Connection error', 'error');
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('Disconnected', false);
            this.stopHeartbeat();
            this.showToast('Disconnected from server', 'warning');
        };
    }

    sendConnectionRequest() {
        this.sendProtocolMessage(MessageType.CONNECTION_REQUEST, {
            username: this.username,
            userId: this.sessionId
        });
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendProtocolMessage(MessageType.HEARTBEAT, {});
            }
        }, 30000); // Every 30 seconds
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // ===========================
    // Protocol Message Handling
    // ===========================
    sendProtocolMessage(type, payload, metadata = {}) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }

        const message = {
            type,
            timestamp: Date.now(),
            payload,
            metadata: {
                userId: this.sessionId,
                ...metadata
            }
        };

        this.ws.send(JSON.stringify(message));
    }

    handleMessage(message) {
        const { type, payload } = message;

        switch (type) {
            case MessageType.CONNECTION_ACK:
                this.handleConnectionAck(payload);
                break;

            case MessageType.BROADCAST_MESSAGE:
                this.handleBroadcastMessage(payload);
                break;

            case MessageType.USER_JOINED:
                this.handleUserJoined(payload);
                break;

            case MessageType.USER_LEFT:
                this.handleUserLeft(payload);
                break;

            case MessageType.TYPING_INDICATOR:
                this.handleTypingIndicator(payload);
                break;

            case MessageType.HEARTBEAT:
                console.log('Heartbeat received');
                break;

            case MessageType.ERROR:
                this.handleError(payload);
                break;

            default:
                console.log('Unknown message type:', type);
        }
    }

    handleConnectionAck(payload) {
        this.sessionId = payload.sessionId;
        console.log('Connection acknowledged:', this.sessionId);

        // Join the room
        this.sendProtocolMessage(MessageType.JOIN_ROOM, {
            room: this.currentRoom
        });
    }

    handleBroadcastMessage(payload) {
        if (payload.messages) {
            // Message history
            payload.messages.forEach(msg => this.displayMessage(msg));
        } else {
            // Single message
            this.displayMessage(payload);
        }
    }

    handleUserJoined(payload) {
        this.displaySystemMessage(`${payload.username} joined the room`);
        this.showToast(`${payload.username} joined`, 'success');
    }

    handleUserLeft(payload) {
        this.displaySystemMessage(`${payload.username} left the room`);
    }

    handleTypingIndicator(payload) {
        const { username, isTyping } = payload;

        if (isTyping) {
            this.typingText.textContent = `${username} is typing...`;
            this.typingIndicator.classList.remove('hidden');
        } else {
            this.typingIndicator.classList.add('hidden');
        }
    }

    handleError(payload) {
        console.error('Protocol error:', payload);
        this.showToast(payload.error, 'error');
    }

    // ===========================
    // User Actions
    // ===========================
    handleJoin() {
        const username = this.usernameInput.value.trim();
        const room = this.roomInput.value.trim();

        if (!username || !room) {
            this.showToast('Please enter username and room name', 'warning');
            return;
        }

        this.username = username;
        this.currentRoom = room;

        // Update UI
        this.roomNameEl.textContent = room;
        this.currentUsernameEl.textContent = username;

        // Switch screens
        this.loginScreen.classList.remove('active');
        this.chatScreen.classList.add('active');

        // Connect to server
        this.connect();

        // Focus message input
        this.messageInput.focus();
    }

    sendMessage() {
        const message = this.messageInput.value.trim();

        if (!message) return;

        this.sendProtocolMessage(MessageType.SEND_MESSAGE, {
            message,
            room: this.currentRoom
        });

        this.messageInput.value = '';
        this.stopTypingIndicator();
    }

    handleTyping() {
        if (!this.isTyping) {
            this.isTyping = true;
            this.sendProtocolMessage(MessageType.TYPING_INDICATOR, {
                room: this.currentRoom,
                isTyping: true
            });
        }

        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.stopTypingIndicator();
        }, 2000);
    }

    stopTypingIndicator() {
        if (this.isTyping) {
            this.isTyping = false;
            this.sendProtocolMessage(MessageType.TYPING_INDICATOR, {
                room: this.currentRoom,
                isTyping: false
            });
        }
    }

    leaveRoom() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.sendProtocolMessage(MessageType.LEAVE_ROOM, {
                room: this.currentRoom
            });
            this.ws.close();
        }

        this.stopHeartbeat();

        // Reset state
        this.sessionId = null;
        this.currentRoom = null;

        // Clear messages
        this.messagesContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-icon">✨</div>
        <h3>Welcome to ChatSync!</h3>
        <p>Start chatting with others in real-time</p>
      </div>
    `;

        // Switch screens
        this.chatScreen.classList.remove('active');
        this.loginScreen.classList.add('active');
    }

    // ===========================
    // UI Updates
    // ===========================
    displayMessage(messageData) {
        const { username, message, timestamp } = messageData;
        const isOwn = username === this.username;

        const messageEl = document.createElement('div');
        messageEl.className = `message ${isOwn ? 'own' : ''}`;

        const avatar = username.charAt(0).toUpperCase();
        const time = new Date(timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageEl.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-username">${username}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-bubble">${this.escapeHtml(message)}</div>
      </div>
    `;

        // Remove welcome message if exists
        const welcomeMsg = this.messagesContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    displaySystemMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.textContent = text;

        this.messagesContainer.appendChild(messageEl);
        this.scrollToBottom();
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateConnectionStatus(status, isConnected) {
        this.connectionStatusEl.textContent = status;
        this.connectionStatusEl.style.color = isConnected ? 'var(--success-color)' : 'var(--error-color)';
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===========================
// Initialize Application
// ===========================
const app = new ChatApp();
