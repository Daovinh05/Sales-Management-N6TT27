---
name: "speckit-converge"
description: "Assess the current codebase against the feature's spec, plan, and tasks, then append any remaining unbuilt work as new tasks to tasks.md so implement can complete it."
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/converge.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi hội tụ (converge))**:

- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_converge`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook tùy chọn** (`optional: true`):

    ```text
    ## Extension Hooks

    **Optional Pre-Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

  - **Hook bắt buộc** (`optional: false`):

    ```text
    ## Extension Hooks

    **Automatic Pre-Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}

    Wait for the result of the hook command before proceeding to the Goal.
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.

- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Mục tiêu

Lấp khoảng cách giữa những gì đặc tả (spec), kế hoạch (plan) và danh sách việc (tasks) của tính năng yêu cầu với những gì codebase hiện đang triển khai. Đọc `spec.md`, `plan.md` và `tasks.md` như **nguồn ý định duy nhất** (với constitution là ràng buộc quản trị), đánh giá trạng thái hiện tại của code, xác định yêu cầu, tiêu chí chấp nhận, quyết định plan và task hiện có nào chưa đạt, chưa xong hay mới đạt một phần, rồi **nối thêm từng phần việc còn lại thành task mới có thể truy vết** ở cuối `tasks.md` để `/speckit-implement` hoàn tất. Lệnh này PHẢI chỉ chạy sau khi `/speckit-implement` đã chạy trên `tasks.md` hiện tại, và sau khi `/speckit-tasks` đã tạo xong đầy đủ `tasks.md`.

Đây **không** phải công cụ diff và **không** theo dõi thay đổi. Nó đánh giá trạng thái hiện tại của code so với tài liệu của tính năng — không git, không so sánh nhánh, không lịch sử.

## Ràng buộc vận hành

**CHỈ NỐI THÊM, KHÔNG BAO GIỜ VIẾT LẠI**: Lần ghi **duy nhất** của lệnh là nối thêm mục `## Phase N: Convergence` vào `tasks.md`. Nó PHẢI KHÔNG:

- sửa `spec.md` hay `plan.md` dưới mọi hình thức;
- viết lại, đánh số lại, sắp lại hay xóa bất kỳ task hiện có nào (kể cả task từ pha Convergence trước);
- sửa, tạo hay xóa bất kỳ code ứng dụng nào — hoàn tất các task nối thêm là việc của `/speckit-implement`.

Khi codebase đã đáp ứng mọi thứ, lệnh PHẢI để `tasks.md` **nguyên từng byte** (không thêm tiêu đề Convergence rỗng) và báo kết quả sạch.

**Thẩm quyền của constitution**: constitution của dự án (`.specify/memory/constitution.md`) là **bất khả thương lượng**. Code vi phạm nguyên tắc MUST là phát hiện nghiêm trọng nhất và sinh task khắc phục tương ứng. Nếu constitution chỉ là mẫu chưa điền, bỏ qua kiểm tra constitution một cách nhẹ nhàng thay vì lỗi.

## Các bước thực hiện

### 1. Khởi tạo ngữ cảnh hội tụ (converge)

Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` một lần từ thư mục gốc repo và phân tích JSON để lấy FEATURE_DIR và AVAILABLE_DOCS. Suy ra các đường dẫn tuyệt đối:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md
- CONSTITUTION = `.specify/memory/constitution.md` (nếu có)
Nếu thiếu `spec.md`, `plan.md` hay `tasks.md`, DỪNG lại với thông báo rõ ràng, khả thi, nêu tên lệnh điều kiện tiên quyết cần chạy (`/speckit-specify` khi thiếu spec, `/speckit-plan` khi thiếu plan, `/speckit-tasks` khi thiếu tasks). Không xuất kết quả nửa vời.
Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

### 2. Nạp tài liệu (Tiết lộ dần dần)

Chỉ nạp ngữ cảnh tối thiểu cần thiết từ mỗi tài liệu:

**Từ spec.md:**

- Yêu cầu chức năng (FR-###)
- Tiêu chí thành công (SC-###) — chỉ gồm mục cần công việc xây dựng được; loại trừ chỉ số kết quả sau triển khai và KPI kinh doanh
- Câu chuyện người dùng và Kịch bản chấp nhận của chúng
- Trường hợp biên (nếu có)

**Từ plan.md:**

- Lựa chọn kiến trúc/stack và quyết định kỹ thuật
- Tham chiếu Mô hình dữ liệu
- Các giai đoạn và điểm chạm đã nêu tên (file/component mà plan nói sẽ tạo hoặc sửa)
- Ràng buộc kỹ thuật

**Từ tasks.md:**

- ID task (để tính ID tiếp theo và số pha tiếp theo)
- Mô tả, nhóm theo giai đoạn và đường dẫn file được tham chiếu

**Từ constitution (nếu không phải mẫu chưa điền):**

- Tên nguyên tắc và phát biểu chuẩn tắc MUST/SHOULD

### 3. Dựng danh mục ý định

Tạo mô hình nội bộ (không echo tài liệu thô):

- **Danh mục yêu cầu**: một khóa ổn định cho mỗi FR-### / SC-### / kịch bản chấp nhận của câu chuyện người dùng (ví dụ `US1/AC2`), cộng các quyết định plan và nguyên tắc constitution đặt ra nghĩa vụ xây dựng được.
- **Bản đồ phạm vi code**: từ đường dẫn file nêu trong `plan.md` và `tasks.md`, cộng tìm kiếm từ khóa cho khái niệm mỗi yêu cầu mô tả, suy ra tập file mã nguồn và component thuộc phạm vi đánh giá. Giới hạn đánh giá trong phạm vi này — **không** suy diễn phạm vi vượt ngoài tài liệu định nghĩa.

### 4. Đánh giá codebase và phân loại phát hiện

Gồm mọi task hiện có trong danh mục ý định, bất kể trạng thái checkbox hay pha Convergence: tuyên bố hoàn tất không phải bằng chứng. Kiểm chứng hành vi hiện tại theo spec, plan, tasks và constitution; với chuỗi task sửa chữa, đánh giá hành vi kết quả chứ không phải chi tiết triển khai đã bị thay thế. Kiểm tra cả nghĩa vụ chưa đạt lẫn phần triển khai mâu thuẫn, vượt quá hay nằm ngoài ý định đã nêu.

Với mỗi mục trong danh mục ý định, kiểm tra code hiện tại trong phạm vi và chỉ sinh `Finding` khi có khoảng trống. Phân loại mỗi phát hiện theo **loại khoảng trống (gap type)**:

- **`missing`**: công việc yêu cầu hoàn toàn vắng mặt trong code.
- **`partial`**: việc đã có nhưng chưa đáp ứng đầy đủ yêu cầu / tiêu chí chấp nhận / quyết định plan.
- **`contradicts`**: code làm điều mâu thuẫn với ý định đã nêu hay nguyên tắc MUST của constitution.
- **`unrequested`**: code chứa việc không được spec, plan hay tasks yêu cầu (nêu để nhận biết — converge **không** xóa code, chỉ nối thêm task để xem xét/biện minh hoặc gỡ bỏ).

Mỗi `Finding` ghi: id ổn định, `source-ref` truy vết tới, `gap-type`, mức nghiêm trọng và mô tả ngắn gọn con người đọc được kèm bằng chứng (file/vùng đã quan sát).

**Trường hợp biên:**

- **Chưa có hoặc hầu như chưa có code**: coi toàn bộ phạm vi đã quy định là công việc còn lại dạng `missing` thay vì báo lỗi.
- **Không còn gì**: sinh không phát hiện và theo nhánh đã hội tụ ở Bước 7.

### 5. Gán mức nghiêm trọng

- **CRITICAL**: vi phạm nguyên tắc MUST của constitution, hoặc khoảng trống `missing`/`contradicts` chặn chức năng nền tảng của câu chuyện người dùng P1.
- **HIGH**: khoảng trống `missing` hoặc `partial` trên yêu cầu chức năng cốt lõi hay tiêu chí chấp nhận.
- **MEDIUM**: khoảng trống `partial` trên yêu cầu thứ yếu, hoặc bổ sung `unrequested` chưa rõ lý do.
- **LOW**: khoảng trống partial nhỏ, trau chuốt, hoặc bổ sung `unrequested` rủi ro thấp.

### 6. Trình bày tóm tắt phát hiện trong phiên

Trước khi nối thêm bất cứ gì, xuất tóm tắt gọn xếp theo nghiêm trọng (chưa ghi file):

## Convergence Findings

| ID | Gap Type | Severity | Source | Evidence | Remaining Work |
|----|----------|----------|--------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | Example: no append-only guard detected in path/to/module.py when writing tasks.md | Add append-only enforcement |

**Chỉ số tóm tắt:**

- Số yêu cầu / tiêu chí chấp nhận đã kiểm tra
- Số quyết định plan đã kiểm tra
- Số nguyên tắc constitution đã kiểm tra (hoặc "đã bỏ qua — mẫu chưa điền")
- Phát hiện theo loại khoảng trống (missing / partial / contradicts / unrequested)
- Phát hiện theo nghiêm trọng

### 7. Nối thêm task hội tụ (hoặc báo đã hội tụ)

**Nếu có một hoặc nhiều phát hiện khả thi** (kết quả `tasks_appended`):

Nối vào **cuối** `tasks.md`, theo hợp đồng nối thêm:

1. Quét mọi ID task hiện có; gọi `M` là giá trị lớn nhất. Xác định số pha tiếp theo `N` (pha hiện cao nhất + 1).
2. Viết một tiêu đề mục mới `## Phase N: Convergence`.
3. Xuất một mục checklist cho mỗi phát hiện khả thi, xếp CRITICAL/HIGH trước, gán ID đệm 0 `T{M+1:03d}, T{M+2:03d}, …`:

   ```markdown
   - [ ] T042 <imperative description> per <source-ref> (<gap-type>)
   ```

   `<source-ref>` truy vết task về nguồn: ví dụ `FR-003`, `SC-002`, `US1/AC2`, `plan: storage decision`, `Constitution II`.

   `<gap-type>` là một trong `missing`, `partial`, `contradicts`, `unrequested`.

   Task vi phạm constitution PHẢI xuất trước và mô tả là `CRITICAL`.
4. Không bao giờ tái dùng hay đánh số lại ID hiện có. Nếu đã có pha Convergence trước, thêm pha mới đánh số riêng bên dưới — không chạm pha cũ.

**Nếu không có phát hiện khả thi nào** (kết quả `converged`):

- **Không** sửa `tasks.md` chút nào — không thêm tiêu đề pha rỗng.
- Báo: **"✅ Converged — bản triển khai đã đáp ứng spec, plan và tasks."**
- Kèm số lượng đã kiểm tra.

### 8. Đưa hành động tiếp theo (Bàn giao)

- Với `tasks_appended`: nêu đã nối thêm bao nhiêu task dưới pha nào, và khuyến nghị chạy `/speckit-implement` để hoàn tất; lưu ý lần converge tiếp theo sẽ còn ít mục hơn hoặc hết.
- Với `converged`: khuyến nghị chuyển sang review / mở PR. Không cần thêm lượt implement nào cho phạm vi đã quy định của tính năng này.

### 9. Kiểm tra extension hooks

Sau khi ra kết quả, kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.

- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_converge`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: báo cho người dùng rằng không đọc được `.specify/extensions.yml` (kèm lỗi của trình phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã đăng ký ở đó, rồi tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Coi các hook không có trường `enabled` là được bật mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc trường này null/rỗng, coi hook là có thể thực thi
  - Nếu hook định nghĩa `condition` khác rỗng, bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
- Báo kết quả hội tụ (`converged` hoặc `tasks_appended`) trong phiên trước khi liệt kê bất kỳ hook nào, để người dùng quyết định có chạy lệnh tiếp theo tùy chọn không.
- Khi dựng lệnh gọi từ tên lệnh của hook, thay dấu chấm (`.`) bằng dấu gạch ngang (`-`). Ví dụ, `speckit.git.commit` → `/speckit-git-commit`.
- Với mỗi hook có thể thực thi, xuất nội dung sau dựa trên cờ `optional` của nó:
  - **Hook tùy chọn** (`optional: true`):

    ```text
    ## Extension Hooks

    **Optional Hook**: {extension}
    Command: `/{command}`
    Description: {description}

    Prompt: {prompt}
    To execute: `/{command}`
    ```

  - **Hook bắt buộc** (`optional: false`):

    ```text
    ## Extension Hooks

    **Automatic Hook**: {extension}
    Executing: `/{command}`
    EXECUTE_COMMAND: {command}
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.

- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng
