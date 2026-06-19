# Loại tin nhắn — cs, transaction và promotion *(Message Types)*

Zalo OA hỗ trợ ba loại tin nhắn quyết định đối tượng nhận, quy tắc gửi và nội dung được phép. Việc chọn đúng loại là điều thiết yếu để tuân thủ chính sách của Zalo và đảm bảo tin nhắn đến được người nhận.

---

## Tổng quan *(Overview)*

| Loại | Đối tượng | Yêu cầu tương tác | Giới hạn hạn ngạch | Trường hợp sử dụng điển hình |
|------|-----------|-------------------|-------------------|------------------------------|
| `cs` | Người theo dõi cá nhân | Đã tương tác trong **7 ngày** qua | Không | Trả lời hỗ trợ khách hàng |
| `transaction` | Người theo dõi cá nhân | Đã tương tác trong **1 năm** qua | Không | Cập nhật đơn hàng, nhắc nhở |
| `promotion` | Người theo dõi hoạt động (phát sóng) | Không cần tương tác trước | **Có** | Marketing, thông báo |

---

## cs — Tin nhắn hỗ trợ khách hàng *(Customer Service Messages)*

### Khi nào sử dụng *(When to use)*

Dùng `cs` khi bạn đang trả lời người dùng đã tích cực tương tác với OA của bạn trong 7 ngày qua. Đây là loại dễ dãi nhất cho hội thoại cá nhân hóa.

### Quy tắc *(Rules)*

- Người nhận phải đã gửi tin nhắn, nhấn nút, hoặc tương tác với OA của bạn trong **7 ngày qua**.
- Tin nhắn có thể chứa nội dung phong phú: văn bản, hình ảnh, tệp đính kèm, danh sách và nhãn dán.
- Không có hạn ngạch hàng ngày — gửi bao nhiêu tin nhắn cs cũng được trong cửa sổ tương tác.

### Lỗi khi sử dụng sai *(Error if misused)*

Nếu người dùng chưa tương tác trong 7 ngày, API trả về:

```json
{ "error": -214, "message": "User outside interaction window" }
```

### Ví dụ sử dụng *(Example use cases)*

- Trả lời câu hỏi hỗ trợ kỹ thuật.
- Xác nhận đặt chỗ sau khi người dùng đặt qua chat OA.
- Gửi tin nhắn theo dõi sau cuộc trò chuyện trực tiếp.

### Cấu hình trong n8n *(n8n configuration)*

```
Resource:   Message
Operation:  sendText
Message Type: cs
User ID:    {{ $json.sender.id }}
Text:       Chúng tôi đã nhận yêu cầu của bạn và sẽ theo dõi trong vòng 24 giờ.
```

---

## transaction — Tin nhắn giao dịch *(Transactional Messages)*

### Khi nào sử dụng *(When to use)*

Dùng `transaction` cho các thông báo liên quan trực tiếp đến giao dịch kinh doanh hoặc dịch vụ người dùng đã đồng ký. Cửa sổ tương tác là 1 năm, phù hợp cho người dùng đã tương tác với OA trước đây nhưng không gần đây.

### Quy tắc *(Rules)*

- Người nhận phải đã tương tác với OA của bạn trong **1 năm qua**.
- Nội dung phải mang tính giao dịch — xác nhận đơn hàng, cập nhật giao hàng, biên lai thanh toán, nhắc nhở cuộc hẹn.
- Không có hạn ngạch hàng ngày.
- Không dùng `transaction` cho nội dung marketing — điều này có thể vi phạm chính sách của Zalo.

### Lỗi khi sử dụng sai *(Error if misused)*

Nếu người dùng chưa tương tác trong hơn một năm, API trả về:

```json
{ "error": -214, "message": "User outside interaction window" }
```

### Ví dụ sử dụng *(Example use cases)*

- Xác nhận đơn hàng: "Đơn hàng #12345 của bạn đã được xác nhận."
- Cập nhật giao hàng: "Gói hàng của bạn đã được gửi đi."
- Nhắc nhở cuộc hẹn: "Nhắc nhở: cuộc hẹn của bạn là ngày mai lúc 10:00 SA."
- Biên lai thanh toán.

### Cấu hình trong n8n *(n8n configuration)*

```
Resource:   Message
Operation:  sendText
Message Type: transaction
User ID:    {{ $json.body.userId }}
Text:       Đơn hàng #{{ $json.body.orderId }} của bạn đang trên đường!
```

---

## promotion — Tin nhắn quảng cáo / Phát sóng *(Promotional / Broadcast Messages)*

### Khi nào sử dụng *(When to use)*

Dùng `promotion` để gửi các chiến dịch marketing, bản tin và thông báo đến toàn bộ người theo dõi hoạt động. Không giống cs và transaction, bạn không cần tương tác trước — tin nhắn được phát sóng đến tất cả người theo dõi đủ điều kiện.

### Quy tắc *(Rules)*

- Đối tượng: **người theo dõi hoạt động** chưa chặn hoặc tắt thông báo OA.
- Phụ thuộc vào **hạn ngạch phát sóng hàng ngày** được xác định theo cấp OA của bạn.
- Nội dung phải tuân thủ chính sách quảng cáo của Zalo.
- Hỗ trợ nội dung phong phú (hình ảnh, danh sách).
- Cá nhân hóa hạn chế hơn so với cs/transaction.

### Hạn ngạch *(Quotas)*

Zalo áp dụng hạn ngạch hàng ngày theo OA cho tin nhắn promotion. Giới hạn chính xác phụ thuộc vào cấp độ xác minh OA:

| Cấp OA | Hạn ngạch hàng ngày gần đúng |
|--------|------------------------------|
| OA chưa xác minh | Hạn ngạch thấp (tham khảo Zalo) |
| OA đã xác minh | Hạn ngạch cao hơn |
| OA doanh nghiệp | Hạn ngạch tùy chỉnh theo thỏa thuận |

Khi vượt quá hạn ngạch, API trả về lỗi. Theo dõi mức sử dụng và lên lịch các chiến dịch để phân phối gửi trong ngày.

### Ví dụ sử dụng *(Example use cases)*

- Bản tin hàng tuần: "Xem các sản phẩm mới của chúng tôi tuần này!"
- Flash sale: "Giảm 50% chỉ hôm nay — mua ngay."
- Thông báo sự kiện: "Tham gia webinar của chúng tôi vào thứ Sáu."

### Cấu hình trong n8n *(n8n configuration)*

```
Resource:   Message
Operation:  sendText
Message Type: promotion
User ID:    (mã người dùng Zalo từ CRM hoặc danh sách người theo dõi)
Text:       Tin vui! Đợt giảm giá mùa hè bắt đầu hôm nay. Ghé thăm chúng tôi tại...
```

Để phát sóng đến nhiều người theo dõi, dùng nút **n8n Split In Batches** hoặc **Loop Over Items** với danh sách mã người dùng từ thao tác **ZaloOA → Follower → getList**.

---

## Chọn đúng loại — Cây quyết định *(Choosing the Right Type — Decision Tree)*

```
Tin nhắn này có phải là trả lời trực tiếp cho điều người dùng vừa nói không?
  CÓ → cs (nếu trong vòng 7 ngày)
  KHÔNG →
    Đây có phải thông báo giao dịch (đơn hàng, thanh toán, cuộc hẹn) không?
      CÓ → transaction (nếu trong vòng 1 năm)
      KHÔNG →
        Đây có phải tin nhắn marketing hoặc phát sóng không?
          CÓ → promotion (kiểm tra hạn ngạch)
          KHÔNG → Cân nhắc lại xem tin nhắn Zalo có phù hợp không
```

---

## Lỗi thường gặp và cách xử lý *(Common Errors and Resolutions)*

| Mã lỗi | Thông báo | Nguyên nhân | Cách xử lý |
|--------|-----------|-------------|-----------|
| `-213` | User does not follow OA | Người dùng chưa bao giờ theo dõi, hoặc đã bỏ theo dõi | Kiểm tra trạng thái người theo dõi trước khi gửi |
| `-214` | User outside interaction window | cs: không tương tác trong 7 ngày; transaction: không tương tác trong 1 năm | Chuyển loại tin nhắn hoặc chờ người dùng tương tác lại |
| `promotion quota exceeded` | Đã đạt giới hạn hàng ngày | Quá nhiều tin nhắn promotion hôm nay | Lên lịch cho ngày mai hoặc giảm khối lượng |

---

## Thực hành tốt nhất *(Best Practices)*

1. **Luôn dùng cs cho hội thoại hỗ trợ.** Đảm bảo trải nghiệm phản hồi nhanh nhất.
2. **Dùng transaction một cách thận trọng và chính xác.** Lạm dụng cho marketing có thể dẫn đến vi phạm chính sách và đình chỉ OA.
3. **Gửi tin nhắn promotion theo lô.** Phân phối các đợt phát sóng lớn trong nhiều giờ để tránh giới hạn tốc độ và cạn kiệt hạn ngạch.
4. **Theo dõi dấu thời gian tương tác.** Lưu thời gian tương tác cuối cùng trong CRM để tự động chọn giữa cs và transaction.
5. **Xử lý lỗi một cách khéo léo.** Luôn kiểm tra trường `error` trong phản hồi và triển khai logic thử lại hoặc thông báo dự phòng (ví dụ: email) khi gửi Zalo thất bại.
