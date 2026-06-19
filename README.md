# n8n-nodes-mochi-zalo-oa

[![CI](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa/actions/workflows/ci.yml/badge.svg)](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/n8n-nodes-mochi-zalo-oa)](https://www.npmjs.com/package/n8n-nodes-mochi-zalo-oa)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Bộ nút cộng đồng n8n dành cho **Zalo Official Account (OA) API v3.0**. Tự động hóa việc gửi tin nhắn, quản lý người theo dõi, tải lên tệp phương tiện, xử lý webhook và nhiều hơn nữa — tất cả trong các luồng làm việc n8n của bạn.

---

## Zalo OA là gì? *(What is Zalo OA?)*

[Zalo](https://zalo.me) là nền tảng nhắn tin phổ biến nhất tại Việt Nam với hơn 75 triệu người dùng. **Zalo Official Account (OA)** là tài khoản doanh nghiệp được xác minh trên Zalo, tương tự như Facebook Page hay LINE Official Account. Zalo OA API cho phép bạn:

- Gửi tin nhắn văn bản, hình ảnh, tệp đính kèm, danh sách và nhãn dán đến người theo dõi
- Quản lý hồ sơ và thẻ nhãn của người theo dõi
- Đăng bài viết và quản lý cửa hàng sản phẩm
- Nhận tin nhắn đến qua webhook theo thời gian thực
- Cập nhật hồ sơ OA và menu chat

Gói này tích hợp toàn bộ Zalo OA API v3.0 vào n8n thông qua hai nút.

---

## Các nút *(Nodes)*

| Nút | Loại | Mô tả |
|-----|------|-------|
| **ZaloOA** | Action | Gửi tin nhắn, quản lý người theo dõi, tải lên phương tiện, xử lý thẻ nhãn, menu, bài viết, cửa hàng và hội thoại |
| **ZaloOAWebhook** | Trigger | Nhận sự kiện theo thời gian thực từ Zalo OA (người theo dõi mới, tin nhắn đến, nhấn nút, v.v.) |

### ZaloOA — Tài nguyên và thao tác *(Resources and Operations)*

| Tài nguyên | Thao tác |
|------------|---------|
| **Message** | sendText, sendImage, sendFile, sendList, sendSticker, getStatus |
| **Follower** | getInfo, getList, update |
| **OA** | getProfile |
| **Media** | uploadImage, uploadFile, uploadGif |
| **Tag** | getList, assign, remove, removeFollower |
| **Menu** | update |
| **Article** | create, update, remove, getList, getDetail |
| **Store** | createProduct, updateProduct, getProduct, getProducts, createCategory, updateCategory, getCategories, createOrder |
| **Conversation** | getRecentChats, getMessages |

### ZaloOAWebhook — Các sự kiện được hỗ trợ *(Supported Events)*

`follow`, `unfollow`, `user_send_text`, `user_send_image`, `user_send_file`, `user_send_audio`, `user_send_video`, `user_send_sticker`, `user_send_gif`, `user_send_link`, `user_send_location`, `user_send_business_card`, `user_click_button`, `user_click_link`, các sự kiện `group_*`, `add_user_to_tag`, `user_call_oa`, và `*` (tất cả sự kiện)

---

## Cài đặt *(Installation)*

### n8n Desktop / Cloud

Trong giao diện n8n, vào **Settings → Community Nodes → Install** và nhập:

```
n8n-nodes-mochi-zalo-oa
```

### n8n tự lưu trữ với npm *(Self-hosted n8n via npm)*

```bash
npm install n8n-nodes-mochi-zalo-oa
```

Sau đó khởi động lại phiên bản n8n của bạn.

### n8n tự lưu trữ với Docker *(Self-hosted n8n via Docker)*

```dockerfile
FROM n8nio/n8n
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-mochi-zalo-oa
```

---

## Thiết lập thông tin đăng nhập *(Credential Setup)*

1. Truy cập [developers.zalo.me](https://developers.zalo.me) và tạo một ứng dụng.
2. Trong mục **Official Account API**, bật các quyền OA cần thiết.
3. Thực hiện luồng OAuth v4 + PKCE để lấy **Access Token** và **Refresh Token**.
4. Trong n8n, tạo thông tin đăng nhập mới loại **Zalo OA API** và điền:
   - **App ID** — mã ứng dụng Zalo của bạn
   - **App Secret** — khóa bí mật ứng dụng (dùng để xác minh chữ ký MAC webhook)
   - **Access Token** — hết hạn sau 25 giờ (90.000 giây)
   - **Refresh Token** — có hiệu lực trong 3 tháng; dùng để lấy access token mới

> Xem [docs/credential-setup.md](docs/credential-setup.md) để biết toàn bộ luồng OAuth và chiến lược làm mới token.

---

## Bắt đầu nhanh — Gửi tin nhắn đầu tiên *(Quick Start — Send Your First Message)*

**Mục tiêu:** Gửi tin nhắn văn bản đến một người theo dõi Zalo khi kích hoạt thủ công.

1. Tạo một luồng làm việc mới trong n8n.
2. Thêm nút **Manual Trigger**.
3. Thêm nút **ZaloOA**:
   - Credential: thông tin đăng nhập Zalo OA API của bạn
   - Resource: **Message**
   - Operation: **sendText**
   - Message Type: **cs** (Customer Service)
   - User ID: `<mã người dùng Zalo của người theo dõi>`
   - Text: `Xin chào! Cảm ơn bạn đã theo dõi OA của chúng tôi.`
4. Kết nối các nút và nhấn **Execute Workflow**.

Bạn sẽ thấy mã tin nhắn Zalo trong kết quả đầu ra. Người theo dõi sẽ nhận được tin nhắn trong ứng dụng Zalo của họ.

---

## Hướng dẫn loại tin nhắn *(Message Type Guide)*

Zalo OA có ba loại tin nhắn kiểm soát đối tượng nhận và điều kiện gửi:

| Loại | Đối tượng | Yêu cầu tương tác | Trường hợp sử dụng |
|------|-----------|-------------------|-------------------|
| `cs` | Người theo dõi cá nhân | Phải đã tương tác trong **7 ngày** qua | Trả lời hỗ trợ khách hàng |
| `transaction` | Người theo dõi cá nhân | Phải đã tương tác trong **1 năm** qua | Xác nhận đơn hàng, nhắc nhở |
| `promotion` | Người theo dõi hoạt động (phát sóng) | Có hạn ngạch hàng ngày | Chiến dịch marketing |

> Xem [docs/message-types.md](docs/message-types.md) để biết hướng dẫn chi tiết, hạn ngạch và ví dụ.

---

## Hướng dẫn thiết lập Webhook *(Webhook Setup Guide)*

Nút **ZaloOAWebhook** nhận sự kiện theo thời gian thực từ Zalo.

**Thiết lập nhanh:**

1. Thêm nút **ZaloOAWebhook** vào luồng làm việc và kích hoạt nó.
2. Sao chép **Webhook URL** từ nút (ví dụ: `https://your-n8n.example.com/webhook/zalo-oa`).
3. Trong [Zalo Developer Console](https://developers.zalo.me), đăng ký URL làm điểm cuối webhook OA của bạn.
4. Cấu hình App Secret trong thông tin đăng nhập — nút tự động xác minh tiêu đề `X-ZEvent-Signature` bằng HMAC-SHA256.
5. Chọn loại sự kiện cần lắng nghe (hoặc chọn `*` cho tất cả).

> Xem [docs/webhook-guide.md](docs/webhook-guide.md) để biết thiết lập đầy đủ, tham chiếu sự kiện và hành vi thử lại.

---

## Tham chiếu mã lỗi *(Error Codes Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu tham số bắt buộc | Kiểm tra tất cả các trường bắt buộc đã được điền |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| `-213` | Người dùng không theo dõi OA này | Xác minh mã người dùng và họ đã theo dõi OA của bạn |
| `-214` | Người dùng ngoài cửa sổ tương tác | Dùng loại `transaction` (cửa sổ 1 năm) hoặc chờ người dùng tương tác lại |
| `-240` | API v2.0 bị vô hiệu hóa | Thao tác yêu cầu v3.0; gói này xử lý tự động |

---

## Giới hạn tốc độ *(Rate Limits)*

Zalo OA API áp dụng giới hạn tốc độ theo OA mỗi ngày:

- **Tin nhắn cs / transaction:** Liên kết với tương tác người dùng; không có giới hạn cứng hàng ngày theo người nhận, nhưng giới hạn phía máy chủ vẫn áp dụng.
- **Tin nhắn promotion:** Phụ thuộc vào hạn ngạch phát sóng hàng ngày được xác định theo cấp OA của bạn. Vượt quá hạn ngạch sẽ trả về lỗi.
- **Lời gọi API:** Giới hạn tốc độ chung được áp dụng. Hãy triển khai logic thử lại với thời gian chờ tăng dần cho các luồng làm việc sản xuất.

---

## Tài liệu *(Documentation)*

| Tài liệu | Mô tả |
|----------|-------|
| [Bắt đầu nhanh](docs/getting-started.md) | Hướng dẫn toàn bộ từ đầu đến tin nhắn đầu tiên |
| [Thiết lập thông tin đăng nhập](docs/credential-setup.md) | Luồng OAuth và làm mới token |
| [Loại tin nhắn](docs/message-types.md) | cs vs transaction vs promotion |
| [Hướng dẫn Webhook](docs/webhook-guide.md) | Thiết lập webhook và tham chiếu sự kiện |
| [Nút Message](docs/nodes/zalo-oa-message.md) | Tất cả thao tác gửi tin nhắn |
| [Nút Follower](docs/nodes/zalo-oa-follower.md) | Quản lý người theo dõi |
| [Nút Media](docs/nodes/zalo-oa-media.md) | Tải lên hình ảnh, tệp và GIF |
| [Nút Tag](docs/nodes/zalo-oa-tag.md) | Quản lý thẻ nhãn |
| [Nút Menu](docs/nodes/zalo-oa-menu.md) | Menu chat OA |
| [Nút Article](docs/nodes/zalo-oa-article.md) | Đăng bài viết |
| [Nút Store](docs/nodes/zalo-oa-store.md) | Quản lý sản phẩm và đơn hàng |
| [Nút Conversation](docs/nodes/zalo-oa-conversation.md) | Lịch sử hội thoại |
| [Nút Webhook](docs/nodes/zalo-oa-webhook.md) | Tham chiếu sự kiện kích hoạt |

---

## Đóng góp *(Contributing)*

Chúng tôi hoan nghênh mọi đóng góp. Vui lòng mở issue hoặc pull request trên [GitHub](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa).

1. Fork repository.
2. Tạo nhánh tính năng: `git checkout -b feature/my-feature`
3. Commit các thay đổi với thông điệp mô tả rõ ràng.
4. Chạy `npm test` và `npm run lint` trước khi gửi.
5. Mở pull request vào nhánh `main`.

---

## Giấy phép *(License)*

MIT © [Cong Dinh](mailto:congdinh2021@gmail.com)

---

## Liên kết *(Links)*

- [Gói npm](https://www.npmjs.com/package/n8n-nodes-mochi-zalo-oa)
- [Kho GitHub](https://github.com/congdinh2008/n8n-nodes-mochi-zalo-oa)
- [Tài liệu Zalo OA API](https://developers.zalo.me/docs/official-account)
- [Tài liệu nút cộng đồng n8n](https://docs.n8n.io/integrations/community-nodes/)
