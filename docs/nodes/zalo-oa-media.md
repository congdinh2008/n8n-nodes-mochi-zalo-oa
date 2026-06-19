# ZaloOA Node — Media Resource

The **Media** resource provides operations to upload images, files, and animated GIFs to Zalo's content delivery infrastructure. Uploaded assets return a token or attachment ID that can be reused in subsequent message operations.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Binary data must be available in the n8n workflow as a binary property (from an HTTP Request, Read Binary File, or similar node), or the asset must be publicly accessible via URL.

---

## Why Upload Media First?

Zalo does not allow arbitrary URLs in message payloads for all asset types. Uploading media in advance:

1. Returns a stable token or attachment ID valid for reuse.
2. Ensures Zalo's CDN serves the asset — not your origin server.
3. Avoids repeated bandwidth costs for frequently sent images (e.g., a logo).

---

## Operations

### uploadImage

Upload an image from binary data or a public URL. Returns a token usable in `message.sendImage`.

**Endpoint:** `POST /upload/image`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Source | select | Yes | `binary` or `url` |
| Binary Property | string | If source = binary | Name of the binary property in the n8n item |
| Image URL | string | If source = url | Publicly accessible image URL |

**Supported formats:** JPEG, PNG, GIF (static), BMP, WEBP

**Maximum file size:** 1 MB

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "attachment_id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
  }
}
```

Use `data.attachment_id` as the `Attachment ID` in `message.sendImage`.

**Notes:**
- The attachment ID does not expire as long as the asset is associated with the OA.
- Animated GIFs uploaded via `uploadImage` are treated as static images; use `uploadGif` for animation.

---

### uploadFile

Upload a file document from binary data or a public URL. Returns a token usable in `message.sendFile`.

**Endpoint:** `POST /upload/file`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Source | select | Yes | `binary` or `url` |
| Binary Property | string | If source = binary | Name of the binary property in the n8n item |
| File URL | string | If source = url | Publicly accessible file URL |

**Supported formats:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT, and common office formats.

**Maximum file size:** 25 MB

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "token": "file_token_abc123xyz789"
  }
}
```

Use `data.token` as the `File Token` in `message.sendFile`.

**Notes:**
- File tokens have a limited lifetime. Use the token promptly after uploading.
- If the same file is sent frequently, re-upload periodically to keep the token fresh.

---

### uploadGif

Upload an animated GIF from binary data or a public URL. Returns an `attachment_id` that renders with animation in Zalo messages.

**Endpoint:** `POST /upload/gif`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Source | select | Yes | `binary` or `url` |
| Binary Property | string | If source = binary | Name of the binary property in the n8n item |
| GIF URL | string | If source = url | Publicly accessible animated GIF URL |

**Maximum file size:** 5 MB

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "attachment_id": "gif_a1b2c3d4e5f6g7h8i9j0"
  }
}
```

**Notes:**
- Animated GIFs must be in standard GIF format (not WEBP or APNG).
- Large GIFs may take a moment to process. Consider adding a short wait before using the attachment_id in a message.

---

## Example Workflow — Upload and Send a Product Image

```
HTTP Request (download product image from e-commerce API)
  → ZaloOA Media uploadImage
        Source: binary
        Binary Property: data
  → ZaloOA Message sendImage
        Message Type: transaction
        User ID:      {{ $json.userId }}
        Image Source: attachment_id
        Attachment ID: {{ $node["ZaloOA Media"].json.data.attachment_id }}
```

---

## Example Workflow — Send a PDF Invoice

```
Generate PDF (e.g., using an HTTP Request to a PDF generation service)
  → ZaloOA Media uploadFile
        Source: binary
        Binary Property: data
  → ZaloOA Message sendFile
        Message Type: transaction
        User ID:      {{ $json.customerId }}
        File Token:   {{ $node["ZaloOA Media"].json.data.token }}
```

---

## Error Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing binary data or URL | Ensure a binary property or URL is provided |
| `-204` | Invalid or expired access token | Refresh the access token |
| File too large | Exceeds size limit | Compress or split the file |

---

## Notes and Limitations

- All three operations accept either binary data or a public URL — you cannot mix both in a single call.
- Tokens from `uploadFile` are single-use or short-lived. Do not cache them for more than a few hours.
- `attachment_id` values from `uploadImage` and `uploadGif` are more durable and can be stored in a database for reuse.
- Private URLs (behind authentication or firewall) are not supported for URL-based uploads. Use the binary upload path instead.
- There is no API endpoint to list or delete previously uploaded media assets.
