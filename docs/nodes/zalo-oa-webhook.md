# ZaloOAWebhook Node — Trigger Reference

The **ZaloOAWebhook** node is a trigger node that starts a workflow whenever a specified event occurs on your Zalo Official Account. It handles Zalo's verification handshake, MAC signature verification, and event filtering automatically.

---

## Prerequisites

- A valid **Zalo OA API** credential with App ID, App Secret, and Access Token.
- Your n8n instance must be publicly accessible over HTTPS so that Zalo's servers can reach the webhook URL.
- The webhook URL must be registered in the [Zalo Developer Console](https://developers.zalo.me).

---

## Node Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Credential | select | Yes | Your **Zalo OA API** credential |
| Event | select | Yes | The event type to listen for, or `*` for all events |

---

## Supported Events

### User Interaction Events

| Event Name | Trigger Condition |
|------------|------------------|
| `follow` | A user follows your OA |
| `unfollow` | A user unfollows your OA |
| `user_send_text` | User sends a text message |
| `user_send_image` | User sends an image |
| `user_send_file` | User sends a file |
| `user_send_audio` | User sends a voice message |
| `user_send_video` | User sends a video |
| `user_send_sticker` | User sends a sticker |
| `user_send_gif` | User sends an animated GIF |
| `user_send_link` | User sends a URL |
| `user_send_location` | User shares their location |
| `user_send_business_card` | User shares a Zalo business card |
| `user_click_button` | User clicks a reply button in a message |
| `user_click_link` | User clicks a link in a message |
| `user_call_oa` | User initiates a voice or video call |

### Tag Events

| Event Name | Trigger Condition |
|------------|------------------|
| `add_user_to_tag` | A user is added to a tag on your OA |

### Catch-All

| Event Name | Trigger Condition |
|------------|------------------|
| `*` | All events (every event type listed above) |

---

## Event Payload Structure

### Common Fields (all events)

```json
{
  "app_id": "1234567890",
  "user_id_by_app": "a1b2c3d4e5f6789",
  "event_name": "follow",
  "timestamp": "1718000000000",
  "sender": {
    "id": "zalo_user_id"
  },
  "recipient": {
    "id": "oa_id"
  }
}
```

### follow / unfollow

```json
{
  "event_name": "follow",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "follower": {
    "id": "zalo_user_id",
    "display_name": "Nguyen Van A",
    "avatar": "https://..."
  },
  "timestamp": "1718000000000"
}
```

### user_send_text

```json
{
  "event_name": "user_send_text",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000100000",
  "message": {
    "mid": "msg_abc123",
    "text": "Hello, I need help!"
  }
}
```

### user_send_image

```json
{
  "event_name": "user_send_image",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000200000",
  "message": {
    "mid": "msg_def456",
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "https://cdn.zalo.me/image/..."
        }
      }
    ]
  }
}
```

### user_send_location

```json
{
  "event_name": "user_send_location",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000300000",
  "message": {
    "mid": "msg_ghi789",
    "attachments": [
      {
        "type": "location",
        "payload": {
          "coordinates": {
            "lat": 21.0285,
            "long": 105.8542
          },
          "address": "Hoan Kiem, Ha Noi"
        }
      }
    ]
  }
}
```

### user_click_button

```json
{
  "event_name": "user_click_button",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000400000",
  "message": {
    "mid": "msg_jkl012",
    "text": "I need help"
  }
}
```

The `message.text` field contains the `payload` value configured in the button that was clicked.

### add_user_to_tag

```json
{
  "event_name": "add_user_to_tag",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000500000",
  "tag_name": "VIP"
}
```

---

## Security — MAC Verification

The node automatically verifies every incoming POST request using the following algorithm:

```
signature = HMAC-SHA256(appId + rawBody + timestamp + appSecret)
```

The computed signature is compared against the `X-ZEvent-Signature` header sent by Zalo. If they do not match, the node returns HTTP 401 and the workflow execution does not start.

**No configuration is needed** — the App ID and App Secret from your credential are used automatically.

---

## Verification Handshake

When you register the webhook URL in the Zalo Developer Console, Zalo sends:

```
GET <webhook-url>?hub.mode=subscribe&hub.challenge=<random>&hub.verify_token=<token>
```

The node responds with the `hub.challenge` value and HTTP 200. This happens automatically — no workflow configuration is required.

---

## Example Workflows

### Auto-Reply to Any Message

```
ZaloOAWebhook (event: *)
  → Switch (on: $json.event_name)
      "user_send_text"  → ZaloOA Message sendText (auto-reply)
      "follow"          → ZaloOA Message sendText (welcome)
      "user_click_button" → ... handle button action ...
```

### Escalate Unanswered Conversations to Human Agent

```
ZaloOAWebhook (event: user_send_text)
  → Wait (5 minutes)
  → ZaloOA Conversation getMessages (last 2 messages)
  → IF (last message is still from user, no OA reply)
        → HTTP Request (notify support team via Slack or email)
```

### Tag a Follower on First Message

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA Tag assign
        User ID:  {{ $json.sender.id }}
        Tag Name: HasMessaged
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Handshake fails | n8n not reachable from internet | Use a public IP or ngrok tunnel |
| No events received | Workflow not activated | Activate the workflow |
| Events received but MAC fails | Wrong App Secret | Verify App Secret in credential and Zalo console |
| Duplicate executions | Zalo retrying | Deduplicate using `$json.message.mid` |

---

## Notes and Limitations

- A single workflow can handle at most one event type filter in the webhook node. Use `*` with a downstream Switch node to route multiple event types.
- Webhook delivery from Zalo is best-effort. For critical workflows, implement idempotency using the `message.mid` field.
- The node handles GET (handshake) and POST (events) on the same URL — do not add additional routing logic around it.
- Webhook URLs are per-workflow activation. Deactivating and reactivating a workflow may change the URL — re-register it in the Zalo console.
