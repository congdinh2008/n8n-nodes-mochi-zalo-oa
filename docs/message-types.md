# Message Types — cs, transaction, and promotion

Zalo OA supports three message types that determine the audience, delivery rules, and allowed content. Choosing the correct type is essential for compliance with Zalo's policies and for ensuring your messages reach recipients.

---

## Overview

| Type | Target | Interaction Requirement | Subject to Quota | Typical Use Case |
|------|--------|------------------------|-----------------|-----------------|
| `cs` | Individual follower | Interacted within last **7 days** | No | Customer support replies |
| `transaction` | Individual follower | Interacted within last **1 year** | No | Order updates, reminders |
| `promotion` | Active followers (broadcast) | No prior interaction required | **Yes** | Marketing, announcements |

---

## cs — Customer Service Messages

### When to use

Use `cs` when you are replying to a user who has actively engaged with your OA in the past 7 days. This is the most permissive type for personalized conversations.

### Rules

- The recipient must have sent a message, clicked a button, or interacted with your OA within the **last 7 days**.
- Messages can contain rich content: text, images, files, lists, and stickers.
- No daily quota — send as many cs messages as needed within the interaction window.

### Error if misused

If the user has not interacted in 7 days, the API returns:

```json
{ "error": -214, "message": "User outside interaction window" }
```

### Example use cases

- Responding to a support inquiry.
- Confirming a reservation after the user books through the OA chat.
- Sending a follow-up after a live conversation.

### n8n configuration

```
Resource:   Message
Operation:  sendText
Message Type: cs
User ID:    {{ $json.sender.id }}
Text:       We have received your request and will follow up within 24 hours.
```

---

## transaction — Transactional Messages

### When to use

Use `transaction` for notifications directly related to a business transaction or service the user has agreed to. The interaction window is 1 year, making this suitable for users who engaged with your OA in the past but not recently.

### Rules

- The recipient must have interacted with your OA within the **last 1 year**.
- Content must be transactional in nature — order confirmations, shipping updates, payment receipts, appointment reminders.
- No daily quota.
- Do not use `transaction` for marketing content — this may violate Zalo's policies.

### Error if misused

If the user has not interacted in over a year, the API returns:

```json
{ "error": -214, "message": "User outside interaction window" }
```

### Example use cases

- Order confirmation: "Your order #12345 has been confirmed."
- Shipping update: "Your package has been dispatched."
- Appointment reminder: "Reminder: your appointment is tomorrow at 10:00 AM."
- Payment receipt.

### n8n configuration

```
Resource:   Message
Operation:  sendText
Message Type: transaction
User ID:    {{ $json.body.userId }}
Text:       Your order #{{ $json.body.orderId }} is on its way!
```

---

## promotion — Promotional / Broadcast Messages

### When to use

Use `promotion` to send marketing campaigns, newsletters, and announcements to your active follower base. Unlike cs and transaction, you do not need a prior interaction — the message is broadcast to all eligible followers.

### Rules

- Target audience: **active followers** who have not blocked or muted the OA.
- Subject to a **daily broadcast quota** defined by your OA tier.
- Content must comply with Zalo's advertising policies.
- Rich content (images, lists) is supported.
- Personalization is limited compared to cs/transaction.

### Quotas

Zalo enforces a per-OA daily quota for promotion messages. The exact limit depends on your OA verification level:

| OA Level | Approximate Daily Quota |
|----------|------------------------|
| Unverified OA | Low quota (consult Zalo) |
| Verified OA | Higher quota |
| Enterprise OA | Custom quota via agreement |

When the quota is exceeded, the API returns an error. Monitor your usage and schedule campaigns to spread delivery across the day.

### Example use cases

- Weekly newsletter: "Check out our new products this week!"
- Flash sale: "50% off today only — shop now."
- Event announcement: "Join us for our webinar on Friday."

### n8n configuration

```
Resource:   Message
Operation:  sendText
Message Type: promotion
User ID:    (recipient's Zalo user ID from your CRM or follower list)
Text:       Exciting news! Our summer sale starts today. Visit us at...
```

To broadcast to multiple followers, use an **n8n Split In Batches** or **Loop Over Items** node with a list of user IDs from the **ZaloOA → Follower → getList** operation.

---

## Choosing the Right Type — Decision Tree

```
Is this message a direct reply to something the user just said?
  YES → cs (if within 7 days)
  NO  →
    Is this a transactional notification (order, payment, appointment)?
      YES → transaction (if within 1 year)
      NO  →
        Is this a marketing or broadcast message?
          YES → promotion (check quota)
          NO  → Reconsider whether a Zalo message is appropriate
```

---

## Common Errors and Resolutions

| Error Code | Message | Cause | Resolution |
|------------|---------|-------|-----------|
| `-213` | User does not follow OA | User has never followed, or has unfollowed | Check follower status before sending |
| `-214` | User outside interaction window | cs: no interaction in 7d; transaction: no interaction in 1y | Switch message type or wait for user to re-engage |
| `promotion quota exceeded` | Daily limit reached | Too many promotion messages today | Schedule for tomorrow or reduce volume |

---

## Best Practices

1. **Always use cs for support conversations.** It ensures the most responsive experience.
2. **Use transaction sparingly and accurately.** Misusing it for marketing can lead to policy violations and OA suspension.
3. **Batch promotion messages.** Spread large broadcasts across multiple hours to avoid rate throttling and quota exhaustion.
4. **Track interaction timestamps.** Store the last interaction time in your CRM to dynamically choose between cs and transaction.
5. **Handle errors gracefully.** Always check the `error` field in the response and implement retry logic or fallback notifications (e.g., email) when Zalo delivery fails.
