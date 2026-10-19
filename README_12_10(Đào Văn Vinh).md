# BÁO CÁO CÁ NHÂN — Đào Văn Vinh

**Dự án:** Hệ thống quản lý bán hàng (Sales Management)
**Phần việc của em:** đăng nhập/đăng ký/đăng xuất, đặt hàng, thanh toán, lịch sử đơn hàng (khách); quản lý đơn hàng, thống kê (admin).

---

## 1. Sản phẩm là gì? Mục đích, động lực

- **Sản phẩm:** web bán điện thoại, 3 vai trò: khách mua hàng, nhân viên kho nhập hàng (bạn Thành), admin quản lý toàn bộ.
- **Mục đích:** số hoá quy trình bán hàng nhỏ — tồn kho trừ đúng theo đơn, thanh toán COD/VietQR có luồng rõ ràng, admin nhìn được doanh thu thay vì ghi sổ giấy.
- **Động lực:** học Spring Boot + React ở quy mô thật, và học cách **làm việc với AI Agent mà vẫn kiểm soát được code** (trọng tâm thầy yêu cầu).

## 2. Tổng quan kiến trúc hệ thống

```
Browser (React 18 + Vite)
   │  REST /api + JWT (access 30p, refresh 7 ngày)
Spring Boot 4 (Controller → Service → Repository → MySQL 8)
   │  Spring Security + JwtFilter + @PreAuthorize theo role
Docker Compose: frontend 5173 | backend 8080 | mysql 3307 | phpMyAdmin 8081
```

Bảng input → output các module của em:

| Luồng | Input | Output em kiểm soát được |
|---|---|---|
| Đăng nhập | username/password → `AuthController.login` | access+refresh token, `user` vào localStorage |
| Đăng ký | form → `AuthController.register` | tài khoản mới, báo dùng để đăng nhập |
| Đăng xuất | nút Đăng xuất | xóa token/user khỏi localStorage, về trang khách |
| Đặt hàng | giỏ hàng → `POST /api/orders` | đơn `CHO_DUYET` + giữ chỗ kho (`reserved`) |
| Thanh toán | modal COD/VietQR → `POST /orders/{code}/payment` | COD/VietQR đều giữ `CHO_DUYET` chờ duyệt; trừ kho ở Hoàn thành |
| Lịch sử đơn (khách) | `GET /orders/mine` | xem, thanh toán bù, hủy đơn (nhả/trả kho) |
| Quản lý đơn (admin) | `PATCH /orders/{code}/status` 1 chiều | duyệt đúng bước, chặn đơn thiếu phương thức, trừ tồn đúng 1 lần |
| Thống kê (admin) | khoảng ngày → `/api/admin/stats/*` | KPI, biểu đồ doanh thu, top bán chạy, tồn thấp |

### Quan hệ tồn kho giữa phần của em và phần của bạn Thành

Hai phần chung 1 bảng `inventory` (`quantity`, `reservedQuantity`) và 1 công thức `bán được = quantity − reserved`, mỗi bên chỉ đụng phần việc của mình:

- **Bạn Thành (nhập kho):** staff lập phiếu → admin duyệt → `quantity` **tăng**. Không bao giờ đụng `reserved`.
- **Em (bán hàng):** đặt hàng → `reserved` **tăng** (giữ chỗ, chưa trừ); trả VietQR/COD → vẫn giữ chỗ; hoàn thành → `quantity` và `reserved` **cùng giảm** (trừ thật); hủy → nhả chỗ hoặc cộng trả tồn.
- Nhờ chia như vậy: kho nhập bao nhiêu, shop bán bấy nhiêu, không bán lố (`available` chặn ở cả giỏ hàng và API đặt); admin xem trang kho đối chiếu được cả 2 chiều nhập–xuất.

## 3. Khối lượng công việc em đã làm

- **Cụm khách:** đăng nhập/đăng ký/đăng xuất (`AuthModal.jsx`, `store/auth.jsx`), đặt hàng (`Checkout.jsx`), thanh toán COD/VietQR (`PaymentModal.jsx`, API `POST /orders/{code}/payment`), lịch sử đơn (`OrderHistory.jsx`: thanh toán bù, hủy đơn, banner nhắc trả).
- **Cụm admin:** quản lý đơn (`OrderManagement.jsx`: lọc trạng thái/phương thức, duyệt 1 chiều, phân trang), thống kê (`ThongKe.jsx` + 4 API `/api/admin/stats/*`).
- **Nền dùng chung:** giữ chỗ/trừ tồn (`OrderServiceImpl`, cờ `stockDeducted`, khóa bi quan), seed tài khoản/kho/tồn/khuyến mãi, component modal xoá + toast + phân trang dùng chung.

## 4. Ý 1 — Xây dựng hệ thống với sự trợ giúp của Agent (3 điểm)

Quy trình của em, bước nào cũng có kiểm chứng chứ không phó mặc:

1. **Phân tích bằng Agent:** yêu cầu Agent đọc codebase rồi **trả lời trước, code sau**. Ví dụ hỏi "đặt hàng trừ kho thế nào cho hợp lý" → nhận 2 phương án → em chốt giữ chỗ 2 bước rồi mới cho làm.
2. **Định nghĩa file trước khi viết:** Agent đề xuất file mới/sửa (ví dụ `PaymentConfirmRequest`, `StatsController`, `PaymentModal.jsx`), em duyệt danh sách file rồi mới cho tạo.
3. **Chỗ nào tự viết, chỗ nào nhờ AI:**
   - Tự viết/quyết định: trạng thái đơn 1 chiều, quy tắc tồn kho (giữ chỗ khi đặt, trừ thật ở Hoàn thành cho cả COD lẫn VietQR), câu chữ tiếng Việt trên UI.
   - Nhờ AI viết: code lặp theo mẫu (filter, pagination 9 trang), CSS, JPQL thống kê — sau đó em đọc diff từng dòng.
4. **Kiểm soát bằng diff + log:** mọi thay đổi xem `git diff` trước khi commit; lỗi đọc log container (`docker logs sales-backend`) và tab Network của DevTools. Ví dụ: `No static resource .../payment` → backend chạy bản cũ, restart là hết; `stock_deducted` → MySQL từ chối ADD COLUMN, thêm default là xong; 403 hàng loạt → token chết sau reset DB, đăng nhập lại.

### Phong cách làm việc của em với AI: SRS → plan → từng task

1. **Đọc yêu cầu:** gom từ tài liệu (`docs/`, mermaid) và tin nhắn nhóm thành 1 việc rõ ràng.
2. **Phân tích thành plan:** chia việc lớn thành task nhỏ có thứ tự, mỗi task ghi **làm gì + kiểm tra bằng gì**. Ví dụ modal thanh toán tách thành: (a) API confirm/hủy của khách, (b) modal + nối checkout, (c) nút thanh toán/hủy ở lịch sử đơn.
3. **Làm từng task, mỗi task 1 vòng kín:** giao task → Agent làm → em đọc diff → chạy thử (click thật hoặc `curl`/test) → đạt mới sang task tiếp.
4. **Verify độc lập:** test xanh, API trả đúng kiểm bằng tay, hoặc restart app chạy được. Không có chuyện "Agent bảo xong là xong".
5. **Commit nhỏ theo task:** mỗi task 1 commit `type(scope)` tiếng Việt — `git log` chính là nhật ký plan đã chạy.

**Mấu chốt: AI chỉ làm trong task, còn plan – kiểm tra – chịu trách nhiệm là của em.** Đổi Agent nào (Copilot, Cursor, Claude) nếp này vẫn giữ.

## 5. Ý 2 — Kỹ năng kiểm soát code (5 điểm)

### a) Kiểm soát tính năng — code ở đâu, sửa thế nào

- **Đăng nhập ở đâu:** `AuthController (@PostMapping /api/auth/login)` → `AuthServiceImpl.login` → `JwtFilter` (giải token mỗi request) → `SecurityConfig` (ai được vào đâu). Frontend: `store/auth.jsx` (`login()`) + `components/auth/AuthModal.jsx`. Đăng xuất: `logout()` xóa 3 key localStorage.
- **Ví dụ "ràng buộc mật khẩu phải có dấu @":** sửa DTO register — thêm `@Pattern(regexp = ".*@.*")` (đúng mẫu `OrderStatusRequest` đang dùng `@Pattern`), backend tự trả 400, không đụng service. Test: `abc123` rớt, `abc@123` qua, gọi API trực tiếp vẫn bị chặn.
- **Ví dụ "đổi trừ kho sang trừ ngay khi đặt":** chuyển 1 dòng `deductStockIfNeeded()` từ nhánh `HOAN_THANH` sang `confirmPayment`; cờ `stockDeducted` chống trừ 2 lần — em chỉ đúng file đúng dòng vì chính em thiết kế.
- **Ví dụ "tìm chỗ tính tiền thanh toán":** `OrderServiceImpl.create` (`paymentAmount = total − discount`), modal hiện `totalAmount/discountAmount/paymentAmount` của đơn trả về.

### b) Kỹ năng dùng skill — graphify, skill files, mermaid

**Graphify là gì (nói thẳng):** skill biến code/mô tả thành **sơ đồ trực quan**. Lúc đầu em cũng không thấy nó giúp vibe code vì nó **không viết code thay mình** — giá trị nằm ở bước trước khi code:

1. **Vẽ trước khi code (`mermaid/04-sequence-order.mmd`):** trước khi làm modal + API payment, sinh sequence đặt → giữ chỗ → modal → COD/VietQR → trừ/nhả kho. Diagram thành **checklist**: thiếu nhánh nào biết ngay (nhờ vậy mới phát hiện case đóng modal giữa chừng → thêm banner nhắc + modal xác nhận rời đi).
2. **Khóa thiết kế, chống code trôi:** đổi luồng thì sửa diagram trước, sửa code sau. Quy tắc: **diagram và code không được lệch nhau**.
3. **Giải thích thay vì đọc code chay:** `02-erd.mmd` (`orders` ↔ `order_detail` ↔ `inventory`), `04-sequence` là thứ em mở khi thầy/bạn hỏi.

**File liên quan:** `mermaid/01-use-case.mmd`, `02-erd.mmd`, `03-system-architecture.mmd`, `04-sequence-order.mmd` (chuẩn hóa luồng đặt, giữ chỗ, modal, PayOS), `09-use-case-ban-hang-don-hang.mmd`, `10-erd-don-hang-thanh-toan-ton-kho.mmd`, `11-sequence-xac-thuc-jwt.mmd`, `12-sequence-dat-hang-thanh-toan.mmd`, `13-sequence-quan-ly-don-hang-admin.mmd`, `14-sequence-thong-ke-doanh-thu.mmd`, `docs/Token.md` (luồng JWT em viết tay).

**Skill files (cấu trúc: name, description, khi nào dùng):**
- `explore` — "đọc nhiều file rồi tóm tắt", dùng trước mọi task (ví dụ tìm `boxRef` mất do merge: đọc 2 nhánh git, chỉ đúng đoạn bị xóa).
- `soạn commit` — "commit nhỏ Conventional Commits tiếng Việt", dùng sau mỗi việc (repo ~40 commit `feat(order)/fix(shop)...`).
- Tự đề xuất `commit-linter` — "chặn commit gộp nhiều mảng, message đúng `type(scope): mô tả`". Cả nhóm 1 repo 4 mảng, không có nó thì history rối, không review đúng người đúng việc.

### c) Log, diff và tiêu chí hiệu quả (vai trò leader)

- **Công cụ:** `git log/diff/status`, `git show/blame` (ai sửa dòng nào), `docker logs`, DevTools Network/Console, `lsof -i :8080`, `curl` gọi API trực tiếp.
- **Tiêu chí thành viên hiệu quả theo em:**
  1. Hiểu input → output việc mình làm (hỏi là chỉ được file + dòng).
  2. Commit nhỏ, 1 việc/mảng, message chuẩn — nhìn log biết ai làm gì.
  3. Lỗi kèm bằng chứng (log/message), không "em tưởng".
  4. Không để code hỏng sang người khác: chạy thử trước khi báo xong.
- Không đánh giá bằng số dòng/số commit. Cách em kiểm tra bạn cùng nhóm: đối chiếu yêu cầu → xem log/diff → review code → chạy thử/test → hỏi lại để chắc bạn hiểu.

## 6. Ý 3 — Kết hợp công cụ test tính năng (2 điểm)

Test tay có kịch bản trên Docker dev, đối chiếu DB qua phpMyAdmin. Bảng case phần của em:

| Tình huống | Kết quả mong đợi |
|---|---|
| Đặt hàng đủ tồn | Đơn `CHO_DUYET`, `reserved` tăng, `quantity` giữ nguyên |
| Đặt vượt số bán được | 400 "chỉ còn Y sản phẩm có thể bán", đơn không tạo |
| Trả VietQR/COD trong modal | Vẫn `CHO_DUYET`, ghi nhận phương thức (trừ kho ở Hoàn thành) |
| Đóng modal chưa trả | Toast + banner nhắc + modal xác nhận rời đi |
| Admin duyệt đơn chưa chọn phương thức | 400, dropdown cũng ẩn bước này |
| Hủy đơn chờ / đơn đã trả | Nhả chỗ / cộng trả tồn + note hoàn tiền |
| Hoàn thành 2 lần | Lần 2 báo đơn đã kết thúc, kho chỉ trừ 1 lần |
| Gọi API không token / sai role | 401/403, không chỉ dựa vào ẩn nút |

**JUnit 5 + Mockito (`backend/src/test/java/com/salemanagement/OrderServiceTests.java`):**
- `@ExtendWith(MockitoExtension.class)`: không cần Spring context/DB, mỗi case < 1 giây.
- `@Mock OrderRepository / InventoryRepository / ProductVariantRepository`: giả dependency; `when(...).thenReturn(...)` dựng tồn mẫu (tồn 10 giữ 9 cho case vượt tồn).
- `lenient()` trong `@BeforeEach` cho stub dùng chung (tránh `UnnecessaryStubbing`).
- `assertThatThrownBy(...).isInstanceOf(...).hasMessageContaining(...)`: assert cả loại lỗi lẫn câu tiếng Việt.
- `verify(repo, never()).save(...)`: đơn vượt tồn thì **không ghi DB**; `argThat` kiểm tra `reserved` tăng đúng số.
- Chạy `mvn -Dtest=OrderServiceTests test` (6/6 PASS); full `mvn test` khi MySQL Docker chạy: **22/22 PASS** (`backend/target/surefire-reports/*.txt`). AssertJ đi kèm `spring-boot-starter-test`, không thêm dependency.

**Công cụ phối hợp:** `curl` + DevTools (phân biệt lỗi token vs server), phpMyAdmin (đối chiếu `quantity/reserved`), `@DataJpaTest` có sẵn, `npm run dev` + restart kiểm hồi quy UI.
**Thừa nhận:** test đồng thời thật (2 request cùng lúc) chưa chạy — khóa bi quan mới được lý giải bằng code + test đơn luồng; đây là việc tiếp theo.

## 7. Khó khăn đã gặp và bài học

- Merge mất code (`boxRef`): bài học đọc diff của merge commit, không tin blind.
- Backend chạy bản cũ sau khi sửa Java: luôn restart + kiểm tra log, Vite thì tự reload còn Spring thì không.
- Token chết sau reset DB gây 403 hàng loạt: hiểu vòng đời access/refresh thay vì sửa code lung tung.
- Team đổi logic (VietQR không trừ ngay): test đỏ → đọc code mới → sửa test theo, không cố giữ thiết kế cũ. Bài học: test phải theo code thật, và thay đổi phải báo nhau.

## 8. Dàn ý slide bảo vệ

1. Sản phẩm – mục đích – động lực (mục 1).
2. Kiến trúc + bảng input/output 8 luồng (mục 2).
3. Việc em làm + skill dùng ở đâu + skill tự tạo (mục 3, 5b).
4. Demo sống: đặt hàng → trả QR → admin duyệt → kho trừ (mục 4–6 để trả lời khi hỏi sâu).

*Em chịu trách nhiệm mọi dòng trong báo cáo này; phần kho (nhập/duyệt) của bạn Hoàng Văn Thành — xem `README_4_10(Hoàng Văn Thành).md`. Ranh giới 2 phần: chung bảng `inventory`, chung công thức bán được.*
