---
description: Execute the implementation plan by processing and executing all tasks defined in tasks.md
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi triển khai)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_implement`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: hãy báo cho người dùng rằng không đọc được file `.specify/extensions.yml` (kèm lỗi phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã khai báo ở đó, sau đó tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Các hook không có trường `enabled` được coi là đang bật theo mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc giá trị null/rỗng, coi hook đó là có thể thực thi được
  - Nếu hook có định nghĩa `condition` không rỗng, hãy bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook tùy chọn** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Hook bắt buộc** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Outline.
    ```
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.
- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Dàn ý

1. Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` từ thư mục gốc repo và phân tích danh sách FEATURE_DIR và AVAILABLE_DOCS. Mọi đường dẫn phải là tuyệt đối. Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

2. **Kiểm tra trạng thái checklist** (nếu tồn tại `FEATURE_DIR/checklists/`):
   - Coi dấu checklist như cổng chỉ đọc: quét trạng thái checkbox, báo cáo trạng thái, và hỏi trước khi tiếp tục khi cần; KHÔNG sửa file hay dấu checklist
   - `checklists/requirements.md` là checklist chất lượng spec tích hợp sẵn do `/speckit.specify` và `/speckit.clarify` duy trì; các checklist tùy chỉnh do `/speckit.checklist` sinh ra là tài liệu rà soát chất lượng yêu cầu thuộc về người rà soát
   - Với checklist tùy chỉnh, `[x]` nghĩa là người rà soát xác định tiêu chí chất lượng yêu cầu đã đạt; nó KHÔNG có nghĩa là công việc triển khai đã xong
   - Quét mọi file checklist trong thư mục checklists/
   - Với mỗi checklist, đếm:
     - Tổng số mục: Mọi dòng khớp `- [ ]` hoặc `- [X]` hoặc `- [x]`
     - Mục đã tích: Dòng khớp `- [X]` hoặc `- [x]`
     - Mục chưa tích: Dòng khớp `- [ ]`
   - Tạo bảng trạng thái:

     ```text
     | Checklist | Total | Checked | Unchecked | Status |
     |-----------|-------|---------|-----------|--------|
     | ux.md     | 12    | 12      | 0         | ✓ PASS |
     | test.md   | 8     | 5       | 3         | ✗ FAIL |
     | security.md | 6   | 6       | 0         | ✓ PASS |
     ```

   - Tính trạng thái chung:
     - **PASS (Đạt)**: Mọi checklist đều không còn mục chưa tích
     - **FAIL (Chưa đạt)**: Một hoặc nhiều checklist còn mục chưa tích

   - **Nếu có checklist còn mục chưa tích**:
     - Hiển thị bảng kèm số mục chưa tích
     - **DỪNG** và hỏi: "Một số checklist còn mục chưa tích. Bạn có muốn tiếp tục triển khai không? (yes/no)"
     - Chờ người dùng trả lời trước khi tiếp tục
     - Nếu người dùng nói "no" hay "wait" hay "stop", dừng thực thi
     - Nếu người dùng nói "yes" hay "proceed" hay "continue", tiếp tục sang bước 3

   - **Nếu mọi checklist đã tích đủ**:
     - Hiển thị bảng tất cả checklist đã đạt
     - Tự động tiếp tục sang bước 3

3. Nạp và phân tích ngữ cảnh triển khai:
   - **BẮT BUỘC**: Đọc tasks.md để lấy danh sách task và kế hoạch thực thi đầy đủ
   - **BẮT BUỘC**: Đọc plan.md để lấy công nghệ, kiến trúc và cấu trúc file
   - **NẾU TỒN TẠI**: Đọc data-model.md để lấy thực thể và quan hệ
   - **NẾU TỒN TẠI**: Đọc contracts/ để lấy đặc tả API và yêu cầu kiểm thử
   - **NẾU TỒN TẠI**: Đọc research.md để lấy quyết định kỹ thuật và ràng buộc
   - **NẾU TỒN TẠI**: Đọc .specify/memory/constitution.md để lấy ràng buộc quản trị
   - **NẾU TỒN TẠI**: Đọc quickstart.md để lấy kịch bản tích hợp

4. **Kiểm chứng thiết lập dự án**:
   - **BẮT BUỘC**: Tạo/kiểm tra file bỏ qua (ignore) theo thiết lập dự án thực tế:

   **Logic phát hiện & tạo**:
   - Kiểm tra lệnh sau có thành công không để xác định repo có phải git không (nếu phải thì tạo/kiểm tra .gitignore):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Kiểm tra có file Dockerfile* hay chữ Docker trong plan.md không → tạo/kiểm tra .dockerignore
   - Kiểm tra có .eslintrc* không → tạo/kiểm tra .eslintignore
   - Kiểm tra có eslint.config.* không → đảm bảo mục `ignores` trong config bao phủ mẫu bắt buộc
   - Kiểm tra có .prettierrc* không → tạo/kiểm tra .prettierignore
   - Kiểm tra có .npmrc hay package.json không → tạo/kiểm tra .npmignore (nếu phát hành gói)
   - Kiểm tra có file terraform (*.tf) không → tạo/kiểm tra .terraformignore
   - Kiểm tra có cần .helmignore không (có helm chart) → tạo/kiểm tra .helmignore

   **Nếu file bỏ qua đã tồn tại**: Kiểm tra xem nó đã chứa mẫu cần thiết chưa, chỉ bổ sung mẫu trọng yếu còn thiếu
   **Nếu file bỏ qua chưa có**: Tạo mới với bộ mẫu đầy đủ cho công nghệ đã phát hiện

   **Mẫu chung theo công nghệ** (từ công nghệ trong plan.md):
   - **Node.js/JavaScript/TypeScript**: `node_modules/`, `dist/`, `build/`, `*.log`, `.env*`
   - **Python**: `__pycache__/`, `*.pyc`, `.venv/`, `venv/`, `dist/`, `*.egg-info/`
   - **Java**: `target/`, `*.class`, `*.jar`, `.gradle/`, `build/`
   - **C#/.NET**: `bin/`, `obj/`, `*.user`, `*.suo`, `packages/`
   - **Go**: `*.exe`, `*.test`, `vendor/`, `*.out`
   - **Ruby**: `.bundle/`, `log/`, `tmp/`, `*.gem`, `vendor/bundle/`
   - **PHP**: `vendor/`, `*.log`, `*.cache`, `*.env`
   - **Rust**: `target/`, `debug/`, `release/`, `*.rs.bk`, `*.rlib`, `*.prof*`, `.idea/`, `*.log`, `.env*`
   - **Kotlin**: `build/`, `out/`, `.gradle/`, `.idea/`, `*.class`, `*.jar`, `*.iml`, `*.log`, `.env*`
   - **C++**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.so`, `*.a`, `*.exe`, `*.dll`, `.idea/`, `*.log`, `.env*`
   - **C**: `build/`, `bin/`, `obj/`, `out/`, `*.o`, `*.a`, `*.so`, `*.exe`, `*.dll`, `autom4te.cache/`, `config.status`, `config.log`, `.idea/`, `*.log`, `.env*`
   - **Swift**: `.build/`, `DerivedData/`, `*.swiftpm/`, `Packages/`
   - **R**: `.Rproj.user/`, `.Rhistory`, `.RData`, `.Ruserdata`, `*.Rproj`, `packrat/`, `renv/`
   - **Universal**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Mẫu theo công cụ**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Phân tích cấu trúc tasks.md và trích xuất:
   - **Giai đoạn task**: Thiết lập, Kiểm thử, Lõi, Tích hợp, Đánh bóng
   - **Phụ thuộc task**: Quy tắc chạy tuần tự so với song song
   - **Chi tiết task**: ID, mô tả, đường dẫn file, dấu song song [P]
   - **Luồng thực thi**: Thứ tự và yêu cầu phụ thuộc

6. Triển khai theo kế hoạch task:
   - **Chạy theo từng giai đoạn**: Xong giai đoạn này mới sang giai đoạn tiếp
   - **Tôn trọng phụ thuộc**: Task tuần tự chạy theo thứ tự, task song song [P] có thể chạy cùng nhau
   - **Theo hướng TDD**: Chạy task kiểm thử trước task triển khai tương ứng
   - **Phối hợp qua file**: Các task chạm cùng file phải chạy tuần tự
   - **Điểm kiểm tra**: Xác nhận xong mỗi giai đoạn trước khi tiếp tục

7. Quy tắc chạy triển khai:
   - **Thiết lập trước**: Khởi tạo cấu trúc dự án, phụ thuộc, cấu hình
   - **Viết test trước code**: Nếu cần viết test cho contract, thực thể và kịch bản tích hợp
   - **Phát triển lõi**: Triển khai model, service, lệnh CLI, endpoint
   - **Việc tích hợp**: Kết nối CSDL, middleware, logging, dịch vụ ngoài
   - **Đánh bóng và kiểm định**: Unit test, tối ưu hiệu năng, tài liệu

8. Theo dõi tiến độ và xử lý lỗi:
   - Báo tiến độ sau mỗi task hoàn thành
   - Dừng thực thi nếu task không song song nào thất bại
   - Với task song song [P], tiếp tục các task thành công, báo các task thất bại
   - Đưa thông báo lỗi rõ ràng kèm ngữ cảnh để gỡ lỗi
   - Gợi ý bước tiếp theo nếu không triển khai tiếp được
   - **QUAN TRỌNG** Với task đã xong, nhớ đánh dấu [X] trong file tasks.

9. Kiểm định hoàn thành:
   - Kiểm tra mọi task bắt buộc đã xong
   - Kiểm tra tính năng đã triển khai khớp đặc tả gốc
   - Kiểm định test đã qua và bao phủ đạt yêu cầu
   - Xác nhận bản triển khai bám theo kế hoạch kỹ thuật

Lưu ý: Lệnh này giả định bảng chia task đầy đủ đã có trong tasks.md. Nếu task thiếu hay chưa đủ, hãy gợi ý chạy `/speckit.tasks` trước để sinh lại danh sách task.

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn thành mục này trước khi báo hoàn thành cho người dùng.**

Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_implement`, bỏ qua tới Báo cáo hoàn thành.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_implement`.
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: hãy báo cho người dùng rằng không đọc được file `.specify/extensions.yml` (kèm lỗi phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã khai báo ở đó, sau đó tiếp tục tới Báo cáo hoàn thành.
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Các hook không có trường `enabled` được coi là đang bật theo mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc giá trị null/rỗng, coi hook đó là có thể thực thi được
  - Nếu hook có định nghĩa `condition` không rỗng, hãy bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook bắt buộc** (`optional: false`) — **Bạn PHẢI phát ra `EXECUTE_COMMAND:` cho mỗi hook bắt buộc**:
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.
  - **Hook tùy chọn** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

## Báo cáo hoàn thành

Báo cáo trạng thái cuối cùng kèm tóm tắt công việc đã xong.

## Điều kiện xong

- [ ] Mọi task trong tasks.md đã xong và đánh dấu `[X]`
- [ ] Bản triển khai đã kiểm định theo đặc tả, kế hoạch và bao phủ kiểm thử
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn thành cho người dùng kèm tóm tắt công việc đã xong
