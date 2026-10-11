BÁO CÁO VẬN DỤNG AI AGENT, KỸ NĂNG LÀM CHỦ CODE VÀ KIỂM THỬ PHẦN MỀM
Người thực hiện: Hoàng Văn Thành
Học phần / Lớp: Đồ án Quản lý bán hàng – N6TT27
Dự án: Hệ thống quản lý bán hàng công nghệ TECHZONE

Ý 1. XÂY DỰNG HỆ THỐNG VỚI SỰ TRỢ GIÚP CỦA AI AGENT

1.1. Em đã sử dụng gì để phân tích hệ thống kho hàng trước khi viết code?

Trước khi bắt đầu viết code, em xác định rằng nếu chưa hiểu nghiệp vụ và kiến trúc thì việc sử dụng AI có thể tạo ra nhiều code nhưng không bảo đảm các thành phần hoạt động đúng với nhau.

Vì vậy, em tiếp cận bài toán theo ba hướng: phân tích nghiệp vụ, thiết kế dữ liệu và xác định kiến trúc hệ thống.

**Thứ nhất, em phân tích nghiệp vụ.**

Em chia hệ thống quản lý bán hàng TECHZONE thành các nhóm nghiệp vụ chính như danh mục, sản phẩm, biến thể sản phẩm, kho hàng, giỏ hàng và đơn hàng. Sau đó, em xác định các vai trò sử dụng hệ thống, chẳng hạn ADMIN, nhân viên kho, khách hàng và khách chưa đăng nhập.

Việc phân tích này giúp em trả lời được:

- Ai được phép thực hiện từng thao tác?
- Dữ liệu nào cần được lưu trữ?
- Một chức năng cần đi qua những bước nào?
- Những điều kiện nào phải được bảo đảm trước khi ghi dữ liệu?
- Khi thao tác thất bại thì hệ thống cần xử lý ra sao?

**Thứ hai, em sử dụng Mermaid để mô hình hóa hệ thống.**

Trong dự án, các sơ đồ có thể được tổ chức trong thư mục `mermaid/`, bao gồm:

- `01-use-case.mmd`: Mô tả tác nhân và các chức năng mà mỗi vai trò được phép sử dụng.
- `02-erd.mmd`: Mô tả thực thể và quan hệ dữ liệu.
- `03-system-architecture.mmd`: Mô tả kiến trúc tổng thể.
- `04-sequence-order.mmd`: Mô tả trình tự xử lý khi khách hàng đặt hàng.

Các sơ đồ giúp em nhìn được thành phần nào tham gia vào nghiệp vụ, dữ liệu nào cần lưu và những điều kiện nào cần kiểm soát trước khi cập nhật cơ sở dữ liệu.

**Thứ ba, em phân tích luồng xử lý nghiệp vụ.**

Ví dụ, nếu kho có 10 sản phẩm và đã giữ chỗ 3 sản phẩm cho các đơn hàng, số lượng khả dụng còn 7. Nếu chỉ kiểm tra tồn thực tế mà bỏ qua lượng giữ chỗ, hệ thống có nguy cơ nhận thêm đơn vượt quá số lượng có thể bán.

Qua bước phân tích này, em xác định được những quy tắc cần triển khai, những lớp cần kiểm tra và những trường hợp biên cần kiểm thử trước khi nhờ AI hỗ trợ viết hoặc sửa code.

1.2. Tổ chức kiến trúc và xác định file

Em sử dụng kiến trúc phân tầng để mỗi thành phần có trách nhiệm rõ ràng, dễ tìm, sửa và kiểm thử.

| Thư mục | Trách nhiệm |
| --- | --- |
| entity/ | Các thực thể như Product, ProductVariant, Inventory, Order, OrderDetail. |
| repository/ | Truy vấn và cập nhật dữ liệu bằng Spring Data JPA. |
| dto/request/ | Nhận dữ liệu và khai báo validation. |
| dto/response/ | Định nghĩa dữ liệu trả về frontend. |
| service/, service/impl/ | Khai báo và triển khai nghiệp vụ, điều kiện xử lý và transaction. |
| controller/ | Nhận HTTP request, kiểm tra đầu vào và gọi service. |
| security/, config/ | Thành phần bảo mật và cấu hình dùng chung. |

Ở frontend React, em xác định các phần giao diện, thành phần dùng chung và nơi gọi API theo cấu trúc thực tế của dự án. Em không tạo thư mục chỉ để cho đủ mà phải hiểu trách nhiệm của từng file. Controller nên mỏng; logic nghiệp vụ nằm ở service, còn repository phụ trách truy cập dữ liệu.

1.3. Em nhờ AI viết gì và tự kiểm soát gì?

Em dùng AI Agent như trợ lý lập trình, chia yêu cầu thành nhiệm vụ nhỏ, nêu rõ đầu vào, đầu ra và tiêu chí kiểm tra.

**AI có thể hỗ trợ:**

- Sinh khung DTO, mapper và các đoạn code lặp lại.
- Tạo CRUD mẫu theo kiến trúc đã thống nhất.
- Gợi ý validation, giao diện JSX và định dạng dữ liệu.
- Giải thích code, phân tích log lỗi và đề xuất test case.

**Em phải tự hiểu và kiểm soát:**

- Mô hình dữ liệu và quan hệ giữa các bảng.
- Quy tắc nghiệp vụ, phân quyền và tính toàn vẹn dữ liệu.
- Cách tính giá, tổng tiền và số lượng hàng khả dụng.
- Quy trình giữ chỗ, cập nhật tồn kho và điều kiện xóa dữ liệu.
- Transaction, xử lý đồng thời và tác động của thay đổi.

Ví dụ, backend phải lấy giá sản phẩm từ dữ liệu đáng tin cậy trong cơ sở dữ liệu, không sử dụng giá do frontend tự gửi lên. Nếu AI đề xuất PESSIMISTIC_WRITE, em phải hiểu vị trí khai báo khóa, phạm vi transaction và cách kiểm thử, chứ không chỉ thêm annotation theo gợi ý.

1.4. Kiểm tra code do AI tạo ra

Sau khi nhận code, em:

1. Đối chiếu với yêu cầu nghiệp vụ.
2. Kiểm tra code có đúng tầng và tuân theo cấu trúc dự án không.
3. Đọc và giải thích được điều kiện, truy vấn và xử lý ngoại lệ.
4. Kiểm tra dữ liệu thiếu, sai định dạng và trường hợp biên.
5. Chạy test phù hợp.
6. Dùng Git diff xem chính xác phần thay đổi.
7. Sửa hoặc loại bỏ code không phù hợp.

Code chạy được nhưng sai nghiệp vụ vẫn là code cần sửa. AI giúp tăng tốc, nhưng em chịu trách nhiệm về kết quả cuối cùng.

Ý 2. KỸ NĂNG KIỂM SOÁT CODE (5 ĐIỂM)

2.1. Ý 2a – Biết tính năng ở đâu và sửa như thế nào

Em truy vết theo luồng Frontend → API → Controller → Service → Repository → Cơ sở dữ liệu. Em không chỉ tìm được tên file mà phải hiểu dữ liệu đi qua đâu, quy tắc nghiệp vụ nằm ở đâu và thay đổi có thể ảnh hưởng phần nào.

**Ví dụ: Bắt buộc mật khẩu có ký tự @**

Em tìm luồng đăng ký, DTO nhận request, controller và service. Các file cần kiểm tra trong cấu trúc được mô tả gồm RegisterRequest.java, AuthController.java và AuthServiceImpl.java.

Trong DTO, có thể dùng Bean Validation:

```java
@Pattern(
    regexp = ".*@.*",
    message = "Mật khẩu bắt buộc phải chứa ký tự @"
)
private String password;
```

Controller cần kích hoạt validation bằng @Valid cho request tương ứng. Sau đó kiểm thử:

- abc123: bị từ chối vì thiếu @.
- abc@123: đạt điều kiện có @.
- Mật khẩu rỗng: kiểm tra thêm quy tắc bắt buộc nhập.
- Gửi request trực tiếp đến backend: vẫn phải bị kiểm tra.

Em cần xác nhận validation thực sự được kích hoạt và lỗi được trả về đúng cách; chỉ kiểm tra trên frontend là chưa đủ.

**Ví dụ: Giải thích luồng đăng nhập**

- AuthController.java: nhận request đăng nhập.
- AuthServiceImpl.java: điều phối xác thực và trả kết quả đăng nhập.
- AuthenticationManager: xác thực theo cấu hình Spring Security.
- JwtUtils: hỗ trợ xử lý JWT theo cách triển khai của dự án.
- JwtAuthFilter.java: kiểm tra token trong các request được bảo vệ.
- SecurityConfig.java: cấu hình bảo mật và quyền truy cập.

Đăng nhập là bước xác minh thông tin để cấp token; filter xử lý token ở những request tiếp theo. Khi sửa code, em phải kiểm tra đúng luồng thực tế trong repository.

**Ví dụ: Kiểm soát nghiệp vụ đặt hàng**

Trong OrderServiceImpl.java, em cần xác định vị trí lấy giá, kiểm tra tồn kho, giữ chỗ và tạo đơn. Em phải trả lời được giá lấy từ đâu, điều kiện nào xác định hàng khả dụng, xử lý thế nào khi hai request đến cùng lúc và dữ liệu có rollback nếu thao tác thất bại hay không.

2.2. Ý 2b – Graphify và công cụ hỗ trợ làm chủ code

Các công cụ phân tích quan hệ mã nguồn như Graphify/Dependency Mapping giúp hình dung file phụ thuộc vào nhau, nơi gọi một phương thức, phạm vi ảnh hưởng của thay đổi và dấu hiệu phụ thuộc vòng. Chúng cũng hỗ trợ phát hiện nguy cơ vi phạm kiến trúc, ví dụ controller gọi trực tiếp repository trong khi dự án quy định phải qua service.

Em dùng Mermaid để mô tả trình tự xử lý đặt hàng, từ kiểm tra dữ liệu và tồn kho đến giữ chỗ, tạo đơn. Sơ đồ giúp nhận ra bước có thể bị thiếu trước khi code hoặc trong lúc review.

Các công cụ IDE cũng hữu ích:

- Go to Definition: Đi đến nơi khai báo.
- Find Usages: Tìm nơi sử dụng.
- Call Hierarchy: Xem quan hệ gọi hàm.
- Search Everywhere: Tìm file, lớp, phương thức hoặc chuỗi.

Khi dùng AI, em cung cấp ngữ cảnh và quy tắc dự án như cấu trúc thư mục, quy ước đặt tên, cách xử lý lỗi, thông báo tiếng Việt và quy tắc nghiệp vụ. Công cụ chỉ hỗ trợ định hướng; em vẫn phải xác nhận bằng cách đọc code và kiểm thử. Chỉ ghi đã dùng Graphify hoặc skill cụ thể nếu thực tế đã sử dụng.

2.3. Ý 2c – Git log, diff và đánh giá hiệu quả thành viên

Git giúp theo dõi lịch sử và kiểm tra thay đổi, nhưng không tự kết luận thành viên làm việc tốt hay không.

| Lệnh | Ý nghĩa |
| --- | --- |
| git status | Kiểm tra trạng thái file. |
| git log --oneline | Xem nhanh lịch sử commit. |
| git diff | Xem thay đổi chưa staging. |
| git diff --staged | Xem thay đổi đã staging. |
| git show <commit_id> | Xem chi tiết một commit. |
| git blame <file> | Xem commit gắn với từng dòng. |

Ví dụ, khi thành viên báo hoàn thành tìm kiếm phiếu nhập, em tìm commit bằng git log, xem nội dung bằng git show, đọc diff, đối chiếu yêu cầu, kiểm tra API và chạy test. Nếu giao diện có ô tìm kiếm nhưng backend không xử lý tham số thì tính năng chưa hoàn chỉnh.

Nếu là leader, em đánh giá dựa trên:

1. Hoàn thành yêu cầu: Đúng phạm vi, đúng nghiệp vụ và thời hạn.
2. Chất lượng code: Dễ hiểu, đúng kiến trúc, xử lý lỗi và bảo vệ dữ liệu.
3. Làm chủ code: Giải thích được luồng chạy, quyết định kỹ thuật và cách sửa lỗi; hiểu code do AI hỗ trợ.
4. Kiểm thử: Có kiểm tra trường hợp đúng, sai, biên và bằng chứng kết quả.
5. Quản lý thay đổi, phối hợp: Commit rõ ràng, diff dễ review, xử lý conflict cẩn thận và không ghi đè code của người khác.

Em không đánh giá chỉ bằng số dòng code hoặc số commit. Quy trình đánh giá là đối chiếu yêu cầu, xem log/diff, review code, kiểm tra test và trao đổi để xác nhận thành viên hiểu phần mình làm. Git là bằng chứng cần kết hợp với kiểm thử và trao đổi trực tiếp.

Ý 3. KẾT HỢP CÔNG CỤ KIỂM THỬ NÂNG CAO (2 ĐIỂM)

3.1. Công cụ và mục đích

- JUnit/Spring Boot Test: Kiểm tra logic và thành phần backend.
- @DataJpaTest + H2: Kiểm tra repository, ánh xạ và truy vấn trên cơ sở dữ liệu kiểm thử.
- Postman: Gửi request trực tiếp và kiểm tra response của API.
- Log/Debugger: Theo dõi luồng chạy và tìm nguyên nhân lỗi.
- Công cụ quản lý CSDL: Đối chiếu dữ liệu sau thao tác.
- npm run build: Kiểm tra frontend có đóng gói được hay không.
- ./mvnw test: Chạy bộ test backend.
- Docker Compose: Kiểm tra cấu hình và khả năng phối hợp các dịch vụ.

Mỗi công cụ có phạm vi riêng. Test H2 không bảo đảm mọi hành vi giống MySQL, nhất là khác biệt về khóa, transaction và đặc điểm riêng của hệ quản trị; các trường hợp đó cần kiểm tra thêm trong môi trường phù hợp.

3.2. Các tình huống kiểm thử nghiệp vụ

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Đặt hàng hợp lệ | Tạo đơn và cập nhật dữ liệu đúng quy tắc. |
| Đặt số lượng vượt tồn khả dụng | Từ chối đặt hàng. |
| Nhiều request đặt cùng lúc | Không giữ chỗ vượt số lượng khả dụng. |
| Biến thể chưa có giá | Xử lý theo quy tắc, không phát sinh lỗi ngoài dự kiến. |
| Xóa biến thể còn liên kết lịch sử | Bảo vệ tính toàn vẹn dữ liệu. |
| Người không đủ quyền gọi API ghi dữ liệu | Backend từ chối. |
| Duyệt lại phiếu đã duyệt | Không cộng tồn kho lần thứ hai. |
| Client gửi giá giả mạo | Backend dùng giá hợp lệ từ dữ liệu server. |

Ví dụ, nếu giá trong cơ sở dữ liệu là 15.000.000 đồng nhưng client gửi unitPrice = 100, em dùng Postman gửi request và kiểm tra backend lấy giá từ dữ liệu đáng tin cậy. Nếu đặt hai sản phẩm cùng giá, tổng mong đợi là 30.000.000 đồng, chưa tính giảm giá hoặc phí khác nếu có.

Với kiểm thử đồng thời, em gửi các request phù hợp và đối chiếu số lượng ban đầu với dữ liệu sau xử lý. Với phân quyền, em gọi trực tiếp API để xác nhận backend từ chối, không chỉ kiểm tra nút giao diện đã bị ẩn.

3.3. Quy trình tìm lỗi và xác nhận kết quả

Nếu API báo thành công nhưng tồn kho không thay đổi đúng, em:

1. Dùng Postman kiểm tra request và response.
2. Xem log/debugger để theo dõi controller và service.
3. Kiểm tra unit test của logic cập nhật.
4. Kiểm tra integration test giữa service, repository và cơ sở dữ liệu.
5. Đối chiếu trạng thái phiếu và số lượng tồn thực tế.
6. Dùng Git diff xem thay đổi gần nhất có thể gây lỗi không.
7. Sửa lỗi và chạy lại các test liên quan.

npm run build xác nhận frontend đóng gói được theo cấu hình hiện tại, nhưng không chứng minh mọi chức năng đều đúng. ./mvnw test chạy các test đã cấu hình; em phải đọc báo cáo để xác định test pass, fail hoặc bị bỏ qua. Docker Compose giúp kiểm tra các dịch vụ chạy cùng nhau trong môi trường tích hợp.

Kết quả test phải dựa trên lần chạy thực tế. Các bảng trên là kết quả mong đợi của test case, không tự động có nghĩa mọi test đã PASS.

KẾT LUẬN

Qua ba nội dung, em hiểu rằng phát triển phần mềm không chỉ là viết chức năng mà còn phải phân tích, thiết kế, kiểm soát và xác minh chất lượng.

- Với AI Agent, em phải cung cấp ngữ cảnh, chia nhỏ yêu cầu, kiểm tra code được hỗ trợ và chịu trách nhiệm về kết quả.
- Với làm chủ code, em phải truy vết được tính năng, dùng công cụ phân tích quan hệ, hiểu Git log/diff và đánh giá thay đổi dựa trên chất lượng code, test và khả năng giải thích.
- Với kiểm thử, em cần kết hợp unit test, integration test, API test, kiểm tra dữ liệu, log/debugger và build để tìm lỗi nghiệp vụ, phân quyền, dữ liệu và xử lý đồng thời.

Điều quan trọng nhất là em phải giải thích được code mình sử dụng, biết vì sao cần sửa, xác định đúng vị trí sửa, chứng minh kết quả bằng kiểm thử và chịu trách nhiệm về chất lượng thay đổi.