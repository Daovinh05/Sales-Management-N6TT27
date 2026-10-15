# Quickstart: Kiểm chứng vòng đời 6 trạng thái đơn hàng

**Tính năng**: `004-order-status-lifecycle` | Tham chiếu contract: [order-status-api](./contracts/order-status-api.md), mô hình: [data-model](./data-model.md)

## Điều kiện tiên quyết

- Docker đang chạy: `sales-mysql` healthy, `sales-backend` Up (:8080), `sales-frontend` Up (:5173).
- Tài khoản seed: `admin/123456`, `customer/123456`.

## Kịch bản 1: Đi từng bước + chặn nhảy cóc (admin)

```bash
# Đăng nhập admin, lấy token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Dùng 1 mã đơn đang CHO_DUYET (lấy từ GET /api/orders với token admin), rồi đi từng bước:
for ST in DA_XAC_NHAN DANG_CHUAN_BI DANG_GIAO HOAN_THANH; do
  curl -s -X PATCH http://localhost:8080/api/orders/DH01/status \
    -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
    -d "{\"status\":\"$ST\"}"; echo
done
# Kỳ vọng: 4 lần đều 200, status đi đúng thứ tự.

# Nhảy cóc (tạo đơn mới ở CHO_DUYET rồi bắn thẳng DANG_GIAO):
curl -s -X PATCH http://localhost:8080/api/orders/DH02/status \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"DANG_GIAO"}'; echo
# Kỳ vọng: 400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này".
```

## Kịch bản 2: Khách hủy đúng/chặn đúng

```bash
# Đăng nhập customer, tạo đơn rồi hủy ở CHO_DUYET -> 200 DA_HUY.
# Đơn đã lên DA_XAC_NHAN -> hủy vẫn 200.
# Đơn đã lên DANG_CHUAN_BI -> hủy bị 400 "vui lòng liên hệ shop để hủy".
```

Trên UI: vào Lịch sử mua hàng, tab mới “Đang chuẩn bị hàng” hiện đơn; nút “Hủy đơn” chỉ xuất hiện ở tab “Chờ xác nhận” và “Đã xác nhận”.

## Kịch bản 3: Test tự động

```bash
sh mvnw test -Dtest='OrderServiceTests'  # trong thư mục backend/
# Kỳ vọng: BUILD SUCCESS, gồm test mới cho bước DANG_CHUAN_BI và chặn nhảy cóc.
```

## Kết quả mong đợi tổng

- `mvn test` xanh; không migration DB; đơn cũ 5 trạng thái vẫn hiển thị.
- Mọi message lỗi tiếng Việt; không còn đường nào đi `DA_XAC_NHAN → DANG_GIAO` trực tiếp.
