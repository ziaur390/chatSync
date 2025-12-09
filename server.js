const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create HTTP server for serving static files
const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  
  const extname = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
  };
  
  const contentType = contentTypes[extname] || 'text/plain';
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active connections and rooms
const clients = new Map(); // sessionId -> { ws, userId, username, currentRoom }
const rooms = new Map();   // roomName -> Set of sessionIds
const messageHistory = new Map(); // roomName -> Array of messages

// Protocol Message Types
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

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create protocol message
function createMessage(type, payload, metadata = {}) {
  return {
    type,
    timestamp: Date.now(),
    payload,
    metadata
  };
}

// Broadcast to all clients in a room
function broadcastToRoom(roomName, message, excludeSessionId = null) {
  const roomClients = rooms.get(roomName);
  if (!roomClients) return;
  
  roomClients.forEach(sessionId => {
    if (sessionId !== excludeSessionId) {
      const client = clients.get(sessionId);
      if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const sessionId = generateSessionId();
  console.log(`New connection: ${sessionId}`);
  
  // Send connection acknowledgment
  const ackMessage = createMessage(MessageType.CONNECTION_ACK, {
    sessionId,
    serverTime: Date.now(),
    message: 'Connected to ChatSync Protocol Server'
  });
  ws.send(JSON.stringify(ackMessage));
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(ws, sessionId, message);
    } catch (error) {
      console.error('Error parsing message:', error);
      const errorMsg = createMessage(MessageType.ERROR, {
        error: 'Invalid message format',
        details: error.message
      });
      ws.send(JSON.stringify(errorMsg));
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`Connection closed: ${sessionId}`);
    const client = clients.get(sessionId);
    
    if (client && client.currentRoom) {
      // Notify room members
      const leaveMessage = createMessage(MessageType.USER_LEFT, {
        username: client.username,
        room: client.currentRoom,
        timestamp: Date.now()
      });
      broadcastToRoom(client.currentRoom, leaveMessage);
      
      // Remove from room
      const roomClients = rooms.get(client.currentRoom);
      if (roomClients) {
        roomClients.delete(sessionId);
        if (roomClients.size === 0) {
          rooms.delete(client.currentRoom);
          messageHistory.delete(client.currentRoom);
        }
      }
    }
    
    clients.delete(sessionId);
  });
});

// Handle different message types
function handleMessage(ws, sessionId, message) {
  const { type, payload, metadata } = message;
  
  switch (type) {
    case MessageType.CONNECTION_REQUEST:
      handleConnectionRequest(ws, sessionId, payload);
      break;
      
    case MessageType.JOIN_ROOM:
      handleJoinRoom(ws, sessionId, payload);
      break;
      
    case MessageType.LEAVE_ROOM:
      handleLeaveRoom(ws, sessionId, payload);
      break;
      
    case MessageType.SEND_MESSAGE:
      handleSendMessage(ws, sessionId, payload);
      break;
      
    case MessageType.TYPING_INDICATOR:
      handleTypingIndicator(ws, sessionId, payload);
      break;
      
    case MessageType.HEARTBEAT:
      handleHeartbeat(ws, sessionId);
      break;
      
    default:
      console.log(`Unknown message type: ${type}`);
  }
}

function handleConnectionRequest(ws, sessionId, payload) {
  const { username, userId } = payload;
  
  clients.set(sessionId, {
    ws,
    userId: userId || sessionId,
    username,
    currentRoom: null
  });
  
  console.log(`User registered: ${username} (${sessionId})`);
}

function handleJoinRoom(ws, sessionId, payload) {
  const { room } = payload;
  const client = clients.get(sessionId);
  
  if (!client) return;
  
  // Leave current room if any
  if (client.currentRoom) {
    handleLeaveRoom(ws, sessionId, { room: client.currentRoom });
  }
  
  // Join new room
  client.currentRoom = room;
  
  if (!rooms.has(room)) {
    rooms.set(room, new Set());
    messageHistory.set(room, []);
  }
  
  rooms.get(room).add(sessionId);
  
  // Send message history
  const history = messageHistory.get(room);
  const historyMessage = createMessage(MessageType.BROADCAST_MESSAGE, {
    messages: history,
    room
  });
  ws.send(JSON.stringify(historyMessage));
  
  // Notify others
  const joinMessage = createMessage(MessageType.USER_JOINED, {
    username: client.username,
    room,
    timestamp: Date.now()
  });
  broadcastToRoom(room, joinMessage, sessionId);
  
  console.log(`${client.username} joined room: ${room}`);
}

function handleLeaveRoom(ws, sessionId, payload) {
  const { room } = payload;
  const client = clients.get(sessionId);
  
  if (!client || client.currentRoom !== room) return;
  
  const roomClients = rooms.get(room);
  if (roomClients) {
    roomClients.delete(sessionId);
    
    // Notify others
    const leaveMessage = createMessage(MessageType.USER_LEFT, {
      username: client.username,
      room,
      timestamp: Date.now()
    });
    broadcastToRoom(room, leaveMessage);
    
    if (roomClients.size === 0) {
      rooms.delete(room);
      messageHistory.delete(room);
    }
  }
  
  client.currentRoom = null;
  console.log(`${client.username} left room: ${room}`);
}

function handleSendMessage(ws, sessionId, payload) {
  const { message, room } = payload;
  const client = clients.get(sessionId);
  
  if (!client || client.currentRoom !== room) return;
  
  const messageData = {
    username: client.username,
    message,
    timestamp: Date.now(),
    room
  };
  
  // Store in history
  const history = messageHistory.get(room);
  if (history) {
    history.push(messageData);
    // Keep only last 50 messages
    if (history.length > 50) {
      history.shift();
    }
  }
  
  // Broadcast to room
  const broadcastMsg = createMessage(MessageType.BROADCAST_MESSAGE, {
    ...messageData
  });
  broadcastToRoom(room, broadcastMsg);
  
  // Send to sender as well
  ws.send(JSON.stringify(broadcastMsg));
}

function handleTypingIndicator(ws, sessionId, payload) {
  const { room, isTyping } = payload;
  const client = clients.get(sessionId);
  
  if (!client || client.currentRoom !== room) return;
  
  const typingMessage = createMessage(MessageType.TYPING_INDICATOR, {
    username: client.username,
    isTyping,
    room
  });
  
  broadcastToRoom(room, typingMessage, sessionId);
}

function handleHeartbeat(ws, sessionId) {
  const heartbeatResponse = createMessage(MessageType.HEARTBEAT, {
    sessionId,
    timestamp: Date.now()
  });
  ws.send(JSON.stringify(heartbeatResponse));
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   ChatSync Protocol Server Running         ║
║   Port: ${PORT}                               ║
║   URL: http://localhost:${PORT}               ║
╚════════════════════════════════════════════╝
  `);
});
