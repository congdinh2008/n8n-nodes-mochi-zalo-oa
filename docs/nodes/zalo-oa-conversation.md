# Nút ZaloOA — Tài nguyên Conversation *(ZaloOA Node — Conversation Resource)*

Tài nguyên **Conversation** cho phép bạn truy xuất các luồng chat gần đây và lịch sử tin nhắn của các hội thoại riêng lẻ giữa OA và người theo dõi.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- Lịch sử hội thoại chỉ có sẵn cho người theo dõi đã nhắn tin với OA của bạn.

---

## Tài nguyên Conversation là gì? *(What Is the Conversation Resource?)*

Các endpoint hội thoại cung cấp cho luồng làm việc của bạn quyền truy cập lập trình vào lịch sử chat OA — hữu ích cho kiểm toán, bảng điều khiển hỗ trợ khách hàng, thu thập dữ liệu huấn luyện và xây dựng ngữ cảnh hội thoại trước khi gửi phản hồi tự động.

---

## Các thao tác *(Operations)*

### getRecentChats

Truy xuất các luồng chat gần đây nhất trên tất cả người theo dõi, được sắp xếp theo tin nhắn gần nhất.

**Endpoint:** `GET /listrecentchat` (Zalo API v2.0)

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Offset | number | Có | Chỉ số bắt đầu (bắt đầu từ 0) |
| Count | number | Có | Số luồng chat cần trả về (tối đa 20 mỗi yêu cầu) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 312,
    "chats": [
      {
        "user_id": "zalo_user_id_1",
        "display_name": "Nguyen Van A",
        "avatar": "https://s240-ava-talk.zadn.vn/...",
        "last_message": {
          "type": "text",
          "text": "Thank you for your help!",
          "timestamp": 1718050000000,
          "from_id": "zalo_user_id_1"
        },
        "unread_count": 0
      },
      {
        "user_id": "zalo_user_id_2",
        "display_name": "Tran Thi B",
        "avatar": "https://s240-ava-talk.zadn.vn/...",
        "last_message": {
          "type": "text",
          "text": "When will my order arrive?",
          "timestamp": 1718049000000,
          "from_id": "zalo_user_id_2"
        },
        "unread_count": 1
      }
    ]
  }
}
```

**Mô tả các trường:**

| Trường | Mô tả |
|--------|-------|
| `user_id` | Mã người dùng Zalo của người theo dõi |
| `last_message.type` | Loại tin nhắn: `text`, `image`, `file`, `sticker`, v.v. |
| `last_message.from_id` | Người gửi — bằng `user_id` cho tin nhắn người theo dõi, hoặc mã OA cho phản hồi của OA |
| `unread_count` | Số tin nhắn chưa đọc từ người theo dõi này |

---

### getMessages

Truy xuất toàn bộ lịch sử tin nhắn của hội thoại với một người theo dõi cụ thể.

**Endpoint:** `GET /conversation` (Zalo API v2.0)

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Offset | number | Có | Chỉ số bắt đầu (bắt đầu từ 0, từ tin nhắn mới nhất) |
| Count | number | Có | Số tin nhắn cần trả về (tối đa 20 mỗi yêu cầu) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 47,
    "messages": [
      {
        "message_id": "msg_abc123",
        "type": "text",
        "text": "Hello, I need help with my order.",
        "timestamp": 1718049000000,
        "from_id": "zalo_user_id_1",
        "to_id": "oa_id_here"
      },
      {
        "message_id": "msg_def456",
        "type": "text",
        "text": "Sure! What is your order number?",
        "timestamp": 1718049060000,
        "from_id": "oa_id_here",
        "to_id": "zalo_user_id_1"
      },
      {
        "message_id": "msg_ghi789",
        "type": "image",
        "attachment": {
          "url": "https://cdn.zalo.me/image/..."
        },
        "timestamp": 1718049120000,
        "from_id": "zalo_user_id_1",
        "to_id": "oa_id_here"
      }
    ]
  }
}
```

**Mô tả các trường:**

| Trường | Mô tả |
|--------|-------|
| `message_id` | Mã định danh tin nhắn duy nhất |
| `type` | `text`, `image`, `file`, `audio`, `video`, `sticker`, `gif`, `link`, `location` |
| `text` | Nội dung tin nhắn (chỉ cho `type: text`) |
| `attachment` | Thông tin tệp đính kèm cho tin nhắn không phải văn bản |
| `from_id` | Mã người gửi (mã người dùng người theo dõi hoặc mã OA) |
| `to_id` | Mã người nhận |

---

## Ví dụ luồng làm việc — Xây dựng bảng điều khiển hộp thư hỗ trợ *(Example Workflow — Build a Support Inbox Dashboard)*

```
Schedule Trigger (every 5 minutes)
  → ZaloOA Conversation getRecentChats (offset: 0, count: 20)
  → Filter (unread_count > 0)
  → HTTP Request (POST to internal helpdesk API with unread conversations)
```

---

## Ví dụ luồng làm việc — Lấy ngữ cảnh hội thoại trước khi tự động trả lời *(Example Workflow — Fetch Conversation Context Before Auto-Replying)*

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA Conversation getMessages
        User ID: {{ $json.sender.id }}
        Offset:  0
        Count:   10
  → AI Agent (summarize last 10 messages as context)
  → ZaloOA Message sendText (cs)
        User ID: {{ $json.sender.id }}
        Text:    {{ $node["AI Agent"].json.reply }}
```

---

## Phân trang *(Pagination)*

Cả hai thao tác đều dùng phân trang theo offset:

```
getRecentChats: offset 0, count 20 → luồng 1–20
                offset 20, count 20 → luồng 21–40
                ...
getMessages:    offset 0, count 20 → 20 tin nhắn gần nhất
                offset 20, count 20 → tin nhắn 21–40 (cũ hơn)
```

Tin nhắn trong `getMessages` được trả về theo thứ tự thời gian ngược (mới nhất trước tại offset 0).

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu tham số bắt buộc | Cung cấp User ID, offset và count |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| `-213` | Người dùng không theo dõi OA này | Xác minh mã người dùng |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Cả `getRecentChats` và `getMessages` đều dùng Zalo API v2.0 bên trong — điều này được xử lý tự động.
- Lịch sử tin nhắn bị giới hạn bởi thời gian lưu giữ do Zalo thiết lập. Các tin nhắn rất cũ có thể không thể truy xuất được.
- URL tệp đính kèm trả về trong lịch sử tin nhắn có thể có thời gian hết hạn; tải xuống tệp đính kèm sớm nếu cần lưu trữ.
- Tài nguyên này chỉ đọc — bạn không thể xóa hoặc chỉnh sửa tin nhắn hội thoại qua API.
- `unread_count` phản ánh trạng thái chưa đọc của quản trị viên OA, không phải của người theo dõi.
