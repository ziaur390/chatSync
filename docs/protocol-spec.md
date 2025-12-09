# ChatSync Protocol (CSP) Specification

## Version 1.0

### Document Information
- **Protocol Name**: ChatSync Protocol (CSP)
- **Version**: 1.0
- **Transport Layer**: WebSocket (RFC 6455)
- **Data Format**: JSON
- **Author**: Web Engineering Course
- **Date**: December 2025

---

## 1. Introduction

### 1.1 Purpose
The ChatSync Protocol (CSP) is an application-layer protocol designed for real-time, bidirectional communication in chat applications. It operates over WebSocket connections and provides a structured messaging format for multi-room chat functionality.

### 1.2 Scope
This protocol defines:
- Message types and structures
- Connection establishment and termination procedures
- Room management operations
- User presence tracking
- Typing indicators
- Message broadcasting mechanisms

### 1.3 Design Goals
- **Simplicity**: Easy to implement and understand
- **Extensibility**: Support for future feature additions
- **Reliability**: Built-in heartbeat mechanism
- **Real-time**: Low-latency message delivery
- **Scalability**: Support for multiple rooms and users

---

## 2. Protocol Architecture

### 2.1 Communication Model
CSP uses a client-server architecture with WebSocket as the transport protocol:

```
┌──────────┐                    ┌──────────┐
│  Client  │◄──── WebSocket ───►│  Server  │
└──────────┘                    └──────────┘
     │                               │
     │    JSON Protocol Messages     │
     │◄─────────────────────────────►│
```

### 2.2 Connection Lifecycle

```
Client                          Server
  │                               │
  │──── WebSocket Handshake ─────►│
  │◄─── WebSocket Accept ─────────│
  │                               │
  │──── CONNECTION_REQUEST ───────►│
  │◄─── CONNECTION_ACK ────────────│
  │                               │
  │──── JOIN_ROOM ────────────────►│
  │◄─── USER_JOINED ───────────────│
  │◄─── BROADCAST_MESSAGE ─────────│ (history)
  │                               │
  │──── SEND_MESSAGE ─────────────►│
  │◄─── BROADCAST_MESSAGE ─────────│
  │                               │
  │──── TYPING_INDICATOR ─────────►│
  │◄─── TYPING_INDICATOR ──────────│
  │                               │
  │──── HEARTBEAT ────────────────►│
  │◄─── HEARTBEAT ─────────────────│
  │                               │
  │──── LEAVE_ROOM ───────────────►│
  │◄─── USER_LEFT ─────────────────│
  │                               │
  │──── WebSocket Close ──────────►│
```

---

## 3. Message Structure

### 3.1 Base Message Format

All CSP messages follow this JSON structure:

```json
{
  "type": "MESSAGE_TYPE",
  "timestamp": 1234567890123,
  "payload": {
    // Type-specific data
  },
  "metadata": {
    "userId": "unique-user-id",
    "sessionId": "unique-session-id"
  }
}
```

### 3.2 Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | String | Yes | Message type identifier |
| `timestamp` | Number | Yes | Unix timestamp in milliseconds |
| `payload` | Object | Yes | Message-specific data |
| `metadata` | Object | No | Additional context information |

---

## 4. Message Types

### 4.1 CONNECTION_REQUEST

**Direction**: Client → Server  
**Purpose**: Initiate protocol-level connection after WebSocket establishment

**Payload**:
```json
{
  "username": "john_doe",
  "userId": "optional-user-id"
}
```

**Fields**:
- `username` (String, required): Display name for the user
- `userId` (String, optional): Unique user identifier

**Example**:
```json
{
  "type": "CONNECTION_REQUEST",
  "timestamp": 1702123456789,
  "payload": {
    "username": "john_doe",
    "userId": "user_123"
  }
}
```

---

### 4.2 CONNECTION_ACK

**Direction**: Server → Client  
**Purpose**: Acknowledge connection and provide session information

**Payload**:
```json
{
  "sessionId": "session_1702123456789_abc123",
  "serverTime": 1702123456789,
  "message": "Connected to ChatSync Protocol Server"
}
```

**Fields**:
- `sessionId` (String, required): Unique session identifier
- `serverTime` (Number, required): Server timestamp
- `message` (String, optional): Welcome message

---

### 4.3 JOIN_ROOM

**Direction**: Client → Server  
**Purpose**: Join a chat room

**Payload**:
```json
{
  "room": "general"
}
```

**Fields**:
- `room` (String, required): Room name to join

**Server Actions**:
1. Add client to room's participant list
2. Send message history to client
3. Broadcast USER_JOINED to other participants

---

### 4.4 LEAVE_ROOM

**Direction**: Client → Server  
**Purpose**: Leave current chat room

**Payload**:
```json
{
  "room": "general"
}
```

**Fields**:
- `room` (String, required): Room name to leave

**Server Actions**:
1. Remove client from room's participant list
2. Broadcast USER_LEFT to remaining participants
3. Delete room if empty

---

### 4.5 SEND_MESSAGE

**Direction**: Client → Server  
**Purpose**: Send a chat message to current room

**Payload**:
```json
{
  "message": "Hello, everyone!",
  "room": "general"
}
```

**Fields**:
- `message` (String, required): Message content (max 500 chars)
- `room` (String, required): Target room name

**Server Actions**:
1. Validate message content
2. Store in message history
3. Broadcast to all room participants

---

### 4.6 BROADCAST_MESSAGE

**Direction**: Server → Client  
**Purpose**: Deliver chat message or message history

**Payload (Single Message)**:
```json
{
  "username": "john_doe",
  "message": "Hello, everyone!",
  "timestamp": 1702123456789,
  "room": "general"
}
```

**Payload (Message History)**:
```json
{
  "messages": [
    {
      "username": "alice",
      "message": "Hi there!",
      "timestamp": 1702123450000,
      "room": "general"
    },
    {
      "username": "bob",
      "message": "Welcome!",
      "timestamp": 1702123455000,
      "room": "general"
    }
  ],
  "room": "general"
}
```

---

### 4.7 USER_JOINED

**Direction**: Server → Client  
**Purpose**: Notify room participants when a user joins

**Payload**:
```json
{
  "username": "alice",
  "room": "general",
  "timestamp": 1702123456789
}
```

**Fields**:
- `username` (String, required): Joining user's name
- `room` (String, required): Room name
- `timestamp` (Number, required): Join time

---

### 4.8 USER_LEFT

**Direction**: Server → Client  
**Purpose**: Notify room participants when a user leaves

**Payload**:
```json
{
  "username": "bob",
  "room": "general",
  "timestamp": 1702123456789
}
```

**Fields**:
- `username` (String, required): Leaving user's name
- `room` (String, required): Room name
- `timestamp` (Number, required): Leave time

---

### 4.9 TYPING_INDICATOR

**Direction**: Bidirectional  
**Purpose**: Indicate when a user is typing

**Payload (Client → Server)**:
```json
{
  "room": "general",
  "isTyping": true
}
```

**Payload (Server → Client)**:
```json
{
  "username": "alice",
  "isTyping": true,
  "room": "general"
}
```

**Fields**:
- `room` (String, required): Room name
- `isTyping` (Boolean, required): Typing state
- `username` (String, server only): User who is typing

**Client Behavior**:
- Send `isTyping: true` when user starts typing
- Send `isTyping: false` after 2 seconds of inactivity

---

### 4.10 HEARTBEAT

**Direction**: Bidirectional  
**Purpose**: Keep connection alive and detect disconnections

**Payload (Client → Server)**:
```json
{}
```

**Payload (Server → Client)**:
```json
{
  "sessionId": "session_1702123456789_abc123",
  "timestamp": 1702123456789
}
```

**Timing**:
- Client sends every 30 seconds
- Server responds immediately

---

### 4.11 ERROR

**Direction**: Server → Client  
**Purpose**: Communicate protocol or application errors

**Payload**:
```json
{
  "error": "Invalid message format",
  "details": "Missing required field: username",
  "code": "INVALID_FORMAT"
}
```

**Fields**:
- `error` (String, required): Error description
- `details` (String, optional): Additional information
- `code` (String, optional): Error code

**Common Error Codes**:
- `INVALID_FORMAT`: Malformed JSON or missing fields
- `UNAUTHORIZED`: Invalid session or permissions
- `ROOM_NOT_FOUND`: Specified room doesn't exist
- `MESSAGE_TOO_LONG`: Message exceeds length limit

---

## 5. State Management

### 5.1 Client States

```
┌─────────────┐
│ DISCONNECTED│
└──────┬──────┘
       │ WebSocket Connect
       ▼
┌─────────────┐
│  CONNECTED  │
└──────┬──────┘
       │ CONNECTION_REQUEST
       ▼
┌─────────────┐
│AUTHENTICATED│
└──────┬──────┘
       │ JOIN_ROOM
       ▼
┌─────────────┐
│  IN_ROOM    │
└──────┬──────┘
       │ LEAVE_ROOM
       ▼
┌─────────────┐
│AUTHENTICATED│
└─────────────┘
```

### 5.2 Server-Side Room State

Each room maintains:
- **Participant List**: Set of active session IDs
- **Message History**: Last 50 messages
- **Creation Time**: Room creation timestamp

Rooms are automatically deleted when the last participant leaves.

---

## 6. Error Handling

### 6.1 Connection Errors
- **WebSocket Failure**: Client should attempt reconnection with exponential backoff
- **Timeout**: No HEARTBEAT response for 60 seconds triggers reconnection

### 6.2 Message Validation
- All messages must be valid JSON
- Required fields must be present
- Message content limited to 500 characters
- Username limited to 20 characters
- Room name limited to 30 characters

### 6.3 Server Responses
- Invalid messages receive ERROR response
- Malformed JSON results in connection termination

---

## 7. Security Considerations

### 7.1 Input Validation
- All user input must be sanitized
- HTML/script injection prevention
- Maximum length enforcement

### 7.2 Rate Limiting
- Recommended: 10 messages per second per user
- Typing indicators: 1 per 2 seconds

### 7.3 Authentication
- Current version: Username-based (no password)
- Future: Token-based authentication support

---

## 8. Performance Considerations

### 8.1 Message History
- Limited to last 50 messages per room
- Prevents memory exhaustion
- Reduces initial load time

### 8.2 Broadcast Optimization
- Messages sent only to room participants
- Excludes sender from broadcasts (sent separately)

### 8.3 Connection Management
- Heartbeat every 30 seconds
- Automatic cleanup of stale connections

---

## 9. Future Extensions

### 9.1 Planned Features
- **Private Messaging**: Direct user-to-user messages
- **File Sharing**: Binary data support
- **Message Reactions**: Emoji reactions to messages
- **User Profiles**: Avatar and status support
- **Message Editing**: Edit/delete sent messages
- **Read Receipts**: Message read tracking

### 9.2 Protocol Versioning
Future versions will include version field:
```json
{
  "version": "2.0",
  "type": "MESSAGE_TYPE",
  ...
}
```

---

## 10. Compliance

### 10.1 Standards
- **RFC 6455**: WebSocket Protocol
- **RFC 8259**: JSON Data Interchange Format
- **ISO 8601**: Timestamp format (Unix milliseconds)

### 10.2 Best Practices
- Follows WebSocket best practices
- JSON schema validation recommended
- UTF-8 encoding for all text

---

## Appendix A: Complete Message Type Reference

| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| CONNECTION_REQUEST | C→S | Initiate connection |
| CONNECTION_ACK | S→C | Acknowledge connection |
| JOIN_ROOM | C→S | Join chat room |
| LEAVE_ROOM | C→S | Leave chat room |
| SEND_MESSAGE | C→S | Send chat message |
| BROADCAST_MESSAGE | S→C | Deliver message |
| USER_JOINED | S→C | User join notification |
| USER_LEFT | S→C | User leave notification |
| TYPING_INDICATOR | C↔S | Typing status |
| HEARTBEAT | C↔S | Keep-alive |
| ERROR | S→C | Error notification |

**Legend**: C=Client, S=Server, →=Unidirectional, ↔=Bidirectional

---

## Appendix B: Example Session

```javascript
// 1. Client connects
→ WebSocket connection established

// 2. Server acknowledges
← {
  "type": "CONNECTION_ACK",
  "timestamp": 1702123456789,
  "payload": {
    "sessionId": "session_abc123",
    "serverTime": 1702123456789
  }
}

// 3. Client requests connection
→ {
  "type": "CONNECTION_REQUEST",
  "timestamp": 1702123456790,
  "payload": {
    "username": "alice"
  }
}

// 4. Client joins room
→ {
  "type": "JOIN_ROOM",
  "timestamp": 1702123456791,
  "payload": {
    "room": "general"
  }
}

// 5. Server sends history
← {
  "type": "BROADCAST_MESSAGE",
  "timestamp": 1702123456792,
  "payload": {
    "messages": [],
    "room": "general"
  }
}

// 6. Client sends message
→ {
  "type": "SEND_MESSAGE",
  "timestamp": 1702123456800,
  "payload": {
    "message": "Hello!",
    "room": "general"
  }
}

// 7. Server broadcasts
← {
  "type": "BROADCAST_MESSAGE",
  "timestamp": 1702123456801,
  "payload": {
    "username": "alice",
    "message": "Hello!",
    "timestamp": 1702123456800,
    "room": "general"
  }
}
```

---

**End of ChatSync Protocol Specification v1.0**
