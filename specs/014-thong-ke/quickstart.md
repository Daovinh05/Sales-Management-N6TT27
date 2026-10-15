# Quickstart (hồi tố): Thống kê

**Tính năng**: `014-thong-ke` | Contract: [stats](./contracts/stats-api.md)

Điều kiện: token admin; seed `DH01–DH08`.

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
for EP in overview revenue-by-day orders-by-status "top-products?limit=5"; do
curl -s "http://localhost:8080/api/admin/stats/$EP" -H "Authorization: Bearer $TOKEN" | head -c 200; echo; done
# Kỳ vọng: revenue chỉ HOAN_THANH; không token -> 401
```

UI: ThongKe đổi khoảng ngày → KPI/charts/top-5/tồn thấp cập nhật → export. Test: `mvn -Dtest='StatsServiceTests' test`.
