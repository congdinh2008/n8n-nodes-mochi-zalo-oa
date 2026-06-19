# Nút ZaloOA — Tài nguyên Message *(ZaloOA Node — Message Resource)*

Tài nguyên **Message** cho phép bạn gửi nhiều loại tin nhắn đến người theo dõi Zalo OA và kiểm tra trạng thái gửi của các tin nhắn đã gửi.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- Người nhận phải là người theo dõi OA của bạn.
- Cửa sổ tương tác phù hợp phải được thỏa mãn đối với loại tin nhắn cs và transaction (xem [message-types.md](../message-types.md)).

---

## Các thao tác *(Operations)*

### sendText

Gửi tin nhắn văn bản thuần túy đến người theo dõi.

**Endpoint:** `POST /message/{type}` (type = cs | transaction | promotion)

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message Type | select | Có | `cs`, `transaction`, hoặc `promotion` |
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Text | string | Có | Nội dung tin nhắn (tối đa 2.000 ký tự) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "b87fd4a6-e34a-4b63-99b3-123456789abc"
  }
}
```

**Lưu ý:**
- Text hỗ trợ Unicode (ký tự tiếng Việt được hỗ trợ đầy đủ).
- Đường dẫn trong văn bản tự động hiển thị dạng nhấp được trong ứng dụng Zalo.

---

### sendImage

Gửi tin nhắn hình ảnh đến người theo dõi. Hình ảnh có thể được chỉ định qua URL hoặc `attachment_id` trả về từ thao tác **Media → uploadImage**.

**Endpoint:** `POST /message/{type}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message Type | select | Có | `cs`, `transaction`, hoặc `promotion` |
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Image Source | select | Có | `url` hoặc `attachment_id` |
| Image URL | string | Nếu source = url | URL hình ảnh có thể truy cập công khai |
| Attachment ID | string | Nếu source = attachment_id | Token từ thao tác uploadImage |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "c91ae5b7-1234-5678-abcd-ef0123456789"
  }
}
```

**Lưu ý:**
- Định dạng được hỗ trợ: JPEG, PNG, GIF (tĩnh).
- Kích thước tệp tối đa cho hình ảnh qua URL: 1 MB.
- Dùng `attachment_id` được ưu tiên cho hình ảnh gửi thường xuyên (tránh tải lại nhiều lần).

---

### sendFile

Gửi tệp đính kèm đến người theo dõi bằng token tệp lấy từ thao tác **Media → uploadFile**.

**Endpoint:** `POST /message/{type}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message Type | select | Có | `cs`, `transaction`, hoặc `promotion` |
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| File Token | string | Có | Token trả về bởi `media.uploadFile` |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "d02bf6c8-abcd-ef01-2345-678901234567"
  }
}
```

**Lưu ý:**
- Tải tệp lên trước bằng tài nguyên **Media** để lấy token.
- Định dạng được hỗ trợ: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP và các định dạng khác.
- Kích thước tệp tối đa: 25 MB.

---

### sendList

Gửi tin nhắn danh sách có cấu trúc chứa 1 đến 4 phần tử. Mỗi phần tử bao gồm tiêu đề, phụ đề, hình ảnh và nút hành động tùy chọn.

**Endpoint:** `POST /message/{type}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message Type | select | Có | `cs`, `transaction`, hoặc `promotion` |
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Elements | array | Có | 1–4 phần tử danh sách (xem bên dưới) |

**Cấu trúc phần tử:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| title | string | Có | Tiêu đề phần tử |
| subtitle | string | Không | Phụ đề phần tử |
| image_url | string | Không | URL hình ảnh phần tử |
| default_action | object | Không | `{ "type": "oa.open.url", "url": "..." }` |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "e13cg7d9-1234-5678-bcde-f01234567890"
  }
}
```

**Lưu ý:**
- Tin nhắn danh sách lý tưởng cho danh sách sản phẩm, xem trước bài viết và tương tác kiểu menu.
- Tối thiểu 1 phần tử, tối đa 4 phần tử.

---

### sendSticker

Gửi nhãn dán Zalo đến người theo dõi.

**Endpoint:** `POST /message/{type}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message Type | select | Có | `cs`, `transaction`, hoặc `promotion` |
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Sticker ID | string | Có | Mã nhãn dán số từ danh mục nhãn dán của Zalo |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "f24dh8e0-5678-9abc-cdef-012345678901"
  }
}
```

**Lưu ý:**
- Sticker ID đặc thù với nền tảng Zalo. Tham khảo tài liệu nhà phát triển Zalo OA để có danh mục nhãn dán.

---

### getStatus

Kiểm tra trạng thái gửi của tin nhắn đã gửi trước đó.

**Endpoint:** `POST /message/status`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Message ID | string | Có | `message_id` trả về khi gửi tin nhắn |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "message_id": "b87fd4a6-e34a-4b63-99b3-123456789abc",
    "status": "delivered",
    "sent_time": 1718000000000,
    "delivered_time": 1718000005000
  }
}
```

**Các giá trị trạng thái có thể:**

| Trạng thái | Ý nghĩa |
|------------|---------|
| `sent` | Tin nhắn đã gửi đến máy chủ Zalo |
| `delivered` | Tin nhắn đã giao đến thiết bị người dùng |
| `seen` | Người dùng đã mở tin nhắn |
| `failed` | Gửi thất bại |

---

## Ví dụ luồng làm việc — Xác nhận đơn hàng *(Example Workflow — Order Confirmation)*

```
Webhook (order placed)
  → ZaloOA Message sendText
      Message Type: transaction
      User ID:      {{ $json.body.zaloUserId }}
      Text:         Đơn hàng #{{ $json.body.orderId }} của bạn đã được xác nhận!
                    Ngày giao hàng dự kiến: {{ $json.body.deliveryDate }}
  → Wait (10 minutes)
  → ZaloOA Message getStatus
      Message ID: {{ $node["ZaloOA"].json.data.message_id }}
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa |
|----|---------|
| `-201` | Thiếu tham số bắt buộc (User ID, text hoặc token) |
| `-204` | Access token không hợp lệ hoặc đã hết hạn |
| `-213` | Người dùng không theo dõi OA này |
| `-214` | Người dùng ngoài cửa sổ tương tác cho phép |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Tin nhắn không thể chỉnh sửa hoặc xóa sau khi đã gửi.
- Không có API biên lai đã đọc ngoài `getStatus`.
- Ứng dụng Zalo không hiển thị dấu thời gian tin nhắn với độ chính xác đến giây cho người dùng.
- Tin nhắn danh sách có hơn 4 phần tử bị API từ chối; xác nhận số lượng phần tử trước khi gọi.
