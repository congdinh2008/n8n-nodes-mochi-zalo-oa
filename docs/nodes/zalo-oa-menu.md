# Nút ZaloOA — Tài nguyên Menu *(ZaloOA Node — Menu Resource)*

Tài nguyên **Menu** cho phép bạn cập nhật menu chat cố định của OA — tập hợp các nút hành động nhanh hiển thị ở dưới cùng của cửa sổ hội thoại trong ứng dụng Zalo.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- OA của bạn phải được xác minh để sử dụng menu tùy chỉnh (OA chưa xác minh có thể bị hạn chế truy cập).

---

## Menu chat OA là gì? *(What Is the OA Chat Menu?)*

Khi người dùng mở hội thoại với OA của bạn trong ứng dụng Zalo, họ thấy thanh menu cố định ở cuối màn hình. Menu này cung cấp tối đa 5 mục hành động nhanh mà người dùng có thể nhấn — không cần gõ chữ. Tương đương với persistent menu của Facebook Messenger.

Menu áp dụng cho toàn bộ OA và hiển thị đồng nhất với tất cả người theo dõi.

---

## Các thao tác *(Operations)*

### update

Đặt hoặc thay thế menu chat cố định của OA với tối đa 5 mục menu.

**Endpoint:** `POST /menu`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Items | array | Có | Mảng gồm 1–5 đối tượng mục menu |

**Các trường mục menu:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| title | string | Có | Nhãn hiển thị trên nút (tối đa 20 ký tự) |
| action.type | string | Có | Một trong: `oa.open.url`, `oa.send.message`, `oa.open.phone` |
| action.url | string | Nếu type = oa.open.url | URL mở trong trình duyệt trong ứng dụng Zalo |
| action.payload | string | Nếu type = oa.send.message | Văn bản gửi thay mặt người dùng khi nhấn |
| action.phone_code | string | Nếu type = oa.open.phone | Số điện thoại để gọi (định dạng Việt Nam) |

**Các loại hành động:**

| Loại hành động | Hành vi | Trường bắt buộc |
|----------------|---------|----------------|
| `oa.open.url` | Mở URL trong trình duyệt trong ứng dụng Zalo | `url` |
| `oa.send.message` | Gửi văn bản được định sẵn thay mặt người dùng | `payload` |
| `oa.open.phone` | Mở bộ quay số với số điện thoại | `phone_code` |

**Ví dụ nội dung yêu cầu:**

```json
{
  "menu": [
    {
      "title": "Our Website",
      "action": {
        "type": "oa.open.url",
        "url": "https://example.com"
      }
    },
    {
      "title": "Talk to Support",
      "action": {
        "type": "oa.send.message",
        "payload": "I need help"
      }
    },
    {
      "title": "Call Us",
      "action": {
        "type": "oa.open.phone",
        "phone_code": "0901234567"
      }
    },
    {
      "title": "View Products",
      "action": {
        "type": "oa.open.url",
        "url": "https://example.com/products"
      }
    },
    {
      "title": "Promotions",
      "action": {
        "type": "oa.send.message",
        "payload": "Show me promotions"
      }
    }
  ]
}
```

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

## Ví dụ luồng làm việc — Cập nhật menu theo mùa *(Example Workflow — Update Menu Seasonally)*

```
Schedule Trigger (1st day of each month)
  → IF (month in [6, 7, 8])  // Mùa hè
        → ZaloOA Menu update
              Items: [
                { title: "Summer Sale", action: { type: "oa.open.url", url: "https://example.com/summer" } },
                { title: "Talk to Us",  action: { type: "oa.send.message", payload: "Hello!" } }
              ]
  → ELSE
        → ZaloOA Menu update
              Items: [
                { title: "Shop Now",  action: { type: "oa.open.url", url: "https://example.com" } },
                { title: "Support",   action: { type: "oa.send.message", payload: "I need help" } }
              ]
```

---

## Ví dụ luồng làm việc — Lắng nghe nhấn nút menu *(Example Workflow — Listen for Menu Button Clicks)*

Khi người dùng nhấn nút `oa.send.message`, Zalo kích hoạt sự kiện `user_send_text` với payload là nội dung tin nhắn. Dùng nút webhook để xử lý:

```
ZaloOAWebhook (event: user_send_text)
  → Switch (on: $json.message.text)
      "I need help"      → ZaloOA Message sendText (hướng dẫn hỗ trợ)
      "Show me promotions" → ZaloOA Message sendList (danh sách khuyến mãi)
      default            → ZaloOA Message sendText (trả lời chung)
```

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Gọi `update` sẽ thay thế toàn bộ menu. Không có cập nhật một phần — luôn cung cấp toàn bộ menu mong muốn.
- Số lượng mục menu tối đa: **5**.
- Nhãn nút giới hạn 20 ký tự. Chuỗi dài hơn sẽ bị cắt bớt hoặc bị từ chối.
- Cập nhật menu có hiệu lực ngay lập tức nhưng có thể mất vài giây để hiển thị với người dùng đang hoạt động do bộ nhớ đệm phía client.
- Không có API endpoint riêng biệt để truy xuất cấu hình menu hiện tại. Lưu cấu hình menu của bạn trong biến luồng làm việc hoặc kho dữ liệu bên ngoài nếu cần theo dõi.
- Zalo xem xét menu OA để tuân thủ chính sách. Đảm bảo URL và số điện thoại là hợp lệ.
