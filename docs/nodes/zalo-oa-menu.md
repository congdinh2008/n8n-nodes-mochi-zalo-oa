# ZaloOA Node — Menu Resource

The **Menu** resource lets you update your OA's persistent chat menu — the set of quick-action buttons displayed at the bottom of the conversation window in the Zalo app.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Your OA must be verified to use custom menus (unverified OAs may have limited access).

---

## What Is the OA Chat Menu?

When a user opens a conversation with your OA in the Zalo app, they see a persistent menu bar at the bottom of the screen. This menu provides up to 5 quick-action items that users can tap — no typing required. It is equivalent to a Facebook Messenger persistent menu.

The menu is OA-wide and applies to all followers uniformly.

---

## Operations

### update

Set or replace the OA's persistent chat menu with up to 5 menu items.

**Endpoint:** `POST /menu`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Items | array | Yes | Array of 1–5 menu item objects |

**Menu item fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Label displayed on the button (max 20 characters) |
| action.type | string | Yes | One of: `oa.open.url`, `oa.send.message`, `oa.open.phone` |
| action.url | string | If type = oa.open.url | URL to open in Zalo's in-app browser |
| action.payload | string | If type = oa.send.message | Text to send as the user's message when tapped |
| action.phone_code | string | If type = oa.open.phone | Phone number to dial (Vietnamese format) |

**Action types:**

| Action Type | Behavior | Required Field |
|-------------|----------|---------------|
| `oa.open.url` | Opens a URL in Zalo's in-app browser | `url` |
| `oa.send.message` | Sends a predefined text as the user | `payload` |
| `oa.open.phone` | Opens the phone dialer with a number | `phone_code` |

**Request body example:**

```json
{
  "menu": [
    {
      "title": "Our Website",
      "action": {
        "type": "oa.open.url",
        "url": "https://example.com"
      }
    },
    {
      "title": "Talk to Support",
      "action": {
        "type": "oa.send.message",
        "payload": "I need help"
      }
    },
    {
      "title": "Call Us",
      "action": {
        "type": "oa.open.phone",
        "phone_code": "0901234567"
      }
    },
    {
      "title": "View Products",
      "action": {
        "type": "oa.open.url",
        "url": "https://example.com/products"
      }
    },
    {
      "title": "Promotions",
      "action": {
        "type": "oa.send.message",
        "payload": "Show me promotions"
      }
    }
  ]
}
```

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

## Example Workflow — Update Menu Seasonally

```
Schedule Trigger (1st day of each month)
  → IF (month in [6, 7, 8])  // Summer
        → ZaloOA Menu update
              Items: [
                { title: "Summer Sale", action: { type: "oa.open.url", url: "https://example.com/summer" } },
                { title: "Talk to Us",  action: { type: "oa.send.message", payload: "Hello!" } }
              ]
  → ELSE
        → ZaloOA Menu update
              Items: [
                { title: "Shop Now",  action: { type: "oa.open.url", url: "https://example.com" } },
                { title: "Support",   action: { type: "oa.send.message", payload: "I need help" } }
              ]
```

---

## Example Workflow — Listen for Menu Button Clicks

When a user taps an `oa.send.message` button, Zalo fires a `user_send_text` event with the payload as the message text. Use the webhook node to handle it:

```
ZaloOAWebhook (event: user_send_text)
  → Switch (on: $json.message.text)
      "I need help"      → ZaloOA Message sendText (support instructions)
      "Show me promotions" → ZaloOA Message sendList (promotion list)
      default            → ZaloOA Message sendText (generic reply)
```

---

## Notes and Limitations

- Calling `update` replaces the entire menu. There is no partial update — always provide the full desired menu.
- Maximum menu items: **5**.
- Button labels are limited to 20 characters. Longer strings will be truncated or rejected.
- The menu update takes effect immediately but may take a few seconds to appear for active users due to client caching.
- There is no separate API endpoint to retrieve the current menu definition. Store your menu configuration in a workflow variable or external data store if you need to track it.
- Zalo reviews OA menus for policy compliance. Ensure URLs and phone numbers are legitimate.
