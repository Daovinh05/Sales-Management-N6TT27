# Contract: API tạo đơn

**Tính năng**: `010-dat-hang`

- `POST /api/orders {customerName,customerPhone,email,shippingAddress,note,discountAmount,items[{variantCode,productName,quantity,unitPrice}]}` → 201 đơn `CHO_DUYET` (`paymentAmount = total − discount`, giá từ DB).
- Vượt tồn → 400 "Sản phẩm {name} chỉ còn {n} sản phẩm có thể bán".
- Không token → 401; sai chủ → 403.
