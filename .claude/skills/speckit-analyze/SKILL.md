---
name: "speckit-analyze"
description: "Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation."
argument-hint: "Optional focus areas for analysis"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/analyze.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi phân tích (analyze))**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_analyze`
- Nếu YAML không phân tích (parse) được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm theo lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Goal.
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Mục tiêu

Xác định các điểm không nhất quán, trùng lặp, mơ hồ và chưa được mô tả đủ trên ba tài liệu cốt lõi (`spec.md`, `plan.md`, `tasks.md`) trước khi triển khai (implement). Lệnh này PHẢI chỉ chạy sau khi `/speckit-tasks` đã tạo xong đầy đủ `tasks.md`.

## Ràng buộc vận hành

**CHỈ ĐỌC, TUYỆT ĐỐI KHÔNG SỬA**: **Không** sửa bất kỳ file nào. Xuất ra một báo cáo phân tích có cấu trúc. Đề xuất thêm một kế hoạch khắc phục tùy chọn (người dùng phải phê duyệt tường minh trước khi bất kỳ lệnh sửa nào tiếp theo được gọi thủ công).

**Thẩm quyền của constitution**: constitution của dự án (`.specify/memory/constitution.md`) là **bất khả thương lượng** trong phạm vi phân tích này. Xung đột với constitution tự động xếp mức CRITICAL và yêu cầu điều chỉnh spec, plan hoặc tasks — không được pha loãng, diễn giải lại hay lặng lẽ bỏ qua nguyên tắc. Nếu bản thân nguyên tắc cần thay đổi, việc đó phải diễn ra trong một lần cập nhật constitution riêng biệt, tường minh, ngoài `/speckit-analyze`.

## Các bước thực hiện

### 1. Khởi tạo ngữ cảnh phân tích

Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` một lần từ thư mục gốc repo và phân tích JSON để lấy FEATURE_DIR và AVAILABLE_DOCS. Suy ra các đường dẫn tuyệt đối:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Dừng và báo lỗi nếu thiếu bất kỳ file bắt buộc nào (hướng dẫn người dùng chạy lệnh điều kiện tiên quyết còn thiếu).
Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

### 2. Nạp các tài liệu (Tiết lộ dần dần)

Chỉ nạp ngữ cảnh tối thiểu cần thiết từ mỗi tài liệu:

**Từ spec.md:**

- Tổng quan/Bối cảnh
- Yêu cầu chức năng
- Tiêu chí thành công (kết quả đo được — ví dụ hiệu năng, bảo mật, tính sẵn sàng, thành công của người dùng, tác động kinh doanh)
- Câu chuyện người dùng (user stories)
- Trường hợp biên (nếu có)

**Từ plan.md:**

- Lựa chọn kiến trúc/công nghệ (stack)
- Tham chiếu Mô hình dữ liệu
- Các giai đoạn
- Ràng buộc kỹ thuật

**Từ tasks.md:**

- ID công việc
- Mô tả
- Nhóm theo giai đoạn
- Đánh dấu chạy song song [P]
- Đường dẫn file được tham chiếu

**Từ constitution:**

- Nạp `.specify/memory/constitution.md` để kiểm tra đối chiếu nguyên tắc

### 3. Dựng mô hình ngữ nghĩa

Tạo các biểu diễn nội bộ (không đưa tài liệu thô vào đầu ra):

- **Danh mục yêu cầu (requirements inventory)**: Với mỗi Yêu cầu chức năng (FR-###) và Tiêu chí thành công (SC-###), ghi một khóa ổn định. Dùng mã định danh FR-/SC- tường minh làm khóa chính khi có, và tùy chọn suy thêm slug cụm động từ mệnh lệnh để dễ đọc (ví dụ "User can upload file" → `user-can-upload-file`). Chỉ gồm các Tiêu chí thành công cần công việc xây dựng được (ví dụ hạ tầng kiểm thử tải, công cụ kiểm toán bảo mật), và loại trừ các chỉ số kết quả sau triển khai và KPI kinh doanh (ví dụ "Giảm 50% ticket hỗ trợ").
- **Danh mục câu chuyện/hành động người dùng**: Các hành động rời rạc của người dùng kèm tiêu chí chấp nhận
- **Ánh xạ bao phủ công việc**: Ánh xạ mỗi task tới một hoặc nhiều yêu cầu hoặc câu chuyện (suy luận theo từ khóa / mẫu tham chiếu tường minh như ID hoặc cụm từ khóa)
- **Bộ quy tắc constitution**: Trích tên nguyên tắc và các phát biểu chuẩn tắc MUST/SHOULD

### 4. Các lượt quét phát hiện (Phân tích tiết kiệm token)

Tập trung vào phát hiện có tín hiệu cao. Giới hạn tối đa 50 phát hiện; phần dư gom vào tóm tắt tràn.

#### A. Phát hiện trùng lặp

- Nhận diện các yêu cầu gần như trùng nhau
- Đánh dấu cách diễn đạt kém chất lượng hơn để gộp lại

#### B. Phát hiện mơ hồ

- Gắn cờ các tính từ mơ hồ (nhanh, mở rộng tốt, bảo mật, trực quan, robust) thiếu tiêu chí đo được
- Gắn cờ các placeholder chưa giải quyết (TODO, TKTK, ???, `<placeholder>`, v.v.)

#### C. Mô tả thiếu (Underspecification)

- Yêu cầu có động từ nhưng thiếu tân ngữ hoặc kết quả đo được
- Câu chuyện người dùng thiếu sự liên kết với tiêu chí chấp nhận
- Task tham chiếu file hoặc component không được định nghĩa trong spec/plan

#### D. Đối chiếu constitution

- Bất kỳ yêu cầu hay thành phần plan nào xung đột với nguyên tắc MUST
- Thiếu các mục bắt buộc hay cổng chất lượng do constitution quy định

#### E. Lỗ hổng bao phủ

- Yêu cầu không có task nào liên quan
- Task không ánh xạ tới yêu cầu/câu chuyện nào
- Tiêu chí thành công cần công việc xây dựng được (hiệu năng, bảo mật, tính sẵn sàng) chưa được phản ánh trong tasks

#### F. Không nhất quán

- Trôi dạt thuật ngữ (cùng một khái niệm được gọi bằng tên khác nhau giữa các file)
- Thực thể dữ liệu được nhắc trong plan nhưng vắng mặt trong spec (hoặc ngược lại)
- Mâu thuẫn thứ tự task (ví dụ task tích hợp xếp trước task thiết lập nền tảng mà không ghi chú phụ thuộc)
- Yêu cầu mâu thuẫn (ví dụ một chỗ yêu cầu Next.js trong khi chỗ khác ghi Vue)

### 5. Gán mức độ nghiêm trọng

Dùng heuristic sau để xếp ưu tiên phát hiện:

- **CRITICAL**: Vi phạm MUST của constitution, thiếu tài liệu spec cốt lõi, hoặc yêu cầu không có bao phủ nào mà chặn chức năng nền tảng
- **HIGH**: Yêu cầu trùng lặp hoặc mâu thuẫn, thuộc tính bảo mật/hiệu năng mơ hồ, tiêu chí chấp nhận không kiểm thử được
- **MEDIUM**: Trôi dạt thuật ngữ, thiếu bao phủ task phi chức năng, trường hợp biên mô tả chưa đủ
- **LOW**: Cải tiến văn phong/cách diễn đạt, dư thừa nhỏ không ảnh hưởng thứ tự thực thi

### 6. Xuất báo cáo phân tích gọn

Xuất báo cáo Markdown (không ghi file) theo cấu trúc sau:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar requirements ... | Merge phrasing; keep clearer version |

(Thêm một dòng cho mỗi phát hiện; sinh ID ổn định với tiền tố là chữ cái đầu của loại.)

**Bảng tóm tắt bao phủ:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Các vấn đề đối chiếu Constitution:** (nếu có)

**Các task chưa ánh xạ:** (nếu có)

**Chỉ số:**

- Tổng số yêu cầu
- Tổng số task
- % bao phủ (số yêu cầu có >=1 task)
- Số điểm mơ hồ
- Số điểm trùng lặp
- Số vấn đề Critical

### 7. Đưa ra các hành động tiếp theo

Ở cuối báo cáo, xuất một khối Hành động tiếp theo ngắn gọn:

- Nếu tồn tại vấn đề CRITICAL: Khuyến nghị xử lý trước khi chạy `/speckit-implement`
- Nếu chỉ có LOW/MEDIUM: Người dùng có thể tiếp tục, nhưng kèm gợi ý cải thiện
- Đưa gợi ý lệnh cụ thể: ví dụ "Chạy /speckit-specify kèm tinh chỉnh", "Chạy /speckit-plan để chỉnh kiến trúc", "Sửa thủ công tasks.md để bổ sung bao phủ cho 'performance-metrics'"

### 8. Đề xuất khắc phục

Hỏi người dùng: "Bạn có muốn tôi gợi ý các chỉnh sửa khắc phục cụ thể cho N vấn đề hàng đầu không?" (KHÔNG tự động áp dụng.)

### 9. Kiểm tra extension hooks

Sau khi báo cáo, kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_analyze`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Optional hook** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Mandatory hook** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Nguyên tắc vận hành

### Hiệu quả ngữ cảnh

- **Token tối thiểu nhưng tín hiệu cao**: Tập trung vào phát hiện khả thi, không viết tài liệu dàn trải
- **Tiết lộ dần dần**: Nạp tài liệu theo từng bước; không đổ toàn bộ nội dung vào phân tích
- **Đầu ra tiết kiệm token**: Giới hạn bảng phát hiện tối đa 50 dòng; tóm tắt phần tràn
- **Kết quả xác định (deterministic)**: Chạy lại mà không thay đổi phải cho ID và số liệu nhất quán

### Hướng dẫn phân tích

- **KHÔNG BAO GIỜ sửa file** (đây là phân tích chỉ đọc)
- **KHÔNG BAO GIỜ bịa ra mục còn thiếu** (nếu vắng mặt, báo cáo đúng thực tế)
- **Ưu tiên vi phạm constitution** (luôn xếp CRITICAL)
- **Dùng ví dụ thay vì quy tắc dàn trải** (trích dẫn trường hợp cụ thể, không nêu mẫu chung chung)
- **Báo cáo không có vấn đề một cách nhẹ nhàng** (xuất báo cáo thành công kèm thống kê bao phủ)

## Context

$ARGUMENTS
