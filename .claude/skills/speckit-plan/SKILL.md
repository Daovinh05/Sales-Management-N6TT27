---
name: "speckit-plan"
description: "Execute the implementation planning workflow using the plan template to generate design artifacts."
argument-hint: "Optional guidance for the planning phase"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/plan.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi lập kế hoạch (plan))**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_plan`
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

1. **Thiết lập**: Chạy `.specify/scripts/bash/setup-plan.sh --json` từ thư mục gốc repo và phân tích JSON để lấy FEATURE_SPEC, IMPL_PLAN, FEATURE_DIR, BRANCH. Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

2. **Nạp ngữ cảnh**: Đọc FEATURE_SPEC và `.specify/memory/constitution.md`. Nạp mẫu IMPL_PLAN (đã được chép sẵn).

3. **Chạy quy trình plan**: Bám cấu trúc trong mẫu IMPL_PLAN để:
   - Điền Ngữ cảnh kỹ thuật (đánh dấu chỗ chưa biết là "NEEDS CLARIFICATION")
   - Điền mục Kiểm tra Constitution từ constitution
   - Đánh giá cổng (ERROR nếu vi phạm không có lý do chính đáng)
   - Pha 0: Sinh research.md (giải quyết mọi NEEDS CLARIFICATION)
   - Pha 1: Sinh data-model.md, contracts/, quickstart.md
   - Đánh giá lại Kiểm tra Constitution sau thiết kế

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn tất mục này trước khi báo hoàn tất cho người dùng.**

Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_plan`, bỏ qua tới Báo cáo hoàn tất.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_plan`.
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

Lệnh kết thúc sau thiết kế Pha 1. Báo nhánh, đường dẫn IMPL_PLAN và các tài liệu đã sinh.

## Các pha

### Pha 0: Dàn ý & nghiên cứu

1. **Trích chỗ chưa biết từ Ngữ cảnh kỹ thuật** ở trên:
   - Mỗi NEEDS CLARIFICATION → một task nghiên cứu
   - Mỗi phụ thuộc → một task thực hành tốt nhất
   - Mỗi tích hợp → một task mẫu

2. **Sinh và điều phối agent nghiên cứu**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Gom phát hiện** vào `research.md` theo định dạng:
   - Quyết định: [đã chọn gì]
   - Lý do: [vì sao chọn]
   - Phương án đã cân nhắc: [cái khác đã đánh giá]

**Đầu ra**: research.md đã giải quyết mọi NEEDS CLARIFICATION

### Pha 1: Thiết kế & hợp đồng (contracts)

**Điều kiện tiên quyết:** `research.md` đã xong

1. **Trích thực thể từ spec tính năng** → `data-model.md`:
   - Tên thực thể, trường, quan hệ
   - Quy tắc kiểm tra từ yêu cầu
   - Chuyển trạng thái nếu có

2. **Định nghĩa contract giao diện** (nếu dự án có giao diện ngoài) → `/contracts/`:
   - Xác định dự án phơi giao diện gì cho người dùng hay hệ thống khác
   - Ghi định dạng contract phù hợp loại dự án
   - Ví dụ: API công khai cho thư viện, schema lệnh cho công cụ CLI, endpoint cho dịch vụ web, văn phạm cho parser, contract UI cho ứng dụng
   - Bỏ qua nếu dự án thuần nội bộ (script build, công cụ một lần, v.v.)

3. **Tạo hướng dẫn kiểm tra quickstart** → `quickstart.md`:
   - Ghi các kịch bản kiểm chứng chạy được để chứng minh tính năng chạy end-to-end
   - Gồm điều kiện tiên quyết, lệnh thiết lập, lệnh test/chạy và kết quả mong đợi
   - Dùng liên kết hoặc tham chiếu tới contract và mô hình dữ liệu thay vì chép lại
   - Không đưa code triển khai đầy đủ, thân model/service/controller, migration hay bộ test hoàn chỉnh
   - Giữ tài liệu này như hướng dẫn chạy/kiểm chứng; chi tiết triển khai thuộc về `tasks.md` và pha triển khai

**Đầu ra**: data-model.md, /contracts/*, quickstart.md

## Quy tắc chính

- Dùng đường dẫn tuyệt đối cho thao tác file; dùng đường dẫn tương đối theo dự án cho tham chiếu trong tài liệu
- ERROR khi lỗi cổng hay còn điểm làm rõ chưa giải quyết

## Điều kiện xong

- [ ] Quy trình plan đã chạy và tài liệu thiết kế đã được sinh
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo đúng quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn tất cho người dùng kèm nhánh, đường dẫn plan và tài liệu đã sinh
