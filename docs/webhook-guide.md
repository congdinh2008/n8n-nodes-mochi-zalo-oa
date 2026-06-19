# Webhook Guide — ZaloOAWebhook Node

The **ZaloOAWebhook** trigger node listens for real-time events from your Zalo Official Account. This guide covers registration, security verification, event types, and handling retry behavior.

---

## How Zalo Webhooks Work

When an event occurs on your OA (a user sends a message, clicks a button, follows/unfollows, etc.), Zalo sends an HTTP POST request to your registered webhook URL. The payload contains event data in JSON format along with a signature header for verification.

---

## Step 1 — Activate the Webhook Workflow in n8n

1. Create a new workflow.
2. Add a **ZaloOAWebhook** node as the trigger.
3. Select your **Zalo OA API** credential.
4. Choose the **Event** types you want to handle (or select `*` for all events).
5. Click **Activate Workflow** (the toggle in the top-right corner).

Once activated, n8n displays the **Webhook URL** in the node. It follows this format:

```
https://<your-n8n-host>/webhook/<unique-path>
```

For example:

```
https://n8n.example.com/webhook/zalo-oa-events
```

> If n8n is behind a firewall or NAT, make sure the webhook URL is publicly accessible from the internet. Zalo's servers must be able to reach it.

---

## Step 2 — Register the Webhook URL in Zalo Developer Console

1. Go to [https://developers.zalo.me](https://developers.zalo.me) and open your app.
2. Navigate to **Official Account → Webhook**.
3. Enter your n8n webhook URL in the **Callback URL** field.
4. Click **Verify** — Zalo sends a GET request with a `hub.challenge` parameter. The node automatically responds with the challenge value to confirm ownership.
5. Once verified, select the event types you want to receive and click **Save**.

> You only need to register one URL. Event filtering is then handled in n8n using the **Event** field or an **IF** node downstream.

---

## Step 3 — Zalo Verification Handshake

When you first register the webhook URL, Zalo performs a GET handshake to verify you own the endpoint:

```
GET <your-webhook-url>?hub.mode=subscribe&hub.challenge=<random_string>&hub.verify_token=<token>
```

The **ZaloOAWebhook** node automatically responds with the raw `hub.challenge` value and HTTP 200. No configuration is needed on your end.

---

## Step 4 — MAC Signature Verification

Every event POST from Zalo includes the header:

```
X-ZEvent-Signature: <hex_signature>
```

The signature is computed as:

```
HMAC-SHA256(appId + rawBody + timestamp + appSecret)
```

The **ZaloOAWebhook** node verifies this signature automatically using the **App ID** and **App Secret** stored in your credential. Requests that fail verification are rejected with HTTP 401.

> Ensure your **App Secret** in the n8n credential exactly matches the one in the Zalo Developer Console.

---

## Event Types Reference

| Event | Description |
|-------|-------------|
| `follow` | A user follows your OA |
| `unfollow` | A user unfollows your OA |
| `user_send_text` | User sends a text message |
| `user_send_image` | User sends an image |
| `user_send_file` | User sends a file attachment |
| `user_send_audio` | User sends a voice note |
| `user_send_video` | User sends a video |
| `user_send_sticker` | User sends a sticker |
| `user_send_gif` | User sends an animated GIF |
| `user_send_link` | User sends a link |
| `user_send_location` | User shares their location |
| `user_send_business_card` | User shares a business card |
| `user_click_button` | User clicks a message button |
| `user_click_link` | User clicks a link in a message |
| `add_user_to_tag` | A user is added to a tag |
| `user_call_oa` | User makes a voice or video call to the OA |
| `*` | All events (catch-all) |

> Note: Group-related events (e.g., `group_created`, `group_joined`) are available depending on your OA type and Zalo permissions.

---

## Event Payload Structure

A typical event payload looks like this:

```json
{
  "app_id": "1234567890",
  "user_id_by_app": "a1b2c3d4e5f6",
  "event_name": "follow",
  "timestamp": "1718000000000",
  "sender": {
    "id": "zalo_user_id_here"
  },
  "recipient": {
    "id": "oa_id_here"
  },
  "follower": {
    "id": "zalo_user_id_here"
  }
}
```

For message events, the payload includes a `message` object:

```json
{
  "event_name": "user_send_text",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000000000",
  "message": {
    "mid": "msg_1234",
    "text": "Hello!"
  }
}
```

---

## Example Workflow — Auto-Reply to Text Messages

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA (Message → sendText)
      User ID:  {{ $json.sender.id }}
      Message Type: cs
      Text: Thanks for your message! We'll get back to you shortly.
```

---

## Example Workflow — Route by Event Type

```
ZaloOAWebhook (event: *)
  → Switch (on: $json.event_name)
      "follow"          → ZaloOA sendText (welcome message)
      "user_send_text"  → ZaloOA sendText (auto-reply)
      "user_click_button" → HTTP Request (internal API)
      default           → No Operation
```

---

## Retry Behavior

Zalo retries failed webhook deliveries with exponential back-off if your endpoint does not respond with HTTP 200 within the timeout window (approximately 5 seconds).

**Best practices to avoid missed events:**

- Respond to Zalo's POST immediately with HTTP 200, then process the event asynchronously (n8n handles this automatically).
- Keep your n8n instance healthy and the workflow activated.
- Monitor for `X-ZEvent-Signature` failures in your n8n execution logs — they indicate a credential mismatch.
- Do not perform long-running operations (database writes, third-party API calls) synchronously before returning the 200 response. Use n8n's built-in async execution instead.

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Verification handshake fails | n8n not publicly accessible | Expose n8n via ngrok, reverse proxy, or cloud deployment |
| Events not received | Workflow not activated | Click **Activate** in the workflow editor |
| Signature verification fails | App Secret mismatch | Check App Secret in both Zalo console and n8n credential |
| Duplicate events | Retry from Zalo | Add deduplication logic using `message.mid` |
| GET handshake succeeds but POST fails | Port or firewall issue | Allow inbound POST on the webhook port |
