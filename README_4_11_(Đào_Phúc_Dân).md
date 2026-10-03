# BÁO CÁO DỰ ÁN QUẢN LÝ BÁN HÀNG

**Người thực hiện:** Đào Phúc Dân
**Thời gian tổng hợp:** 03/10/2026
**Phần việc:** Quản lý sản phẩm và quản lý biến thể

## 1. Tổng quan và hiểu biết về dự án

Luồng chính của ứng dụng:

1. Người dùng đăng nhập, backend cấp access token và refresh token; frontend gắn access token khi gọi API.
2. Tài khoản ADMIN vào trang quản trị, tài khoản khách vào khu vực mua sắm.
3. Các màn hình quản trị gọi API để thao tác dữ liệu; endpoint ghi dữ liệu chặn quyền ADMIN ở backend.
4. Riêng cụm sản phẩm tách làm 2 bảng: bảng sản phẩm giữ thông tin chung (mã, tên, danh mục, thương hiệu, nhà cung cấp), bảng biến thể giữ giá, tồn kho, ảnh, màu, RAM, dung lượng.
5. Docker Compose kết nối frontend, backend, MySQL; kèm Redis và phpMyAdmin.

## 2. Công nghệ và cấu trúc

- **Frontend:** React 18, Vite, Axios; Font Awesome cho biểu tượng; nhập/xuất Excel qua API backend.
- **Backend:** Java 21, Spring Boot 4.1.1, Spring Data JPA, Spring Security, Bean Validation, JWT; Apache POI đọc/ghi Excel.
- **Cơ sở dữ liệu:** MySQL 8; truy cập dữ liệu theo luồng controller, service, repository, entity.
- **Ảnh biến thể:** lưu file trong thư mục uploads, phục vụ qua đường dẫn public.
- **Kiểm thử:** test JPA với H2; kiểm thử API bằng gọi trực tiếp sau khi chạy Docker.

## 3. Công việc đã thực hiện

### Quản lý sản phẩm

- Tạo entity và repository sản phẩm, liên kết nhiều-một tới danh mục, thương hiệu, nhà cung cấp.
- Tạo DTO tạo mới và cập nhật riêng, DTO trả về gộp sẵn tên danh mục, thương hiệu, nhà cung cấp cùng giá, tồn kho, ảnh của biến thể đầu tiên.
- Viết tầng service chứa toàn bộ nghiệp vụ: chuẩn hóa mã in hoa, báo trùng mã, báo khóa ngoại không tồn tại, xóa kèm biến thể liên quan, import Excel gom lỗi theo từng dòng.
- Viết controller mỏng chỉ validate đầu vào và gọi service: xem danh sách có lọc theo mã/tên, xem chi tiết, thêm, sửa, xóa, nhập và xuất Excel.
- Dựng trang quản trị gộp 4 màn PHP cũ thành 1 component: bộ lọc mã/tên, bảng 11 cột, badge tồn kho, dialog thêm/sửa, nhập/xuất Excel.

### Quản lý biến thể

- Tạo entity và repository biến thể, liên kết nhiều-một tới sản phẩm; giá dùng BigDecimal, ảnh lưu TEXT.
- Tạo DTO tạo mới và cập nhật riêng, mã biến thể chỉ nhập khi tạo và khóa khi sửa.
- Viết service lưu file ảnh: chỉ nhận định dạng ảnh hợp lệ, làm sạch tên file, tự chống trùng tên, xóa file cũ khi thay hoặc xóa biến thể.
- Viết tầng service nghiệp vụ: báo thiếu mã sản phẩm, báo trùng mã biến thể, báo mã sản phẩm không tồn tại, giữ ảnh cũ khi sửa không upload mới, import Excel không kèm ảnh.
- Viết controller nhận multipart cho phép gửi JSON fields kèm file ảnh trong cùng một request, đủ các endpoint xem, thêm, sửa, xóa, nhập, xuất Excel.
- Dựng trang quản trị: bộ lọc mã/tên biến thể, bảng đầy đủ màu/RAM/dung lượng/giá/tồn, dialog 9 trường có chọn sản phẩm từ dropdown, upload ảnh kèm xem trước, nhập/xuất Excel.

### Việc chung cho cả hai phân hệ

- Mở đọc public cho API sản phẩm, biến thể, danh mục, nhà cung cấp và đường dẫn ảnh; thao tác ghi giữ nguyên yêu cầu quyền ADMIN.
- Cấu hình thư mục upload, giới hạn dung lượng file, seed sẵn một bộ dữ liệu mẫu để mở trang là có dữ liệu.
- Nối cả hai trang vào sidebar layout quản trị cạnh trang danh mục và khuyến mãi của bạn.
- Chia toàn bộ việc thành 21 commit nhỏ theo chuẩn Conventional Commits, cụm sản phẩm và cụm biến thể tách riêng từng commit theo tầng.
- Xử lý conflict khi rebase lên main theo nguyên tắc giữ code của bạn: bỏ entity/controller danh mục và nhà cung cấp của mình để dùng bản service-pattern của bạn, giữ lại phần sản phẩm/biến thể và tự thích ứng.

## 4. Kết quả và trạng thái

- Backend biên dịch thành công, test JPA pass toàn bộ, frontend build thành công.
- Rebuild Docker và khởi động thành công, bảng mới tự tạo và seed đủ dữ liệu mẫu.
- Kiểm thử API thật: đăng nhập admin lấy JWT, tạo sản phẩm trả 201, tạo trùng trả 409, xóa trả 204; tạo biến thể multipart trả 201, đọc chi tiết join đúng tên sản phẩm.
- Mở trình duyệt đăng nhập admin dùng được hết các trang quản lý sản phẩm, biến thể, danh mục, khuyến mãi.

## 5. Phần còn hạn chế

- Xóa sản phẩm hiện xóa kèm biến thể; chưa chặn khi biến thể đã phát sinh trong đơn hàng vì module đơn hàng chưa có.
- Import Excel mới báo tổng số tạo mới/trùng/lỗi, chưa hiển thị chi tiết từng dòng lỗi trên giao diện.
- Cửa hàng phía khách vẫn dùng dữ liệu mẫu, chưa nối vào API sản phẩm thật.
- Muốn build Docker cần máy truy cập được Docker Registry và cấu hình `JWT_SECRET` trong file `.env`.

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
