# Đặc tả tính năng (hồi tố): Đặt hàng giữ chỗ kho

**Nhánh tính năng**: `010-dat-hang`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `005-khach-dat-thanh-toan` (US1). Khách đã đăng nhập (auth: `008-auth-co-ban`) đặt hàng ở `Checkout.jsx`, server giữ chỗ kho 2 bước.

> Code đã có trên `main`; artifact viết sau để chứng minh quy trình SRS → plan → task + skill.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Đặt hàng đủ tồn (Ưu tiên: P1)

Khách điền form `Checkout.jsx` → `POST /api/orders {customerName,customerPhone,email,shippingAddress,note,discountAmount,items[{variantCode,productName,quantity,unitPrice}]}`. Server bỏ qua `unitPrice` client, lấy `variant.price` từ DB, tính `total`, `paymentAmount = total − discount`, giữ chỗ `reserved += qty` từng dòng (khóa bi quan kho trung tâm id=1, chưa trừ `quantity`). Đơn mới `CHO_DUYET` → mở `PaymentModal` (`011-thanh-toan`).

**Kiểm thử độc lập**: Đơn đủ tồn → 201 `CHO_DUYET`, `reserved` tăng, `quantity` giữ nguyên.

**Kịch bản chấp nhận**:

1. **Cho** giỏ đủ tồn, **Khi** `POST /api/orders`, **Thì** 201, `status = CHO_DUYET`, `paymentAmount = total − discount`.
2. **Cho** client gửi `unitPrice` giả, **Khi** đặt, **Thì** server vẫn tính theo giá DB.

---

### Chuyện 2 - Đặt vượt tồn bị chặn (Ưu tiên: P1)

**Kiểm thử độc lập**: Vượt `quantity − reserved` → 400, `verify(repo, never()).save(...)`.

**Kịch bản chấp nhận**:

1. **Cho** `qty > quantity − reserved`, **Khi** đặt, **Thì** 400 "Sản phẩm {name} chỉ còn {n} sản phẩm có thể bán", đơn không tạo.

## Yêu cầu *(bắt buộc)*

- **FR-001**: Giá PHẢI lấy từ DB (không tin client).
- **FR-002**: Giữ chỗ `reserved` bằng khóa bi quan; vượt tồn → 400 kèm số bán được.
- **FR-003**: Đơn sai chủ → 403 (`checkOwner`); không token → 401. Chữ UI/message tiếng Việt.

### Thực thể chính

- **Order**: `code` PK, `status = CHO_DUYET`, `paymentAmount = total − discount`.
- **Inventory**: `quantity`, `reservedQuantity`; `bán được = quantity − reserved`.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: `mvn -Dtest='OrderServiceTests#datHangDuTon_giuChoChuaTru+datHangVuotTon_baoLoiVaKhongTaoDon' test` xanh.
- **SC-002**: 100% spoof giá bị bỏ qua; 100% vượt tồn bị 400 đúng số.

## Giả định

- Kho trung tâm id=1; đơn vãng lai (`username == null`) thao tác theo mã.
