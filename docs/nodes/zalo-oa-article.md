# ZaloOA Node — Article Resource

The **Article** resource lets you create, update, delete, list, and retrieve articles published on your Zalo Official Account. Articles are long-form content pieces visible in your OA's news feed and shareable via Zalo messages.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Your OA must have article publishing permissions enabled.

---

## What Are OA Articles?

Articles are rich-content posts on your Zalo OA — analogous to blog posts or Facebook Notes. They support HTML-formatted body text, cover images, and author attribution. Once published, articles appear in your OA's news feed and can be linked in messages sent to followers.

---

## Operations

### create

Create and publish a new article on your OA.

**Endpoint:** `POST /article/create`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Title | string | Yes | Article headline (max 100 characters) |
| Description | string | No | Short summary shown in previews (max 300 characters) |
| Cover Image URL | string | Yes | URL of the article cover image |
| Author | string | No | Author display name |
| Body | string | Yes | HTML content of the article body |
| Status | select | Yes | `show` (published) or `hide` (draft) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "article_id": "art_abc123def456"
  }
}
```

**Notes:**
- The `body` field supports a subset of HTML tags: `<p>`, `<b>`, `<i>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<img>`, `<h1>`–`<h3>`, `<br>`.
- Cover images must be publicly accessible URLs. Upload with the **Media → uploadImage** operation for best results.
- Setting `status` to `hide` saves the article as a draft without publishing it to followers.

---

### update

Update an existing article's content or status.

**Endpoint:** `POST /article/update`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Article ID | string | Yes | The ID of the article to update |
| Title | string | No | New headline |
| Description | string | No | New summary |
| Cover Image URL | string | No | New cover image URL |
| Author | string | No | New author name |
| Body | string | No | New HTML body content |
| Status | select | No | `show` or `hide` |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Notes:**
- Only provide fields you want to change. Omitted fields retain their current values.
- Changing `status` from `hide` to `show` publishes the article immediately.

---

### remove

Delete a published or draft article permanently.

**Endpoint:** `POST /article/remove`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Article ID | string | Yes | The ID of the article to delete |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Warning:** Deletion is permanent and cannot be undone. Any links shared with followers that point to this article will return a 404 page.

---

### getList

Retrieve a paginated list of articles on your OA.

**Endpoint:** `GET /article/getslice` (Zalo API v2.0)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Offset | number | Yes | Starting index (0-based) |
| Count | number | Yes | Number of articles to return (max 20 per request) |
| Status | select | No | `show`, `hide`, or omit to return all |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 48,
    "articles": [
      {
        "article_id": "art_abc123",
        "title": "Summer Sale Announcement",
        "description": "Our biggest sale of the year starts now...",
        "cover": "https://cdn.zalo.me/...",
        "status": "show",
        "created_time": 1718000000000,
        "updated_time": 1718050000000
      }
    ]
  }
}
```

---

### getDetail

Retrieve the full content and metadata of a specific article.

**Endpoint:** `GET /article/getdetail`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Article ID | string | Yes | The ID of the article to retrieve |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "article_id": "art_abc123",
    "title": "Summer Sale Announcement",
    "description": "Our biggest sale of the year starts now...",
    "cover": "https://cdn.zalo.me/...",
    "author": "Marketing Team",
    "body": "<p>Welcome to our summer sale...</p>",
    "status": "show",
    "url": "https://zalo.me/s/oa-article/art_abc123",
    "created_time": 1718000000000,
    "updated_time": 1718050000000
  }
}
```

---

## Example Workflow — Publish a Weekly Newsletter Article

```
Schedule Trigger (every Monday 8:00 AM)
  → HTTP Request (fetch newsletter content from CMS API)
  → ZaloOA Article create
        Title:     {{ $json.title }}
        Body:      {{ $json.html_content }}
        Cover Image URL: {{ $json.featured_image }}
        Author:    Marketing Team
        Status:    show
  → ZaloOA Message sendText (promotion)
        Text:      New article: {{ $json.title }}. Read it here: {{ $node["ZaloOA"].json.data.url }}
```

---

## Example Workflow — Archive Old Articles

```
Schedule Trigger (1st of each month)
  → ZaloOA Article getList (offset: 0, count: 20, status: show)
  → Loop Over Items
  → IF ($json.created_time < 90 days ago)
        → ZaloOA Article update
              Article ID: {{ $json.article_id }}
              Status:     hide
```

---

## Error Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing required parameter | Provide title, cover image, body, and status |
| `-204` | Invalid or expired access token | Refresh the access token |
| Article not found | Invalid article ID | Verify the article ID from getList |

---

## Notes and Limitations

- The `getList` operation uses Zalo API v2.0 internally — this is handled automatically by the node.
- Article URLs are permanent Zalo-hosted pages; once an article is deleted, its URL becomes invalid.
- Rich HTML in the `body` field is rendered in Zalo's article viewer but stripped to plain text in message previews.
- Images within the article body should use absolute URLs. Relative URLs are not supported.
- Articles are indexed by Zalo's search if your OA has search visibility enabled.
