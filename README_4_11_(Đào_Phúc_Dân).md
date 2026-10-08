# BÁO CÁO DỰ ÁN & VẬN DỤNG KỸ NĂNG LÀM CHỦ CODE

* **Người thực hiện:** Đào Phúc Dân
* **Học phần / Lớp:** Đồ án Quản lý bán hàng - N6TT27
* **Dự án:** Hệ thống Quản lý bán hàng công nghệ (TECHZONE)

---

## Ý 1: Xây dựng hệ thống với sự trợ giúp của AI Agent (3 điểm)

### 1. Cách em dùng công cụ để phân tích hệ thống trước khi code:
* **Phân rã nghiệp vụ:** Chia nhỏ bài toán thành các phân hệ lõi: Danh mục, Sản phẩm, Biến thể, Kho hàng, Giỏ hàng, Đơn hàng.
* **Mô hình hóa bằng Mermaid (`mermaid/`) trước khi gõ code:**
  * `01-use-case.mmd`: Xác định rõ ranh giới quyền hạn của từng vai trò (Admin, Warehouse Staff, Customer, Guest).
  * `02-erd.mmd`: Thiết kế quan hệ thực thể CSDL, tách riêng Sản phẩm (thông tin chung) và Biến thể (giá, màu, RAM, dung lượng); xác định cấu trúc tồn kho (`quantity`, `reservedQuantity`).
  * `03-system-architecture.mmd`: Định hình kiến trúc phân tầng React SPA <-> Spring Boot API <-> MySQL / Redis.
  * `04-sequence-order.mmd`: Vẽ biểu đồ tuần tự luồng đặt hàng phức tạp: kiểm tra tồn -> khóa dòng kho (lock) -> giữ chỗ tồn -> tạo đơn.

### 2. Cách em định nghĩa hệ thống file và kiến trúc:
* Áp dụng kiến trúc phân tầng (Layered Architecture) chuẩn:
  * `entity/`: Định nghĩa các bảng CSDL (`Product`, `ProductVariant`, `Inventory`, `Order`, `OrderDetail`...).
  * `repository/`: Truy vấn dữ liệu với Spring Data JPA, viết JPQL tối ưu và dùng Pessimistic Lock.
  * `dto/` (`request/`, `response/`): Tách biệt dữ liệu nhận/trả, validate đầu vào bằng Bean Validation.
  * `service/` & `service/impl/`: Nơi duy nhất xử lý logic nghiệp vụ và transaction.
  * `controller/`: Chỉ nhận request, validate DTO và gọi service, giữ controller mỏng.
  * `security/` & `config/`: Cấu hình JWT filter, mã hóa mật khẩu và phân quyền endpoint.

### 3. Phân định rõ ràng: "Chỗ nào em tự viết, chỗ nào em nhờ AI viết":
* **Chỗ em nhờ AI viết:**
  * Sinh khung code ban đầu (boilerplate): DTO records, getters/setters, mapper chuyển đổi giữa entity và DTO.
  * Viết CRUD mẫu và các regex kiểm tra định dạng số điện thoại, format hiển thị giá tiền.
  * Dựng khung giao diện JSX và bảng hiển thị dữ liệu React cơ bản.
* **Chỗ em tự thiết kế và viết 100% (không để AI tự quyết định):**
  * Thiết kế mô hình dữ liệu, chọn kiểu dữ liệu chuẩn (`BigDecimal` cho tiền tệ thay vì `double` để tránh sai số dấu phẩy động).
  * Nghiệp vụ nhạy cảm về giá và kho: Bắt buộc lấy giá gốc từ server (`variant.getPrice()`), không tin giá client gửi lên; dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` để khóa dòng tồn kho chống bán lố khi nhiều người cùng mua.
  * Xử lý toàn vẹn dữ liệu: Chặn xóa biến thể/sản phẩm khi còn hàng hoặc đã có đơn/phiếu nhập; dọn dòng tồn kho rỗng trước khi xóa biến thể để tránh lỗi khóa ngoại (FK constraint).
  * Thiết lập phân quyền bảo mật Spring Security và bảo vệ các endpoint ghi dữ liệu.

---

## Ý 2: Kỹ năng kiểm soát code (5 điểm)

### a) Kiểm soát tính năng và luồng code:
* **Nắm rõ vị trí từng tính năng trong source code:**
  * **Code đăng nhập nằm ở đâu:**
    * Controller: `AuthController.java` (endpoint `POST /api/auth/login`).
    * Service: `AuthServiceImpl.java` (gọi `AuthenticationManager.authenticate()` xác thực, tạo JWT qua `JwtUtils`).
    * Filter & Cấu hình: `JwtAuthFilter.java` và `SecurityConfig.java`.
  * **Muốn tạo ràng buộc mật khẩu phải có dấu `@` thì sửa ở đâu:**
    * Vào `RegisterRequest.java` (dòng 16), thêm annotation Bean Validation trên trường `password`:
      `@Pattern(regexp = ".*@.*", message = "Mật khẩu bắt buộc phải chứa ký tự @")`
    * Controller có gắn `@Valid` sẽ tự động chặn request không hợp lệ và trả mã lỗi `400 Bad Request`.
  * **Code đặt hàng và giữ chỗ kho ở đâu:**
    * `OrderServiceImpl.java` (dòng 86-127): `create()` tự đọc giá từ DB, gọi `reserveStock()` khóa dòng tồn kho.
  * **Code chặn xóa biến thể khi còn tồn kho hoặc có giao dịch ở đâu:**
    * `ProductVariantServiceImpl.java` (dòng 156) và `ProductServiceImpl.java` (dòng 165): `ensureDeletable()` kiểm tra tồn và lịch sử, trả mã lỗi `409 Conflict`.
* **Luồng xử lý 1 Request từ Client -> Server:**
  * Client (Axios) gắn token -> `JwtAuthFilter` (giải mã token, nạp user) -> `Controller` (validate DTO) -> `Service` (nghiệp vụ + transaction) -> `Repository` (truy vấn CSDL) -> `MySQL`.

### b) Kỹ năng sử dụng Skill và công cụ phụ trợ (graphify, sơ đồ kiến trúc):
* **Dùng skill Graphify / Dependency Mapping:** Quét cây thư mục, lập sơ đồ phụ thuộc giữa các tầng để phát hiện sớm lỗi phụ thuộc vòng (Circular Dependency) hoặc vi phạm kiến trúc (Controller gọi thẳng Repository).
* **Dùng Mermaid trực tiếp trong IDE:** Mở sequence diagram để soi thứ tự thực thi (ví dụ: mở transaction -> lock tồn kho -> tạo order detail -> tính tổng tiền) trước khi code.
* **Dùng Rules / Context Engineering cho AI:** Đặt các quy tắc ràng buộc AI (luôn dùng thông báo tiếng Việt có dấu, quy chuẩn Conventional Commits, giữ nguyên mô hình 1 kho trung tâm id=1).

### c) Phân tích qua Log, Diff & Góc nhìn Leader đánh giá hiệu quả nhóm:
* **Ý hiểu về công cụ:**
  * `git diff`: Soi chiếu từng dòng thay đổi trước khi commit, loại bỏ các dòng `console.log`, tránh việc format lại toàn bộ file làm nhiễu lịch sử git.
  * `git log`: Cuốn nhật ký tiến độ; commit rõ ràng theo chuẩn Conventional Commits (`feat:`, `fix:`).
* **Đóng vai trò Leader - Cách em đánh giá thành viên làm việc hiệu quả:**
  * **Không đo bằng số dòng code (LOC):** Dòng code nhiều chỉ là copy-paste từ AI, dễ gây ra code thừa và nợ kỹ thuật.
  * **Tiêu chí 1 - Tính nguyên tử của Commit:** Commit nhỏ gọn (2-3 file/commit), nội dung tập trung giải quyết đúng 1 vấn đề, message rõ ràng.
  * **Tiêu chí 2 - Khả năng làm chủ code:** Hỏi bất kỳ dòng code nào trong PR đều giải thích được lý do và luồng chạy, không trả lời kiểu "AI sinh ra nên em để vậy".
  * **Tiêu chí 3 - Xử lý trường hợp biên (Edge Cases):** Luôn có tư duy phòng thủ (check `null` trước khi `.compareTo()`, bắt lỗi khóa ngoại khi xóa, validate dữ liệu đầu vào).
  * **Tiêu chí 4 - Độ tin cậy qua Test:** Tính năng viết ra phải có Unit/Integration Test đi kèm chứng minh chạy đúng.
  * **Tiêu chí 5 - Kỹ năng giải quyết conflict:** Thường xuyên rebase, giải quyết conflict cẩn thận mà không ghi đè mất code của người khác.

---

## Ý 3: Kết hợp các công cụ test tính năng nâng cao (2 điểm)

### 1. Kiểm thử tầng dữ liệu và nghiệp vụ (`@DataJpaTest` + H2 Database):
* Xây dựng bộ test tự động trong `OrderAndCatalogIntegrityTests.java` kiểm thử các ca biên thực tế:
  * **Test chống hack giá client:** Client gửi `unitPrice = 100đ` (hoặc `0đ`), server tự lấy giá DB `15.000.000đ`, tính đúng tổng đơn `30.000.000đ`.
  * **Test tổng tồn đa biến thể:** Biến thể A tồn = 0, Biến thể B tồn = 10 -> Tổng tồn sản phẩm tính đúng là 10 (không bị lấy sai biến thể đầu dẫn đến báo hết hàng).
  * **Test bảo toàn lịch sử kho:** Biến thể đã có kho hoặc phiếu nhập thì cấm đổi `productCode`, server trả về `409 Conflict`.
  * **Test phòng vệ giá null:** Biến thể mới chưa đặt giá bán (`price = null`), tạo phiếu nhập kho không bị crash `NullPointerException`.

### 2. Kiểm thử đồng thời và ràng buộc toàn vẹn (`CartServiceTests.java`):
* Test chặn thêm giỏ hàng khi vượt quá tồn khả dụng trong kho.
* Test dọn sạch dòng tồn kho rỗng trước khi xóa biến thể để không bị lỗi vi phạm khóa ngoại CSDL (FK violation).

### 3. Kiểm thử đóng gói và tự động hóa quy trình:
* **Frontend:** Chạy `npm run build` xác nhận Vite đóng gói thành công, không có lỗi cú pháp JSX.
* **Backend:** Chạy `./mvnw test` đảm bảo toàn bộ 16/16 test case pass 100%.
* **Docker Compose:** Khởi chạy đồng bộ Frontend, Backend, MySQL, Redis để kiểm thử môi trường chạy thật.
