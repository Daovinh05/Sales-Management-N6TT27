# Webhook PayOS: race condition & idempotency (tài liệu thuộc bài)

> Mở file này ra đọc khi ai hỏi "mày có hiểu idempotent với race condition không".
> Code thật: `backend/src/main/java/com/salemanagement/service/impl/PaymentServiceImpl.java:84-116`.
> Test chứng minh: `backend/src/test/java/com/salemanagement/PaymentWebhookConcurrencyTest.java:59-61`.

## 1. Race condition là gì, xảy ra ở đâu?

PayOS **không đảm bảo chỉ gọi webhook 1 lần**: timeout, mạng chập chờn, user F5 đúng lúc tiền về → **2 request webhook cùng 1 đơn ập vào server cùng một lúc**.

Code ngây thơ sẽ làm thế này ở cả 2 luồng:

```
đọc paid (= false) → ghi paid = true → trừ kho / tính doanh thu
```

Cả 2 luồng cùng đọc `false` trước khi ai kịp ghi → đơn bị xử lý **2 lần**: trừ kho 2 lần, doanh thu tính 2 lần. Kết quả sai tùy thuộc luồng nào chạy trước — đó là **race condition**.

## 2. Chống bằng 2 lớp, thiếu 1 là vẫn dính

### Lớp 1 — Khóa ghi (chống race): `PaymentServiceImpl.java:98`

```java
Order order = orderRepository.findByPayosOrderCodeForUpdate(payosOrderCode).orElse(null);
```

`ForUpdate` = `SELECT ... FOR UPDATE`: khóa hàng đơn đó ở DB. Luồng thứ 2 đến **phải đứng chờ ngoài cửa**, không được đọc bẩn, không được ghi đè.

### Lớp 2 — Kiểm tra đã xử lý (idempotent): `PaymentServiceImpl.java:104`

```java
if (order.isPaid()) {
    ... return (bỏ qua, vẫn 200);
}
```

Luồng thứ 2 vào sau, thấy đơn đã `paid` thì bỏ qua. Kết quả cuối **giống hệt như chỉ xử lý 1 lần** — đó chính là định nghĩa **idempotency**: gọi N lần cũng như gọi 1 lần.

### Vì sao phải có cả 2?

| Chỉ có... | Kết quả |
|---|---|
| Chỉ `isPaid`, không khóa | Cả 2 cùng đọc `false` → vẫn xử lý 2 lần. **Vô dụng.** |
| Chỉ khóa, không `isPaid` | Luồng 2 vào sau vẫn ghi đè xử lý lần nữa. |
| Cả 2 | Luồng 2 chờ → thấy đã paid → bỏ qua. **Đúng.** |

Cùng nguyên tắc với cờ `stockDeducted` ở `OrderServiceImpl.deductStockIfNeeded`: trừ kho đúng 1 lần dù `HOAN_THANH` bị gọi lặp.

## 2b. Idempotency nói cho hết (đọc kỹ đoạn này)

### Định nghĩa 1 dòng

**Idempotent = gọi 1 lần hay N lần, trạng thái cuối cùng giống hệt nhau, tác dụng phụ chỉ xảy ra 1 lần.**
`GET` đọc dữ liệu là idempotent tự nhiên. `POST /payment` làm thay đổi tiền/kho nên **không idempotent tự nhiên** — phải thiết kế cho nó thành idempotent.

### Vì sao webhook bắt buộc phải idempotent?

Giao thức webhook là **at-least-once delivery**: bên gửi (PayOS) chỉ đảm bảo "gửi ít nhất 1 lần", không đảm bảo "đúng 1 lần". Hết timeout không thấy 200 là nó gửi lại, không cần biết server đã xử lý chưa. Nên phía nhận **không được phép** giả định mỗi đơn chỉ đến 1 lần — mọi webhook chuẩn (PayOS, Stripe, Momo) đều yêu cầu code xử lý phải idempotent. Đây là ràng buộc của giao thức, không phải thích thì làm.

### Idempotency key: `payosOrderCode` chính là nó

Mỗi thanh toán sinh 1 `payosOrderCode` duy nhất (`PaymentServiceImpl.java:51`), lưu vào đơn lúc tạo link. Webhook mang mã này về → server tra đúng 1 đơn (`findByPayosOrderCodeForUpdate`). Công thức chuẩn của mọi hệ thống:

```
idempotency key (mã duy nhất của lần thanh toán)
  → tra trạng thái đã xử lý chưa (isPaid?)
  → rồi mới xử lý / bỏ qua
```

Không có key duy nhất thì không thể biết "lần này" với "lần trước" có phải cùng 1 thanh toán không — đó là lý do mã lạ (không tra ra đơn) thì bỏ qua chứ không báo lỗi.

### Checklist nhận diện code đã idempotent chưa

1. **Có key duy nhất cho mỗi tác vụ không?** (ở đây: `payosOrderCode`)
2. **Có đọc trạng thái trước khi ghi không?** (`if (order.isPaid()) return`)
3. **Đọc + ghi có nằm trong 1 transaction khóa không?** (`ForUpdate` + `@Transactional` — nếu không, 2 luồng cùng đọc `false`)
4. **Tác dụng phụ có guard riêng không?** (trừ kho có `stockDeducted`, ghi paid chỉ 1 lần)
5. **Retry từ phía gửi có an toàn không?** (luôn 200 → PayOS không retry storm; retry cũng chỉ gặp `isPaid` → bỏ qua)

### Những chỗ idempotent khác trong codebase (để khoe là hiểu sâu)

- `OrderServiceImpl.deductStockIfNeeded`: cờ `stockDeducted` — `HOAN_THANH` gọi 2 lần kho chỉ trừ 1 lần.
- `AuthServiceImpl.logout` → `refreshTokenService.revoke`: revoke token đã revoke rồi vẫn 200, không lỗi — logout bấm 2 lần không sao.
- `api.js` interceptor: cờ `request._retry` — mỗi request chỉ tự refresh **đúng 1 lần**, refresh xong vẫn 401 thì dừng (không loop vô hạn).
- `updateStatus`: `if (oldStatus.equals(status)) return` — cập nhật trùng trạng thái thì no-op thay vì ghi DB thừa.

### Phản ví dụ (để phân biệt)

- `POST /api/orders` tạo đơn **không idempotent**: user bấm đặt 2 lần (double-click, mạng lag) → tạo 2 đơn `DHxx` khác nhau. Chống bằng FE (disable nút sau click) chứ không bằng key — đây là điểm yếu đã biết, khác với webhook.
- `DELETE /api/orders/{code}` xóa đơn đã xóa → 404, không phải idempotent hoàn hảo — chấp nhận được vì xóa không liên quan tiền.

## 3. Hai câu senior hay hỏi tiếp

**Q: Sao mã đơn lạ vẫn trả 200?** (`:98-101`)
A: `findByPayosOrderCodeForUpdate` không thấy → log "mã lạ, bỏ qua" → vẫn trả 200 để PayOS **khỏi retry vô hạn**. Không phải lỗi của mình thì không báo lỗi.

**Q: Sao lệch tiền vẫn 200 mà không đánh paid?** (`:107-109`)
A: So `amount` webhook vs `paymentAmount` đơn — lệch (kẻ gian giả webhook, hoặc user sửa số tiền) → từ chối ghi nhận. Vẫn 200 để không lộ logic + không gây retry storm.

**Q: Verify chữ ký ở đâu?** (`:84-86`)
A: Đầu tiên, trước mọi xử lý: `verifyWebhookSignature(data, signature)` sai → từ chối. Không tin bất kỳ field nào client/PayOS gửi khi chưa verify.

## 4. Bằng chứng (chạy live khi bị hỏi)

```bash
cd backend
mvn -Dtest='PaymentWebhookConcurrencyTest' test
# bắn 2 webhook đồng thời cùng 1 đơn -> chỉ 1 lượt ghi nhận paid
mvn -Dtest='PaymentServiceTest' test
# sai HMAC -> từ chối; lệch tiền -> từ chối; mã lạ -> 200 bỏ qua; gọi 2 lần -> 1 ghi nhận
```

## 5. Câu trả lời 30 giây

> "Race là 2 webhook cùng đơn vào cùng lúc, em khóa hàng bằng FOR UPDATE để thằng sau chờ; idempotent là check isPaid rồi return, gọi mấy lần cũng như một lần. Không khóa thì check isPaid vô dụng vì cả hai cùng đọc false. Test concurrency bắn 2 webhook cùng lúc, chỉ một lượt ghi nhận."
