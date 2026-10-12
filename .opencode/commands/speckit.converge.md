---
description: Assess the current codebase against the feature's spec, plan, and tasks, then append any remaining unbuilt work as new tasks to tasks.md so implement can complete it.
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi hội tụ - converge)**:

- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_converge`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: hãy báo cho người dùng rằng không đọc được file `.specify/extensions.yml` (kèm lỗi phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã khai báo ở đó, sau đó tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Các hook không có trường `enabled` được coi là đang bật theo mặc định.
- Với mỗi hook còn lại, **không** cố diễn giải hay đánh giá biểu thức `condition` của hook:
  - Nếu hook không có trường `condition`, hoặc giá trị null/rỗng, coi hook đó là có thể thực thi được
  - Nếu hook có định nghĩa `condition` không rỗng, hãy bỏ qua hook và để việc đánh giá điều kiện cho phần cài đặt HookExecutor
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
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.

- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Mục tiêu

Thu hẹp khoảng cách giữa những gì đặc tả (spec), kế hoạch (plan) và công việc (tasks) của tính năng yêu cầu với những gì codebase hiện đang triển khai. Đọc `spec.md`, `plan.md` và `tasks.md` như **nguồn ý định duy nhất** (với constitution là ràng buộc chi phối), đánh giá trạng thái hiện tại của code, xác định yêu cầu, tiêu chí chấp nhận, quyết định trong plan và task hiện có nào chưa đạt, chưa xong hay mới đạt một phần, rồi **bổ sung mỗi phần việc còn lại thành một task mới có thể truy vết** ở cuối `tasks.md` để `/speckit.implement` có thể hoàn tất. Lệnh này PHẢI chỉ chạy sau khi `/speckit.implement` đã chạy trên `tasks.md` hiện tại, và sau khi `/speckit.tasks` đã tạo xong `tasks.md` hoàn chỉnh.

Đây **không** phải công cụ diff và **không** theo dõi thay đổi. Nó đánh giá trạng thái hiện tại của code so với tài liệu của tính năng — không git, không so sánh nhánh, không lịch sử.

## Ràng buộc vận hành

**CHỈ ĐƯỢC BỔ SUNG, KHÔNG BAO GIỜ VIẾT LẠI**: Lần ghi **duy nhất** của lệnh là bổ sung mục mới `## Phase N: Convergence` (Giai đoạn N: Hội tụ) vào `tasks.md`. Nó PHẢI KHÔNG:

- sửa `spec.md` hay `plan.md` dưới bất kỳ hình thức nào;
- viết lại, đánh số lại, sắp xếp lại hay xóa bất kỳ task hiện có nào (kể cả task từ giai đoạn Hội tụ trước);
- sửa, tạo hay xóa bất kỳ code ứng dụng nào — hoàn tất các task bổ sung là việc của `/speckit.implement`.

Khi codebase đã đáp ứng mọi thứ, lệnh PHẢI để `tasks.md` **nguyên từng byte** (không thêm tiêu đề Convergence rỗng) và báo kết quả sạch.

**Thẩm quyền của constitution**: Bản constitution của dự án (`.specify/memory/constitution.md`) là **không thể thương lượng**. Code vi phạm nguyên tắc MUST là phát hiện nghiêm trọng nhất và sinh ra task khắc phục tương ứng. Nếu constitution còn là mẫu chưa điền, hãy lặng lẽ bỏ qua kiểm tra constitution thay vì báo lỗi.

## Các bước thực thi

### 1. Khởi tạo ngữ cảnh hội tụ (converge)

Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-spec --require-tasks --include-tasks` một lần từ thư mục gốc repo và phân tích JSON để lấy FEATURE_DIR và AVAILABLE_DOCS. Suy ra các đường dẫn tuyệt đối:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md
- CONSTITUTION = `.specify/memory/constitution.md` (if present)
Nếu thiếu `spec.md`, `plan.md` hay `tasks.md`, DỪNG lại với thông báo rõ ràng, có thể hành động, nêu tên lệnh điều kiện tiên quyết cần chạy (`/speckit.specify` cho spec thiếu, `/speckit.plan` cho plan thiếu, `/speckit.tasks` cho tasks thiếu). Không xuất kết quả nửa vời.
Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

### 2. Nạp tài liệu (Tiết lộ dần dần)

Chỉ nạp ngữ cảnh tối thiểu cần thiết từ mỗi tài liệu:

**Từ spec.md:**

- Yêu cầu chức năng (FR-###)
- Tiêu chí thành công (SC-###) — chỉ gồm mục cần công việc xây dựng được; loại trừ chỉ số kết quả sau triển khai và KPI kinh doanh
- Câu chuyện người dùng và Kịch bản chấp nhận của chúng
- Trường hợp biên (nếu có)

**Từ plan.md:**

- Lựa chọn kiến trúc/công nghệ và quyết định kỹ thuật
- Tham chiếu Mô hình dữ liệu
- Các giai đoạn và điểm chạm đã nêu tên (file/component mà plan nói sẽ tạo hoặc sửa)
- Ràng buộc kỹ thuật

**Từ tasks.md:**

- ID task (để tính ID tiếp theo và số giai đoạn tiếp theo)
- Mô tả, nhóm theo giai đoạn và đường dẫn file tham chiếu

**Từ constitution (nếu không phải mẫu chưa điền):**

- Tên nguyên tắc và phát biểu chuẩn tắc MUST/SHOULD

### 3. Xây dựng danh mục ý định

Tạo mô hình nội bộ (không lặp lại tài liệu thô):

- **Danh mục yêu cầu**: một khóa ổn định cho mỗi FR-### / SC-### / kịch bản chấp nhận của câu chuyện người dùng (ví dụ `US1/AC2`), cộng với các quyết định trong plan và nguyên tắc constitution phát sinh nghĩa vụ xây dựng được.
- **Bản đồ phạm vi code**: từ các đường dẫn file nêu trong `plan.md` và `tasks.md`, cộng với tìm kiếm từ khóa cho khái niệm mỗi yêu cầu mô tả, suy ra tập file nguồn và component thuộc phạm vi đánh giá. Giới hạn đánh giá trong đó — **không** suy diễn phạm vi ngoài tài liệu định nghĩa.

### 4. Đánh giá codebase và phân loại phát hiện

Đưa mọi task hiện có vào danh mục ý định, bất kể trạng thái checkbox hay giai đoạn Convergence: tuyên bố hoàn thành không phải bằng chứng. Kiểm chứng hành vi hiện tại theo spec, plan, tasks và constitution; với chuỗi task sửa sai, đánh giá hành vi kết quả, không phải chi tiết triển khai đã bị thay thế. Kiểm tra cả nghĩa vụ chưa đạt và phần triển khai mâu thuẫn, vượt quá hay nằm ngoài ý định đã nêu.

Với mỗi mục trong danh mục ý định, kiểm tra code hiện tại trong phạm vi và chỉ tạo `Finding` (phát hiện) khi có khoảng trống. Phân loại mỗi phát hiện theo **loại khoảng trống**:

- **`missing` (thiếu)**: công việc yêu cầu hoàn toàn vắng mặt trong code.
- **`partial` (một phần)**: việc đã có nhưng chưa đáp ứng đầy đủ yêu cầu / tiêu chí chấp nhận / quyết định trong plan.
- **`contradicts` (mâu thuẫn)**: code làm điều xung đột với ý định đã nêu hay nguyên tắc MUST của constitution.
- **`unrequested` (ngoài yêu cầu)**: code chứa việc không được spec, plan hay tasks yêu cầu (nêu để nhận biết — converge **không** xóa code, chỉ bổ sung task để rà soát/biện minh hoặc gỡ bỏ).

Mỗi `Finding` ghi: id ổn định, `source-ref` truy vết tới, `gap-type`, mức nghiêm trọng và mô tả ngắn gọn cho con người kèm bằng chứng (file/khu vực quan sát được).

**Trường hợp biên:**

- **Hầu như chưa có code**: coi toàn bộ phạm vi đã đặc tả là công việc còn lại dạng `missing` thay vì báo lỗi.
- **Không còn gì**: tạo không phát hiện và đi theo nhánh đã hội tụ ở Bước 7.

### 5. Gán mức nghiêm trọng

- **CRITICAL**: vi phạm nguyên tắc MUST của constitution, hoặc khoảng trống `missing`/`contradicts` chặn chức năng nền tảng của câu chuyện người dùng P1.
- **HIGH**: khoảng trống `missing` hay `partial` trên yêu cầu chức năng lõi hoặc tiêu chí chấp nhận.
- **MEDIUM**: khoảng trống `partial` trên yêu cầu thứ yếu, hoặc bổ sung `unrequested` chưa rõ lý do.
- **LOW**: khoảng trống một phần nhỏ, đánh bóng, hoặc bổ sung `unrequested` rủi ro thấp.

### 6. Trình bày tóm tắt phát hiện trong phiên

Trước khi bổ sung bất cứ gì, xuất tóm tắt gọn, xếp theo mức nghiêm trọng (chưa ghi file):

## Phát hiện hội tụ (Convergence Findings)

| ID | Loại khoảng trống | Mức độ | Nguồn | Bằng chứng | Việc còn lại |
|----|----------|----------|--------|----------|----------------|
| F1 | missing  | HIGH     | FR-008 | Ví dụ: không thấy cơ chế chặn ghi trong path/to/module.py khi ghi tasks.md | Thêm kiểm soát chỉ-bổ-sung |

**Chỉ số tóm tắt:**

- Yêu cầu / tiêu chí chấp nhận đã kiểm tra
- Quyết định trong plan đã kiểm tra
- Nguyên tắc constitution đã kiểm tra (hoặc "bỏ qua — mẫu chưa điền")
- Phát hiện theo loại khoảng trống (missing / partial / contradicts / unrequested)
- Phát hiện theo mức nghiêm trọng

### 7. Bổ sung task hội tụ (hoặc báo đã hội tụ)

**Nếu có một hoặc nhiều phát hiện cần hành động** (kết quả `tasks_appended` — đã bổ sung task):

Bổ sung vào **cuối** `tasks.md`, theo hợp đồng bổ sung:

1. Quét mọi ID task hiện có; gọi `M` là giá trị lớn nhất. Xác định số giai đoạn tiếp theo `N` (giai đoạn cao nhất hiện có + 1).
2. Viết một tiêu đề mục mới `## Phase N: Convergence`.
3. Phát ra một mục checklist cho mỗi phát hiện cần hành động, xếp CRITICAL/HIGH trước, gán ID đệm 0 `T{M+1:03d}, T{M+2:03d}, …`:

   ```markdown
   - [ ] T042 <mô tả mệnh lệnh> theo <source-ref> (<gap-type>)
   ```

   `<source-ref>` truy vết task về gốc: ví dụ `FR-003`, `SC-002`, `US1/AC2`, `plan: storage decision`, `Constitution II`.

   `<gap-type>` là một trong `missing`, `partial`, `contradicts`, `unrequested`.

   Task vi phạm constitution PHẢI phát ra trước và mô tả là `CRITICAL`.
4. Không bao giờ tái dùng hay đánh số lại ID hiện có. Nếu đã có giai đoạn Convergence trước, thêm giai đoạn mới đánh số riêng bên dưới — không chạm vào giai đoạn cũ.

**Nếu không có phát hiện cần hành động** (kết quả `converged` — đã hội tụ):

- **Không** sửa `tasks.md` chút nào — không thêm tiêu đề giai đoạn rỗng.
- Báo: **"✅ Đã hội tụ — bản triển khai đáp ứng spec, plan và tasks."**
- Kèm số lượng đã kiểm tra.

### 8. Đưa hành động tiếp theo (Bàn giao)

- Với `tasks_appended`: nêu đã bổ sung bao nhiêu task thuộc giai đoạn nào, và khuyến nghị chạy `/speckit.implement` để hoàn tất; lưu ý lần converge tiếp theo sẽ còn ít mục hơn hoặc không còn.
- Với `converged`: khuyến nghị tiếp tục rà soát / mở PR. Không cần thêm lượt implement cho phạm vi đã đặc tả của tính năng này.

### 9. Kiểm tra extension hooks

Sau khi ra kết quả, kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.

- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_converge`
- Nếu YAML không phân tích được hoặc không hợp lệ, không được bỏ qua trong im lặng: hãy báo cho người dùng rằng không đọc được file `.specify/extensions.yml` (kèm lỗi phân tích) và chưa kiểm tra hook nào, kể cả các hook bắt buộc (`optional: false`) đã khai báo ở đó, sau đó tiếp tục như bình thường
- Loại bỏ các hook có `enabled` là `false` một cách tường minh. Các hook không có trường `enabled` được coi là đang bật theo mặc định.
- Báo kết quả hội tụ (`converged` hay `tasks_appended`) trong phiên trước khi liệt kê hook, để người dùng quyết định có chạy lệnh tiếp theo tùy chọn không.
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
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.

- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng
