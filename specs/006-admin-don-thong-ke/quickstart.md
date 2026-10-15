# Quickstart (hồi tố): Kiểm chứng cụm admin

**Tính năng**: `006-admin-don-thong-ke` | Contract: [admin-orders-stats](./contracts/admin-orders-stats-api.md)

## Điều kiện tiên quyết

Docker dev chạy; seed `admin/123456` + 8 đơn `DH01–DH08`.

## Kịch bản 1: Duyệt đơn từng bước + chặn sai (admin)

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s "http://localhost:8080/api/orders?status=CHO_DUYET" -H "Authorization: Bearer $TOKEN" | head -c 300; echo
curl -s -X PATCH http://localhost:8080/api/orders/DH01/status -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" -d '{"status":"DANG_GIAO"}'; echo
# Kỳ vọng: 400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này"
curl -s http://localhost:8080/api/admin/stats/overview -H "Authorization: Bearer $TOKEN"; echo
# Kỳ vọng: revenue chỉ tính đơn HOAN_THANH
curl -s http://localhost:8080/api/admin/stats/overview; echo
# Kỳ vọng: 401
```

## Kịch bản 2: UI sống (demo bảo vệ)

1. Đăng nhập admin → Quản lý đơn: lọc trạng thái/phương thức → mở chi tiết → duyệt 1 chiều → kiểm tra dropdown (ẩn `DA_XAC_NHAN` khi chưa có phương thức).
2. Mở Thống kê: đổi khoảng ngày → KPI/biểu đồ/donut/top-5/tồn thấp cập nhật; export Excel.

## Kịch bản 3: Test tự động

```bash
cd backend
mvn -Dtest='OrderServiceTests,StatsServiceTests' test
# Kỳ vọng: BUILD SUCCESS (ma trận, trừ kho 1 lần, stats theo HOAN_THANH)
```
