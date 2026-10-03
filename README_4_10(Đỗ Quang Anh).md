# BÁO CÁO DỰ ÁN QUẢN LÝ BÁN HÀNG

**Người thực hiện:** Đỗ Quang Anh  
**Thời gian tổng hợp:** 27/09/2026 – 02/10/2026

## 1. Tổng quan và hiểu biết về dự án

Luồng chính của ứng dụng:

1. Người dùng đăng ký hoặc đăng nhập. Backend cấp access token và refresh token; frontend gửi access token khi gọi API.
2. Vai trò tài khoản quyết định giao diện sau đăng nhập: quản trị viên vào trang quản trị, khách hàng vào khu vực mua sắm.
3. Các màn hình quản trị gọi API để thao tác với dữ liệu. Những endpoint quản trị được giới hạn cho tài khoản có quyền ADMIN.
4. Docker Compose kết nối các dịch vụ frontend, backend và cơ sở dữ liệu; cấu hình còn có Redis và phpMyAdmin.

## 2. Công nghệ và cấu trúc

- **Frontend:** React 18, Vite, Axios; Font Awesome cho biểu tượng; thư viện đọc/ghi Excel.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring MVC, Spring Data JPA, Spring Security, Bean Validation và JWT.
- **Cơ sở dữ liệu:** MySQL 8. Dữ liệu ứng dụng được truy cập qua các lớp controller, service, repository và entity.
- **Đóng gói/chạy ứng dụng:** Docker và Docker Compose. Frontend được build bằng Vite rồi phục vụ qua Nginx; backend chạy dưới dạng ứng dụng Spring Boot.
- **Tài liệu thiết kế:** thư mục `docs/` và `mermaid/` lưu tài liệu mô tả use case, ERD, kiến trúc hệ thống và trình tự xử lý đơn hàng.

## 3. Công việc đã thực hiện

### Phiên 1 – Hồ sơ khách hàng và xác thực

- Bổ sung luồng mở menu tài khoản từ avatar/tên khách hàng; từ menu, người dùng chọn **Quản lý tài khoản** để mở trang hồ sơ.
- Xây dựng trang hồ sơ cho phép xem và cập nhật họ tên, email, số điện thoại, địa chỉ; tên đăng nhập không cho chỉnh sửa.
- Bổ sung API đọc/cập nhật hồ sơ tài khoản đang đăng nhập tại `/api/users/me`.
- Xử lý trường hợp tải hồ sơ thất bại, tránh lưu biểu mẫu chưa có dữ liệu và cung cấp thao tác tải lại.
- Thêm cơ chế frontend dùng refresh token để lấy access token mới khi token hết hạn; nếu phiên không thể làm mới thì xóa trạng thái đăng nhập và yêu cầu đăng nhập lại.
- Trong phiên làm việc, luồng xem và cập nhật hồ sơ đã được kiểm tra trên trình duyệt; yêu cầu cập nhật trả về thành công.

### Phiên 2 – Quản lý thương hiệu và điều hướng trang quản trị

- Tạo màn hình quản lý thương hiệu, kết nối với API backend và dữ liệu MySQL.
- Hỗ trợ tìm kiếm theo mã/tên, thêm, sửa, xóa thương hiệu; nhập và xuất danh sách bằng CSV.
- Nối mục **Quản lý thương hiệu** trên sidebar với đúng màn hình; các thẻ hành động nhanh cũng dùng chung đích điều hướng tương ứng.
- Điều tra tình trạng Docker vẫn hiển thị giao diện cũ: source đã có màn hình nhưng image/container chưa được cập nhật. Quá trình build từng bị chặn do máy không phân giải được `auth.docker.io`, không phải do lỗi click trong mã nguồn.

### Phiên 3 – Quản lý người dùng và đánh giá

- Hoàn thiện màn hình quản lý tài khoản, gồm tìm kiếm riêng theo mã user và tên user, thêm tài khoản, sửa vai trò, xóa tài khoản, nhập Excel và xuất CSV.
- Kết nối màn hình với API quản trị. Backend yêu cầu quyền ADMIN; có kiểm tra dữ liệu đầu vào, mã hóa mật khẩu, ngăn tự xóa tài khoản đang đăng nhập, tự hạ quyền và xóa quản trị viên cuối cùng.
- Hoàn thiện màn hình quản lý đánh giá với tìm kiếm theo mã đánh giá, tên khách hàng và tên sản phẩm; hỗ trợ thêm, sửa, xóa và xuất Excel.
- Nối mục **Quản lý đánh giá** có biểu tượng ngôi sao trên sidebar tới trang đánh giá, đồng thời bỏ mục đánh giá trùng lặp theo yêu cầu.
- Kết nối các thẻ hành động nhanh trên Dashboard với các màn hình người dùng, thương hiệu và đánh giá tương ứng.
- Theo ghi nhận phiên làm việc, các màn quản lý người dùng/đánh giá đã được khởi động và kiểm tra sau khi cập nhật Docker.

## 4. Kết quả và trạng thái

Các phần đã triển khai nổi bật trong phạm vi ba phiên là hồ sơ khách hàng, làm mới phiên đăng nhập, quản lý thương hiệu, quản lý tài khoản và quản lý đánh giá. Các màn hình này đã được nối với API backend thay vì chỉ hiển thị dữ liệu tĩnh; thao tác quản trị được bảo vệ bằng phân quyền ở backend.

Vấn đề Docker ở phiên quản lý thương hiệu được xác định là vấn đề tải image do DNS/kết nối tới Docker Registry. Đây là vấn đề môi trường triển khai, khác với lỗi điều hướng trong source. Phiên làm việc sau ghi nhận Docker đã được cập nhật và kiểm tra cho các màn quản lý người dùng, đánh giá.

## 5. Phần còn hạn chế

- Dashboard có nhiều mục quản trị được hiển thị, nhưng trong phạm vi các phiên này chỉ có các màn quản lý người dùng, thương hiệu và đánh giá được nối tới màn hình nghiệp vụ. Các phân hệ khác như sản phẩm, đơn hàng, khuyến mãi và thống kê chưa có
- Việc nhập/xuất hiện không đồng nhất giữa các phân hệ: thương hiệu dùng CSV; người dùng nhập Excel và xuất CSV; đánh giá xuất Excel.
- Các phiên ghi nhận kiểm tra thao tác trên trình duyệt và triển khai Docker ở một số thời điểm; chưa có kết quả được ghi nhận cho một lượt chạy toàn bộ bộ kiểm thử tự động của backend/frontend.
- Muốn build Docker cần máy truy cập được Docker Registry và cấu hình `JWT_SECRET` trong file `.env`; không nên đưa giá trị bí mật vào tài liệu hoặc mã nguồn.

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
- Redis: `localhost:6379`

Có thể xem trạng thái container bằng `docker compose ps` và nhật ký bằng `docker compose logs -f frontend backend`.
