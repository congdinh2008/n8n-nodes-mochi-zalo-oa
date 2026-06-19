# ZaloOA Node — Conversation Resource

The **Conversation** resource lets you retrieve recent chat threads and the message history of individual conversations between your OA and its followers.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Conversation history is only available for followers who have messaged your OA.

---

## What Is the Conversation Resource?

The conversation endpoints give your workflows programmatic access to OA chat history — useful for auditing, customer support dashboards, training data collection, and building conversation context before sending an automated reply.

---

## Operations

### getRecentChats

Retrieve the most recent chat threads across all followers, ordered by the most recent message.

**Endpoint:** `GET /listrecentchat` (Zalo API v2.0)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Offset | number | Yes | Starting index (0-based) |
| Count | number | Yes | Number of threads to return (max 20 per request) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 312,
    "chats": [
      {
        "user_id": "zalo_user_id_1",
        "display_name": "Nguyen Van A",
        "avatar": "https://s240-ava-talk.zadn.vn/...",
        "last_message": {
          "type": "text",
          "text": "Thank you for your help!",
          "timestamp": 1718050000000,
          "from_id": "zalo_user_id_1"
        },
        "unread_count": 0
      },
      {
        "user_id": "zalo_user_id_2",
        "display_name": "Tran Thi B",
        "avatar": "https://s240-ava-talk.zadn.vn/...",
        "last_message": {
          "type": "text",
          "text": "When will my order arrive?",
          "timestamp": 1718049000000,
          "from_id": "zalo_user_id_2"
        },
        "unread_count": 1
      }
    ]
  }
}
```

**Field descriptions:**

| Field | Description |
|-------|-------------|
| `user_id` | The follower's Zalo user ID |
| `last_message.type` | Message type: `text`, `image`, `file`, `sticker`, etc. |
| `last_message.from_id` | Sender — equals `user_id` for follower messages, or OA ID for OA replies |
| `unread_count` | Number of unread messages from this follower |

---

### getMessages

Retrieve the full message history of a conversation with a specific follower.

**Endpoint:** `GET /conversation` (Zalo API v2.0)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | The follower's Zalo user ID |
| Offset | number | Yes | Starting index (0-based, from newest message) |
| Count | number | Yes | Number of messages to return (max 20 per request) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 47,
    "messages": [
      {
        "message_id": "msg_abc123",
        "type": "text",
        "text": "Hello, I need help with my order.",
        "timestamp": 1718049000000,
        "from_id": "zalo_user_id_1",
        "to_id": "oa_id_here"
      },
      {
        "message_id": "msg_def456",
        "type": "text",
        "text": "Sure! What is your order number?",
        "timestamp": 1718049060000,
        "from_id": "oa_id_here",
        "to_id": "zalo_user_id_1"
      },
      {
        "message_id": "msg_ghi789",
        "type": "image",
        "attachment": {
          "url": "https://cdn.zalo.me/image/..."
        },
        "timestamp": 1718049120000,
        "from_id": "zalo_user_id_1",
        "to_id": "oa_id_here"
      }
    ]
  }
}
```

**Field descriptions:**

| Field | Description |
|-------|-------------|
| `message_id` | Unique message identifier |
| `type` | `text`, `image`, `file`, `audio`, `video`, `sticker`, `gif`, `link`, `location` |
| `text` | Message text (only for `type: text`) |
| `attachment` | Attachment details for non-text messages |
| `from_id` | Sender ID (follower user ID or OA ID) |
| `to_id` | Recipient ID |

---

## Example Workflow — Build a Support Inbox Dashboard

```
Schedule Trigger (every 5 minutes)
  → ZaloOA Conversation getRecentChats (offset: 0, count: 20)
  → Filter (unread_count > 0)
  → HTTP Request (POST to internal helpdesk API with unread conversations)
```

---

## Example Workflow — Fetch Conversation Context Before Auto-Replying

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA Conversation getMessages
        User ID: {{ $json.sender.id }}
        Offset:  0
        Count:   10
  → AI Agent (summarize last 10 messages as context)
  → ZaloOA Message sendText (cs)
        User ID: {{ $json.sender.id }}
        Text:    {{ $node["AI Agent"].json.reply }}
```

---

## Pagination

Both operations use offset-based pagination:

```
getRecentChats: offset 0, count 20 → threads 1–20
                offset 20, count 20 → threads 21–40
                ...
getMessages:    offset 0, count 20 → most recent 20 messages
                offset 20, count 20 → messages 21–40 (older)
```

Messages in `getMessages` are returned in reverse chronological order (newest first at offset 0).

---

## Error Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing required parameter | Provide User ID, offset, and count |
| `-204` | Invalid or expired access token | Refresh the access token |
| `-213` | User does not follow this OA | Verify user ID |

---

## Notes and Limitations

- Both `getRecentChats` and `getMessages` use Zalo API v2.0 internally — this is handled automatically.
- Message history is limited to the retention period set by Zalo. Very old messages may not be retrievable.
- Attachment URLs returned in message history may have expiry times; download attachments promptly if you need to preserve them.
- This resource is read-only — you cannot delete or edit conversation messages through the API.
- `unread_count` reflects the OA admin's unread status, not the follower's.
