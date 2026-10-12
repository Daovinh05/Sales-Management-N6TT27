---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi phân tích - analyze)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_analyze`
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

    Wait for the result of the hook command before proceeding to the Goal.
    ```
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.
- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Mục tiêu

Xác định các điểm không nhất quán, trùng lặp, mơ hồ và chưa được mô tả đầy đủ trên ba tài liệu cốt lõi (`spec.md`, `plan.md`, `tasks.md`) trước khi triển khai. Lệnh này PHẢI chỉ chạy sau khi `/speckit.tasks` đã tạo xong file `tasks.md` hoàn chỉnh.

## Ràng buộc vận hành

**CHỈ ĐỌC TUYỆT ĐỐI**: Không được sửa bất kỳ file nào. Xuất ra báo cáo phân tích có cấu trúc. Có thể gợi ý kế hoạch khắc phục tùy chọn (người dùng phải duyệt rõ ràng trước khi gọi thủ công các lệnh chỉnh sửa tiếp theo).

**Thẩm quyền của bản hiến pháp dự án (constitution)**: Bản constitution của dự án (`.specify/memory/constitution.md`) là **không thể thương lượng** trong phạm vi phân tích này. Các xung đột với constitution tự động bị coi là CRITICAL và yêu cầu điều chỉnh spec, plan hoặc tasks — không được làm loãng, diễn giải lại hay lặng lẽ bỏ qua nguyên tắc. Nếu bản thân nguyên tắc cần thay đổi, việc đó phải thực hiện trong một lần cập nhật constitution riêng biệt, tường minh, nằm ngoài `/speckit.analyze`.

## Các bước thực thi

### 1. Khởi tạo ngữ cảnh phân tích

Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` một lần từ thư mục gốc của repo và phân tích JSON để lấy FEATURE_DIR và AVAILABLE_DOCS. Suy ra các đường dẫn tuyệt đối:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Dừng và báo lỗi nếu thiếu file bắt buộc nào (hướng dẫn người dùng chạy lệnh điều kiện tiên quyết còn thiếu).
Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

### 2. Nạp các tài liệu (Tiết lộ dần dần)

Chỉ nạp ngữ cảnh tối thiểu cần thiết từ mỗi tài liệu:

**Từ spec.md:**

- Tổng quan/Bối cảnh
- Yêu cầu chức năng
- Tiêu chí thành công (kết quả đo lường được — ví dụ: hiệu năng, bảo mật, tính sẵn sàng, thành công của người dùng, tác động kinh doanh)
- Câu chuyện người dùng (user stories)
- Trường hợp biên (nếu có)

**Từ plan.md:**

- Lựa chọn kiến trúc/công nghệ
- Tham chiếu Mô hình dữ liệu
- Các giai đoạn
- Ràng buộc kỹ thuật

**Từ tasks.md:**

- ID công việc
- Mô tả
- Nhóm theo giai đoạn
- Dấu chạy song song [P]
- Đường dẫn file được tham chiếu

**Từ bản hiến pháp (constitution):**

- Nạp file `.specify/memory/constitution.md` để kiểm tra sự tuân thủ nguyên tắc

### 3. Xây dựng mô hình ngữ nghĩa

Tạo các biểu diễn nội bộ (không đưa tài liệu thô vào đầu ra):

- **Danh mục yêu cầu (requirements inventory)**: Với mỗi Yêu cầu chức năng (FR-###) và Tiêu chí thành công (SC-###), ghi lại một khóa ổn định. Dùng mã FR-/SC- tường minh làm khóa chính khi có, và có thể suy thêm slug cụm động từ để dễ đọc (ví dụ: "User can upload file" → `user-can-upload-file`). Chỉ bao gồm các Tiêu chí thành công cần công việc xây dựng được (ví dụ: hạ tầng kiểm thử tải, công cụ kiểm toán bảo mật), và loại trừ các chỉ số kết quả sau triển khai và KPI kinh doanh (ví dụ: "Giảm 50% ticket hỗ trợ").
- **Danh mục câu chuyện/hành động người dùng**: Các hành động rời rạc của người dùng kèm tiêu chí chấp nhận
- **Ánh xạ bao phủ công việc**: Ánh xạ mỗi task tới một hoặc nhiều yêu cầu hoặc câu chuyện (suy luận theo từ khóa / mẫu tham chiếu tường minh như ID hoặc cụm từ khóa)
- **Bộ quy tắc constitution**: Trích xuất tên nguyên tắc và các phát biểu chuẩn tắc MUST/SHOULD

### 4. Các lượt phát hiện (Phân tích tiết kiệm token)

Tập trung vào các phát hiện có tín hiệu cao. Giới hạn tối đa 50 phát hiện; phần dư gom vào tóm tắt tràn.

#### A. Phát hiện trùng lặp

- Xác định các yêu cầu gần như trùng lặp
- Đánh dấu cách diễn đạt kém chất lượng hơn để hợp nhất

#### B. Phát hiện mơ hồ

- Gắn cờ các tính từ mơ hồ (nhanh, mở rộng tốt, bảo mật, trực quan, mạnh mẽ) thiếu tiêu chí đo lường được
- Gắn cờ các placeholder chưa giải quyết (TODO, TKTK, ???, `<placeholder>`, v.v.)

#### C. Thiếu đặc tả

- Yêu cầu có động từ nhưng thiếu tân ngữ hoặc kết quả đo lường được
- Câu chuyện người dùng thiếu sự liên kết với tiêu chí chấp nhận
- Task tham chiếu tới file hoặc thành phần không được định nghĩa trong spec/plan

#### D. Liên kết với constitution

- Bất kỳ yêu cầu hay thành phần plan nào xung đột với nguyên tắc MUST
- Thiếu các mục bắt buộc hay cổng chất lượng do constitution yêu cầu

#### E. Lỗ hổng bao phủ

- Yêu cầu không có task nào liên kết
- Task không ánh xạ tới yêu cầu/câu chuyện nào
- Tiêu chí thành công cần công việc xây dựng được (hiệu năng, bảo mật, tính sẵn sàng) chưa được phản ánh trong các task

#### F. Không nhất quán

- Thuật ngữ trôi dạt (cùng một khái niệm được gọi bằng tên khác nhau giữa các file)
- Thực thể dữ liệu được tham chiếu trong plan nhưng vắng mặt trong spec (hoặc ngược lại)
- Mâu thuẫn thứ tự task (ví dụ: task tích hợp đặt trước task thiết lập nền tảng mà không ghi chú phụ thuộc)
- Yêu cầu xung đột (ví dụ: một bên yêu cầu Next.js trong khi bên kia chỉ định Vue)

### 5. Gán mức độ nghiêm trọng

Dùng cách ước lượng sau để ưu tiên các phát hiện:

- **CRITICAL**: Vi phạm nguyên tắc MUST của constitution, thiếu tài liệu spec cốt lõi, hoặc yêu cầu không có bao phủ nào mà chặn chức năng nền tảng
- **HIGH**: Yêu cầu trùng lặp hoặc xung đột, thuộc tính bảo mật/hiệu năng mơ hồ, tiêu chí chấp nhận không kiểm thử được
- **MEDIUM**: Thuật ngữ trôi dạt, thiếu bao phủ task phi chức năng, trường hợp biên mô tả chưa đầy đủ
- **LOW**: Cải thiện văn phong/cách diễn đạt, trùng lặp nhỏ không ảnh hưởng thứ tự thực thi

### 6. Xuất báo cáo phân tích gọn nhẹ

Xuất báo cáo Markdown (không ghi file) với cấu trúc sau:

## Báo cáo phân tích đặc tả

| ID | Loại | Mức độ | Vị trí | Tóm tắt | Khuyến nghị |
|----|----------|----------|-------------|---------|----------------|
| A1 | Trùng lặp | HIGH | spec.md:L120-134 | Hai yêu cầu tương tự ... | Gộp cách diễn đạt; giữ bản rõ ràng hơn |

(Thêm một dòng cho mỗi phát hiện; sinh ID ổn định với tiền tố là chữ cái đầu của loại.)

**Bảng tóm tắt bao phủ:**

 | Requirement Key | Has Task? | Task IDs | Notes |
 |-----------------|-----------|----------|-------|

**Các vấn đề liên kết với constitution:** (nếu có)

**Các task chưa ánh xạ:** (nếu có)

**Chỉ số đo lường:**

- Tổng số yêu cầu
- Tổng số task
- Tỉ lệ bao phủ % (yêu cầu có >=1 task)
- Số điểm mơ hồ
- Số điểm trùng lặp
- Số vấn đề nghiêm trọng (Critical)

### 7. Đưa ra các hành động tiếp theo

Ở cuối báo cáo, xuất khối Hành động tiếp theo ngắn gọn:

- Nếu tồn tại vấn đề CRITICAL: Khuyến nghị xử lý xong trước khi chạy `/speckit.implement`
- Nếu chỉ có LOW/MEDIUM: Người dùng có thể tiếp tục, nhưng hãy đưa gợi ý cải thiện
- Đưa gợi ý lệnh rõ ràng: ví dụ: "Chạy /speckit.specify để tinh chỉnh", "Chạy /speckit.plan để điều chỉnh kiến trúc", "Sửa thủ công tasks.md để bổ sung bao phủ cho 'performance-metrics'"

### 8. Đề nghị khắc phục

Hỏi người dùng: "Bạn có muốn tôi gợi ý các chỉnh sửa khắc phục cụ thể cho N vấn đề hàng đầu không?" (KHÔNG tự động áp dụng.)

### 9. Kiểm tra extension hooks

Sau khi báo cáo, kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_analyze`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: hãy báo cho người dùng rằng không đọc được file `.specify/extensions.yml` (kèm lỗi phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã khai báo ở đó, sau đó tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Các hook không có trường `enabled` được coi là đang bật theo mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc giá trị null/rỗng, coi hook đó là có thể thực thi được
  - Nếu hook có định nghĩa `condition` không rỗng, hãy bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook tùy chọn** (`optional: true`):
    ```
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```
  - **Hook bắt buộc** (`optional: false`):
    ```
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.
- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Nguyên tắc vận hành

### Hiệu quả ngữ cảnh

- **Token tối thiểu nhưng tín hiệu cao**: Tập trung vào các phát hiện có thể hành động, không viết tài liệu dàn trải
- **Tiết lộ dần dần**: Nạp tài liệu theo từng bước; không đổ toàn bộ nội dung vào phân tích
- **Đầu ra tiết kiệm token**: Giới hạn bảng phát hiện ở 50 dòng; tóm tắt phần tràn
- **Kết quả ổn định**: Chạy lại mà không thay đổi phải cho ID và số lượng nhất quán

### Hướng dẫn phân tích (analyze)

- **KHÔNG BAO GIỜ sửa file** (đây là phân tích chỉ đọc)
- **KHÔNG BAO GIỜ bịa ra mục còn thiếu** (nếu vắng mặt, báo cáo chính xác)
- **Ưu tiên vi phạm constitution** (luôn là CRITICAL)
- **Dùng ví dụ thay vì quy tắc dàn trải** (trích dẫn trường hợp cụ thể, không nêu mẫu chung chung)
- **Báo cáo khéo léo khi không có vấn đề** (xuất báo cáo thành công kèm thống kê bao phủ)

## Ngữ cảnh

$ARGUMENTS
