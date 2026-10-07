# BÁO CÁO DỰ ÁN QUẢN LÝ BÁN HÀNG

**Người thực hiện:** Đỗ Quang Anh  
**Thời gian tổng hợp:** 27/09/2026 – 02/10/2026

## 1. Xây dựng hệ thống với sự hỗ trợ của Agent (3 điểm)

### 1.1. Tổng quan hệ thống

Đây là ứng dụng quản lý bán hàng có các khu vực mua sắm cho khách hàng và quản trị/nghiệp vụ cho nhân viên. Frontend React gọi REST API ở backend Spring Boot; backend xử lý nghiệp vụ, phân quyền và truy cập MySQL.

- **Frontend:** React 18, Vite, Axios; có các màn hình mua sắm, giỏ hàng, thanh toán, hồ sơ khách hàng và quản lý.
- **Backend:** Java 21, Spring Boot, Spring MVC, Spring Data JPA, Spring Security, Bean Validation và JWT.
- **Dữ liệu và môi trường:** MySQL 8, Docker Compose; cấu hình dự án còn có Redis và phpMyAdmin.
- **Tài liệu hệ thống:** `docs/` và `mermaid/` lưu tài liệu thiết kế; các sơ đồ use case, ERD, kiến trúc và trình tự đặt hàng nằm trong `mermaid/`.

### 1.2. Quy trình làm việc với Agent

Các Agent hỗ trợ như VS Code Copilot, Cursor hoặc Claude có thể được dùng xuyên suốt quá trình phát triển, nhưng người làm vẫn phải hiểu và chịu trách nhiệm với phần code được tạo ra:

1. **Cung cấp ngữ cảnh:** nêu yêu cầu, cấu trúc frontend/backend, luồng nghiệp vụ liên quan và tiêu chí hoàn thành. Có thể dùng sơ đồ trong `mermaid/` để giải thích quan hệ giữa các thành phần.
2. **Yêu cầu Agent đề xuất trước khi sửa:** xác định các file cần thay đổi, luồng dữ liệu, trường hợp lỗi và cách kiểm thử; giới hạn thay đổi vào đúng tính năng.
3. **Kiểm tra kết quả:** đọc diff từng file, đối chiếu API và quy tắc nghiệp vụ, tự giải thích được phần code quan trọng; không chấp nhận code chỉ vì Agent báo đã hoàn thành.
4. **Xác minh:** chạy build/test phù hợp, kiểm tra giao diện và API, xem log khi có lỗi. Nếu kết quả không đúng, cung cấp lỗi và ngữ cảnh cho Agent để sửa rồi kiểm tra lại.

Ví dụ một yêu cầu tốt: “Bổ sung ràng buộc mật khẩu đăng ký phải có ký tự `@`; kiểm tra cả backend lẫn giao diện, thêm test cho trường hợp hợp lệ/không hợp lệ, và chỉ sửa các file liên quan đến đăng ký.”

## 2. Kỹ năng kiểm soát code

### 2.1. Nắm vị trí và cách sửa tính năng

Ví dụ với tính năng đăng nhập/đăng ký:

- Giao diện biểu mẫu: `frontend/src/components/auth/AuthModal.jsx`.
- Trạng thái đăng nhập, gọi API đăng nhập/đăng ký: `frontend/src/store/auth.jsx`.
- Gắn access token, tự làm mới token khi hết hạn: `frontend/src/services/api.js`.
- Endpoint `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`: `backend/src/main/java/com/salemanagement/controller/AuthController.java`.
- Xác thực nghiệp vụ: `backend/src/main/java/com/salemanagement/service/impl/AuthServiceImpl.java`.
- Ràng buộc dữ liệu yêu cầu đăng nhập: `backend/src/main/java/com/salemanagement/dto/request/LoginRequest.java`.
- Ràng buộc đăng ký: `backend/src/main/java/com/salemanagement/dto/request/RegisterRequest.java`.
- Cấu hình phân quyền và bộ mã hóa mật khẩu BCrypt: `backend/src/main/java/com/salemanagement/config/SecurityConfig.java`.

**Ví dụ khi được yêu cầu bắt buộc mật khẩu có dấu `@`:** hiện tại `RegisterRequest` chỉ quy định mật khẩu không trống và tối thiểu 6 ký tự, chưa bắt buộc có `@`. Cần thêm kiểm tra phía backend (ví dụ `@Pattern(regexp = ".*@.*")` cho trường `password`) để API không bị bỏ qua quy tắc; đồng thời bổ sung kiểm tra/hiển thị lỗi ở biểu mẫu đăng ký trong `AuthModal.jsx` để người dùng biết cách sửa. Sau đó kiểm thử đăng ký với mật khẩu có và không có `@`. Đăng nhập không cần quy tắc mới nếu yêu cầu chỉ áp dụng cho mật khẩu đăng ký.

Một số vị trí khác có thể tra theo chức năng:

- Hồ sơ khách hàng: `frontend/src/pages/shop/CustomerProfile.jsx`, `backend/src/main/java/com/salemanagement/controller/UserProfileController.java`.
- Quản lý thương hiệu: `frontend/src/pages/admin/BrandManagement.jsx`, `backend/src/main/java/com/salemanagement/controller/BrandController.java`.
- Quản lý người dùng: `frontend/src/pages/admin/UserManagement.jsx`, `backend/src/main/java/com/salemanagement/controller/UserManagementController.java`.
- Quản lý đánh giá: `frontend/src/pages/admin/ReviewManagement.jsx`, `backend/src/main/java/com/salemanagement/controller/ReviewController.java`.

### 2.2. Kỹ năng dùng skill và công cụ hỗ trợ code

Khi có skill phù hợp (ví dụ Graphify hoặc skill điều hướng/phân tích code), có thể dùng để hiểu quan hệ giữa màn hình, API, service và dữ liệu trước khi sửa. Không nên chỉ dựa vào kết quả phân tích tự động: cần đối chiếu với mã nguồn và chạy kiểm tra sau thay đổi. Dự án cũng có các sơ đồ trong `mermaid/` làm nguồn ngữ cảnh để người phát triển và Agent thống nhất cách hiểu kiến trúc, dữ liệu và luồng nghiệp vụ.

Quy trình áp dụng skill: xác định câu hỏi cần trả lời → dùng skill tìm thành phần liên quan → kiểm tra các file nguồn → yêu cầu thay đổi nhỏ, có tiêu chí kiểm thử → xem diff và xác minh. Không dùng skill để tạo thay đổi hàng loạt nếu chưa hiểu tác động đến các màn hình/API đang dùng chung.

### 2.3. Dùng log và diff để theo dõi hiệu quả làm việc

- **Diff (`git diff`):** cho biết cụ thể file nào và dòng nào đã thay đổi; dùng để kiểm tra thay đổi có đúng yêu cầu, có sửa lan sang tính năng khác hay không, và có thiếu test/tài liệu liên quan không.
- **Log Git (`git log`):** cho biết lịch sử commit, nội dung và trình tự hoàn thành công việc; kết hợp với mã ticket/task để hiểu mục tiêu của từng thay đổi.
- **Log ứng dụng:** dùng `docker compose logs -f frontend backend` để xem lỗi khi chạy; đối chiếu thời điểm, endpoint và thao tác gây lỗi. Không ghi hoặc chia sẻ token, mật khẩu hay giá trị bí mật trong log.

Với vai trò leader, không đánh giá hiệu quả chỉ bằng số dòng code hoặc số commit. Có thể xem xét các tiêu chí:

1. Hoàn thành đúng yêu cầu và tiêu chí nghiệm thu trong thời gian đã thống nhất.
2. Thay đổi đúng phạm vi, dễ đọc, không tạo lỗi hồi quy; người thực hiện giải thích được lựa chọn và luồng xử lý.
3. Có test/kiểm tra phù hợp, xử lý trường hợp lỗi, cung cấp bằng chứng build hoặc chạy thử.
4. Diff và commit rõ ràng, bám sát từng task; mô tả được việc đã làm, việc còn thiếu và rủi ro.
5. Phối hợp tốt: cập nhật tiến độ sớm, báo blocker có thông tin tái hiện, tiếp nhận review và sửa lỗi.

### 2.4. Công việc đã thực hiện trong dự án

- Bổ sung trang hồ sơ khách hàng để xem/cập nhật thông tin và API `/api/users/me`.
- Bổ sung cơ chế frontend làm mới access token bằng refresh token; khi không thể làm mới thì xóa phiên và yêu cầu đăng nhập lại.
- Xây dựng màn hình quản lý thương hiệu, kết nối API; hỗ trợ tìm kiếm, thêm, sửa, xóa, nhập và xuất CSV; nối điều hướng từ sidebar/dashboard.
- Hoàn thiện màn hình quản lý tài khoản, kết nối API quản trị; hỗ trợ tìm kiếm, thêm, sửa vai trò, xóa, nhập Excel và xuất CSV.
- Hoàn thiện màn hình quản lý đánh giá; hỗ trợ tìm kiếm, thêm, sửa, xóa và xuất Excel; nối điều hướng từ sidebar/dashboard.
- Trong quá trình cập nhật Docker, đã phân biệt lỗi tải image do máy không phân giải/kết nối được Docker Registry với lỗi trong mã nguồn giao diện.

## 3. Kết hợp công cụ kiểm thử tính năng

Nên kiểm tra ở nhiều mức thay vì chỉ xác nhận màn hình mở được:

1. **Kiểm tra đầu vào:** xác minh dữ liệu hợp lệ và không hợp lệ, bao gồm các ràng buộc ở giao diện và backend.
2. **Kiểm tra API/backend:** chạy các kiểm thử tự động hiện có và kiểm tra endpoint, phản hồi lỗi, phân quyền, cùng các thay đổi dữ liệu trong cơ sở dữ liệu.
3. **Kiểm tra tích hợp giao diện:** thao tác trên trình duyệt, xác minh frontend gọi đúng API và trạng thái hiển thị đúng khi thành công/thất bại.
4. **Kiểm tra hồi quy:** chạy lại các luồng liên quan sau khi sửa, chẳng hạn đăng nhập, refresh token, hồ sơ khách hàng hoặc các màn quản trị dùng chung điều hướng/API.
5. **Kiểm tra khi đóng gói:** build frontend/backend hoặc chạy Docker Compose; nếu lỗi thì đối chiếu kết quả build, `docker compose ps` và log dịch vụ để khoanh vùng.

Trong repository hiện có các bài kiểm thử backend như `SaleManagementApplicationTests`, `CatalogRepositoryTests`, `StorefrontRepositoryTests` và `CartServiceTests`. Có thể chạy backend tests từ thư mục `backend`:

```powershell
.\mvnw.cmd test
```

Build frontend từ thư mục `frontend`:

```powershell
npm run build
```

Các phiên làm việc trước đã ghi nhận kiểm tra thủ công một số luồng trên trình duyệt và Docker. Chưa có kết quả được ghi nhận cho một lượt chạy toàn bộ kiểm thử tự động sau tất cả thay đổi; cần chạy lại các lệnh trên và kiểm tra các luồng trọng yếu trước khi kết luận toàn hệ thống đã đạt.

## Chạy ứng dụng bằng Docker

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

Xem trạng thái container và nhật ký:

```powershell
docker compose ps
docker compose logs -f frontend backend
```
