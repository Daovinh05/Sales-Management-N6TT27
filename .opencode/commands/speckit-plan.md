---
description: Execute the implementation planning workflow using the plan template to generate design artifacts.
handoffs:
  - label: Create Tasks
    agent: speckit.tasks
    prompt: Break the plan into tasks
    send: true
  - label: Create Checklist
    agent: speckit.checklist
    prompt: Create a checklist for the following domain...
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi lập kế hoạch - plan)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_plan`
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

1. **Thiết lập**: Chạy `.specify/scripts/bash/setup-plan.sh --json` từ thư mục gốc repo và phân tích JSON để lấy FEATURE_SPEC, IMPL_PLAN, FEATURE_DIR, BRANCH. Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

2. **Nạp ngữ cảnh**: Đọc FEATURE_SPEC và `.specify/memory/constitution.md`. Nạp mẫu IMPL_PLAN (đã được sao chép).

3. **Chạy quy trình plan**: Làm theo cấu trúc trong mẫu IMPL_PLAN để:
   - Điền Ngữ cảnh kỹ thuật (đánh dấu điểm chưa rõ là "NEEDS CLARIFICATION")
   - Điền mục Kiểm tra Constitution từ constitution
   - Đánh giá cổng (ERROR nếu vi phạm không có lý do chính đáng)
   - Giai đoạn 0: Sinh research.md (giải quyết mọi NEEDS CLARIFICATION)
   - Giai đoạn 1: Sinh data-model.md, contracts/, quickstart.md
   - Đánh giá lại Kiểm tra Constitution sau thiết kế

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn thành mục này trước khi báo hoàn thành cho người dùng.**

Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_plan`, bỏ qua tới Báo cáo hoàn thành.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_plan`.
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

Lệnh kết thúc sau thiết kế Giai đoạn 1. Báo cáo nhánh, đường dẫn IMPL_PLAN và các tài liệu đã sinh.

## Các giai đoạn

### Giai đoạn 0: Dàn ý & Nghiên cứu

1. **Trích xuất điểm chưa rõ từ Ngữ cảnh kỹ thuật** ở trên:
   - Mỗi NEEDS CLARIFICATION → task nghiên cứu
   - Mỗi phụ thuộc → task thực hành tốt nhất
   - Mỗi tích hợp → task mẫu hình

2. **Sinh và điều phối agent nghiên cứu**:

   ```text
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Tổng hợp phát hiện** trong `research.md` theo định dạng:
   - Quyết định: [đã chọn gì]
   - Lý do: [vì sao chọn]
   - Phương án đã cân nhắc: [những gì khác đã đánh giá]

**Đầu ra**: research.md với mọi NEEDS CLARIFICATION đã giải quyết

### Giai đoạn 1: Thiết kế & Contract

**Điều kiện tiên quyết:** `research.md` đã xong

1. **Trích xuất thực thể từ spec tính năng** → `data-model.md`:
   - Tên thực thể, trường, quan hệ
   - Quy tắc kiểm chứng từ yêu cầu
   - Chuyển trạng thái nếu có

2. **Định nghĩa contract giao diện** (nếu dự án có giao diện ngoài) → `/contracts/`:
   - Xác định giao diện mà dự án phơi ra cho người dùng hay hệ thống khác
   - Tài liệu hóa định dạng contract phù hợp loại dự án
   - Ví dụ: API công khai cho thư viện, lược đồ lệnh cho công cụ CLI, endpoint cho dịch vụ web, văn phạm cho trình phân tích, contract UI cho ứng dụng
   - Bỏ qua nếu dự án hoàn toàn nội bộ (script build, công cụ một lần, v.v.)

3. **Tạo hướng dẫn kiểm chứng quickstart** → `quickstart.md`:
   - Tài liệu hóa kịch bản kiểm chứng chạy được để chứng minh tính năng hoạt động end-to-end
   - Gồm điều kiện tiên quyết, lệnh thiết lập, lệnh test/chạy và kết quả mong đợi
   - Dùng liên kết hoặc tham chiếu tới contract và mô hình dữ liệu thay vì lặp lại
   - Không đưa code triển khai đầy đủ, thân model/service/controller, migration hay bộ test hoàn chỉnh
   - Giữ tài liệu này như hướng dẫn chạy/kiểm chứng; chi tiết triển khai thuộc về `tasks.md` và giai đoạn triển khai

**Đầu ra**: data-model.md, /contracts/*, quickstart.md

## Quy tắc chính

- Dùng đường dẫn tuyệt đối cho thao tác file; dùng đường dẫn tương đối theo dự án cho tham chiếu trong tài liệu
- ERROR khi trượt cổng hay còn làm rõ chưa giải quyết

## Điều kiện xong

- [ ] Quy trình plan đã chạy và tài liệu thiết kế đã sinh
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn thành cho người dùng kèm nhánh, đường dẫn plan và tài liệu đã sinh
