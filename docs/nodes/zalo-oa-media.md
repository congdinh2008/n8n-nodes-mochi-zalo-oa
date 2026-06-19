# Nút ZaloOA — Tài nguyên Media *(ZaloOA Node — Media Resource)*

Tài nguyên **Media** cung cấp các thao tác để tải lên hình ảnh, tệp và GIF động lên hạ tầng phân phối nội dung của Zalo. Các tài sản đã tải lên trả về token hoặc attachment ID có thể tái sử dụng trong các thao tác gửi tin nhắn tiếp theo.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- Dữ liệu nhị phân phải có sẵn trong luồng làm việc n8n dưới dạng thuộc tính nhị phân (từ nút HTTP Request, Read Binary File hoặc tương tự), hoặc tài sản phải có thể truy cập công khai qua URL.

---

## Tại sao cần tải lên phương tiện trước? *(Why Upload Media First?)*

Zalo không cho phép URL tùy ý trong payload tin nhắn cho tất cả loại tài sản. Việc tải lên phương tiện trước:

1. Trả về token ổn định hoặc attachment ID có thể tái sử dụng.
2. Đảm bảo CDN của Zalo phục vụ tài sản — không phải máy chủ gốc của bạn.
3. Tránh chi phí băng thông lặp lại cho các hình ảnh gửi thường xuyên (ví dụ: logo).

---

## Các thao tác *(Operations)*

### uploadImage

Tải lên hình ảnh từ dữ liệu nhị phân hoặc URL công khai. Trả về token có thể dùng trong `message.sendImage`.

**Endpoint:** `POST /upload/image`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Source | select | Có | `binary` hoặc `url` |
| Binary Property | string | Nếu source = binary | Tên thuộc tính nhị phân trong mục n8n |
| Image URL | string | Nếu source = url | URL hình ảnh có thể truy cập công khai |

**Định dạng được hỗ trợ:** JPEG, PNG, GIF (tĩnh), BMP, WEBP

**Kích thước tệp tối đa:** 1 MB

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "attachment_id": "f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
  }
}
```

Dùng `data.attachment_id` làm `Attachment ID` trong `message.sendImage`.

**Lưu ý:**
- Attachment ID không hết hạn miễn là tài sản được liên kết với OA.
- GIF động tải lên qua `uploadImage` được xử lý như hình ảnh tĩnh; dùng `uploadGif` để giữ hiệu ứng động.

---

### uploadFile

Tải lên tài liệu tệp từ dữ liệu nhị phân hoặc URL công khai. Trả về token có thể dùng trong `message.sendFile`.

**Endpoint:** `POST /upload/file`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Source | select | Có | `binary` hoặc `url` |
| Binary Property | string | Nếu source = binary | Tên thuộc tính nhị phân trong mục n8n |
| File URL | string | Nếu source = url | URL tệp có thể truy cập công khai |

**Định dạng được hỗ trợ:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT và các định dạng văn phòng thông dụng.

**Kích thước tệp tối đa:** 25 MB

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "token": "file_token_abc123xyz789"
  }
}
```

Dùng `data.token` làm `File Token` trong `message.sendFile`.

**Lưu ý:**
- Token tệp có thời gian hiệu lực giới hạn. Dùng token sớm sau khi tải lên.
- Nếu cùng một tệp được gửi thường xuyên, hãy tải lên định kỳ để giữ token còn hiệu lực.

---

### uploadGif

Tải lên GIF động từ dữ liệu nhị phân hoặc URL công khai. Trả về `attachment_id` hiển thị có hiệu ứng động trong tin nhắn Zalo.

**Endpoint:** `POST /upload/gif`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Source | select | Có | `binary` hoặc `url` |
| Binary Property | string | Nếu source = binary | Tên thuộc tính nhị phân trong mục n8n |
| GIF URL | string | Nếu source = url | URL GIF động có thể truy cập công khai |

**Kích thước tệp tối đa:** 5 MB

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "attachment_id": "gif_a1b2c3d4e5f6g7h8i9j0"
  }
}
```

**Lưu ý:**
- GIF động phải ở định dạng GIF chuẩn (không phải WEBP hoặc APNG).
- GIF lớn có thể mất một chút thời gian xử lý. Cân nhắc thêm khoảng chờ ngắn trước khi dùng attachment_id trong tin nhắn.

---

## Ví dụ luồng làm việc — Tải lên và gửi hình ảnh sản phẩm *(Example Workflow — Upload and Send a Product Image)*

```
HTTP Request (download product image from e-commerce API)
  → ZaloOA Media uploadImage
        Source: binary
        Binary Property: data
  → ZaloOA Message sendImage
        Message Type: transaction
        User ID:      {{ $json.userId }}
        Image Source: attachment_id
        Attachment ID: {{ $node["ZaloOA Media"].json.data.attachment_id }}
```

---

## Ví dụ luồng làm việc — Gửi hóa đơn PDF *(Example Workflow — Send a PDF Invoice)*

```
Generate PDF (e.g., using an HTTP Request to a PDF generation service)
  → ZaloOA Media uploadFile
        Source: binary
        Binary Property: data
  → ZaloOA Message sendFile
        Message Type: transaction
        User ID:      {{ $json.customerId }}
        File Token:   {{ $node["ZaloOA Media"].json.data.token }}
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu dữ liệu nhị phân hoặc URL | Đảm bảo có thuộc tính nhị phân hoặc URL |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| File too large | Vượt quá giới hạn kích thước | Nén hoặc chia nhỏ tệp |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Cả ba thao tác đều nhận dữ liệu nhị phân hoặc URL công khai — bạn không thể kết hợp cả hai trong một lần gọi.
- Token từ `uploadFile` dùng một lần hoặc tồn tại ngắn hạn. Không lưu trữ đệm chúng quá vài giờ.
- Giá trị `attachment_id` từ `uploadImage` và `uploadGif` bền hơn và có thể lưu trữ trong cơ sở dữ liệu để tái sử dụng.
- URL riêng tư (đằng sau xác thực hoặc tường lửa) không được hỗ trợ cho tải lên qua URL. Dùng đường dẫn tải lên nhị phân thay thế.
- Không có API endpoint để liệt kê hoặc xóa các tài sản phương tiện đã tải lên.
