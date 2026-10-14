# Mô hình dữ liệu: Review Service Layer

## Thực thể chính

### Review (bảng `reviews`, không đổi schema)

- `id`: Long PK tự tăng, không đổi
- `customerName`: String(100), bắt buộc, đã `trim()`, rỗng sau trim bị từ chối
- `productName`: String(150), bắt buộc, đã `trim()`
- `rating`: Integer 1-5, bắt buộc
- `content`: String(2000), bắt buộc, đã `trim()`
- `reply`: String(2000), nullable — rỗng/blank chuẩn hóa thành null
- `createdAt`: LocalDateTime, `@CreationTimestamp`, không cho sửa

### Dữ liệu dẫn xuất (không lưu DB)

- `code`: `DG + %02d` của id (vd id=3 → `DG03`), sinh lúc map sang response, frontend dùng để lọc/hiển thị.

## Quan hệ

- Không quan hệ khóa ngoại: `customerName`/`productName` hiện là chuỗi tự do, không join `users`/`products`. Giữ nguyên trong phạm vi này để không vỡ UI.

## Quy tắc kiểm tra

- Tạo/sửa: tên khách, tên sản phẩm, nội dung bắt buộc phi blank sau trim; độ dài theo cột; rating 1-5; reply tùy chọn ≤2000.
- Xóa/sửa id không tồn tại → 404 "Không tìm thấy đánh giá".
- List luôn sắp `createdAt` giảm dần (`findAllByOrderByCreatedAtDesc`).

## Chuyển trạng thái

```text
không có máy trạng thái; CRUD trực tiếp: tạo -> đọc/sửa/xóa, xóa là xóa cứng
```
