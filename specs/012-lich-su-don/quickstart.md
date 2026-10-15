# Quickstart (hồi tố): Lịch sử đơn

**Tính năng**: `012-lich-su-don` | Contract: [order-history](./contracts/order-history-api.md)

Điều kiện: token customer có đơn ở nhiều trạng thái.

```bash
curl -s http://localhost:8080/api/orders/mine -H "Authorization: Bearer $TOKEN" | head -c 200; echo
curl -s -X POST http://localhost:8080/api/orders/DH01/cancel -H "Authorization: Bearer $TOKEN"; echo
# Kỳ vọng: 200 DA_HUY nếu DH01 ở 2 trạng thái đầu; 400 nếu đã qua
```

UI: Lịch sử mua hàng → tab/badge/modal chi tiết → nút trả bù (đơn chưa trả) / nút hủy (2 tab đầu).
