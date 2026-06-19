# Nút ZaloOA — Tài nguyên Article *(ZaloOA Node — Article Resource)*

Tài nguyên **Article** cho phép bạn tạo, cập nhật, xóa, liệt kê và truy xuất các bài viết đăng trên Zalo Official Account. Bài viết là nội dung dạng dài xuất hiện trong nguồn tin tức của OA và có thể chia sẻ qua tin nhắn Zalo.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- OA của bạn phải được bật quyền đăng bài viết.

---

## Bài viết OA là gì? *(What Are OA Articles?)*

Bài viết là các bài đăng nội dung phong phú trên Zalo OA — tương tự như bài blog hoặc Facebook Notes. Chúng hỗ trợ nội dung thân bài định dạng HTML, hình ảnh bìa và tên tác giả. Sau khi đăng, bài viết xuất hiện trong nguồn tin tức của OA và có thể liên kết trong tin nhắn gửi đến người theo dõi.

---

## Các thao tác *(Operations)*

### create

Tạo và đăng bài viết mới trên OA của bạn.

**Endpoint:** `POST /article/create`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Title | string | Có | Tiêu đề bài viết (tối đa 100 ký tự) |
| Description | string | Không | Tóm tắt ngắn hiển thị trong xem trước (tối đa 300 ký tự) |
| Cover Image URL | string | Có | URL hình ảnh bìa của bài viết |
| Author | string | Không | Tên tác giả hiển thị |
| Body | string | Có | Nội dung HTML của thân bài viết |
| Status | select | Có | `show` (đã đăng) hoặc `hide` (nháp) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "article_id": "art_abc123def456"
  }
}
```

**Lưu ý:**
- Trường `body` hỗ trợ tập con thẻ HTML: `<p>`, `<b>`, `<i>`, `<ul>`, `<ol>`, `<li>`, `<a>`, `<img>`, `<h1>`–`<h3>`, `<br>`.
- URL hình ảnh bìa phải có thể truy cập công khai. Tải lên bằng thao tác **Media → uploadImage** cho kết quả tốt nhất.
- Đặt `status` là `hide` lưu bài viết dưới dạng nháp mà không đăng cho người theo dõi.

---

### update

Cập nhật nội dung hoặc trạng thái của bài viết hiện có.

**Endpoint:** `POST /article/update`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Article ID | string | Có | Mã bài viết cần cập nhật |
| Title | string | Không | Tiêu đề mới |
| Description | string | Không | Tóm tắt mới |
| Cover Image URL | string | Không | URL hình ảnh bìa mới |
| Author | string | Không | Tên tác giả mới |
| Body | string | Không | Nội dung HTML mới |
| Status | select | Không | `show` hoặc `hide` |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Lưu ý:**
- Chỉ cung cấp các trường bạn muốn thay đổi. Các trường bị bỏ qua giữ nguyên giá trị hiện tại.
- Thay đổi `status` từ `hide` sang `show` sẽ đăng bài viết ngay lập tức.

---

### remove

Xóa vĩnh viễn bài viết đã đăng hoặc bản nháp.

**Endpoint:** `POST /article/remove`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Article ID | string | Có | Mã bài viết cần xóa |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Cảnh báo:** Xóa là vĩnh viễn và không thể hoàn tác. Mọi liên kết đã chia sẻ với người theo dõi trỏ đến bài viết này sẽ trả về trang 404.

---

### getList

Truy xuất danh sách bài viết có phân trang trên OA của bạn.

**Endpoint:** `GET /article/getslice` (Zalo API v2.0)

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Offset | number | Có | Chỉ số bắt đầu (bắt đầu từ 0) |
| Count | number | Có | Số bài viết cần trả về (tối đa 20 mỗi yêu cầu) |
| Status | select | Không | `show`, `hide`, hoặc bỏ trống để trả về tất cả |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 48,
    "articles": [
      {
        "article_id": "art_abc123",
        "title": "Summer Sale Announcement",
        "description": "Our biggest sale of the year starts now...",
        "cover": "https://cdn.zalo.me/...",
        "status": "show",
        "created_time": 1718000000000,
        "updated_time": 1718050000000
      }
    ]
  }
}
```

---

### getDetail

Truy xuất toàn bộ nội dung và siêu dữ liệu của một bài viết cụ thể.

**Endpoint:** `GET /article/getdetail`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Article ID | string | Có | Mã bài viết cần truy xuất |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "article_id": "art_abc123",
    "title": "Summer Sale Announcement",
    "description": "Our biggest sale of the year starts now...",
    "cover": "https://cdn.zalo.me/...",
    "author": "Marketing Team",
    "body": "<p>Welcome to our summer sale...</p>",
    "status": "show",
    "url": "https://zalo.me/s/oa-article/art_abc123",
    "created_time": 1718000000000,
    "updated_time": 1718050000000
  }
}
```

---

## Ví dụ luồng làm việc — Đăng bài viết bản tin hàng tuần *(Example Workflow — Publish a Weekly Newsletter Article)*

```
Schedule Trigger (every Monday 8:00 AM)
  → HTTP Request (fetch newsletter content from CMS API)
  → ZaloOA Article create
        Title:     {{ $json.title }}
        Body:      {{ $json.html_content }}
        Cover Image URL: {{ $json.featured_image }}
        Author:    Marketing Team
        Status:    show
  → ZaloOA Message sendText (promotion)
        Text:      Bài viết mới: {{ $json.title }}. Đọc ngay tại: {{ $node["ZaloOA"].json.data.url }}
```

---

## Ví dụ luồng làm việc — Lưu trữ bài viết cũ *(Example Workflow — Archive Old Articles)*

```
Schedule Trigger (1st of each month)
  → ZaloOA Article getList (offset: 0, count: 20, status: show)
  → Loop Over Items
  → IF ($json.created_time < 90 days ago)
        → ZaloOA Article update
              Article ID: {{ $json.article_id }}
              Status:     hide
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu tham số bắt buộc | Cung cấp title, hình ảnh bìa, body và status |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| Article not found | Mã bài viết không hợp lệ | Xác minh mã bài viết từ getList |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Thao tác `getList` sử dụng Zalo API v2.0 bên trong — điều này được xử lý tự động bởi nút.
- URL bài viết là các trang được lưu trữ vĩnh viễn trên Zalo; một khi bài viết bị xóa, URL của nó trở nên không hợp lệ.
- HTML phong phú trong trường `body` được hiển thị trong trình xem bài viết của Zalo nhưng bị chuyển thành văn bản thuần trong bản xem trước tin nhắn.
- Hình ảnh trong thân bài viết phải dùng URL tuyệt đối. URL tương đối không được hỗ trợ.
- Bài viết được lập chỉ mục bởi tìm kiếm của Zalo nếu OA của bạn bật khả năng hiển thị tìm kiếm.
