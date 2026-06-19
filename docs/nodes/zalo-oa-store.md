# Nút ZaloOA — Tài nguyên Store *(ZaloOA Node — Store Resource)*

Tài nguyên **Store** cho phép bạn quản lý danh mục sản phẩm và đơn hàng trong cửa hàng tích hợp sẵn của Zalo OA. Bạn có thể tạo và cập nhật danh mục sản phẩm, liệt kê và quản lý sản phẩm, và tạo đơn hàng.

---

## Yêu cầu trước *(Prerequisites)*

- Thông tin đăng nhập **Zalo OA API** hợp lệ với access token đang hoạt động.
- OA của bạn phải được bật tính năng **Zalo Store**. Liên hệ Zalo hoặc kiểm tra bảng quản trị OA để kích hoạt.
- Mã danh mục phải tồn tại trước khi sản phẩm có thể được gán vào.

---

## Các thao tác *(Operations)*

### createCategory

Tạo danh mục sản phẩm mới trong cửa hàng OA của bạn.

**Endpoint:** `POST /store/category/create` (đường dẫn nội bộ được xử lý bởi nút)

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Name | string | Có | Tên hiển thị danh mục (tối đa 50 ký tự) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "category_id": "cat_1234567890"
  }
}
```

---

### updateCategory

Cập nhật tên của danh mục hiện có.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Category ID | string | Có | Mã danh mục cần cập nhật |
| Name | string | Có | Tên danh mục mới |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

### getCategories

Truy xuất tất cả danh mục sản phẩm trong cửa hàng OA của bạn.

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": [
    { "category_id": "cat_1234567890", "name": "Electronics" },
    { "category_id": "cat_0987654321", "name": "Clothing" }
  ]
}
```

---

### createProduct

Thêm sản phẩm mới vào cửa hàng OA của bạn.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Name | string | Có | Tên sản phẩm (tối đa 120 ký tự) |
| Description | string | Không | Mô tả sản phẩm |
| Category ID | string | Có | Danh mục để đặt sản phẩm vào |
| Price | number | Có | Giá bằng Đồng Việt Nam (VND), số nguyên |
| Photos | array | Không | Mảng URL hình ảnh (tối đa 10) |
| Status | select | Có | `show` (hiển thị) hoặc `hide` (ẩn) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "product_id": "prod_abc123def456"
  }
}
```

**Lưu ý:**
- Giá phải là số nguyên dương bằng VND (ví dụ: `150000` cho 150.000 VND).
- URL hình ảnh phải có thể truy cập công khai. Dùng thao tác **Media → uploadImage** và cung cấp URL CDN kết quả.
- Tối đa 10 hình ảnh mỗi sản phẩm.

---

### updateProduct

Cập nhật thông tin chi tiết của sản phẩm hiện có.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Product ID | string | Có | Mã sản phẩm cần cập nhật |
| Name | string | Không | Tên sản phẩm mới |
| Description | string | Không | Mô tả mới |
| Category ID | string | Không | Chuyển sang danh mục khác |
| Price | number | Không | Giá mới bằng VND |
| Photos | array | Không | Thay thế tất cả hình ảnh bằng bộ mới này |
| Status | select | Không | `show` hoặc `hide` |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

### getProduct

Truy xuất thông tin chi tiết của một sản phẩm theo mã.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Product ID | string | Có | Mã sản phẩm |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "product_id": "prod_abc123def456",
    "name": "Wireless Headphones",
    "description": "High-quality noise-cancelling headphones.",
    "category_id": "cat_1234567890",
    "price": 1500000,
    "photos": [
      "https://cdn.zalo.me/product/..."
    ],
    "status": "show",
    "created_time": 1718000000000
  }
}
```

---

### getProducts

Truy xuất danh sách sản phẩm có phân trang trong cửa hàng.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| Offset | number | Có | Chỉ số bắt đầu (bắt đầu từ 0) |
| Count | number | Có | Số sản phẩm mỗi trang (tối đa 20) |
| Category ID | string | Không | Lọc theo danh mục |
| Status | select | Không | `show`, `hide`, hoặc tất cả |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "total": 85,
    "products": [
      {
        "product_id": "prod_abc123",
        "name": "Wireless Headphones",
        "price": 1500000,
        "status": "show"
      }
    ]
  }
}
```

---

### createOrder

Tạo đơn hàng mới trong cửa hàng OA cho một người theo dõi.

| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| User ID | string | Có | Mã người dùng Zalo của người mua |
| Items | array | Có | Mảng các mục trong đơn hàng |
| Shipping Address | object | Không | Thông tin địa chỉ giao hàng |
| Note | string | Không | Ghi chú đơn hàng từ khách hàng |

**Các trường mục đơn hàng:**

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| product_id | string | Có | Sản phẩm cần đưa vào |
| quantity | number | Có | Số lượng đơn vị |
| price | number | Có | Đơn giá tại thời điểm đặt hàng (VND) |

**Ví dụ đầu ra:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "order_id": "ord_xyz789abc123"
  }
}
```

---

## Ví dụ luồng làm việc — Đồng bộ sản phẩm từ danh mục bên ngoài *(Example Workflow — Sync Products from External Catalog)*

```
Schedule Trigger (daily 2:00 AM)
  → HTTP Request (GET product catalog from ERP system)
  → Split In Batches (size: 10)
  → Loop Over Items:
      ZaloOA Store getProducts (filter by name to check if exists)
      IF product exists:
        → ZaloOA Store updateProduct (price, status)
      ELSE:
        → ZaloOA Store createProduct (name, price, category, photos)
```

---

## Ví dụ luồng làm việc — Xử lý tin nhắn đặt hàng đến *(Example Workflow — Process an Incoming Order Message)*

```
ZaloOAWebhook (event: user_send_text, message: "Order #12345")
  → HTTP Request (look up order in CRM)
  → ZaloOA Store createOrder
        User ID:  {{ $json.sender.id }}
        Items:    [{ product_id: "prod_abc", quantity: 1, price: 150000 }]
  → ZaloOA Message sendText (transaction)
        Text: Đơn hàng của bạn đã được đặt! Mã đơn hàng: {{ $node["ZaloOA Store"].json.data.order_id }}
```

---

## Tham chiếu lỗi *(Error Reference)*

| Mã | Ý nghĩa | Cách xử lý |
|----|---------|-----------|
| `-201` | Thiếu tham số bắt buộc | Kiểm tra tên sản phẩm, mã danh mục và giá |
| `-204` | Access token không hợp lệ hoặc đã hết hạn | Làm mới access token |
| Category not found | Mã danh mục không hợp lệ | Dùng getCategories để xác minh mã |
| Store not enabled | Tính năng Zalo Store chưa được bật | Bật tính năng trong bảng quản trị OA |

---

## Lưu ý và giới hạn *(Notes and Limitations)*

- Giá phải bằng VND (Đồng Việt Nam) dưới dạng số nguyên. Giá thập phân không được hỗ trợ.
- Không có API xóa hàng loạt cho sản phẩm. Xóa sản phẩm từng cái bằng cách cập nhật trạng thái thành `hide`.
- `createOrder` tạo bản ghi phía OA; không xử lý thanh toán. Tích hợp với cổng thanh toán riêng biệt.
- Tối đa 10 hình ảnh mỗi sản phẩm.
- Zalo Store được thiết kế chủ yếu cho thị trường Việt Nam và tiền tệ VND.
