# Hướng dẫn cài đặt và sử dụng Spec Kit

Tài liệu này hướng dẫn cài Spec Kit trên Windows và sử dụng quy trình Spec-Driven Development (SDD) cho dự án Sales Management. Spec Kit giúp chuyển yêu cầu thành đặc tả, kế hoạch, danh sách công việc; sau đó dùng các tài liệu này làm căn cứ triển khai và kiểm tra tính đầy đủ.

## 1. Spec Kit là gì?

Spec Kit gồm hai phần thường được dùng cùng nhau:

- **Specify CLI (`specify`)**: công cụ terminal để khởi tạo/cập nhật cấu hình Spec Kit và các tài nguyên workflow trong một dự án.
- **Skills/commands trong AI agent**: các bước như specify, plan, tasks và implement được gọi trong chat của agent để tạo hoặc thực hiện các tài liệu/code.

Vì vậy, `specify init` là lệnh terminal, còn `/speckit-specify`, `/speckit-plan`... là lệnh/skill gọi trong chat agent. Không nhập các lệnh skill vào PowerShell.

Spec Kit không thay thế Docker. Docker vẫn chạy ứng dụng và các dịch vụ của dự án; Spec Kit và AI agent chạy trên máy phát triển và làm việc với mã nguồn, tài liệu trong repository.

## 2. Cài Spec Kit trên Windows

### Yêu cầu

- Python 3.11 trở lên.
- `uv` để cài Specify CLI.
- Một AI coding agent có tích hợp Spec Kit, chẳng hạn VS Code Copilot, Claude Code hoặc OpenCode.

### Cài `uv`

Mở PowerShell và chạy lệnh cài đặt chính thức sau nếu máy chưa có `uv`:

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

Sau khi cài xong, đóng rồi mở lại PowerShell. Kiểm tra:

```powershell
uv --version
```

### Cài Specify CLI

```powershell
uv tool install specify-cli
```

Kiểm tra CLI:

```powershell
specify version
```

Lệnh này xác nhận lệnh `specify` chạy được và cho biết phiên bản. Có thể kiểm tra cập nhật khả dụng bằng:

```powershell
specify self check
```

Tham khảo cách cài và cập nhật chính thức: [Spec Kit Installation Guide](https://github.github.io/spec-kit/installation.html).

## 3. Trạng thái Spec Kit trong repository này

Repository Sales Management **đã có tài nguyên Spec Kit**, nên không cần chạy `specify init` chỉ để bắt đầu dùng:

- `.specify/`: template, scripts, cấu hình và thông tin tích hợp.
- `.specify/memory/constitution.md`: nguyên tắc phát triển của dự án.
- `.claude/skills/`: các skill Spec Kit cho Claude.
- `.opencode/commands/`: các command Spec Kit cho OpenCode.
- `specs/001-forgot-password/` và `specs/002-payos-vietqr/`: ví dụ tài liệu feature đã có.

Cấu hình hiện tại ghi nhận tích hợp chính là **OpenCode** (phiên bản tài nguyên Spec Kit `1.1.3`); repository cũng có tệp tích hợp Claude. Các tệp tích hợp Copilot chưa được liệt kê trong cấu hình hiện tại. Do đó:

1. Mở agent trong đúng thư mục repository: `D:\Sales-Management-N6TT27`.
2. Kiểm tra danh sách skill/command của agent. Nếu agent nhận diện các skill Spec Kit, gọi theo cú pháp của agent (các ví dụ bên dưới dùng dạng `/speckit-...`).
3. Nếu Copilot không nhận diện các skill đó, điều này có thể do cấu hình trong repository chưa tích hợp Copilot. Đừng chạy `specify init --force` ngay trên thư mục dự án đang có thay đổi. Trước hết kiểm tra `git status`, sao lưu/commit phần đang làm và làm theo hướng dẫn [Spec Kit cho dự án hiện có](https://github.github.io/spec-kit/guides/existing-projects.html) để chọn tích hợp phù hợp.

Các tài liệu hiện có là ví dụ tham khảo. Khi làm feature mới, hãy tạo bộ spec/plan/tasks riêng cho feature đó; không sửa đè các thư mục `001-forgot-password` hoặc `002-payos-vietqr`.

## 4. Quy trình SDD cho một tính năng mới

Với mỗi bước, đọc lại artifact do agent tạo trước khi chuyển bước. Nếu phát hiện yêu cầu sai hoặc thiếu, sửa artifact ở bước phù hợp thay vì để lỗi trôi sang code.

### Bước 1: Xác định nguyên tắc dự án

Constitution chứa các quy tắc dùng chung, chỉ cần tạo/cập nhật khi bắt đầu dự án hoặc khi cần thay đổi nguyên tắc:

```text
/speckit-constitution
```

Repository này đã có constitution. Các điểm quan trọng gồm kiến trúc nhiều tầng ở backend, frontend gọi REST API qua service, ưu tiên test, và artifact/trao đổi với người dùng bằng tiếng Việt. Đọc constitution trước khi yêu cầu sửa nó.

### Bước 2: Viết đặc tả — `/speckit-specify`

Mô tả **người dùng cần gì, vì sao cần, hành vi mong muốn và tiêu chí nghiệm thu**. Chưa áp đặt cách cài đặt hoặc công nghệ ở bước này.

```text
/speckit-specify Là nhân viên kho, tôi muốn lọc danh sách sản phẩm theo trạng thái tồn kho để nhanh chóng tìm sản phẩm sắp hết hàng. Giao diện phải hiển thị trạng thái rõ ràng, bộ lọc có lựa chọn "Tất cả", và kết quả phải phản ánh dữ liệu tồn kho mới nhất. Hãy viết artifact bằng tiếng Việt, nêu rõ trường hợp biên và tiêu chí nghiệm thu.
```

Kết quả thường là thư mục feature trong `specs/`, có `spec.md` mô tả bối cảnh, user story, yêu cầu chức năng và tiêu chí kiểm tra. Xem lại:

- Vai trò/người dùng và mục tiêu có đúng không?
- Luồng chính, lỗi và trường hợp biên đã đủ chưa?
- Tiêu chí có thể kiểm tra được không?
- Có phần nào nằm ngoài phạm vi nhưng agent tự thêm vào không?

### Bước 3: Làm rõ yêu cầu — `/speckit-clarify`

Chạy khi spec có chỗ mơ hồ hoặc có nhiều cách hiểu hợp lý:

```text
/speckit-clarify Tập trung vào cách xác định sản phẩm "sắp hết hàng", xử lý tồn kho bằng 0 và quyền truy cập của nhân viên kho.
```

Trả lời từng câu hỏi dựa trên nghiệp vụ mong muốn. Sau đó xác nhận spec đã được cập nhật đúng với câu trả lời.

### Bước 4: Lập kế hoạch kỹ thuật — `/speckit-plan`

Plan nêu cách triển khai: thành phần bị ảnh hưởng, API/dữ liệu, kiến trúc, kiểm thử và rủi ro. Đây là bước cung cấp chi tiết công nghệ:

```text
/speckit-plan Dùng kiến trúc hiện tại của dự án: React gọi REST qua service, backend Spring Boot theo Controller-Service-Repository và MySQL. Không thêm thư viện nếu chưa cần. Bổ sung kiểm thử service/API và kiểm tra giao diện.
```

Đối chiếu plan với codebase thực tế. Không để plan tạo một kiến trúc song song hoặc vi phạm quy tắc trong constitution.

### Bước 5: Tạo checklist rà soát — `/speckit-checklist`

```text
/speckit-checklist
```

Dùng checklist để rà chất lượng yêu cầu: độ rõ ràng, tính đầy đủ, nhất quán và khả năng kiểm chứng. Checklist không thay thế unit test và không chứng minh rằng code đã hoàn thành.

### Bước 6: Sinh tasks — `/speckit-tasks`

```text
/speckit-tasks
```

Tasks chia plan thành các việc nhỏ, có thứ tự và tiêu chí kiểm tra. Trước khi implement, kiểm tra:

- Task có bao phủ yêu cầu và plan không?
- Việc nào phụ thuộc vào việc nào?
- Có task kiểm thử và xác minh tích hợp không?
- Có task nào quá lớn hoặc mô tả không đo được kết quả không?

### Bước 7: Kiểm tra nhất quán — `/speckit-analyze`

```text
/speckit-analyze
```

Đây là bước phân tích các artifact, giúp tìm xung đột hoặc phần còn thiếu giữa `spec.md`, `plan.md` và `tasks.md`. Nếu có vấn đề, sửa tài liệu gốc rồi chạy analyze lại trước khi code.

### Bước 8: Triển khai — `/speckit-implement`

```text
/speckit-implement
```

Agent thực hiện task theo thứ tự. Với task lớn, có thể yêu cầu làm từng nhóm task/phase để dễ xem diff và kiểm thử. Sau mỗi nhóm:

1. Đọc diff và xác nhận chỉ thay đổi phần liên quan.
2. Kiểm tra lỗi/diagnostic và chạy test phù hợp.
3. Kiểm tra API hoặc giao diện khi cần.
4. Không coi câu trả lời “đã hoàn thành” của agent là bằng chứng thay cho kết quả test.

### Bước 9: Đối chiếu hoàn tất — `/speckit-converge`

```text
/speckit-converge
```

Converge so sánh code hiện có với spec, plan và tasks. Nếu còn thiếu, nó bổ sung task cần làm. Khi đó chạy implement tiếp rồi converge lại đến khi không còn khoảng trống.

### Quy trình rút gọn

Với thay đổi nhỏ, quy trình có thể rút gọn sau khi vẫn xác nhận yêu cầu đủ rõ:

```text
/speckit-specify
/speckit-plan
/speckit-tasks
/speckit-implement
/speckit-converge
```

Với tính năng nghiệp vụ quan trọng hoặc liên quan đến tồn kho, đơn hàng, thanh toán và quyền truy cập, nên dùng đầy đủ bước clarify, checklist và analyze.

## 5. Ví dụ một lượt làm việc trong dự án

Giả sử cần bổ sung chức năng lọc lịch sử đơn hàng theo trạng thái:

1. Gọi `/speckit-specify` và mô tả người dùng, nhu cầu, các trạng thái cần lọc, trạng thái mặc định và tiêu chí nghiệm thu.
2. Xem `spec.md`; xác nhận quyền nào được xem đơn hàng và kết quả khi không có đơn phù hợp.
3. Gọi `/speckit-clarify` nếu chưa rõ trạng thái nào được hiển thị hoặc cách lọc nhiều trạng thái.
4. Gọi `/speckit-plan`; nhắc agent tìm và tuân thủ các component/service/API hiện có, không tự tạo luồng mới nếu có thể dùng lại.
5. Gọi `/speckit-checklist`, `/speckit-tasks`, rồi `/speckit-analyze`.
6. Gọi `/speckit-implement`; kiểm tra diff frontend/backend, quyền truy cập và test.
7. Chạy kiểm tra phù hợp với dự án. Nếu thay đổi giao diện/API đang chạy bằng Docker, build/recreate đúng service và xác nhận luồng hoạt động.
8. Gọi `/speckit-converge`; tiếp tục xử lý task còn thiếu nếu có.

Đặt câu hỏi và yêu cầu agent viết artifact bằng tiếng Việt, theo nguyên tắc trong constitution của dự án.

## 6. Quản lý artifact và Git

- Mỗi feature có thư mục riêng trong `specs/`; giữ `spec.md`, `plan.md`, `tasks.md` cùng các tài liệu liên quan trong thư mục đó.
- Trước khi bắt đầu, kiểm tra feature/spec đã tồn tại chưa để tránh tạo trùng hoặc ghi đè.
- Khi hoàn tất, xem cả thay đổi code lẫn tài liệu bằng `git status` và `git diff`.
- Chỉ đánh dấu task hoàn thành khi đã thực hiện và xác minh theo tiêu chí kiểm tra.
- Không đưa `.env`, mật khẩu, token hoặc dữ liệu nhạy cảm vào spec, plan, log hay commit.

## 7. Xử lý sự cố thường gặp

### PowerShell không nhận lệnh `specify`

Đóng/mở lại terminal sau khi cài `uv`; kiểm tra `uv --version` và `specify version`. Nếu CLI chưa cài, chạy lại `uv tool install specify-cli`.

### AI agent không nhận skill Spec Kit

Kiểm tra agent đang mở đúng thư mục repository và tích hợp của agent. Trong repo này hiện có tài nguyên OpenCode và Claude; nếu dùng Copilot, có thể cần thiết lập tích hợp theo hướng dẫn dự án hiện có. Không khởi tạo đè thư mục repository khi chưa kiểm tra thay đổi và sao lưu.

### Lệnh `/speckit-...` không chạy

Cú pháp hiển thị có thể thay đổi theo agent và chế độ tích hợp. Xem danh sách skill/command của agent hoặc hướng dẫn tích hợp chính thức: [Agent integrations](https://github.github.io/spec-kit/reference/integrations.html). Các skill là lệnh chat của agent, không phải lệnh terminal.

### Đang phát triển lỗi cần sửa gấp

Không phải mọi sửa lỗi nhỏ đều cần chạy toàn bộ chu trình SDD. Tuy nhiên vẫn phải mô tả triệu chứng, tìm nguyên nhân, sửa đúng phạm vi và xác minh lỗi ban đầu đã hết. Với lỗi lớn hoặc có yêu cầu nghiệp vụ mới, ghi nhận yêu cầu/artifact để thay đổi có thể được rà soát và kiểm chứng.

## 8. Tài liệu tham khảo

- [Spec Kit trên GitHub](https://github.com/github/spec-kit)
- [Hướng dẫn cài đặt](https://github.github.io/spec-kit/installation.html)
- [Quickstart SDD](https://github.github.io/spec-kit/quickstart.html)
- [Hướng dẫn cho repository hiện có](https://github.github.io/spec-kit/guides/existing-projects.html)
- [Tài liệu tích hợp agent](https://github.github.io/spec-kit/reference/integrations.html)
