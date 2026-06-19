# Nút ZaloOA — Tài nguyên Follower *(ZaloOA Node — Follower Resource)*

Tài nguyên **Follower** cung cấp các thao tác để truy xuất thông tin về người theo dõi cá nhân, liệt kê tất cả người theo dõi OA của bạn, và cập nhật dữ liệu hiển thị của người theo dõi.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- Người dùng phải là người theo dõi hiện tại của OA của bạn đối với `getInfo` và `update`.
- `getList` chỉ trả về người dùng đang theo dõi OA của bạn.

---

## Các thao tác *(Operations)*

### getInfo

Truy xuất hồ sơ của một người theo dõi cụ thể theo mã người dùng Zalo.

**Endpoint:** `GET /user/detail?data={"user_id":"<id>"}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "user_id": "zalo_user_id_here",
    "display_name": "Nguyen Van A",
    "birth_date": 19900101,
    "gender": 1,
    "avatar": "https://s240-ava-talk.zadn.vn/...",
    "avatar_small": "https://s120-ava-talk.zadn.vn/...",
    "user_is_follower": true,
    "follower_from": 1718000000000,
    "user_is_sensitive": false,
    "tags_and_notes_info": {
      "tag_names": ["VIP", "Hanoi"],
      "notes": [
        { "note": "Premium customer", "create_time": 1718000000000 }
      ]
    },
    "shared_info": {
      "phone": "0901234567",
      "city": "Ha Noi"
    }
  }
}
```

**Mô tả các trường:**

| Trường | Mô tả |
|--------|-------|
| `display_name` | Tên hiển thị trong hội thoại OA |
| `birth_date` | Định dạng: YYYYMMDD (0 nếu không chia sẻ) |
| `gender` | 0 = không xác định, 1 = nam, 2 = nữ |
| `avatar` | URL ảnh đại diện kích thước đầy đủ |
| `user_is_follower` | Người dùng có đang theo dõi OA của bạn không |
| `follower_from` | Unix timestamp (ms) khi người dùng theo dõi |
| `tags_and_notes_info` | Thẻ nhãn được gán và ghi chú thêm qua OA |
| `shared_info` | Số điện thoại và thành phố người dùng chia sẻ (nếu được cấp quyền) |

**Lưu ý:**
- Một số trường (phone, birth_date, gender) chỉ có nếu người dùng đã chia sẻ rõ ràng với OA của bạn.
- Người dùng nhạy cảm (`user_is_sensitive: true`) có quyền truy cập hồ sơ bị hạn chế.

---

### getList

Truy xuất danh sách người theo dõi có phân trang.

**Endpoint:** `GET /user/getlist?data={"offset":0,"count":50}`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Offset | number | Có | Vị trí bắt đầu (bắt đầu từ 0) |
| Count | number | Có | Số người theo dõi cần trả về (tối đa 50 mỗi yêu cầu) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 1250,
    "count": 50,
    "users": [
      {
        "user_id": "user_id_1",
        "display_name": "Tran Thi B",
        "avatar": "https://..."
      },
      {
        "user_id": "user_id_2",
        "display_name": "Le Van C",
        "avatar": "https://..."
      }
    ]
  }
}
```

**Phân trang *(Pagination):***

Để truy xuất tất cả người theo dõi, lặp lại với offset tăng dần:

```
Offset 0,  Count 50 → người dùng 1–50
Offset 50, Count 50 → người dùng 51–100
...
Dừng khi count trả về < 50 hoặc offset >= total
```

**Ví dụ phân trang trong n8n:**

```
ZaloOA Follower getList (offset: 0, count: 50)
  → Loop:
      IF (returned count >= 50)
        → ZaloOA Follower getList (offset: {{ $node.offset + 50 }}, count: 50)
      ELSE → Done
```

---

### update

Cập nhật tên hiển thị, thành phố, số điện thoại và/hoặc ghi chú cho người theo dõi. Dữ liệu này được lưu phía OA và hiển thị cho quản trị viên OA — không thay đổi hồ sơ Zalo của người dùng.

**Endpoint:** `POST /user/update`

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người theo dõi |
| Display Name | string | Không | Tên hiển thị phía OA (tối đa 50 ký tự) |
| City | string | Không | Tên thành phố (tối đa 50 ký tự) |
| Phone | string | Không | Số điện thoại (định dạng Việt Nam, ví dụ: 0901234567) |
| Notes | array | Không | Mảng chuỗi ghi chú (tối đa 5 ghi chú, mỗi ghi chú 100 ký tự) |

**Ví dụ nội dung yêu cầu:**

```json
{
  "user_id": "zalo_user_id_here",
  "display_name": "Nguyen Van A - VIP",
  "city": "Ha Noi",
  "phone": "0901234567",
  "notes": ["Prefers morning contact", "Loyal customer since 2022"]
}
```

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

**Lưu ý:**
- Thao tác `update` chỉ chỉnh sửa siêu dữ liệu phía OA. Không thay đổi hồ sơ Zalo thực sự của người dùng.
- Ghi chú mang tính cộng dồn — để thay thế tất cả ghi chú, hãy cung cấp danh sách mới hoàn chỉnh.
- Số điện thoại phải theo định dạng số di động Việt Nam.

---

## Ví dụ luồng làm việc — Đồng bộ dữ liệu CRM khi theo dõi *(Example Workflow — Sync CRM Data on Follow)*

```
ZaloOAWebhook (event: follow)
  → HTTP Request (GET CRM API to find matching customer by Zalo ID)
  → IF (customer found)
        → ZaloOA Follower update
              User ID:      {{ $json.follower.id }}
              Display Name: {{ $node["HTTP Request"].json.customer.name }}
              Phone:        {{ $node["HTTP Request"].json.customer.phone }}
              Notes:        ["Synced from CRM on {{ $now }}"]
  → ZaloOA Message sendText
        Message Type: cs
        User ID:      {{ $json.follower.id }}
        Text:         Chào mừng trở lại, {{ $node["HTTP Request"].json.customer.name }}!
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa |
|----|---------|
| `-201` | Thiếu tham số bắt buộc (User ID) |
| `-204` | Access token không hợp lệ hoặc đã hết hạn |
| `-213` | Người dùng không theo dõi OA này |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- `getList` trả về tối đa 50 người theo dõi mỗi lần gọi. Dùng phân trang cho các OA lớn.
- Tài khoản Zalo đã bị xóa hoặc khóa sẽ không xuất hiện trong danh sách người theo dõi.
- Các trường `gender` và `birth_date` yêu cầu người dùng đã chia sẻ dữ liệu này với OA của bạn.
- Các cập nhật phía OA (từ `update`) hiển thị trong bảng quản trị OA nhưng không được hiển thị cho người dùng.
