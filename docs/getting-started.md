# Getting Started with n8n-nodes-mochi-zalo-oa

This guide walks you through everything needed to go from zero to sending your first automated message through your Zalo Official Account.

---

## Prerequisites

- A Zalo account with a registered **Official Account (OA)**
- An n8n instance (v0.187 or later) — self-hosted or n8n Cloud
- Basic familiarity with n8n workflows

---

## Step 1 — Create a Zalo App at developers.zalo.me

1. Open [https://developers.zalo.me](https://developers.zalo.me) and sign in with your Zalo account.
2. Click **Create App** (or **Tạo ứng dụng**).
3. Enter an app name and select **Official Account API** as the app type.
4. Submit the form. Zalo will provision your app and display the **App ID** and **App Secret** on the app dashboard. Copy both values.
5. In the app settings, navigate to **Official Account** and link your OA to the app.
6. Under **Permissions**, enable at minimum:
   - `send_zns_message`
   - `manage_official_account`
   - `manage_oa`
7. Add your redirect URI (used in the OAuth flow) — for local testing you can use `https://localhost` or a tool like [ngrok](https://ngrok.com).

---

## Step 2 — Obtain an Access Token via OAuth v4 + PKCE

Zalo uses OAuth 2.0 with the PKCE extension. Follow these steps to obtain your initial tokens.

### 2a — Generate a Code Verifier and Code Challenge

```bash
# Generate a random 64-byte code verifier (URL-safe base64)
CODE_VERIFIER=$(openssl rand -base64 64 | tr -d '=+/' | cut -c1-64)

# Derive the code challenge (SHA-256 hash, URL-safe base64)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

echo "Code Verifier: $CODE_VERIFIER"
echo "Code Challenge: $CODE_CHALLENGE"
```

### 2b — Open the Authorization URL

Open the following URL in your browser (replace placeholders):

```
https://oauth.zaloapp.com/v4/oa/permission
  ?app_id=YOUR_APP_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &code_challenge=YOUR_CODE_CHALLENGE
  &state=random_csrf_token
```

Log in and grant the requested permissions. Zalo will redirect to your `redirect_uri` with a `code` parameter, for example:

```
https://your-redirect-uri/?code=abc123&state=random_csrf_token
```

### 2c — Exchange the Code for Tokens

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: YOUR_APP_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=abc123&app_id=YOUR_APP_ID&grant_type=authorization_code&code_verifier=YOUR_CODE_VERIFIER"
```

A successful response looks like:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 90000
}
```

- **access_token** — valid for 25 hours (90,000 seconds)
- **refresh_token** — valid for 3 months; keep it secret

> See [credential-setup.md](credential-setup.md) for how to refresh tokens automatically.

---

## Step 3 — Set Up the Credential in n8n

1. In n8n, open **Settings → Credentials → New Credential**.
2. Search for **Zalo OA API** and select it.
3. Fill in the four fields:

   | Field | Value |
   |-------|-------|
   | App ID | Your Zalo app ID |
   | App Secret | Your Zalo app secret |
   | Access Token | The token from Step 2c |
   | Refresh Token | The refresh token from Step 2c |

4. Click **Save**. n8n will call `GET /getoa` to verify the credential. A green checkmark confirms success.

---

## Step 4 — Build Your First Workflow: Send a Welcome Message to a New Follower

This workflow automatically sends a welcome message every time someone follows your OA.

### Workflow structure

```
ZaloOAWebhook  →  IF (event = follow)  →  ZaloOA (sendText)
```

### Configure the ZaloOAWebhook node

1. Add a **ZaloOAWebhook** node to a new workflow.
2. Select your **Zalo OA API** credential.
3. Set **Event** to `follow`.
4. Activate the workflow and copy the **Webhook URL** shown in the node.
5. Register that URL in your Zalo Developer Console under **Official Account → Webhook URL**.

### Configure the IF node (optional filter)

The webhook fires only for `follow` events in this example, so the IF node is optional. You can skip it and connect directly to the message node.

### Configure the ZaloOA node

1. Add a **ZaloOA** node after the webhook.
2. Select your **Zalo OA API** credential.
3. Set:
   - **Resource:** Message
   - **Operation:** sendText
   - **Message Type:** `cs`
   - **User ID:** `{{ $json.follower.id }}`
   - **Text:** `Welcome! Thank you for following us on Zalo. How can we help you today?`
4. Connect the ZaloOAWebhook node output to this node.

### Activate and test

1. Click **Activate** to enable the workflow.
2. On a second Zalo account (or ask a colleague), follow your OA.
3. Within seconds, the new follower should receive the welcome message.

---

## Next Steps

- [Credential Setup](credential-setup.md) — automate token refresh
- [Message Types](message-types.md) — choose between cs, transaction, and promotion
- [Webhook Guide](webhook-guide.md) — handle all 25 event types
- [Message Node Reference](nodes/zalo-oa-message.md) — full message operations
- [Follower Node Reference](nodes/zalo-oa-follower.md) — query and update follower profiles
