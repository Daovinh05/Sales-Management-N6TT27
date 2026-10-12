---
name: "speckit-tasks"
description: "Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts."
argument-hint: "Optional task generation constraints"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/tasks.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi sinh tasks)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_tasks`
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

1. **Thiết lập**: Chạy `.specify/scripts/bash/setup-tasks.sh --json` từ thư mục gốc repo và phân tích FEATURE_DIR, TASKS_TEMPLATE_CONTENT, TASKS_TEMPLATE và danh sách AVAILABLE_DOCS. `FEATURE_DIR` và `TASKS_TEMPLATE` phải là đường dẫn tuyệt đối khi được cung cấp. `AVAILABLE_DOCS` là danh sách tên/đường dẫn tương đối của tài liệu có dưới `FEATURE_DIR` (ví dụ `research.md` hay `contracts/`). Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

2. **Nạp tài liệu thiết kế**: Đọc từ FEATURE_DIR:
   - **Bắt buộc**: plan.md (tech stack, thư viện, cấu trúc), spec.md (câu chuyện người dùng kèm ưu tiên)
   - **Tùy chọn**: data-model.md (thực thể), contracts/ (contract giao diện), research.md (quyết định), quickstart.md (kịch bản kiểm thử)
   - **NẾU CÓ**: Nạp `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án
   - Lưu ý: Không phải dự án nào cũng có đủ tài liệu. Sinh task dựa trên cái hiện có.

3. **Chạy quy trình sinh task**:
   - Nạp plan.md và trích tech stack, thư viện, cấu trúc dự án
   - Nạp spec.md và trích câu chuyện người dùng kèm ưu tiên (P1, P2, P3, v.v.)
   - Nếu có data-model.md: Trích thực thể và ánh xạ vào câu chuyện người dùng
   - Nếu có contracts/: Ánh xạ contract giao diện vào câu chuyện người dùng
   - Nếu có research.md: Trích quyết định cho task thiết lập
   - Sinh task tổ chức theo câu chuyện người dùng (xem Quy tắc sinh task dưới đây)
   - Sinh đồ thị phụ thuộc thể hiện thứ tự xong các câu chuyện người dùng
   - Tạo ví dụ chạy song song cho mỗi câu chuyện người dùng
   - Kiểm tra đủ task (mỗi câu chuyện có đủ task cần thiết, kiểm thử độc lập được)

4. **Sinh tasks.md**: Dùng TASKS_TEMPLATE_CONTENT (từ đầu ra JSON trên) làm cấu trúc. Để tương thích script setup cũ thiếu TASKS_TEMPLATE_CONTENT, đọc TASKS_TEMPLATE thay thế. Điền:
   - Tên tính năng đúng từ plan.md
   - Pha 1: Task thiết lập (khởi tạo dự án)
   - Pha 2: Task nền tảng (điều kiện chặn trước mọi câu chuyện người dùng)
   - Pha 3+: Mỗi câu chuyện người dùng một pha (theo thứ tự ưu tiên từ spec.md)
   - Mỗi pha gồm: mục tiêu câu chuyện, tiêu chí test độc lập, test (nếu được yêu cầu), task triển khai
   - Pha cuối: Trau chuốt & vấn đề xuyên suốt
   - Mọi task phải theo định dạng checklist nghiêm ngặt (xem Quy tắc sinh task dưới đây)
   - Đường dẫn file rõ cho mỗi task
   - Mục phụ thuộc thể hiện thứ tự xong câu chuyện
   - Ví dụ chạy song song cho mỗi câu chuyện
   - Mục chiến lược triển khai (MVP trước, bàn giao tăng dần)

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn tất mục này trước khi báo hoàn tất cho người dùng.**

Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_tasks`, bỏ qua tới Báo cáo hoàn tất.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_tasks`.
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

Xuất đường dẫn tới tasks.md đã sinh và tóm tắt:
- Tổng số task
- Số task cho mỗi câu chuyện người dùng
- Cơ hội chạy song song đã nhận diện
- Tiêu chí test độc lập cho mỗi câu chuyện
- Phạm vi MVP gợi ý (thường chỉ Câu chuyện người dùng 1)
- Kiểm tra định dạng: Xác nhận MỌI task theo định dạng checklist (checkbox, ID, nhãn, đường dẫn file)

Ngữ cảnh để sinh task: $ARGUMENTS

Tasks.md phải chạy được ngay - mỗi task phải cụ thể tới mức LLM hoàn tất được mà không cần thêm ngữ cảnh.

## Quy tắc sinh task

**TRỌNG YẾU**: Task PHẢI tổ chức theo câu chuyện người dùng để triển khai và kiểm thử độc lập được.

**Test là TÙY CHỌN**: Chỉ sinh task kiểm thử khi đặc tả tính năng yêu cầu tường minh hoặc người dùng yêu cầu cách làm TDD.

### Định dạng checklist (BẮT BUỘC)

Mọi task PHẢI tuân thủ nghiêm định dạng sau:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Thành phần định dạng**:

1. **Checkbox**: LUÔN bắt đầu bằng `- [ ]` (checkbox markdown)
2. **ID task**: Số thứ tự (T001, T002, T003...) theo thứ tự chạy
3. **Dấu [P]**: Chỉ gồm khi task chạy song song được (file khác nhau, không phụ thuộc task chưa xong)
4. **Nhãn [Story]**: BẮT BUỘC chỉ cho task ở pha câu chuyện người dùng
   - Định dạng: [US1], [US2], [US3], v.v. (ánh xạ tới câu chuyện người dùng từ spec.md)
   - Pha thiết lập: KHÔNG nhãn story
   - Pha nền tảng: KHÔNG nhãn story
   - Pha câu chuyện người dùng: PHẢI có nhãn story
   - Pha trau chuốt: KHÔNG nhãn story
5. **Mô tả**: Hành động rõ kèm đường dẫn file chính xác

**Ví dụ**:

- ✅ ĐÚNG: `- [ ] T001 Create project structure per implementation plan`
- ✅ ĐÚNG: `- [ ] T005 [P] Implement authentication middleware in src/middleware/auth.py`
- ✅ ĐÚNG: `- [ ] T012 [P] [US1] Create User model in src/models/user.py`
- ✅ ĐÚNG: `- [ ] T014 [US1] Implement UserService in src/services/user_service.py`
- ❌ SAI: `- [ ] Create User model` (thiếu ID và nhãn Story)
- ❌ SAI: `T001 [US1] Create model` (thiếu checkbox)
- ❌ SAI: `- [ ] [US1] Create User model` (thiếu ID task)
- ❌ SAI: `- [ ] T001 [US1] Create model` (thiếu đường dẫn file)

### Tổ chức task

1. **Từ câu chuyện người dùng (spec.md)** - TỔ CHỨC CHÍNH:
   - Mỗi câu chuyện (P1, P2, P3...) một pha riêng
   - Ánh xạ mọi component liên quan về câu chuyện của nó:
     - Model cần cho câu chuyện đó
     - Service cần cho câu chuyện đó
     - Giao diện/UI cần cho câu chuyện đó
     - Nếu được yêu cầu test: Test riêng cho câu chuyện đó
   - Đánh dấu phụ thuộc câu chuyện (hầu hết câu chuyện nên độc lập)

2. **Từ contract**:
   - Ánh xạ mỗi contract giao diện → tới câu chuyện người dùng nó phục vụ
   - Nếu được yêu cầu test: Mỗi contract giao diện → task contract test [P] trước triển khai trong pha của câu chuyện đó

3. **Từ mô hình dữ liệu**:
   - Ánh xạ mỗi thực thể tới (các) câu chuyện người dùng cần nó
   - Nếu thực thể phục vụ nhiều câu chuyện: Đặt vào câu chuyện sớm nhất hoặc pha Thiết lập
   - Quan hệ → task tầng service trong pha câu chuyện phù hợp
   - Với mỗi trường có ràng buộc trong data-model.md (độ dài tối đa, nullable/required, giá trị enum, quy tắc kiểm tra), trích nguyên văn ràng buộc vào mô tả task để không phó mặc cho lúc triển khai

4. **Từ thiết lập/hạ tầng**:
   - Hạ tầng dùng chung → pha Thiết lập (Pha 1)
   - Task nền tảng/chặn → pha Nền tảng (Pha 2)
   - Thiết lập riêng cho câu chuyện → nằm trong pha của câu chuyện đó

### Cấu trúc pha

- **Pha 1**: Thiết lập (khởi tạo dự án)
- **Pha 2**: Nền tảng (điều kiện chặn - PHẢI xong trước câu chuyện người dùng)
- **Pha 3+**: Câu chuyện người dùng theo thứ tự ưu tiên (P1, P2, P3...)
  - Trong mỗi câu chuyện: Test (nếu được yêu cầu) → Model → Service → Endpoint → Tích hợp
  - Mỗi pha nên là một bản tăng dần (increment) hoàn chỉnh, kiểm thử độc lập được
- **Pha cuối**: Trau chuốt & vấn đề xuyên suốt

## Điều kiện xong

- [ ] tasks.md đã sinh với đủ pha, ID task và đường dẫn file
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo đúng quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn tất cho người dùng kèm số task, chia theo câu chuyện và phạm vi MVP
