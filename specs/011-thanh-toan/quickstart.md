# Quickstart (hồi tố): Thanh toán

**Tính năng**: `011-thanh-toan` | Contract: [payment](./contracts/payment-api.md)

Điều kiện: có đơn `CHO_DUYET` (từ 008) + token customer.

```bash
curl -s -X POST http://localhost:8080/api/orders/DH01/payment -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d '{"paymentMethod":"COD"}'; echo
# Kỳ vọng: 200, vẫn CHO_DUYET
curl -s -X POST http://localhost:8080/api/orders/DH01/vietqr-link -H "Authorization: Bearer $TOKEN"; echo
# Kỳ vọng: payosConfigured true/false đều trả được (demo khi false)
```

UI: tab COD/VietQR → trả → banner chờ duyệt; đóng modal → confirm rời + banner vàng. Test: `mvn -Dtest='PaymentServiceTest,PaymentWebhookConcurrencyTest' test`.
