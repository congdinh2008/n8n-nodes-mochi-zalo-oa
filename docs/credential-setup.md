# Credential Setup — Zalo OA API

This document covers the full OAuth v4 + PKCE authorization flow, credential fields, and a token refresh strategy for production use.

---

## Credential Fields

| Field | Required | Description |
|-------|----------|-------------|
| **App ID** | Yes | Your Zalo application ID from [developers.zalo.me](https://developers.zalo.me) |
| **App Secret** | Yes | Your Zalo application secret — used to verify webhook MAC signatures |
| **Access Token** | Yes | Short-lived token (25 hours / 90,000 seconds) that authorizes API calls |
| **Refresh Token** | Yes | Long-lived token (3 months) used to obtain new access tokens |

The credential injects `access_token` as a header on every API request automatically. You do not need to add it manually to individual nodes.

---

## Token Lifetimes

| Token | Lifetime | Storage advice |
|-------|----------|---------------|
| Access Token | 25 hours (90,000 s) | Update in n8n credential before expiry |
| Refresh Token | 3 months | Store securely; rotate before expiry |

> If the access token expires, the API returns error code `-204`. If the refresh token expires, you must repeat the full OAuth authorization flow.

---

## OAuth v4 + PKCE Authorization Flow

### Step 1 — Generate PKCE Parameters

PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks.

```bash
# Generate a random 64-character code verifier
CODE_VERIFIER=$(openssl rand -base64 64 | tr -d '=+/' | cut -c1-64)

# Derive SHA-256 code challenge (URL-safe base64, no padding)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" \
  | openssl dgst -sha256 -binary \
  | base64 \
  | tr -d '=' \
  | tr '+/' '-_')
```

Store `CODE_VERIFIER` locally — you will need it in Step 3.

### Step 2 — Request Authorization

Direct the user (or yourself) to this URL:

```
https://oauth.zaloapp.com/v4/oa/permission
  ?app_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &code_challenge=<CODE_CHALLENGE>
  &state=<RANDOM_STATE>
```

After the user logs in and consents, Zalo redirects to:

```
<REDIRECT_URI>?code=<AUTHORIZATION_CODE>&state=<RANDOM_STATE>
```

Verify that `state` matches what you sent (CSRF protection).

### Step 3 — Exchange Code for Tokens

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: <APP_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=<AUTHORIZATION_CODE>&app_id=<APP_ID>&grant_type=authorization_code&code_verifier=<CODE_VERIFIER>"
```

**Response:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 90000
}
```

Enter both tokens into the n8n credential.

---

## Refreshing the Access Token

When the access token is about to expire (or after receiving a `-204` error), exchange the refresh token for a new access token.

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: <APP_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=<REFRESH_TOKEN>&app_id=<APP_ID>&grant_type=refresh_token"
```

**Response:**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 90000
}
```

Note: Zalo also issues a new refresh token with each refresh. Update both tokens in your n8n credential.

---

## Token Refresh Strategy in n8n

Because n8n does not auto-refresh Zalo tokens natively, use one of these approaches:

### Option A — Scheduled Refresh Workflow (Recommended)

Create a dedicated workflow that runs every 20 hours:

```
Schedule Trigger (every 20h)
  → HTTP Request (POST to Zalo token endpoint)
  → n8n API (PATCH /credentials/:id to update access_token and refresh_token)
```

This keeps the credential current without manual intervention.

### Option B — Refresh on Error

Add an error handler to your main workflows:

```
ZaloOA node
  → [On Error] → IF (error.code === -204)
                    → HTTP Request (refresh token)
                    → Update credential via n8n API
                    → Retry original ZaloOA node
```

### Option C — Manual Refresh

Suitable for low-volume or development use:
- Set a calendar reminder every 20 hours to re-run the token exchange.
- Paste the new tokens into the n8n credential manually.

---

## Security Best Practices

- Never expose your **App Secret** or **Refresh Token** in workflow parameters, logs, or error messages.
- Store tokens in n8n credentials, not in workflow variables or node parameters.
- Rotate the App Secret in the Zalo Developer Console immediately if you suspect a breach.
- Use environment variables (`N8N_ENCRYPTION_KEY`) to encrypt n8n's credential store at rest.
- Restrict your Zalo app's redirect URIs to the minimum set needed.

---

## Verifying the Credential

The **Test** button in the n8n credential panel calls `GET https://openapi.zalo.me/v3.0/oa/getoa`. A successful test returns your OA's profile information:

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "oa_id": "1234567890",
    "name": "My Official Account",
    "description": "...",
    "avatar": "https://...",
    "cover": "https://..."
  }
}
```

If the test fails, double-check that the access token is valid and has not expired.
