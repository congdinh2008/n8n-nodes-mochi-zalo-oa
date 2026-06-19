# Bắt đầu với n8n-nodes-mochi-zalo-oa *(Getting Started)*

Hướng dẫn này giúp bạn đi qua toàn bộ các bước cần thiết, từ điểm xuất phát đến việc gửi tin nhắn tự động đầu tiên qua Zalo Official Account của mình.

---

## Yêu cầu trước *(Prerequisites)*

- Tài khoản Zalo đã đăng ký **Official Account (OA)**
- Phiên bản n8n (v0.187 trở lên) — tự lưu trữ hoặc n8n Cloud
- Hiểu biết cơ bản về luồng làm việc n8n

---

## Bước 1 — Tạo ứng dụng Zalo tại developers.zalo.me *(Step 1 — Create a Zalo App)*

1. Mở [https://developers.zalo.me](https://developers.zalo.me) và đăng nhập bằng tài khoản Zalo của bạn.
2. Nhấn **Create App** (hoặc **Tạo ứng dụng**).
3. Nhập tên ứng dụng và chọn **Official Account API** là loại ứng dụng.
4. Gửi biểu mẫu. Zalo sẽ tạo ứng dụng và hiển thị **App ID** và **App Secret** trên bảng điều khiển. Sao chép cả hai giá trị.
5. Trong cài đặt ứng dụng, điều hướng đến **Official Account** và liên kết OA của bạn với ứng dụng.
6. Trong mục **Permissions**, bật tối thiểu:
   - `send_zns_message`
   - `manage_official_account`
   - `manage_oa`
7. Thêm redirect URI (dùng trong luồng OAuth) — để kiểm thử cục bộ bạn có thể dùng `https://localhost` hoặc công cụ như [ngrok](https://ngrok.com).

---

## Bước 2 — Lấy Access Token qua OAuth v4 + PKCE *(Step 2 — Obtain an Access Token)*

Zalo sử dụng OAuth 2.0 với phần mở rộng PKCE. Thực hiện các bước sau để lấy token ban đầu.

### 2a — Tạo Code Verifier và Code Challenge

```bash
# Tạo code verifier ngẫu nhiên 64 ký tự (URL-safe base64)
CODE_VERIFIER=$(openssl rand -base64 64 | tr -d '=+/' | cut -c1-64)

# Tạo code challenge (băm SHA-256, URL-safe base64)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr -d '=' | tr '+/' '-_')

echo "Code Verifier: $CODE_VERIFIER"
echo "Code Challenge: $CODE_CHALLENGE"
```

### 2b — Mở URL ủy quyền *(Open the Authorization URL)*

Mở URL sau trong trình duyệt (thay thế các giá trị placeholder):

```
https://oauth.zaloapp.com/v4/oa/permission
  ?app_id=YOUR_APP_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &code_challenge=YOUR_CODE_CHALLENGE
  &state=random_csrf_token
```

Đăng nhập và cấp các quyền được yêu cầu. Zalo sẽ chuyển hướng đến `redirect_uri` của bạn với tham số `code`, ví dụ:

```
https://your-redirect-uri/?code=abc123&state=random_csrf_token
```

### 2c — Đổi code lấy token *(Exchange the Code for Tokens)*

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: YOUR_APP_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=abc123&app_id=YOUR_APP_ID&grant_type=authorization_code&code_verifier=YOUR_CODE_VERIFIER"
```

Phản hồi thành công trông như sau:

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 90000
}
```

- **access_token** — có hiệu lực trong 25 giờ (90.000 giây)
- **refresh_token** — có hiệu lực trong 3 tháng; giữ bí mật

> Xem [credential-setup.md](credential-setup.md) để biết cách tự động làm mới token.

---

## Bước 3 — Thiết lập thông tin đăng nhập trong n8n *(Step 3 — Set Up the Credential in n8n)*

1. Trong n8n, mở **Settings → Credentials → New Credential**.
2. Tìm kiếm **Zalo OA API** và chọn nó.
3. Điền vào bốn trường:

   | Trường | Giá trị |
   |--------|---------|
   | App ID | Mã ứng dụng Zalo của bạn |
   | App Secret | Khóa bí mật ứng dụng Zalo |
   | Access Token | Token từ Bước 2c |
   | Refresh Token | Refresh token từ Bước 2c |

4. Nhấn **Save**. n8n sẽ gọi `GET /getoa` để xác minh thông tin đăng nhập. Dấu kiểm màu xanh xác nhận thành công.

---

## Bước 4 — Xây dựng luồng làm việc đầu tiên: Gửi tin nhắn chào mừng người theo dõi mới *(Step 4 — Build Your First Workflow)*

Luồng làm việc này tự động gửi tin nhắn chào mừng mỗi khi có người theo dõi OA của bạn.

### Cấu trúc luồng làm việc *(Workflow structure)*

```
ZaloOAWebhook  →  IF (event = follow)  →  ZaloOA (sendText)
```

### Cấu hình nút ZaloOAWebhook *(Configure the ZaloOAWebhook node)*

1. Thêm nút **ZaloOAWebhook** vào luồng làm việc mới.
2. Chọn thông tin đăng nhập **Zalo OA API** của bạn.
3. Đặt **Event** là `follow`.
4. Kích hoạt luồng làm việc và sao chép **Webhook URL** hiển thị trong nút.
5. Đăng ký URL đó trong Zalo Developer Console tại **Official Account → Webhook URL**.

### Cấu hình nút IF (bộ lọc tùy chọn) *(Configure the IF node — optional filter)*

Webhook chỉ kích hoạt cho sự kiện `follow` trong ví dụ này, vì vậy nút IF là tùy chọn. Bạn có thể bỏ qua và kết nối trực tiếp đến nút tin nhắn.

### Cấu hình nút ZaloOA *(Configure the ZaloOA node)*

1. Thêm nút **ZaloOA** sau webhook.
2. Chọn thông tin đăng nhập **Zalo OA API** của bạn.
3. Đặt:
   - **Resource:** Message
   - **Operation:** sendText
   - **Message Type:** `cs`
   - **User ID:** `{{ $json.follower.id }}`
   - **Text:** `Chào mừng! Cảm ơn bạn đã theo dõi chúng tôi trên Zalo. Chúng tôi có thể giúp gì cho bạn?`
4. Kết nối đầu ra nút ZaloOAWebhook đến nút này.

### Kích hoạt và kiểm thử *(Activate and test)*

1. Nhấn **Activate** để bật luồng làm việc.
2. Dùng tài khoản Zalo thứ hai (hoặc nhờ đồng nghiệp), theo dõi OA của bạn.
3. Trong vài giây, người theo dõi mới sẽ nhận được tin nhắn chào mừng.

---

## Các bước tiếp theo *(Next Steps)*

- [Thiết lập thông tin đăng nhập](credential-setup.md) — tự động làm mới token
- [Loại tin nhắn](message-types.md) — lựa chọn giữa cs, transaction và promotion
- [Hướng dẫn Webhook](webhook-guide.md) — xử lý tất cả 25 loại sự kiện
- [Tham chiếu nút Message](nodes/zalo-oa-message.md) — toàn bộ thao tác tin nhắn
- [Tham chiếu nút Follower](nodes/zalo-oa-follower.md) — truy vấn và cập nhật hồ sơ người theo dõi
