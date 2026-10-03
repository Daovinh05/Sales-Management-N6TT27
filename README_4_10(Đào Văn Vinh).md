# BÁO CÁO DỰ ÁN QUẢN LÝ BÁN HÀNG

**Người thực hiện:** Đào Văn Vinh
**Thời gian tổng hợp:** 03/10/2026

## 1. Tổng quan và hiểu biết về dự án

Luồng chính của ứng dụng:

1. Người dùng đăng ký hoặc đăng nhập. Backend cấp access token và refresh token; frontend gửi access token khi gọi API.
2. Vai trò tài khoản quyết định giao diện sau đăng nhập: quản trị viên vào trang quản trị, khách hàng vào khu vực mua sắm.
3. Các màn hình quản trị gọi API để thao tác với dữ liệu. Những endpoint quản trị được giới hạn cho tài khoản có quyền ADMIN.
4. Docker Compose kết nối các dịch vụ frontend, backend, MySQL và phpMyAdmin (Redis đã được xoá khỏi cấu hình vì backend không sử dụng).

## 2. Công nghệ và cấu trúc

- **Frontend:** React 18, Vite, Axios; Font Awesome cho biểu tượng; thư viện đọc/ghi Excel.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring MVC, Spring Data JPA, Spring Security, Bean Validation và JWT (jjwt).
- **Cơ sở dữ liệu:** MySQL 8. Dữ liệu ứng dụng được truy cập qua các lớp controller, service, repository và entity.
- **Đóng gói/chạy ứng dụng:** Docker và Docker Compose. Chế độ dev dùng `Dockerfile.dev` và bind-mount để hot-reload; chế độ prod build Vite rồi phục vụ qua Nginx.
- **Tài liệu thiết kế:** thư mục `docs/` và `mermaid/` lưu tài liệu mô tả use case, ERD, kiến trúc hệ thống và trình tự xử lý đơn hàng.

## 3. Công việc đã thực hiện

### Phiên 1 – Khởi tạo nền móng và xác thực

- Khởi tạo cấu trúc thư mục frontend/backend và sơ đồ thiết kế Mermaid nền tảng.
- Phát triển phần xác thực backend ban đầu: đăng nhập, cấp JWT và refresh token (`AuthController`, `JwtProvider`, `JwtFilter`, `AuthService`, `RefreshTokenService`, entity `User`/`Role`/`RefreshToken` và các repository tương ứng).
- Thiết lập kết nối MySQL/phpMyAdmin, `application.properties`, biến môi trường và `JWT_SECRET` (`JWT_SECRET` chỉ nằm trong `.env`, có `.env.example` hướng dẫn tạo mới).
- Bổ sung tài liệu luồng token tại `docs/Token.md` và cấu hình seed dữ liệu (`DataSeeder`, `SecurityConfig`).

### Phiên 2 – Docker dev và dọn dẹp hạ tầng

- Thêm chế độ dev tự reload cho frontend và backend (`backend/Dockerfile.dev`, `frontend/Dockerfile.dev`, `docker-compose.dev.yml` với bind-mount và `maven-cache`).
- Xoá service `redis` và volume `redis-data` khỏi `docker-compose.yml` vì backend không sử dụng, giúp nhẹ tài nguyên khi build lại.
- Sửa lỗi `Bind for 0.0.0.0:5173 failed` do compose gộp port `5173:80` và `5173:5173`; dùng `ports: !override` trong file dev để frontend dev map đúng `5173:5173`.
- Build lại toàn bộ container ở chế độ dev và kiểm tra các service MySQL, backend, frontend, phpMyAdmin khởi động.

### Phiên 3 – Tài liệu hiển thị

- Làm sáng màu 4 file Mermaid (ép theme nền trắng chữ đen, tô màu pastel theo từng nhóm chức năng) để dễ nhìn trên cả dark/light mode; dọn đoạn text thừa đầu file sequence để render đúng.
- Viết lại `Readme.md` theo chuẩn mẫu BE (Name, Description, Badges, Visuals, Installation, Usage, Support, Roadmap, Contributing, Authors, License, Project status) bám theo cấu hình hiện tại.

## 4. Kết quả và trạng thái

Các phần đã triển khai nổi bật là khung xác thực JWT/refresh token, cấu hình MySQL/phpMyAdmin/JWT, chế độ Docker dev hot-reload, dọn Redis thừa, sửa trùng port frontend và hệ thống tài liệu README/Mermaid. Các thay đổi hạ tầng đã được commit theo chuẩn Conventional Commits và kiểm tra khởi động container sau khi build lại.

## 5. Phần còn hạn chế

- Luồng xác thực đã có ở backend nhưng trải nghiệm làm mới token phía frontend vẫn phụ thuộc vào từng màn hình tích hợp.
- Lần đầu chạy dev backend phải tải toàn bộ Maven dependencies nên mất vài phút mới sẵn sàng; chưa có cache warm sẵn trong image.
- Chưa có kết quả được ghi nhận cho một lượt chạy toàn bộ bộ kiểm thử tự động của backend/frontend sau các thay đổi hạ tầng.
- Muốn build Docker cần máy truy cập được Docker Registry và cấu hình `JWT_SECRET` trong file `.env`; không đưa giá trị bí mật vào tài liệu hoặc mã nguồn.

## 6. Cách chạy bằng Docker

Tại thư mục gốc dự án, cấu hình `JWT_SECRET` trong `.env`, sau đó chạy:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

Các địa chỉ dịch vụ theo `docker-compose.yml`:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- phpMyAdmin: http://localhost:8081
- MySQL: `localhost:3306`

Có thể xem trạng thái container bằng `docker compose ps` và nhật ký bằng `docker compose logs -f frontend backend`.
