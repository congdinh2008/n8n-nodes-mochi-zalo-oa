# Thiết lập thông tin đăng nhập — Zalo OA API *(Credential Setup)*

Tài liệu này trình bày toàn bộ luồng ủy quyền OAuth v4 + PKCE, các trường thông tin đăng nhập, và chiến lược làm mới token cho môi trường sản xuất.

---

## Các trường thông tin đăng nhập *(Credential Fields)*

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| **App ID** | Có | Mã ứng dụng Zalo của bạn tại [developers.zalo.me](https://developers.zalo.me) |
| **App Secret** | Có | Khóa bí mật ứng dụng Zalo — dùng để xác minh chữ ký MAC webhook |
| **Access Token** | Có | Token tồn tại ngắn hạn (25 giờ / 90.000 giây) để ủy quyền lời gọi API |
| **Refresh Token** | Có | Token tồn tại dài hạn (3 tháng) dùng để lấy access token mới |

Thông tin đăng nhập tự động đưa `access_token` vào tiêu đề của mỗi yêu cầu API. Bạn không cần thêm thủ công vào từng nút.

---

## Thời gian hiệu lực của token *(Token Lifetimes)*

| Token | Thời gian hiệu lực | Khuyến nghị lưu trữ |
|-------|-------------------|---------------------|
| Access Token | 25 giờ (90.000 giây) | Cập nhật trong thông tin đăng nhập n8n trước khi hết hạn |
| Refresh Token | 3 tháng | Lưu trữ an toàn; làm mới trước khi hết hạn |

> Nếu access token hết hạn, API trả về mã lỗi `-204`. Nếu refresh token hết hạn, bạn phải lặp lại toàn bộ luồng ủy quyền OAuth.

---

## Luồng ủy quyền OAuth v4 + PKCE *(OAuth v4 + PKCE Authorization Flow)*

### Bước 1 — Tạo tham số PKCE *(Step 1 — Generate PKCE Parameters)*

PKCE (Proof Key for Code Exchange) ngăn chặn tấn công đánh cắp mã ủy quyền.

```bash
# Tạo code verifier ngẫu nhiên 64 ký tự
CODE_VERIFIER=$(openssl rand -base64 64 | tr -d '=+/' | cut -c1-64)

# Tạo code challenge SHA-256 (URL-safe base64, không padding)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" \
  | openssl dgst -sha256 -binary \
  | base64 \
  | tr -d '=' \
  | tr '+/' '-_')
```

Lưu `CODE_VERIFIER` cục bộ — bạn sẽ cần nó ở Bước 3.

### Bước 2 — Yêu cầu ủy quyền *(Step 2 — Request Authorization)*

Chuyển hướng người dùng (hoặc chính bạn) đến URL này:

```
https://oauth.zaloapp.com/v4/oa/permission
  ?app_id=<APP_ID>
  &redirect_uri=<REDIRECT_URI>
  &code_challenge=<CODE_CHALLENGE>
  &state=<RANDOM_STATE>
```

Sau khi người dùng đăng nhập và đồng ý, Zalo chuyển hướng đến:

```
<REDIRECT_URI>?code=<AUTHORIZATION_CODE>&state=<RANDOM_STATE>
```

Xác minh rằng `state` khớp với giá trị bạn đã gửi (bảo vệ CSRF).

### Bước 3 — Đổi code lấy token *(Step 3 — Exchange Code for Tokens)*

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: <APP_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "code=<AUTHORIZATION_CODE>&app_id=<APP_ID>&grant_type=authorization_code&code_verifier=<CODE_VERIFIER>"
```

**Phản hồi:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 90000
}
```

Nhập cả hai token vào thông tin đăng nhập n8n.

---

## Làm mới Access Token *(Refreshing the Access Token)*

Khi access token sắp hết hạn (hoặc sau khi nhận lỗi `-204`), đổi refresh token để lấy access token mới.

```bash
curl -X POST https://oauth.zaloapp.com/v4/oa/access_token \
  -H "secret_key: <APP_SECRET>" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "refresh_token=<REFRESH_TOKEN>&app_id=<APP_ID>&grant_type=refresh_token"
```

**Phản hồi:**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "expires_in": 90000
}
```

Lưu ý: Zalo cũng cấp refresh token mới với mỗi lần làm mới. Cập nhật cả hai token trong thông tin đăng nhập n8n của bạn.

---

## Chiến lược làm mới token trong n8n *(Token Refresh Strategy in n8n)*

Vì n8n không tự động làm mới token Zalo, hãy dùng một trong các cách sau:

### Lựa chọn A — Luồng làm việc làm mới theo lịch (Khuyến nghị) *(Option A — Scheduled Refresh Workflow)*

Tạo luồng làm việc riêng chạy mỗi 20 giờ:

```
Schedule Trigger (every 20h)
  → HTTP Request (POST to Zalo token endpoint)
  → n8n API (PATCH /credentials/:id to update access_token and refresh_token)
```

Cách này giữ thông tin đăng nhập luôn cập nhật mà không cần can thiệp thủ công.

### Lựa chọn B — Làm mới khi có lỗi *(Option B — Refresh on Error)*

Thêm bộ xử lý lỗi vào các luồng làm việc chính:

```
ZaloOA node
  → [On Error] → IF (error.code === -204)
                    → HTTP Request (refresh token)
                    → Update credential via n8n API
                    → Retry original ZaloOA node
```

### Lựa chọn C — Làm mới thủ công *(Option C — Manual Refresh)*

Phù hợp cho việc sử dụng ít hoặc môi trường phát triển:
- Đặt lời nhắc lịch mỗi 20 giờ để chạy lại việc đổi token.
- Dán token mới vào thông tin đăng nhập n8n thủ công.

---

## Thực hành bảo mật tốt nhất *(Security Best Practices)*

- Không bao giờ để lộ **App Secret** hoặc **Refresh Token** trong tham số luồng làm việc, nhật ký hay thông báo lỗi.
- Lưu token trong thông tin đăng nhập n8n, không phải trong biến luồng làm việc hay tham số nút.
- Xoay vòng App Secret trong Zalo Developer Console ngay lập tức nếu bạn nghi ngờ bị rò rỉ.
- Dùng biến môi trường (`N8N_ENCRYPTION_KEY`) để mã hóa kho thông tin đăng nhập n8n ở trạng thái lưu trữ.
- Hạn chế redirect URI của ứng dụng Zalo ở mức tối thiểu cần thiết.

---

## Xác minh thông tin đăng nhập *(Verifying the Credential)*

Nút **Test** trong bảng thông tin đăng nhập n8n gọi `GET https://openapi.zalo.me/v3.0/oa/getoa`. Kiểm thử thành công trả về thông tin hồ sơ OA của bạn:

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "oa_id": "1234567890",
    "name": "My Official Account",
    "description": "...",
    "avatar": "https://...",
    "cover": "https://..."
  }
}
```

Nếu kiểm thử thất bại, hãy kiểm tra lại access token có hợp lệ và chưa hết hạn.
