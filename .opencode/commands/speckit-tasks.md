---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
handoffs:
  - label: Analyze For Consistency
    agent: speckit.analyze
    prompt: Run a project analysis for consistency
    send: true
  - label: Implement Project
    agent: speckit.implement
    prompt: Start the implementation in phases
    send: true
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi sinh tasks)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_tasks`
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

1. **Thiết lập**: Chạy `.specify/scripts/bash/setup-tasks.sh --json` từ thư mục gốc repo và phân tích FEATURE_DIR, TASKS_TEMPLATE_CONTENT, TASKS_TEMPLATE và danh sách AVAILABLE_DOCS. `FEATURE_DIR` và `TASKS_TEMPLATE` phải là đường dẫn tuyệt đối khi được cung cấp. `AVAILABLE_DOCS` là danh sách tên/đường dẫn tương đối của tài liệu có dưới `FEATURE_DIR` (ví dụ `research.md` hoặc `contracts/`). Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

2. **Nạp tài liệu thiết kế**: Đọc từ FEATURE_DIR:
   - **Bắt buộc**: plan.md (công nghệ, thư viện, cấu trúc), spec.md (câu chuyện người dùng kèm mức ưu tiên)
   - **Tùy chọn**: data-model.md (thực thể), contracts/ (contract giao diện), research.md (quyết định), quickstart.md (kịch bản kiểm thử)
   - **NẾU TỒN TẠI**: Nạp file `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án
   - Lưu ý: Không phải dự án nào cũng có đủ tài liệu. Hãy sinh task dựa trên những gì hiện có.

3. **Chạy quy trình sinh task**:
   - Nạp plan.md và trích công nghệ, thư viện, cấu trúc dự án
   - Nạp spec.md và trích câu chuyện người dùng kèm mức ưu tiên (P1, P2, P3, v.v.)
   - Nếu có data-model.md: Trích thực thể và ánh xạ tới câu chuyện người dùng
   - Nếu có contracts/: Ánh xạ contract giao diện tới câu chuyện người dùng
   - Nếu có research.md: Trích quyết định cho task thiết lập
   - Sinh task tổ chức theo câu chuyện người dùng (xem Quy tắc sinh task bên dưới)
   - Sinh đồ thị phụ thuộc thể hiện thứ tự hoàn thành câu chuyện
   - Tạo ví dụ chạy song song cho mỗi câu chuyện
   - Kiểm định độ đủ của task (mỗi câu chuyện có đủ task cần thiết, kiểm thử độc lập được)

4. **Sinh tasks.md**: Dùng TASKS_TEMPLATE_CONTENT (từ đầu ra JSON trên) làm cấu trúc. Để tương thích với script setup cũ thiếu TASKS_TEMPLATE_CONTENT, hãy đọc TASKS_TEMPLATE thay thế. Điền:
   - Tên tính năng đúng từ plan.md
   - Giai đoạn 1: Task thiết lập (khởi tạo dự án)
   - Giai đoạn 2: Task nền tảng (điều kiện chặn bắt buộc cho mọi câu chuyện)
   - Giai đoạn 3+: Mỗi câu chuyện một giai đoạn (theo thứ tự ưu tiên từ spec.md)
   - Mỗi giai đoạn gồm: mục tiêu câu chuyện, tiêu chí test độc lập, test (nếu được yêu cầu), task triển khai
   - Giai đoạn cuối: Đánh bóng & vấn đề xuyên suốt
   - Mọi task phải theo định dạng checklist nghiêm ngặt (xem Quy tắc sinh task bên dưới)
   - Đường dẫn file rõ ràng cho mỗi task
   - Mục Phụ thuộc thể hiện thứ tự hoàn thành câu chuyện
   - Ví dụ chạy song song cho mỗi câu chuyện
   - Mục Chiến lược triển khai (MVP trước, giao hàng tăng dần)

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn thành mục này trước khi báo hoàn thành cho người dùng.**

Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_tasks`, bỏ qua tới Báo cáo hoàn thành.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_tasks`.
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

Xuất đường dẫn tới tasks.md đã sinh và tóm tắt:
- Tổng số task
- Số task cho mỗi câu chuyện người dùng
- Cơ hội chạy song song đã xác định
- Tiêu chí test độc lập cho mỗi câu chuyện
- Phạm vi MVP gợi ý (thường chỉ Câu chuyện 1)
- Kiểm định định dạng: Xác nhận MỌI task theo định dạng checklist (checkbox, ID, nhãn, đường dẫn file)

Ngữ cảnh để sinh task: $ARGUMENTS

File tasks.md phải thực thi ngay được - mỗi task phải cụ thể tới mức LLM có thể hoàn tất mà không cần thêm ngữ cảnh.

## Quy tắc sinh task

**QUAN TRỌNG**: Task PHẢI tổ chức theo câu chuyện người dùng để triển khai và kiểm thử độc lập được.

**Test là TÙY CHỌN**: Chỉ sinh task kiểm thử khi đặc tả tính năng yêu cầu tường minh hoặc người dùng yêu cầu hướng TDD.

### Định dạng checklist (BẮT BUỘC)

Mọi task PHẢI tuân thủ nghiêm ngặt định dạng:

```text
- [ ] [TaskID] [P?] [Story?] Description with file path
```

**Thành phần định dạng**:

1. **Checkbox**: LUÔN bắt đầu bằng `- [ ]` (checkbox markdown)
2. **ID task**: Số thứ tự (T001, T002, T003...) theo thứ tự thực thi
3. **Dấu [P]**: Chỉ đưa vào nếu task chạy song song được (file khác nhau, không phụ thuộc task chưa xong)
4. **Nhãn [Story]**: BẮT BUỘC chỉ cho task thuộc giai đoạn câu chuyện người dùng
   - Định dạng: [US1], [US2], [US3], v.v. (ánh xạ tới câu chuyện trong spec.md)
   - Giai đoạn Thiết lập: KHÔNG nhãn story
   - Giai đoạn Nền tảng: KHÔNG nhãn story
   - Giai đoạn Câu chuyện: PHẢI có nhãn story
   - Giai đoạn Đánh bóng: KHÔNG nhãn story
5. **Mô tả**: Hành động rõ ràng kèm đường dẫn file chính xác

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

1. **Từ Câu chuyện người dùng (spec.md)** - TỔ CHỨC CHÍNH:
   - Mỗi câu chuyện (P1, P2, P3...) có một giai đoạn riêng
   - Ánh xạ mọi component liên quan về câu chuyện của nó:
     - Model cần cho câu chuyện đó
     - Service cần cho câu chuyện đó
     - Giao diện/UI cần cho câu chuyện đó
     - Nếu được yêu cầu test: Test riêng cho câu chuyện đó
   - Đánh dấu phụ thuộc giữa các story (hầu hết story nên độc lập)

2. **Từ Contract**:
   - Ánh xạ mỗi contract giao diện → tới câu chuyện người dùng mà nó phục vụ
   - Nếu được yêu cầu test: Mỗi contract giao diện → task test contract [P] trước triển khai trong giai đoạn của câu chuyện đó

3. **Từ Mô hình dữ liệu**:
   - Ánh xạ mỗi thực thể tới (các) câu chuyện cần nó
   - Nếu thực thể phục vụ nhiều story: Đặt vào story sớm nhất hoặc giai đoạn Thiết lập
   - Quan hệ → task tầng service trong giai đoạn story phù hợp
   - Với mỗi trường có ràng buộc trong data-model.md (độ dài tối đa, nullable/bắt buộc, giá trị enum, quy tắc kiểm chứng), trích nguyên văn ràng buộc vào mô tả task để không phải tự quyết lúc triển khai

4. **Từ Thiết lập/Hạ tầng**:
   - Hạ tầng dùng chung → Giai đoạn Thiết lập (Giai đoạn 1)
   - Task nền tảng/chặn → Giai đoạn Nền tảng (Giai đoạn 2)
   - Thiết lập riêng cho story → nằm trong giai đoạn của story đó

### Cấu trúc giai đoạn

- **Giai đoạn 1**: Thiết lập (khởi tạo dự án)
- **Giai đoạn 2**: Nền tảng (điều kiện chặn bắt buộc - PHẢI xong trước các câu chuyện)
- **Giai đoạn 3+**: Câu chuyện theo thứ tự ưu tiên (P1, P2, P3...)
  - Trong mỗi story: Test (nếu được yêu cầu) → Model → Service → Endpoint → Tích hợp
  - Mỗi giai đoạn nên là một bước tăng trưởng hoàn chỉnh, kiểm thử độc lập được
- **Giai đoạn cuối**: Đánh bóng & Vấn đề xuyên suốt

## Điều kiện xong

- [ ] tasks.md đã sinh với đủ giai đoạn, ID task và đường dẫn file
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn thành cho người dùng kèm số task, chia theo story và phạm vi MVP
