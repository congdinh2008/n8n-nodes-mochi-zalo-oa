# n8n-nodes-mochi-zalo-oa

[![CI](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa/actions/workflows/ci.yml/badge.svg)](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/n8n-nodes-mochi-zalo-oa)](https://www.npmjs.com/package/n8n-nodes-mochi-zalo-oa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Community n8n nodes for **Zalo Official Account (OA) API v3.0**. Automate messaging, follower management, media uploads, webhook handling, and more — all from your n8n workflows.

---

## What is Zalo OA?

[Zalo](https://zalo.me) is Vietnam's most-used messaging platform with over 75 million users. A **Zalo Official Account (OA)** is a verified business presence on Zalo, similar to a Facebook Page or LINE Official Account. The Zalo OA API lets you:

- Send text, image, file, list, and sticker messages to followers
- Manage follower profiles and tags
- Publish articles and manage a product store
- Respond to incoming messages via webhooks
- Update your OA profile and chat menu

This package integrates the full Zalo OA API v3.0 into n8n through two nodes.

---

## Nodes

| Node | Type | Description |
|------|------|-------------|
| **ZaloOA** | Action | Send messages, manage followers, upload media, handle tags, menus, articles, store, and conversations |
| **ZaloOAWebhook** | Trigger | Receive real-time events from Zalo OA (new follower, incoming message, button click, etc.) |

### ZaloOA — Resources and Operations

| Resource | Operations |
|----------|-----------|
| **Message** | sendText, sendImage, sendFile, sendList, sendSticker, getStatus |
| **Follower** | getInfo, getList, update |
| **OA** | getProfile |
| **Media** | uploadImage, uploadFile, uploadGif |
| **Tag** | getList, assign, remove, removeFollower |
| **Menu** | update |
| **Article** | create, update, remove, getList, getDetail |
| **Store** | createProduct, updateProduct, getProduct, getProducts, createCategory, updateCategory, getCategories, createOrder |
| **Conversation** | getRecentChats, getMessages |

### ZaloOAWebhook — Supported Events

`follow`, `unfollow`, `user_send_text`, `user_send_image`, `user_send_file`, `user_send_audio`, `user_send_video`, `user_send_sticker`, `user_send_gif`, `user_send_link`, `user_send_location`, `user_send_business_card`, `user_click_button`, `user_click_link`, `group_*` events, `add_user_to_tag`, `user_call_oa`, and `*` (all events)

---

## Installation

### n8n Desktop / Cloud

In the n8n UI go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-mochi-zalo-oa
```

### Self-hosted n8n (npm)

```bash
npm install n8n-nodes-mochi-zalo-oa
```

Then restart your n8n instance.

### Self-hosted n8n (Docker)

```dockerfile
FROM n8nio/n8n
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-mochi-zalo-oa
```

---

## Credential Setup

1. Go to [developers.zalo.me](https://developers.zalo.me) and create an app.
2. Under **Official Account API**, enable OA permissions.
3. Complete the OAuth v4 + PKCE flow to obtain an **Access Token** and **Refresh Token**.
4. In n8n, create a new credential of type **Zalo OA API** and fill in:
   - **App ID** — your Zalo app ID
   - **App Secret** — your Zalo app secret (used for webhook MAC verification)
   - **Access Token** — expires after 25 hours (90,000 seconds)
   - **Refresh Token** — valid for 3 months; use it to obtain a new access token

> See [docs/credential-setup.md](docs/credential-setup.md) for the full OAuth flow and token refresh strategy.

---

## Quick Start — Send Your First Message

**Goal:** Send a text message to a Zalo follower when triggered manually.

1. Create a new workflow in n8n.
2. Add a **Manual Trigger** node.
3. Add a **ZaloOA** node:
   - Credential: your Zalo OA API credential
   - Resource: **Message**
   - Operation: **sendText**
   - Message Type: **cs** (Customer Service)
   - User ID: `<follower's Zalo user ID>`
   - Text: `Hello! Thank you for following our OA.`
4. Connect the nodes and click **Execute Workflow**.

You should see the Zalo message ID in the output. The follower will receive the message in their Zalo app.

---

## Message Type Guide

Zalo OA has three message types that control who can receive a message and under what conditions:

| Type | Audience | Interaction Requirement | Typical Use |
|------|----------|------------------------|-------------|
| `cs` | Individual follower | Must have interacted within last **7 days** | Customer support replies |
| `transaction` | Individual follower | Must have interacted within last **1 year** | Order confirmations, reminders |
| `promotion` | Active followers (broadcast) | Daily quota applies | Marketing campaigns |

> See [docs/message-types.md](docs/message-types.md) for detailed guidance, quotas, and examples.

---

## Webhook Setup Guide

The **ZaloOAWebhook** node receives real-time events from Zalo.

**Quick setup:**

1. Add a **ZaloOAWebhook** node to a workflow and activate it.
2. Copy the **Webhook URL** from the node (e.g., `https://your-n8n.example.com/webhook/zalo-oa`).
3. In the [Zalo Developer Console](https://developers.zalo.me), register the URL as your OA webhook endpoint.
4. Configure your App Secret in the credential — the node verifies the `X-ZEvent-Signature` header automatically using HMAC-SHA256.
5. Select which event types to listen for (or choose `*` for all).

> See [docs/webhook-guide.md](docs/webhook-guide.md) for the full setup, event reference, and retry behavior.

---

## Error Codes Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing required parameter | Check that all required fields are filled |
| `-204` | Invalid or expired access token | Refresh your access token |
| `-213` | User does not follow this OA | Verify the user ID and that the user has followed your OA |
| `-214` | User is outside the interaction window | Use `transaction` type (1-year window) or wait for the user to re-engage |
| `-240` | API v2.0 is disabled | The operation requires v3.0; this package handles it automatically |

---

## Rate Limits

Zalo OA API enforces rate limits per OA per day:

- **cs / transaction messages:** Tied to user interaction; no hard daily cap per recipient, but server-side throttling applies.
- **promotion messages:** Subject to a daily broadcast quota defined by your OA tier. Exceeding the quota returns an error.
- **API calls:** General rate limiting applies. Implement retry logic with exponential back-off for production workflows.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Getting Started](docs/getting-started.md) | Full walkthrough from zero to first message |
| [Credential Setup](docs/credential-setup.md) | OAuth flow and token refresh |
| [Message Types](docs/message-types.md) | cs vs transaction vs promotion |
| [Webhook Guide](docs/webhook-guide.md) | Webhook setup and event reference |
| [Message Node](docs/nodes/zalo-oa-message.md) | All message operations |
| [Follower Node](docs/nodes/zalo-oa-follower.md) | Follower management |
| [Media Node](docs/nodes/zalo-oa-media.md) | Image, file, and GIF uploads |
| [Tag Node](docs/nodes/zalo-oa-tag.md) | Tag management |
| [Menu Node](docs/nodes/zalo-oa-menu.md) | OA chat menu |
| [Article Node](docs/nodes/zalo-oa-article.md) | Article publishing |
| [Store Node](docs/nodes/zalo-oa-store.md) | Product and order management |
| [Conversation Node](docs/nodes/zalo-oa-conversation.md) | Chat history |
| [Webhook Node](docs/nodes/zalo-oa-webhook.md) | Trigger events reference |

---

## Contributing

Contributions are welcome. Please open an issue or pull request on [GitHub](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa).

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes with descriptive messages.
4. Run `npm test` and `npm run lint` before submitting.
5. Open a pull request against `main`.

---

## License

MIT © [Cong Dinh](mailto:congdinh2021@gmail.com)

---

## Links

- [npm package](https://www.npmjs.com/package/n8n-nodes-mochi-zalo-oa)
- [GitHub repository](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa)
- [Zalo OA API documentation](https://developers.zalo.me/docs/official-account)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
