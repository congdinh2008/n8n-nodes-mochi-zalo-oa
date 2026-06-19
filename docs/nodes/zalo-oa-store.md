# ZaloOA Node — Store Resource

The **Store** resource lets you manage a product catalog and orders within your Zalo OA's built-in store. You can create and update product categories, list and manage products, and create orders.

---

## Prerequisites

- A valid **Zalo OA API** credential with an active access token.
- Your OA must have the **Zalo Store** feature enabled. Contact Zalo or check your OA admin dashboard to enable it.
- Category IDs must exist before products can be assigned to them.

---

## Operations

### createCategory

Create a new product category in your OA store.

**Endpoint:** `POST /store/category/create` (internal path handled by node)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Name | string | Yes | Category display name (max 50 characters) |

**Output example:**

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

Update the name of an existing category.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Category ID | string | Yes | ID of the category to update |
| Name | string | Yes | New category name |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

### getCategories

Retrieve all product categories for your OA store.

**Output example:**

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

Add a new product to your OA store.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Name | string | Yes | Product name (max 120 characters) |
| Description | string | No | Product description |
| Category ID | string | Yes | Category to place the product in |
| Price | number | Yes | Price in Vietnamese Dong (VND), integer |
| Photos | array | No | Array of image URLs (max 10) |
| Status | select | Yes | `show` (visible) or `hide` (hidden) |

**Output example:**

```json
{
  "error": 0,
  "message": "Success",
  "data": {
    "product_id": "prod_abc123def456"
  }
}
```

**Notes:**
- Price must be a positive integer in VND (e.g., `150000` for 150,000 VND).
- Photo URLs must be publicly accessible. Use the **Media → uploadImage** operation and provide the resulting CDN URL.
- Up to 10 photos per product.

---

### updateProduct

Update an existing product's details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Product ID | string | Yes | ID of the product to update |
| Name | string | No | New product name |
| Description | string | No | New description |
| Category ID | string | No | Reassign to a different category |
| Price | number | No | New price in VND |
| Photos | array | No | Replace all photos with this new set |
| Status | select | No | `show` or `hide` |

**Output example:**

```json
{
  "error": 0,
  "message": "Success"
}
```

---

### getProduct

Retrieve the details of a single product by ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Product ID | string | Yes | ID of the product |

**Output example:**

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

Retrieve a paginated list of products in the store.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Offset | number | Yes | Starting index (0-based) |
| Count | number | Yes | Number of products per page (max 20) |
| Category ID | string | No | Filter by category |
| Status | select | No | `show`, `hide`, or all |

**Output example:**

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

Create a new order in the OA store for a follower.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| User ID | string | Yes | Zalo user ID of the buyer |
| Items | array | Yes | Array of order line items |
| Shipping Address | object | No | Delivery address details |
| Note | string | No | Order note from the customer |

**Order line item fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product_id | string | Yes | Product to include |
| quantity | number | Yes | Number of units |
| price | number | Yes | Unit price at time of order (VND) |

**Output example:**

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

## Example Workflow — Sync Products from External Catalog

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

## Example Workflow — Process an Incoming Order Message

```
ZaloOAWebhook (event: user_send_text, message: "Order #12345")
  → HTTP Request (look up order in CRM)
  → ZaloOA Store createOrder
        User ID:  {{ $json.sender.id }}
        Items:    [{ product_id: "prod_abc", quantity: 1, price: 150000 }]
  → ZaloOA Message sendText (transaction)
        Text: Your order has been placed! Order ID: {{ $node["ZaloOA Store"].json.data.order_id }}
```

---

## Error Reference

| Code | Meaning | Resolution |
|------|---------|-----------|
| `-201` | Missing required parameter | Check product name, category ID, and price |
| `-204` | Invalid or expired access token | Refresh the access token |
| Category not found | Invalid category ID | Use getCategories to verify the ID |
| Store not enabled | Zalo Store feature not active | Enable the feature in your OA admin dashboard |

---

## Notes and Limitations

- Prices must be in VND (Vietnamese Dong) as integers. Decimal prices are not supported.
- There is no bulk delete API for products. Remove products individually by updating their status to `hide`.
- `createOrder` creates an OA-side record; it does not process payments. Integrate with a payment gateway separately.
- Maximum 10 photos per product.
- The Zalo Store is primarily designed for the Vietnamese market and VND currency.
