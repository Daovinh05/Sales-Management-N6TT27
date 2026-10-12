---
name: "speckit-implement"
description: "Execute the implementation plan by processing and executing all tasks defined in tasks.md"
argument-hint: "Optional implementation guidance or task filter"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/implement.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi triển khai)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_implement`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
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
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Dàn ý

1. Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` từ thư mục gốc repo và phân tích danh sách FEATURE_DIR và AVAILABLE_DOCS. Mọi đường dẫn phải là tuyệt đối. Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

2. **Kiểm tra trạng thái checklist** (nếu FEATURE_DIR/checklists/ tồn tại):
   - Coi dấu checklist như cổng chỉ đọc: quét trạng thái checkbox, báo trạng thái, và hỏi trước khi tiếp tục khi cần; KHÔNG sửa file hay dấu checklist
   - `checklists/requirements.md` là checklist chất lượng spec tích hợp do `/speckit-specify` và `/speckit-clarify` duy trì; checklist tùy chỉnh do `/speckit-checklist` sinh ra là tài liệu đánh giá chất lượng yêu cầu thuộc về người đánh giá
   - Với checklist tùy chỉnh, `[x]` nghĩa là người đánh giá xác định tiêu chí chất lượng yêu cầu đã đạt; nó KHÔNG có nghĩa công việc triển khai đã xong
   - Quét mọi file checklist trong thư mục checklists/
   - Với mỗi checklist, đếm:
     - Tổng mục: Mọi dòng khớp `- [ ]` hoặc `- [X]` hoặc `- [x]`
     - Mục đã tích: Dòng khớp `- [X]` hoặc `- [x]`
     - Mục chưa tích: Dòng khớp `- [ ]`
   - Lập bảng trạng thái:

     ```text
     | Checklist | Total | Checked | Unchecked | Status |
     |-----------|-------|---------|-----------|--------|
     | ux.md     | 12    | 12      | 0         | ✓ PASS |
     | test.md   | 8     | 5       | 3         | ✗ FAIL |
     | security.md | 6   | 6       | 0         | ✓ PASS |
     ```

   - Tính trạng thái chung:
     - **PASS**: Mọi checklist đều có 0 mục chưa tích
     - **FAIL**: Một hoặc nhiều checklist còn mục chưa tích

   - **Nếu checklist nào còn mục chưa tích**:
     - Hiện bảng kèm số mục chưa tích
     - **DỪNG** và hỏi: "Một số checklist còn mục chưa tích. Bạn có muốn cứ triển khai tiếp không? (yes/no)"
     - Chờ người dùng trả lời mới tiếp tục
     - Nếu người dùng nói "no" hay "wait" hay "stop", dừng thực thi
     - Nếu người dùng nói "yes" hay "proceed" hay "continue", sang bước 3

   - **Nếu mọi checklist đã tích đủ**:
     - Hiện bảng tất cả checklist đã đạt
     - Tự động sang bước 3

3. Nạp và phân tích ngữ cảnh triển khai:
   - **BẮT BUỘC**: Đọc tasks.md để lấy danh sách việc và kế hoạch thực thi đầy đủ
   - **BẮT BUỘC**: Đọc plan.md để lấy tech stack, kiến trúc và cấu trúc file
   - **NẾU CÓ**: Đọc data-model.md để lấy thực thể và quan hệ
   - **NẾU CÓ**: Đọc contracts/ để lấy đặc tả API và yêu cầu kiểm thử
   - **NẾU CÓ**: Đọc research.md để lấy quyết định kỹ thuật và ràng buộc
   - **NẾU CÓ**: Đọc .specify/memory/constitution.md để lấy ràng buộc quản trị
   - **NẾU CÓ**: Đọc quickstart.md để lấy kịch bản tích hợp

4. **Kiểm tra thiết lập dự án**:
   - **BẮT BUỘC**: Tạo/kiểm tra file ignore theo thiết lập dự án thực tế:

   **Logic phát hiện & tạo**:
   - Kiểm tra lệnh sau chạy thành công để biết repo có phải git không (nếu phải thì tạo/kiểm tra .gitignore):

     ```sh
     git rev-parse --git-dir 2>/dev/null
     ```

   - Kiểm tra có Dockerfile* hay Docker trong plan.md không → tạo/kiểm tra .dockerignore
   - Kiểm tra có .eslintrc* không → tạo/kiểm tra .eslintignore
   - Kiểm tra có eslint.config.* không → đảm bảo mục `ignores` của config bao đủ mẫu bắt buộc
   - Kiểm tra có .prettierrc* không → tạo/kiểm tra .prettierignore
   - Kiểm tra có .npmrc hay package.json không → tạo/kiểm tra .npmignore (nếu phát hành gói)
   - Kiểm tra file terraform (*.tf) có không → tạo/kiểm tra .terraformignore
   - Kiểm tra có cần .helmignore không (có helm chart) → tạo/kiểm tra .helmignore

   **Nếu file ignore đã tồn tại**: Kiểm tra nó đã chứa mẫu thiết yếu chưa, chỉ nối thêm mẫu trọng yếu còn thiếu
   **Nếu file ignore chưa có**: Tạo với bộ mẫu đầy đủ cho công nghệ đã phát hiện

   **Mẫu chung theo công nghệ** (từ tech stack trong plan.md):
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
   - **Chung**: `.DS_Store`, `Thumbs.db`, `*.tmp`, `*.swp`, `.vscode/`, `.idea/`

   **Mẫu theo công cụ**:
   - **Docker**: `node_modules/`, `.git/`, `Dockerfile*`, `.dockerignore`, `*.log*`, `.env*`, `coverage/`
   - **ESLint**: `node_modules/`, `dist/`, `build/`, `coverage/`, `*.min.js`
   - **Prettier**: `node_modules/`, `dist/`, `build/`, `coverage/`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
   - **Terraform**: `.terraform/`, `*.tfstate*`, `*.tfvars`, `.terraform.lock.hcl`
   - **Kubernetes/k8s**: `*.secret.yaml`, `secrets/`, `.kube/`, `kubeconfig*`, `*.key`, `*.crt`

5. Phân tích cấu trúc tasks.md và trích:
   - **Giai đoạn task**: Thiết lập, Kiểm thử, Lõi, Tích hợp, Trau chuốt
   - **Phụ thuộc task**: Quy tắc chạy tuần tự vs song song
   - **Chi tiết task**: ID, mô tả, đường dẫn file, dấu song song [P]
   - **Luồng thực thi**: Thứ tự và yêu cầu phụ thuộc

6. Triển khai theo kế hoạch task:
   - **Chạy từng giai đoạn**: Xong giai đoạn này mới sang giai đoạn tiếp theo
   - **Tôn trọng phụ thuộc**: Task tuần tự chạy theo thứ tự, task song song [P] có thể chạy cùng nhau
   - **Theo TDD**: Chạy task kiểm thử trước task triển khai tương ứng
   - **Phối hợp qua file**: Task chạm cùng file phải chạy tuần tự
   - **Điểm kiểm tra**: Xác nhận xong mỗi giai đoạn mới tiếp tục

7. Quy tắc chạy triển khai:
   - **Thiết lập trước**: Khởi tạo cấu trúc dự án, phụ thuộc, cấu hình
   - **Test trước code**: Nếu cần viết test cho contract, thực thể và kịch bản tích hợp
   - **Phát triển lõi**: Triển khai model, service, lệnh CLI, endpoint
   - **Việc tích hợp**: Kết nối CSDL, middleware, logging, dịch vụ ngoài
   - **Trau chuốt và kiểm tra**: Unit test, tối ưu hiệu năng, tài liệu

8. Theo dõi tiến độ và xử lý lỗi:
   - Báo tiến độ sau mỗi task xong
   - Dừng thực thi nếu task không song song nào lỗi
   - Với task song song [P], tiếp tục các task thành công, báo task lỗi
   - Đưa thông báo lỗi rõ ràng kèm ngữ cảnh để gỡ lỗi
   - Gợi ý bước tiếp theo nếu không triển khai tiếp được
   - **QUAN TRỌNG** Với task đã xong, nhớ đánh dấu [X] trong file tasks.

9. Kiểm tra hoàn tất:
   - Xác nhận mọi task bắt buộc đã xong
   - Kiểm tra tính năng đã triển khai khớp đặc tả gốc
   - Kiểm tra test đã qua và bao phủ đạt yêu cầu
   - Xác nhận bản triển khai bám theo plan kỹ thuật

Lưu ý: Lệnh này giả định bảng chia việc đầy đủ đã có trong tasks.md. Nếu tasks thiếu hoặc chưa đủ, gợi ý chạy `/speckit-tasks` trước để sinh lại danh sách việc.

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn tất mục này trước khi báo hoàn tất cho người dùng.**

Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_implement`, bỏ qua tới Báo cáo hoàn tất.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_implement`.
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục tới Báo cáo hoàn tất.
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook bắt buộc** (`optional: false`) — **Bạn PHẢI xuất `EXECUTE_COMMAND:` cho mỗi hook bắt buộc**:
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
  - **Hook tùy chọn** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

## Báo cáo hoàn tất

Báo trạng thái cuối kèm tóm tắt việc đã xong.

## Điều kiện xong

- [ ] Mọi task trong tasks.md đã xong và đánh dấu `[X]`
- [ ] Bản triển khai đã kiểm chứng theo đặc tả, plan và bao phủ kiểm thử
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo đúng quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn tất cho người dùng kèm tóm tắt việc đã xong
