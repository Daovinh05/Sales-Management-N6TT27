# BÁO CÁO DỰ ÁN QUẢN LÝ BÁN HÀNG

**Người thực hiện:** Hoàng Văn Thành
**Thời gian tổng hợp:** 03/10/2026

## 1. Tổng quan và hiểu biết về dự án

Luồng chính của ứng dụng:

1. Người dùng đăng nhập, backend cấp access token; frontend gắn access token khi gọi API.
2. Tài khoản ADMIN vào trang quản trị, tài khoản khách vào khu vực mua sắm.
3. Phân hệ kho cho phép quản trị theo dõi và điều phối tồn kho qua API CRUD, giao diện quản trị hiển thị danh sách và form nhập liệu.
4. Docker Compose kết nối frontend, backend, MySQL và phpMyAdmin.

## 2. Công nghệ và cấu trúc

- **Frontend:** React 18, Vite, Axios; trang kho gồm danh sách và form, service gọi API riêng.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring Data JPA, Bean Validation; phân hệ kho theo mô hình phân lớp controller, service, repository, entity, DTO.
- **Cơ sở dữ liệu:** MySQL 8; entity kho ánh xạ qua JPA repository.
- **Điều hướng quản trị:** layout admin dùng sidebar; mục kho được sắp xếp lại vị trí trong menu.

## 3. Công việc đã thực hiện

### Phiên 1 – Khởi tạo khung Layered Architecture

- Đặt nền móng ban đầu cho ứng dụng Spring Boot và cấu trúc backend theo mô hình phân lớp (controller, service, repository, entity, DTO, exception, config).
- Khởi tạo cấu trúc Maven, cấu hình ứng dụng và bộ khung kiểm thử ban đầu.

### Phiên 2 – API quản lý kho (Backend)

- Tạo entity và repository kho (`Warehouse`, `WarehouseRepository`).
- Tạo DTO request/response riêng cho kho (`WarehouseRequest`, `WarehouseResponse`).
- Viết tầng service và implementation chứa nghiệp vụ CRUD kho (`WarehouseService`, `WarehouseServiceImpl`).
- Viết controller mỏng nhận validate đầu vào và gọi service (`WarehouseController`).
- Theo lịch sử commit, các file trên được thêm trong commit hoàn thiện CRUD API quản lý kho.

### Phiên 3 – Giao diện quản lý kho và menu admin

- Dựng trang danh sách và form quản lý kho (`WarehouseList.jsx`, `WarehouseForm.jsx`).
- Viết service frontend gọi API kho (`warehouseService.js`).
- Đồng bộ giao diện quản lý kho và sắp xếp lại vị trí menu admin trong layout (`App.jsx`, `AdminLayout.jsx`).

## 4. Kết quả và trạng thái

Các phần đã triển khai nổi bật trong phạm vi công việc là khung Layered Architecture ban đầu, API CRUD kho ở backend và cặp màn hình danh sách/form kho ở frontend kèm service gọi API, đã được nối vào menu quản trị. Các file tương ứng còn tồn tại trong mã nguồn hiện tại ở `backend/.../entity/Warehouse.java`, `controller/WarehouseController.java` và `frontend/src/pages/admin/Warehouse*.jsx`.

## 5. Phần còn hạn chế

- Báo cáo này tổng hợp từ cấu trúc mã nguồn và lịch sử commit; chưa có kết quả kiểm thử API/giao diện kho được ghi nhận thành văn bản trong phạm vi đối chiếu.
- Luồng tồn kho theo biến thể sản phẩm và luồng nhập/xuất kho gắn với đơn hàng chưa được khẳng định hoàn thành trong phạm vi này.
- Muốn build Docker cần máy truy cập được Docker Registry và cấu hình `JWT_SECRET` trong file `.env`; không đưa giá trị bí mật vào tài liệu hoặc mã nguồn.

## 6. Cách chạy bằng Docker

Tại thư mục gốc dự án, cấu hình `JWT_SECRET` trong `.env`, sau đó chạy:

```powershell
docker compose up -d --build
```

Các địa chỉ dịch vụ theo `docker-compose.yml`:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- phpMyAdmin: http://localhost:8081
- MySQL: `localhost:3306`

Có thể xem trạng thái container bằng `docker compose ps` và nhật ký bằng `docker compose logs -f frontend backend`.
