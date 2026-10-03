# Báo cáo đóng góp thành viên – Dự án quản lý bán hàng

**Nhóm:** N6TT27  
**Ngày tổng hợp:** 03/10/2026

## 1. Tổng quan dự án

Dự án xây dựng ứng dụng quản lý bán hàng/thương mại điện tử theo mô hình frontend–backend:

- **Frontend:** React 18, Vite; giao diện khách hàng và trang quản trị.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring Security, Spring Data JPA.
- **Cơ sở dữ liệu:** MySQL 8; cấu hình chạy local và kết nối qua Docker Compose.
- **Hạ tầng phát triển:** Dockerfile cho frontend/backend; Docker Compose khai báo MySQL, Redis, phpMyAdmin và ứng dụng.
- **Tài liệu thiết kế:** sơ đồ use case, ERD, kiến trúc hệ thống và luồng đặt hàng.

## 2. Đóng góp theo thành viên

### Đào Văn Vinh – 74DCTT22119

**Tài khoản GitHub ghi nhận:** [Daovinh05](https://github.com/Daovinh05), [Congvinh2005](https://github.com/Congvinh2005)

- Khởi tạo cấu trúc dự án và các thư mục nền tảng cho frontend/backend.
- Phát triển phần xác thực backend ban đầu: đăng nhập, JWT và refresh token.
- Thiết lập cấu hình kết nối MySQL/phpMyAdmin, biến môi trường và cấu hình JWT.
- Chuẩn bị tài liệu/sơ đồ thiết kế nền tảng bằng Mermaid cho hệ thống.

### Đào Phúc Dân – 74DCTT22559

**Tài khoản GitHub ghi nhận:** [phucnad9121](https://github.com/phucnad9121)

- Khởi tạo ứng dụng React/Vite, giao diện dùng chung và giao diện cửa hàng.
- Xây dựng trang landing/slider, thẻ sản phẩm, tìm kiếm/lọc sản phẩm và giao diện giỏ hàng.
- Bổ sung luồng đăng nhập/đăng ký phía frontend, trạng thái xác thực và xử lý token khi gọi API.
- Xây dựng điều hướng theo vai trò khách hàng/quản trị viên và layout dashboard quản trị.
- Bổ sung các thành phần dùng chung cho backend như response DTO, xử lý exception, CORS, OpenAPI/Swagger và cấu hình bảo mật.
- Đóng góp cấu hình Dockerfile cho frontend/backend và Docker Compose cho môi trường chạy nhiều dịch vụ.

### Đỗ Quang Anh – 74DCTT22466

**Tài khoản GitHub ghi nhận:** [Quanh2le5](https://github.com/Quanh2le5)

- Phát triển API và giao diện xem/cập nhật hồ sơ cá nhân khách hàng.
- Xây dựng chức năng quản lý thương hiệu: API tạo, xem, sửa, xóa và giao diện quản trị; có chức năng xuất CSV.
- Xây dựng chức năng quản lý tài khoản người dùng phía quản trị, bao gồm xem danh sách, tạo/xóa tài khoản và cập nhật vai trò.
- Xây dựng API và giao diện quản lý đánh giá sản phẩm; có kiểm tra dữ liệu đầu vào và thao tác CRUD.
- Thực hiện các cập nhật/sửa đổi mô hình thương hiệu và hồ sơ khách hàng trong các commit gần nhất.

### Hoàng Văn Thành – 74DCTT22157

**Tài khoản GitHub được cung cấp:** `hoangthanh`

- Đặt nền móng ban đầu cho ứng dụng Spring Boot và cấu trúc backend theo mô hình phân lớp.
- Khởi tạo cấu trúc Maven, cấu hình ứng dụng và bộ khung kiểm thử ban đầu.

**Lưu ý đối chiếu:** lịch sử commit hiện có ghi tác giả `hoangthanhh` (hai chữ `h` ở cuối), trong khi tài khoản được cung cấp là `hoangthanh`. Cần xác nhận hai tên này thuộc cùng một thành viên trước khi chốt báo cáo chính thức.

## 3. Chức năng đã có trong mã nguồn

- Đăng nhập/đăng ký và xác thực JWT; frontend có xử lý refresh token.
- Phân quyền khách hàng/quản trị viên và bảo vệ các thao tác quản trị.
- Quản lý thông tin hồ sơ khách hàng.
- Quản lý thương hiệu và tài khoản người dùng.
- Quản lý đánh giá.
- Giao diện cửa hàng có landing page, tìm kiếm/lọc và giỏ hàng.
- Cấu hình CORS, Swagger/OpenAPI, MySQL và các container phục vụ môi trường phát triển.

## 4. Phạm vi và trạng thái

Các sơ đồ thiết kế mô tả thêm những phân hệ như sản phẩm, danh mục, kho, nhập hàng, đơn hàng và thanh toán. Tuy nhiên, không nên xem các phân hệ đó là chức năng backend đã hoàn thành chỉ dựa trên sơ đồ: trong mã nguồn được đối chiếu, một số màn hình cửa hàng vẫn dùng dữ liệu mẫu và chưa có đầy đủ API/luồng giao dịch tương ứng. Redis hiện được khai báo trong Docker Compose; báo cáo này không khẳng định ứng dụng đã tích hợp Redis làm cache.

Báo cáo được tổng hợp từ cấu trúc mã nguồn và lịch sử commit, không phải phép đo khối lượng công việc hay xác nhận nghiệm thu từng chức năng.

## 5. Ghi chú phiên bản đối chiếu

Tại thời điểm tổng hợp, nhánh `main` trong bản làm việc cục bộ chậm hơn `origin/main` 4 commit. Lịch sử GitHub có các cập nhật bổ sung của Đỗ Quang Anh về mô hình thương hiệu và hồ sơ khách hàng trong ngày 03/10/2026; nên đồng bộ nhánh trước khi dùng báo cáo này làm bản nghiệm thu cuối cùng.
