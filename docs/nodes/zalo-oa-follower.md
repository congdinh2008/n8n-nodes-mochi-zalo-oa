# ZaloOA Node — Follower Resource

The **Follower** resource provides operations to retrieve information about individual followers, list all followers of your OA, and update follower display data.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- The user must be a current follower of your OA for `getInfo` and `update`.
- `getList` returns only users who follow your OA.

---

## Operations

### getInfo

Retrieve the profile of a specific follower by their Zalo user ID.

**Endpoint:** `GET /user/detail?data={"user_id":"<id>"}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | The follower's Zalo user ID |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "user_id": "zalo_user_id_here",
    "display_name": "Nguyen Van A",
    "birth_date": 19900101,
    "gender": 1,
    "avatar": "https://s240-ava-talk.zadn.vn/...",
    "avatar_small": "https://s120-ava-talk.zadn.vn/...",
    "user_is_follower": true,
    "follower_from": 1718000000000,
    "user_is_sensitive": false,
    "tags_and_notes_info": {
      "tag_names": ["VIP", "Hanoi"],
      "notes": [
        { "note": "Premium customer", "create_time": 1718000000000 }
      ]
    },
    "shared_info": {
      "phone": "0901234567",
      "city": "Ha Noi"
    }
  }
}
```

**Field descriptions:**

| Field | Description |
|-------|-------------|
| `display_name` | Name visible in the OA conversation |
| `birth_date` | Format: YYYYMMDD (0 if not shared) |
| `gender` | 0 = unknown, 1 = male, 2 = female |
| `avatar` | Full-size avatar URL |
| `user_is_follower` | Whether the user currently follows your OA |
| `follower_from` | Unix timestamp (ms) when the user followed |
| `tags_and_notes_info` | Tags assigned and notes added via the OA |
| `shared_info` | Phone and city shared by the user (if permissions granted) |

**Notes:**
- Some fields (phone, birth_date, gender) are only available if the user has explicitly shared them with your OA.
- Sensitive users (`user_is_sensitive: true`) have restricted profile access.

---

### getList

Retrieve a paginated list of followers.

**Endpoint:** `GET /user/getlist?data={"offset":0,"count":50}`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Offset | number | Yes | Starting position (0-based) |
| Count | number | Yes | Number of followers to return (max 50 per request) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 1250,
    "count": 50,
    "users": [
      {
        "user_id": "user_id_1",
        "display_name": "Tran Thi B",
        "avatar": "https://..."
      },
      {
        "user_id": "user_id_2",
        "display_name": "Le Van C",
        "avatar": "https://..."
      }
    ]
  }
}
```

**Pagination:**

To retrieve all followers, iterate with increasing offsets:

```
Offset 0,  Count 50 → users 1–50
Offset 50, Count 50 → users 51–100
...
Stop when returned count < 50 or offset >= total
```

**n8n pagination example:**

```
ZaloOA Follower getList (offset: 0, count: 50)
  → Loop:
      IF (returned count >= 50)
        → ZaloOA Follower getList (offset: {{ $node.offset + 50 }}, count: 50)
      ELSE → Done
```

---

### update

Update display name, city, phone number, and/or notes for a follower. This data is stored on the OA side and visible to OA admins — it does not change the user's Zalo profile.

**Endpoint:** `POST /user/update`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | The follower's Zalo user ID |
| Display Name | string | No | OA-side display name (max 50 characters) |
| City | string | No | City name (max 50 characters) |
| Phone | string | No | Phone number (Vietnamese format, e.g., 0901234567) |
| Notes | array | No | Array of note strings (max 5 notes, 100 chars each) |

**Request body example:**

```json
{
  "user_id": "zalo_user_id_here",
  "display_name": "Nguyen Van A - VIP",
  "city": "Ha Noi",
  "phone": "0901234567",
  "notes": ["Prefers morning contact", "Loyal customer since 2022"]
}
```

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Notes:**
- The `update` operation only modifies OA-side metadata. It does not change the user's actual Zalo profile.
- Notes are cumulative — to replace all notes, provide the complete new list.
- Phone number must follow Vietnamese mobile number format.

---

## Example Workflow — Sync CRM Data on Follow

```
ZaloOAWebhook (event: follow)
  → HTTP Request (GET CRM API to find matching customer by Zalo ID)
  → IF (customer found)
        → ZaloOA Follower update
              User ID:      {{ $json.follower.id }}
              Display Name: {{ $node["HTTP Request"].json.customer.name }}
              Phone:        {{ $node["HTTP Request"].json.customer.phone }}
              Notes:        ["Synced from CRM on {{ $now }}"]
  → ZaloOA Message sendText
        Message Type: cs
        User ID:      {{ $json.follower.id }}
        Text:         Welcome back, {{ $node["HTTP Request"].json.customer.name }}!
```

---

## Error Reference

| Code | Meaning |
|------|---------|
| `-201` | Missing required parameter (User ID) |
| `-204` | Invalid or expired access token |
| `-213` | User does not follow this OA |

---

## Notes and Limitations

- `getList` returns a maximum of 50 followers per call. Use pagination for large OAs.
- Deleted or banned Zalo accounts will not appear in the follower list.
- The `gender` and `birth_date` fields require the user to have shared this data with your OA.
- OA-side updates (from `update`) are visible in the OA admin dashboard but are not surfaced to the user.
