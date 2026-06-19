# Nút ZaloOA — Tài nguyên Tag *(ZaloOA Node — Tag Resource)*

Tài nguyên **Tag** cho phép bạn quản lý thẻ nhãn người theo dõi trên Zalo OA. Thẻ nhãn là nhãn bạn gán cho người theo dõi để phân khúc, nhắm mục tiêu và tổ chức — tương tự như nhãn liên hệ trong CRM.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- Thẻ nhãn phải đã tồn tại trên OA của bạn trước khi có thể gán chúng (Zalo không tự tạo thẻ nhãn khi gán).
- Người dùng phải là người theo dõi OA của bạn.

---

## Các thao tác *(Operations)*

### getList

Truy xuất tất cả thẻ nhãn được định nghĩa trên OA của bạn.

**Endpoint:** `GET /tag/gettagsofoa`

Không cần tham số.

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": [
    {
      "tag_name": "VIP",
      "total_follower": 125
    },
    {
      "tag_name": "Hanoi",
      "total_follower": 430
    },
    {
      "tag_name": "Newsletter",
      "total_follower": 2100
    }
  ]
}
```

**Lưu ý:**
- Trả về tất cả thẻ nhãn, bất kể mỗi thẻ có bao nhiêu người theo dõi.
- `total_follower` phản ánh số lượng hiện tại tại thời điểm gọi.

---

### assign

Gán thẻ nhãn cho người theo dõi theo tên thẻ hoặc mã thẻ.

**Endpoint:** `POST /tag/taguser`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Tag Name | string | Một trong tag_name hoặc tag_id | Tên thẻ nhãn dễ đọc |
| Tag ID | string | Một trong tag_name hoặc tag_id | Mã thẻ nhãn dạng số |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Lưu ý:**
- Một người theo dõi có thể có nhiều thẻ nhãn cùng lúc.
- Nếu thẻ nhãn không tồn tại trên OA, API trả về lỗi. Tạo thẻ nhãn trong bảng quản trị Zalo OA trước.
- Gán thẻ nhãn mà người dùng đã có là idempotent (không trả về lỗi).

---

### remove

Xóa hoàn toàn thẻ nhãn khỏi OA của bạn. Điều này xóa thẻ nhãn khỏi tất cả người theo dõi đang có nó.

**Endpoint:** `POST /tag/rmtag`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Tag Name | string | Có | Tên thẻ nhãn chính xác cần xóa |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Cảnh báo:** Thao tác này không thể hoàn tác. Xóa thẻ nhãn sẽ xóa nó khỏi mọi người theo dõi đang có thẻ đó và không thể khôi phục qua API.

---

### removeFollower

Xóa một người theo dõi cụ thể khỏi thẻ nhãn, mà không xóa bản thân thẻ nhãn.

**Endpoint:** `POST /tag/rmfollowerfromtag`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Tag Name | string | Có | Thẻ nhãn cần xóa khỏi người theo dõi này |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Lưu ý:**
- Dùng khi người dùng không còn đủ điều kiện cho một phân khúc nhưng bản thân thẻ nhãn cần được giữ lại.
- Xóa người dùng khỏi thẻ nhãn họ không có vẫn trả về phản hồi thành công (không lỗi).

---

## Ví dụ luồng làm việc — Tự động gắn thẻ người theo dõi theo địa điểm *(Example Workflow — Auto-Tag Followers by Location)*

```
ZaloOAWebhook (event: follow)
  → ZaloOA Follower getInfo
        User ID: {{ $json.follower.id }}
  → Switch (on: $node["ZaloOA"].json.data.shared_info.city)
      "Ha Noi"     → ZaloOA Tag assign (tag_name: "Hanoi")
      "Ho Chi Minh"→ ZaloOA Tag assign (tag_name: "HCM")
      default      → ZaloOA Tag assign (tag_name: "Other")
```

---

## Ví dụ luồng làm việc — Xóa người theo dõi không hoạt động khỏi thẻ nhãn Newsletter *(Example Workflow — Remove Inactive Followers from Newsletter Tag)*

```
Schedule Trigger (weekly)
  → ZaloOA Follower getList
  → Split In Batches
  → HTTP Request (check last order date from CRM)
  → IF (no order in last 6 months)
        → ZaloOA Tag removeFollower
              User ID:  {{ $json.user_id }}
              Tag Name: Newsletter
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu tham số bắt buộc | Cung cấp cả User ID và tên/mã thẻ nhãn |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| `-213` | Người dùng không theo dõi OA này | Xác minh người dùng là người theo dõi hiện tại |
| Tag not found | Tên thẻ nhãn không tồn tại | Tạo thẻ nhãn trong bảng quản trị Zalo OA |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Thẻ nhãn phải được tạo thông qua cổng quản trị Zalo OA ([oa.zalo.me](https://oa.zalo.me)) hoặc API quản lý OA — thao tác `assign` không tạo thẻ nhãn mới.
- Số lượng thẻ nhãn tối đa cho mỗi OA: tùy thuộc loại OA; kiểm tra tài liệu Zalo cho cấp tài khoản của bạn.
- Số lượng thẻ nhãn tối đa cho mỗi người theo dõi: tùy thuộc; tham khảo tài liệu giới hạn của Zalo.
- Thao tác `getList` không trả về mã người dùng cho một thẻ nhãn cụ thể. Dùng endpoint `user/getlist` được lọc theo thẻ nhãn trong bảng quản trị Zalo OA để lấy danh sách người theo dõi theo thẻ nhãn.
