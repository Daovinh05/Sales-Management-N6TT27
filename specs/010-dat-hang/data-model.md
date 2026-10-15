# Mô hình dữ liệu (hồi tố): Đặt hàng

**Tính năng**: `010-dat-hang` | **Ngày**: 2026-10-15

| Thực thể | Trường chính | Ràng buộc |
|---|---|---|
| `Order` | `code` PK (`DHnn`), `status = CHO_DUYET`, `total`, `discountAmount`, `paymentAmount = total − discount` | Giá từ DB |
| `OrderDetail` | `variantCode`, `productName`, `quantity @Positive`, `unitPrice` (server tính lại) | `Order 1—n OrderDetail` |
| `Inventory` | `quantity`, `reservedQuantity` | `bán được = quantity − reserved`; kho trung tâm id=1, khóa bi quan |

Quy tắc: vượt tồn → 400 kèm số bán được, không ghi DB; `checkOwner` cho đơn có chủ.
