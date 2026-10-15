# Đặc tả tính năng (hồi tố): Cụm khách — Đặt hàng, thanh toán, lịch sử đơn

**Nhánh tính năng**: `005-khach-dat-thanh-toan`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Superseded (hồi tố)

> **Đã tách nhỏ**: nội dung spec này được thay bằng `010-dat-hang` (đặt hàng), `011-thanh-toan` (thanh toán), `012-lich-su-don` (lịch sử). File này giữ lại làm lịch sử, không dùng để implement.

**Đầu vào**: Ghi lại phần đặt hàng / thanh toán / lịch sử đơn của Đào Văn Vinh đã triển khai trên `main`. Auth (đăng ký/đăng nhập/đăng xuất) đã tách sang `007-auth-dang-nhap`; ở đây chỉ giả định khách đã đăng nhập (chủ đơn qua `checkOwner`).

> **Ghi chú hồi tố**: Code đã có trên `main`. Artifact này viết sau để chứng minh quy trình SRS → plan → từng task và việc dùng skill (explore, graphify/mermaid, soạn commit/commit-linter, diff + log).

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Đặt hàng giữ chỗ kho (Ưu tiên: P1)

Khách (đã đăng nhập) ở `Checkout.jsx` điền form, bấm đặt → `POST /api/orders` với `items[{variantCode,quantity}]`. Server lấy giá từ `variant.price` (không tin `unitPrice` client), tính `total`, `paymentAmount = total − discount`, giữ chỗ `reserved += qty` (chưa trừ `quantity`, khóa bi quan kho trung tâm id=1). Đơn mới ở `CHO_DUYET`, mở `PaymentModal`. Đặt vượt `quantity − reserved` → 400 "Sản phẩm {name} chỉ còn {n} sản phẩm có thể bán", đơn không tạo.

**Vì sao ưu tiên này**: Lõi mua hàng; giữ chỗ 2 bước chống bán lố là quyết định thiết kế chính (đã chốt với Agent trước khi code).

**Kiểm thử độc lập**: Tạo đơn đủ tồn → 201 `CHO_DUYET`, `reserved` tăng, `quantity` giữ nguyên; tạo đơn vượt tồn → 400, `verify(repo, never()).save(...)`.

**Kịch bản chấp nhận**:

1. **Cho** giỏ đủ tồn, **Khi** `POST /api/orders`, **Thì** 201, `status = CHO_DUYET`.
2. **Cho** `qty > quantity − reserved`, **Khi** đặt, **Thì** 400 kèm số còn bán được, đơn không tạo.
3. **Cho** client gửi `unitPrice` giả, **Khi** đặt, **Thì** server vẫn tính theo giá DB.

---

### Chuyện 2 - Thanh toán COD / VietQR (Ưu tiên: P1)

Trong `PaymentModal` khách chọn COD hoặc VietQR → `POST /api/orders/{code}/payment {paymentMethod}`. Cả hai đều giữ `CHO_DUYET` chờ shop duyệt; trừ kho thật ở `HOAN_THANH`. VietQR có PayOS: `POST /{code}/vietqr-link` trả `checkoutUrl/qrCode`, polling `GET /{code}/detail` chờ `paid`; webhook `POST /api/payments/payos-webhook` verify HMAC, idempotent, lệch tiền → từ chối. Chưa cấu hình PayOS → fallback demo (QR `img.vietqr.io`, nút "Tôi đã chuyển khoản"). Đóng modal chưa trả → toast + banner vàng nhắc + modal xác nhận rời đi.

**Vì sao ưu tiên này**: Luồng tiền; sequence diagram `mermaid/04-sequence-order.mmd` được vẽ **trước khi code** và dùng làm checklist (nhờ đó phát hiện case đóng modal giữa chừng).

**Kiểm thử độc lập**: Trả COD/VietQR → 200, đơn vẫn `CHO_DUYET`, đã ghi `paymentMethod`; webhook gọi 2 lần → chỉ ghi nhận 1 lần; sai chữ ký/lệch tiền → từ chối.

**Kịch bản chấp nhận**:

1. **Cho** đơn `CHO_DUYET` của chính chủ, **Khi** `POST /{code}/payment {COD}`, **Thì** 200, `paymentMethod = COD`, `status` giữ `CHO_DUYET`.
2. **Cho** đơn đã qua `CHO_DUYET`, **Khi** confirm payment, **Thì** 400 "Đơn hàng không còn ở trạng thái chờ thanh toán".
3. **Cho** `paymentMethod` lạ, **Khi** confirm, **Thì** 400 "Phương thức thanh toán không hợp lệ".
4. **Cho** đóng modal chưa trả, **Khi** rời đi, **Thì** modal xác nhận + banner "Đơn #code đang chờ thanh toán, hàng đã được giữ chỗ".

---

### Chuyện 3 - Lịch sử đơn: thanh toán bù, hủy đơn (Ưu tiên: P2)

Khách vào `OrderHistory.jsx` (`GET /api/orders/mine`): tab theo trạng thái + badge "Đã thanh toán". Đơn `CHO_DUYET` chưa trả (và không phải COD) hiện nút "Thanh toán" mở lại `PaymentModal` (thanh toán bù). Nút "Hủy đơn" chỉ ở `CHO_DUYET`/`DA_XAC_NHAN` → `POST /{code}/cancel` (chưa trừ kho → nhả `reserved`; đã trừ → cộng trả `quantity` + note "cần hoàn tiền"). Từ `DANG_CHUAN_BI` trở đi → 400 "vui lòng liên hệ shop".

**Vì sao ưu tiên này**: Hoàn thiện vòng đời phía khách; giữ chính sách hủy đã chốt (không gây rối kho khi hàng đã đóng gói).

**Kiểm thử độc lập**: Hủy đơn `CHO_DUYET` → 200 `DA_HUY`; hủy đơn `DANG_CHUAN_BI` → 400; thanh toán bù đơn chưa trả → mở modal và trả được.

**Kịch bản chấp nhận**:

1. **Cho** đơn của chính chủ ở `CHO_DUYET`, **Khi** `POST /{code}/cancel`, **Thì** 200 `DA_HUY`, kho được hoàn.
2. **Cho** đơn ở `DANG_CHUAN_BI` trở đi, **Khi** khách hủy, **Thì** 400 và UI không hiện nút hủy.
3. **Cho** đơn `CHO_DUYET` chưa trả, **Khi** mở lịch sử, **Thì** có nút thanh toán bù.

---

### Gap đã biết (ghi nhận hồi tố, không giấu)

- `Checkout.jsx` gửi `unitPrice` từ client (server đã bỏ qua và tính lại — đúng, nhưng payload thừa nên dọn).
- Sequence `04-sequence-order.mmd` còn vẽ `POST /api/cart/items` trong khi giỏ thật ở FE — cần sửa diagram cho khớp code (quy tắc: diagram và code không lệch).

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: `POST /api/orders` PHẢI lấy giá từ DB, giữ chỗ `reserved` (khóa bi quan kho trung tâm id=1), vượt tồn → 400 kèm số bán được; đơn sai chủ → 403 (`checkOwner`).
- **FR-002**: `POST /api/orders/{code}/payment` chỉ cho đơn `CHO_DUYET` của chính chủ, `paymentMethod ∈ {COD, VIETQR}`; giữ `CHO_DUYET` sau khi trả.
- **FR-003**: VietQR PayOS PHẢI có link (`/{code}/vietqr-link`, fallback demo khi chưa cấu hình) + webhook HMAC idempotent + kiểm tra khớp tiền.
- **FR-004**: `POST /api/orders/{code}/cancel` của khách chỉ ở `CHO_DUYET`/`DA_XAC_NHAN`; hoàn kho theo cờ `stockDeducted` + note hoàn tiền khi cần.
- **FR-005**: `GET /api/orders/mine` chỉ trả đơn của chính chủ; không token → 401.
- **FR-006**: Mọi câu chữ UI/message PHẢI tiếng Việt.

### Thực thể chính

- **Order**: `code` PK (`DHnn`), `status`, `paymentMethod` (COD/VIETQR/null), `paid/paidAt`, `stockDeducted`, `paymentAmount = total − discount`; quan hệ `Order 1—n OrderDetail`, `Order → Inventory` qua `variantCode`, `Order.username → User` (chủ đơn, xem 007).
- **Inventory**: `quantity`, `reservedQuantity`; công thức `bán được = quantity − reserved`.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `mvn -Dtest='OrderServiceTests,PaymentServiceTest' test` xanh (đơn vượt tồn không ghi DB; webhook 2 lần 1 ghi nhận).
- **SC-002**: 100% case vượt tồn bị 400 kèm số còn bán được; 100% spoof `unitPrice` bị bỏ qua.
- **SC-003**: Khách hủy đúng 2 trạng thái đầu, bị chặn từ `DANG_CHUAN_BI` trở đi; đóng modal chưa trả luôn có banner nhắc.
- **SC-004**: Không token → 401; sai chủ đơn → 403; message/UI tiếng Việt.

## Giả định

- Khách đã đăng nhập (auth xem `007-auth-dang-nhap`); đơn vãng lai (`username == null`) cho phép thao tác theo mã đơn.
- Kho trung tâm duy nhất (`CENTRAL_WAREHOUSE_ID = 1`); chưa test đồng thời thật.
- PayOS demo: chưa cấu hình thì dùng fallback demo.
