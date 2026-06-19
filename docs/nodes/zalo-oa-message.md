# ZaloOA Node — Message Resource

The **Message** resource lets you send various types of messages to Zalo OA followers and check the delivery status of sent messages.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- The recipient must be a follower of your OA.
- The appropriate interaction window must be satisfied for cs and transaction message types (see [message-types.md](../message-types.md)).

---

## Operations

### sendText

Send a plain text message to a follower.

**Endpoint:** `POST /message/{type}` (type = cs | transaction | promotion)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message Type | select | Yes | `cs`, `transaction`, or `promotion` |
| User ID | string | Yes | The follower's Zalo user ID |
| Text | string | Yes | Message body (up to 2,000 characters) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "b87fd4a6-e34a-4b63-99b3-123456789abc"
  }
}
```

**Notes:**
- Text supports Unicode (Vietnamese characters fully supported).
- Links in text are automatically rendered as clickable in the Zalo app.

---

### sendImage

Send an image message to a follower. The image can be specified by URL or by an `attachment_id` returned from the **Media → uploadImage** operation.

**Endpoint:** `POST /message/{type}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message Type | select | Yes | `cs`, `transaction`, or `promotion` |
| User ID | string | Yes | The follower's Zalo user ID |
| Image Source | select | Yes | `url` or `attachment_id` |
| Image URL | string | If source = url | Publicly accessible image URL |
| Attachment ID | string | If source = attachment_id | Token from uploadImage operation |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "c91ae5b7-1234-5678-abcd-ef0123456789"
  }
}
```

**Notes:**
- Supported formats: JPEG, PNG, GIF (static).
- Maximum file size for URL-referenced images: 1 MB.
- Using `attachment_id` is preferred for frequently sent images (avoids repeated downloads).

---

### sendFile

Send a file attachment to a follower using a file token obtained from the **Media → uploadFile** operation.

**Endpoint:** `POST /message/{type}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message Type | select | Yes | `cs`, `transaction`, or `promotion` |
| User ID | string | Yes | The follower's Zalo user ID |
| File Token | string | Yes | Token returned by `media.uploadFile` |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "d02bf6c8-abcd-ef01-2345-678901234567"
  }
}
```

**Notes:**
- Upload the file first using the **Media** resource to get a token.
- Supported file types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, and others.
- Maximum file size: 25 MB.

---

### sendList

Send a structured list message containing 1 to 4 elements. Each element includes a title, subtitle, image, and optional action button.

**Endpoint:** `POST /message/{type}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message Type | select | Yes | `cs`, `transaction`, or `promotion` |
| User ID | string | Yes | The follower's Zalo user ID |
| Elements | array | Yes | 1–4 list elements (see below) |

**Element structure:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Element heading |
| subtitle | string | No | Element subheading |
| image_url | string | No | Element image URL |
| default_action | object | No | `{ "type": "oa.open.url", "url": "..." }` |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "e13cg7d9-1234-5678-bcde-f01234567890"
  }
}
```

**Notes:**
- List messages are ideal for product listings, article previews, and menu-style interactions.
- Minimum 1 element, maximum 4 elements.

---

### sendSticker

Send a Zalo sticker to a follower.

**Endpoint:** `POST /message/{type}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message Type | select | Yes | `cs`, `transaction`, or `promotion` |
| User ID | string | Yes | The follower's Zalo user ID |
| Sticker ID | string | Yes | Numeric sticker ID from Zalo's sticker catalog |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "f24dh8e0-5678-9abc-cdef-012345678901"
  }
}
```

**Notes:**
- Sticker IDs are specific to the Zalo platform. Refer to the Zalo OA developer documentation for the sticker catalog.

---

### getStatus

Check the delivery status of a previously sent message.

**Endpoint:** `POST /message/status`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Message ID | string | Yes | The `message_id` returned when the message was sent |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "b87fd4a6-e34a-4b63-99b3-123456789abc",
    "status": "delivered",
    "sent_time": 1718000000000,
    "delivered_time": 1718000005000
  }
}
```

**Possible status values:**

| Status | Meaning |
|--------|---------|
| `sent` | Message sent to Zalo servers |
| `delivered` | Message delivered to user's device |
| `seen` | User has opened the message |
| `failed` | Delivery failed |

---

## Example Workflow — Order Confirmation

```
Webhook (order placed)
  → ZaloOA Message sendText
      Message Type: transaction
      User ID:      {{ $json.body.zaloUserId }}
      Text:         Your order #{{ $json.body.orderId }} has been confirmed!
                    Estimated delivery: {{ $json.body.deliveryDate }}
  → Wait (10 minutes)
  → ZaloOA Message getStatus
      Message ID: {{ $node["ZaloOA"].json.data.message_id }}
```

---

## Error Reference

| Code | Meaning |
|------|---------|
| `-201` | Missing required parameter (User ID, text, or token) |
| `-204` | Invalid or expired access token |
| `-213` | User does not follow this OA |
| `-214` | User is outside the allowed interaction window |

---

## Notes and Limitations

- Messages cannot be edited or deleted after sending.
- There is no read receipt API beyond `getStatus`.
- The Zalo app does not display message timestamps to users with second-level precision.
- List messages with more than 4 elements are rejected by the API; validate element count before calling.
