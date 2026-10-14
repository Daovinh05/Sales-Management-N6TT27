# Quickstart: Kiểm chứng Review Service Layer

## Điều kiện tiên quyết

- Backend `:8080` + MySQL chạy (docker compose), tài khoản ADMIN đăng nhập được.
- Frontend `:5173` để kiểm trang Quản lý đánh giá.

## Kịch bản 1: Unit test xanh

```bash
cd backend && ./mvnw test -Dtest=ReviewServiceTest
```

Kết quả mong đợi: test CRUD, not-found, trim/reply, thứ tự mới nhất đều pass.

## Kịch bản 2: API giữ nguyên hợp đồng

1. Đăng nhập ADMIN lấy JWT: `POST /api/auth/login`.
2. `GET /api/reviews` → vẫn mảng `[{id, code: "DG..", customerName, productName, rating, content, reply, createdAt}]` mới nhất trước.
3. `POST /api/reviews` thiếu `content` → 400 message tiếng Việt; rating 6 → 400.
4. `PUT /api/reviews/999999` → 404 "Không tìm thấy đánh giá".
5. Tạo rồi xóa một bản ghi thử → `GET` lại không còn.

## Kịch bản 3: UI không đổi

1. Mở trang Quản lý đánh giá: lọc theo mã/khách/sản phẩm, phân trang, xuất Excel vẫn chạy.
2. Thêm → sửa → xóa một đánh giá thử, thông báo tiếng Việt hiện đúng.

## Kết quả mong đợi

- Không sửa frontend; `mvn test` xanh toàn bộ.
