# ZaloOA Node — Tag Resource

The **Tag** resource lets you manage follower tags on your Zalo OA. Tags are labels you assign to followers for segmentation, targeting, and organization — similar to contact labels in a CRM.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Tags must already exist on your OA before you can assign them (Zalo does not auto-create tags on assign).
- The user must be a follower of your OA.

---

## Operations

### getList

Retrieve all tags defined on your OA.

**Endpoint:** `GET /tag/gettagsofoa`

No parameters required.

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": [
    {
      "tag_name": "VIP",
      "total_follower": 125
    },
    {
      "tag_name": "Hanoi",
      "total_follower": 430
    },
    {
      "tag_name": "Newsletter",
      "total_follower": 2100
    }
  ]
}
```

**Notes:**
- Returns all tags, regardless of how many followers each tag has.
- `total_follower` reflects the current count at the time of the call.

---

### assign

Assign a tag to a follower by tag name or tag ID.

**Endpoint:** `POST /tag/taguser`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | The follower's Zalo user ID |
| Tag Name | string | One of tag_name or tag_id | Human-readable tag name |
| Tag ID | string | One of tag_name or tag_id | Numeric tag ID |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Notes:**
- A follower can hold multiple tags simultaneously.
- If a tag does not exist on the OA, the API returns an error. Create the tag in the Zalo OA admin console first.
- Assigning a tag the user already has is idempotent (no error returned).

---

### remove

Delete a tag from your OA entirely. This removes the tag from all followers who had it.

**Endpoint:** `POST /tag/rmtag`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Tag Name | string | Yes | The exact tag name to delete |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Warning:** This operation is irreversible. Deleting a tag removes it from every follower who held it and cannot be undone via the API.

---

### removeFollower

Remove a specific follower from a tag, without deleting the tag itself.

**Endpoint:** `POST /tag/rmfollowerfromtag`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | The follower's Zalo user ID |
| Tag Name | string | Yes | The tag to remove from this follower |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Notes:**
- Use this when a user no longer qualifies for a segment but the tag itself should be preserved.
- Removing a user from a tag they do not have returns a success response (no error).

---

## Example Workflow — Auto-Tag Followers by Location

```
ZaloOAWebhook (event: follow)
  → ZaloOA Follower getInfo
        User ID: {{ $json.follower.id }}
  → Switch (on: $node["ZaloOA"].json.data.shared_info.city)
      "Ha Noi"     → ZaloOA Tag assign (tag_name: "Hanoi")
      "Ho Chi Minh"→ ZaloOA Tag assign (tag_name: "HCM")
      default      → ZaloOA Tag assign (tag_name: "Other")
```

---

## Example Workflow — Remove Inactive Followers from Newsletter Tag

```
Schedule Trigger (weekly)
  → ZaloOA Follower getList
  → Split In Batches
  → HTTP Request (check last order date from CRM)
  → IF (no order in last 6 months)
        → ZaloOA Tag removeFollower
              User ID:  {{ $json.user_id }}
              Tag Name: Newsletter
```

---

## Error Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing required parameter | Provide both User ID and tag name/ID |
| `-204` | Invalid or expired access token | Refresh the access token |
| `-213` | User does not follow this OA | Verify the user is a current follower |
| Tag not found | Tag name does not exist | Create the tag in the Zalo OA admin console |

---

## Notes and Limitations

- Tags must be created through the Zalo OA admin portal ([oa.zalo.me](https://oa.zalo.me)) or the OA management API — the `assign` operation does not create new tags.
- Maximum number of tags per OA: varies by OA type; check the Zalo documentation for your account tier.
- Maximum tags per follower: varies; consult Zalo's limits documentation.
- The `getList` operation does not return follower IDs for a specific tag. Use the `user/getlist` endpoint filtered by tag in the Zalo OA admin console for tag-based follower lists.
