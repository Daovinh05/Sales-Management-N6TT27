# Quickstart (hồi tố): Quản lý đơn

**Tính năng**: `013-quan-ly-don` | Contract: [order-admin](./contracts/order-admin-api.md)

Điều kiện: token admin (seed `admin/123456`).

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s "http://localhost:8080/api/orders?status=CHO_DUYET" -H "Authorization: Bearer $TOKEN" | head -c 200; echo
for ST in DA_XAC_NHAN DANG_CHUAN_BI DANG_GIAO HOAN_THANH; do
curl -s -X PATCH http://localhost:8080/api/orders/DH01/status -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d "{\"status\":\"$ST\"}"; echo; done
# Kỳ vọng: 4 lần 200 đúng thứ tự; nhảy cóc -> 400
curl -s http://localhost:8080/api/orders -H "Authorization: Bearer FAKE"; echo
# Kỳ vọng: 401/403
```

UI: lọc → chi tiết → duyệt 1 chiều → export. Test: `mvn -Dtest='OrderServiceTests' test`.
