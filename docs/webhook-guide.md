# Hướng dẫn Webhook — Nút ZaloOAWebhook *(Webhook Guide)*

Nút trigger **ZaloOAWebhook** lắng nghe các sự kiện theo thời gian thực từ Zalo Official Account của bạn. Hướng dẫn này trình bày việc đăng ký, xác minh bảo mật, các loại sự kiện, và cách xử lý hành vi thử lại.

---

## Webhook Zalo hoạt động như thế nào? *(How Zalo Webhooks Work)*

Khi một sự kiện xảy ra trên OA của bạn (người dùng gửi tin nhắn, nhấn nút, theo dõi/bỏ theo dõi, v.v.), Zalo gửi một yêu cầu HTTP POST đến URL webhook đã đăng ký. Payload chứa dữ liệu sự kiện ở định dạng JSON cùng với tiêu đề chữ ký để xác minh.

---

## Bước 1 — Kích hoạt luồng làm việc Webhook trong n8n *(Step 1 — Activate the Webhook Workflow in n8n)*

1. Tạo luồng làm việc mới.
2. Thêm nút **ZaloOAWebhook** làm trigger.
3. Chọn thông tin đăng nhập **Zalo OA API** của bạn.
4. Chọn các loại **Event** bạn muốn xử lý (hoặc chọn `*` cho tất cả sự kiện).
5. Nhấn **Activate Workflow** (nút bật/tắt ở góc trên bên phải).

Sau khi kích hoạt, n8n hiển thị **Webhook URL** trong nút. URL theo định dạng:

```
https://<your-n8n-host>/webhook/<unique-path>
```

Ví dụ:

```
https://n8n.example.com/webhook/zalo-oa-events
```

> Nếu n8n ở sau tường lửa hoặc NAT, hãy đảm bảo webhook URL có thể truy cập công khai từ internet. Máy chủ của Zalo phải tiếp cận được URL đó.

---

## Bước 2 — Đăng ký Webhook URL trong Zalo Developer Console *(Step 2 — Register the Webhook URL)*

1. Truy cập [https://developers.zalo.me](https://developers.zalo.me) và mở ứng dụng của bạn.
2. Điều hướng đến **Official Account → Webhook**.
3. Nhập webhook URL n8n của bạn vào trường **Callback URL**.
4. Nhấn **Verify** — Zalo gửi yêu cầu GET với tham số `hub.challenge`. Nút tự động phản hồi với giá trị challenge để xác nhận quyền sở hữu.
5. Sau khi xác minh, chọn các loại sự kiện bạn muốn nhận và nhấn **Save**.

> Bạn chỉ cần đăng ký một URL. Việc lọc sự kiện sau đó được xử lý trong n8n thông qua trường **Event** hoặc nút **IF** ở hạ nguồn.

---

## Bước 3 — Bắt tay xác minh Zalo *(Step 3 — Zalo Verification Handshake)*

Khi bạn đăng ký webhook URL lần đầu, Zalo thực hiện bắt tay GET để xác minh bạn sở hữu điểm cuối:

```
GET <your-webhook-url>?hub.mode=subscribe&hub.challenge=<random_string>&hub.verify_token=<token>
```

Nút **ZaloOAWebhook** tự động phản hồi với giá trị `hub.challenge` thô và HTTP 200. Không cần cấu hình gì thêm.

---

## Bước 4 — Xác minh chữ ký MAC *(Step 4 — MAC Signature Verification)*

Mỗi sự kiện POST từ Zalo đều có tiêu đề:

```
X-ZEvent-Signature: <hex_signature>
```

Chữ ký được tính như sau:

```
HMAC-SHA256(appId + rawBody + timestamp + appSecret)
```

Nút **ZaloOAWebhook** xác minh chữ ký này tự động bằng **App ID** và **App Secret** lưu trong thông tin đăng nhập. Các yêu cầu không qua xác minh bị từ chối với HTTP 401.

> Đảm bảo **App Secret** trong thông tin đăng nhập n8n khớp chính xác với giá trị trong Zalo Developer Console.

---

## Tham chiếu các loại sự kiện *(Event Types Reference)*

| Sự kiện | Mô tả |
|---------|-------|
| `follow` | Người dùng theo dõi OA của bạn |
| `unfollow` | Người dùng bỏ theo dõi OA của bạn |
| `user_send_text` | Người dùng gửi tin nhắn văn bản |
| `user_send_image` | Người dùng gửi hình ảnh |
| `user_send_file` | Người dùng gửi tệp đính kèm |
| `user_send_audio` | Người dùng gửi ghi âm giọng nói |
| `user_send_video` | Người dùng gửi video |
| `user_send_sticker` | Người dùng gửi nhãn dán |
| `user_send_gif` | Người dùng gửi GIF động |
| `user_send_link` | Người dùng gửi đường dẫn |
| `user_send_location` | Người dùng chia sẻ vị trí |
| `user_send_business_card` | Người dùng chia sẻ danh thiếp |
| `user_click_button` | Người dùng nhấn nút trong tin nhắn |
| `user_click_link` | Người dùng nhấn đường dẫn trong tin nhắn |
| `add_user_to_tag` | Người dùng được thêm vào thẻ nhãn |
| `user_call_oa` | Người dùng gọi thoại hoặc video đến OA |
| `*` | Tất cả sự kiện (bắt tất cả) |

> Lưu ý: Các sự kiện liên quan đến nhóm (ví dụ: `group_created`, `group_joined`) có thể có tùy thuộc vào loại OA và quyền Zalo của bạn.

---

## Cấu trúc payload sự kiện *(Event Payload Structure)*

Payload sự kiện điển hình trông như sau:

```json
{
  "app_id": "1234567890",
  "user_id_by_app": "a1b2c3d4e5f6",
  "event_name": "follow",
  "timestamp": "1718000000000",
  "sender": {
    "id": "zalo_user_id_here"
  },
  "recipient": {
    "id": "oa_id_here"
  },
  "follower": {
    "id": "zalo_user_id_here"
  }
}
```

Đối với các sự kiện tin nhắn, payload có thêm đối tượng `message`:

```json
{
  "event_name": "user_send_text",
  "sender": { "id": "zalo_user_id" },
  "recipient": { "id": "oa_id" },
  "timestamp": "1718000000000",
  "message": {
    "mid": "msg_1234",
    "text": "Hello!"
  }
}
```

---

## Ví dụ luồng làm việc — Tự động trả lời tin nhắn văn bản *(Example Workflow — Auto-Reply to Text Messages)*

```
ZaloOAWebhook (event: user_send_text)
  → ZaloOA (Message → sendText)
      User ID:  {{ $json.sender.id }}
      Message Type: cs
      Text: Cảm ơn tin nhắn của bạn! Chúng tôi sẽ phản hồi sớm nhất có thể.
```

---

## Ví dụ luồng làm việc — Phân loại theo loại sự kiện *(Example Workflow — Route by Event Type)*

```
ZaloOAWebhook (event: *)
  → Switch (on: $json.event_name)
      "follow"          → ZaloOA sendText (tin nhắn chào mừng)
      "user_send_text"  → ZaloOA sendText (tự động trả lời)
      "user_click_button" → HTTP Request (internal API)
      default           → No Operation
```

---

## Hành vi thử lại *(Retry Behavior)*

Zalo thử lại các lần gửi webhook thất bại với thời gian chờ tăng dần theo cấp số nhân nếu điểm cuối của bạn không phản hồi HTTP 200 trong thời gian chờ (khoảng 5 giây).

**Thực hành tốt nhất để tránh mất sự kiện:**

- Phản hồi POST của Zalo ngay lập tức với HTTP 200, sau đó xử lý sự kiện bất đồng bộ (n8n xử lý điều này tự động).
- Duy trì phiên bản n8n hoạt động ổn định và luồng làm việc được kích hoạt.
- Theo dõi lỗi xác minh `X-ZEvent-Signature` trong nhật ký thực thi n8n — chúng chỉ ra sự không khớp thông tin đăng nhập.
- Không thực hiện các thao tác chạy lâu (ghi cơ sở dữ liệu, gọi API bên thứ ba) đồng bộ trước khi trả về phản hồi 200. Hãy dùng chế độ thực thi bất đồng bộ tích hợp của n8n.

---

## Xử lý sự cố *(Troubleshooting)*

| Vấn đề | Nguyên nhân có thể | Cách khắc phục |
|--------|-------------------|----------------|
| Bắt tay xác minh thất bại | n8n không thể truy cập công khai | Mở n8n qua ngrok, reverse proxy hoặc triển khai đám mây |
| Không nhận được sự kiện | Luồng làm việc chưa được kích hoạt | Nhấn **Activate** trong trình soạn thảo luồng làm việc |
| Xác minh chữ ký thất bại | App Secret không khớp | Kiểm tra App Secret trong cả Zalo console và thông tin đăng nhập n8n |
| Sự kiện trùng lặp | Zalo đang thử lại | Thêm logic loại trùng dùng `message.mid` |
| Bắt tay GET thành công nhưng POST thất bại | Vấn đề cổng hoặc tường lửa | Cho phép POST đầu vào trên cổng webhook |
