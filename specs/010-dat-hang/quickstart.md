# Quickstart (hồi tố): Đặt hàng

**Tính năng**: `010-dat-hang` | Contract: [order-create](./contracts/order-create-api.md)

Điều kiện: Docker dev chạy; token customer (theo 013).

```bash
# Đủ tồn -> 201 CHO_DUYET (TOKEN lấy theo 008-auth quickstart)
curl -s -X POST http://localhost:8080/api/orders -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"customerName":"Test","customerPhone":"0901","shippingAddress":"HN","items":[{"variantCode":"BT01","productName":"X","quantity":1,"unitPrice":1}]}'; echo
# Vượt tồn -> 400 kèm số còn bán được; phpMyAdmin: reserved tăng, quantity giữ nguyên
```

UI: Checkout → đặt → `PaymentModal` mở (sang 009). Test: `mvn -Dtest='OrderServiceTests#datHangDuTon_giuChoChuaTru+datHangVuotTon_baoLoiVaKhongTaoDon' test`.
