# ChatSync Protocol - Quick Reference Card

## Message Types Summary

| Type | Direction | Purpose | Key Fields |
|------|-----------|---------|------------|
| **CONNECTION_REQUEST** | C→S | Initiate connection | `username`, `userId` |
| **CONNECTION_ACK** | S→C | Acknowledge connection | `sessionId`, `serverTime` |
| **JOIN_ROOM** | C→S | Join chat room | `room` |
| **LEAVE_ROOM** | C→S | Leave chat room | `room` |
| **SEND_MESSAGE** | C→S | Send message | `message`, `room` |
| **BROADCAST_MESSAGE** | S→C | Deliver message | `username`, `message`, `timestamp` |
| **USER_JOINED** | S→C | User join notification | `username`, `room` |
| **USER_LEFT** | S→C | User leave notification | `username`, `room` |
| **TYPING_INDICATOR** | C↔S | Typing status | `room`, `isTyping`, `username` |
| **HEARTBEAT** | C↔S | Keep-alive | `sessionId`, `timestamp` |
| **ERROR** | S→C | Error notification | `error`, `details`, `code` |

**Legend**: C=Client, S=Server, →=One direction, ↔=Bidirectional

---

## Base Message Structure

```json
{
  "type": "MESSAGE_TYPE",
  "timestamp": 1234567890123,
  "payload": { /* type-specific data */ },
  "metadata": {
    "userId": "unique-id",
    "sessionId": "session-id"
  }
}
```

---

## Common Workflows

### 1. Initial Connection
```
Client → WebSocket Connect
Server → CONNECTION_ACK
Client → CONNECTION_REQUEST {username}
```

### 2. Join Room
```
Client → JOIN_ROOM {room}
Server → BROADCAST_MESSAGE {history}
Server → USER_JOINED (to others)
```

### 3. Send Message
```
Client → SEND_MESSAGE {message, room}
Server → BROADCAST_MESSAGE (to all in room)
```

### 4. Typing Indicator
```
Client → TYPING_INDICATOR {isTyping: true}
Server → TYPING_INDICATOR (to others)
[2 seconds later]
Client → TYPING_INDICATOR {isTyping: false}
```

---

## Validation Rules

| Field | Max Length | Allowed Characters |
|-------|------------|-------------------|
| Username | 20 chars | Alphanumeric, spaces, underscores |
| Room name | 30 chars | Alphanumeric, spaces, hyphens |
| Message | 500 chars | Any text (HTML escaped) |

---

## Server Configuration

```javascript
PORT=3000                    // Server port
HEARTBEAT_INTERVAL=30000     // 30 seconds
MESSAGE_HISTORY_LIMIT=50     // Messages per room
```

---

## Client States

1. **DISCONNECTED** - No connection
2. **CONNECTED** - WebSocket established
3. **AUTHENTICATED** - User registered
4. **IN_ROOM** - Joined a room

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_FORMAT` | Malformed JSON or missing fields |
| `UNAUTHORIZED` | Invalid session or permissions |
| `ROOM_NOT_FOUND` | Room doesn't exist |
| `MESSAGE_TOO_LONG` | Exceeds 500 character limit |

---

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Access application
http://localhost:3000
```

---

## Testing Checklist

- [ ] Open multiple browser tabs
- [ ] Enter different usernames
- [ ] Join same room
- [ ] Send messages
- [ ] Test typing indicators
- [ ] Leave and rejoin
- [ ] Check user notifications

---

## Key Features

✅ Real-time WebSocket communication  
✅ Multi-room support  
✅ User presence tracking  
✅ Typing indicators  
✅ Message history (50 messages)  
✅ Heartbeat mechanism  
✅ Modern glassmorphism UI  
✅ Responsive design  

---

## File Structure

```
webengccp/
├── server.js              # Server implementation
├── public/
│   ├── index.html        # UI
│   ├── styles.css        # Styling
│   └── app.js            # Client logic
└── docs/
    ├── protocol-spec.md  # Full specification
    └── architecture.md   # Architecture doc
```

---

## Standards Compliance

- **RFC 6455**: WebSocket Protocol
- **RFC 8259**: JSON Format
- **HTML5**: Semantic elements
- **CSS3**: Modern styling

---

**ChatSync Protocol v1.0**  
**Web Engineering**  
**Complex Computing Problem**
