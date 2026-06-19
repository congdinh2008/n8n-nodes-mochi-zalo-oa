# Nút ZaloOAWebhook — Tham chiếu Trigger *(ZaloOAWebhook Node — Trigger Reference)*

Nút **ZaloOAWebhook** là nút trigger khởi động luồng làm việc mỗi khi một sự kiện được chỉ định xảy ra trên Zalo Official Account của bạn. Nút xử lý tự động việc bắt tay xác minh của Zalo, xác minh chữ ký MAC và lọc sự kiện.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với App ID, App Secret và Access Token.
- Phiên bản n8n phải có thể truy cập công khai qua HTTPS để máy chủ Zalo có thể tiếp cận webhook URL.
- Webhook URL phải được đăng ký trong [Zalo Developer Console](https://developers.zalo.me).

---

## Tham số nút *(Node Parameters)*

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Credential | select | Có | Thông tin đăng nhập **Zalo OA API** của bạn |
| Event | select | Có | Loại sự kiện cần lắng nghe, hoặc `*` cho tất cả sự kiện |

---

## Các sự kiện được hỗ trợ *(Supported Events)*

### Sự kiện tương tác người dùng *(User Interaction Events)*

| Tên sự kiện | Điều kiện kích hoạt |
|-------------|-------------------|
| `follow` | Người dùng theo dõi OA của bạn |
| `unfollow` | Người dùng bỏ theo dõi OA của bạn |
| `user_send_text` | Người dùng gửi tin nhắn văn bản |
| `user_send_image` | Người dùng gửi hình ảnh |
| `user_send_file` | Người dùng gửi tệp đính kèm |
| `user_send_audio` | Người dùng gửi tin nhắn thoại |
| `user_send_video` | Người dùng gửi video |
| `user_send_sticker` | Người dùng gửi nhãn dán |
| `user_send_gif` | Người dùng gửi GIF động |
| `user_send_link` | Người dùng gửi URL |
| `user_send_location` | Người dùng chia sẻ vị trí |
| `user_send_business_card` | Người dùng chia sẻ danh thiếp Zalo |
| `user_click_button` | Người dùng nhấn nút trả lời trong tin nhắn |
| `user_click_link` | Người dùng nhấn đường dẫn trong tin nhắn |
| `user_call_oa` | Người dùng bắt đầu cuộc gọi thoại hoặc video |

### Sự kiện thẻ nhãn *(Tag Events)*

| Tên sự kiện | Điều kiện kích hoạt |
|-------------|-------------------|
| `add_user_to_tag` | Người dùng được thêm vào thẻ nhãn trên OA của bạn |

### Bắt tất cả *(Catch-All)*

| Tên sự kiện | Điều kiện kích hoạt |
|-------------|-------------------|
| `*` | Tất cả sự kiện (mọi loại sự kiện được liệt kê ở trên) |

---

## Cấu trúc payload sự kiện *(Event Payload Structure)*

### Các trường chung (tất cả sự kiện) *(Common Fields — all events)*

```json
{
  "app_id": "1234567890",
  "user_id_by_app": "a1b2c3d4e5f6789",
  "event_name": "follow",
  "timestamp": "1718000000000",
  "sender": {
    "id": "zalo_user_id"
  },
  "recipient": {
    "id": "oa_id"
  }
}
```

### follow / unfollow

```json
{
  "event_name": "follow",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "follower": {
    "id": "zalo_user_id",
    "display_name": "Nguyen Van A",
    "avatar": "https://..."
  },
  "timestamp": "1718000000000"
}
```

### user_send_text

```json
{
  "event_name": "user_send_text",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000100000",
  "message": {
    "mid": "msg_abc123",
    "text": "Hello, I need help!"
  }
}
```

### user_send_image

```json
{
  "event_name": "user_send_image",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000200000",
  "message": {
    "mid": "msg_def456",
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "https://cdn.zalo.me/image/..."
        }
      }
    ]
  }
}
```

### user_send_location

```json
{
  "event_name": "user_send_location",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000300000",
  "message": {
    "mid": "msg_ghi789",
    "attachments": [
      {
        "type": "location",
        "payload": {
          "coordinates": {
            "lat": 21.0285,
            "long": 105.8542
          },
          "address": "Hoan Kiem, Ha Noi"
        }
      }
    ]
  }
}
```

### user_click_button

```json
{
  "event_name": "user_click_button",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000400000",
  "message": {
    "mid": "msg_jkl012",
    "text": "I need help"
  }
}
```

Trường `message.text` chứa giá trị `payload` được cấu hình trong nút đã nhấn.

### add_user_to_tag

```json
{
  "event_name": "add_user_to_tag",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000500000",
  "tag_name": "VIP"
}
```

---

## Bảo mật — Xác minh MAC *(Security — MAC Verification)*

Nút tự động xác minh mỗi yêu cầu POST đến bằng thuật toán sau:

```
signature = HMAC-SHA256(appId + rawBody + timestamp + appSecret)
```

Chữ ký tính toán được so sánh với tiêu đề `X-ZEvent-Signature` được Zalo gửi. Nếu không khớp, nút trả về HTTP 401 và việc thực thi luồng làm việc không bắt đầu.

**Không cần cấu hình gì thêm** — App ID và App Secret từ thông tin đăng nhập được dùng tự động.

---

## Bắt tay xác minh *(Verification Handshake)*

Khi bạn đăng ký webhook URL trong Zalo Developer Console, Zalo gửi:

```
GET <webhook-url>?hub.mode=subscribe&hub.challenge=<random>&hub.verify_token=<token>
```

Nút phản hồi với giá trị `hub.challenge` và HTTP 200. Điều này xảy ra tự động — không cần cấu hình luồng làm việc.

---

## Ví dụ luồng làm việc *(Example Workflows)*

### Tự động trả lời bất kỳ tin nhắn nào *(Auto-Reply to Any Message)*

```
ZaloOAWebhook (event: *)
  → Switch (on: $json.event_name)
      "user_send_text"  → ZaloOA Message sendText (tự động trả lời)
      "follow"          → ZaloOA Message sendText (chào mừng)
      "user_click_button" → ... xử lý hành động nút ...
```

### Chuyển hội thoại chưa trả lời đến nhân viên hỗ trợ *(Escalate Unanswered Conversations to Human Agent)*

```
ZaloOAWebhook (event: user_send_text)
  → Wait (5 minutes)
  → ZaloOA Conversation getMessages (last 2 messages)
  → IF (last message is still from user, no OA reply)
        → HTTP Request (thông báo nhóm hỗ trợ qua Slack hoặc email)
```

### Gắn thẻ nhãn người theo dõi khi gửi tin nhắn đầu tiên *(Tag a Follower on First Message)*

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA Tag assign
        User ID:  {{ $json.sender.id }}
        Tag Name: HasMessaged
```

---

## Xử lý sự cố *(Troubleshooting)*

| Vấn đề | Nguyên nhân | Cách khắc phục |
|--------|-------------|----------------|
| Bắt tay thất bại | n8n không thể tiếp cận từ internet | Dùng IP công khai hoặc ngrok tunnel |
| Không nhận được sự kiện | Luồng làm việc chưa kích hoạt | Kích hoạt luồng làm việc |
| Sự kiện nhận được nhưng MAC thất bại | App Secret sai | Xác minh App Secret trong thông tin đăng nhập và Zalo console |
| Thực thi trùng lặp | Zalo đang thử lại | Loại trùng bằng `$json.message.mid` |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Một luồng làm việc có thể xử lý tối đa một bộ lọc loại sự kiện trong nút webhook. Dùng `*` với nút Switch ở hạ nguồn để định tuyến nhiều loại sự kiện.
- Việc gửi webhook từ Zalo là best-effort. Đối với luồng làm việc quan trọng, hãy triển khai tính idempotency bằng trường `message.mid`.
- Nút xử lý cả GET (bắt tay) và POST (sự kiện) trên cùng một URL — không thêm logic định tuyến xung quanh nó.
- Webhook URL gắn với mỗi lần kích hoạt luồng làm việc. Vô hiệu hóa và kích hoạt lại luồng làm việc có thể thay đổi URL — hãy đăng ký lại trong Zalo console.
