---
name: "speckit-taskstoissues"
description: "Deprecated: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts."
argument-hint: "Optional filter or label for GitHub issues"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/taskstoissues.md"
user-invocable: true
disable-model-invocation: false
---


## Thông báo ngừng hỗ trợ

Bạn **PHẢI hiển thị cảnh báo ngắn gọn sau trước tiên**, ở bước đầu tiên của lệnh này và trước các mục Đầu vào người dùng và Kiểm tra trước khi thực thi dưới đây:

> ⚠️ `/speckit-taskstoissues` đã ngừng hỗ trợ và sẽ bị gỡ trong một bản minor tới. Hãy dùng extension `github` đi kèm: chạy `specify extension add github`, rồi gọi `/speckit-github-taskstoissues`.

Tiếp tục quy trình hiện có như cũ. Không tự cài hay bật extension, không dừng lại, và không chạy lệnh thay thế.

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi chuyển tasks thành issues)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_taskstoissues`
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
1. **NẾU CÓ**: Nạp `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.
1. Từ script đã chạy, trích đường dẫn tới **tasks**.
1. Lấy Git remote bằng cách chạy:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> CHỈ SANG BƯỚC TIẾP THEO NẾU REMOTE LÀ URL GITHUB

1. **Lấy issue hiện có để khử trùng**: Trước khi tạo gì, dựng tập ID task bạn sắp xử lý từ `tasks.md` (mỗi ID là chữ `T` theo sau là **ít nhất** ba chữ số, ví dụ `T001` — `/speckit-converge` gán ID mới bằng `T{M+1:03d}`, đây là mức sàn chứ không phải trần, nên khi file có hơn 999 task thì ID dài bốn chữ số trở lên). Rồi dùng công cụ `list_issues` của GitHub MCP server để tìm issue đã bao các ID đó. Đừng truyền giá trị `state`, vì bỏ trống nó khiến công cụ trả cả issue mở lẫn đóng. Yêu cầu `perPage: 100` để giảm số lần gọi, và vì công cụ dùng phân trang bằng con trỏ, yêu cầu từng trang bằng tham số `after` (dùng `endCursor` từ phản hồi trước). Với mỗi tiêu đề issue, khớp nó với mẫu ID task `\bT\d{3,}\b` (`{3,}` chấp nhận ID bốn chữ số trở lên — với `\d{3}` thì tiêu đề chứa `T1000` sẽ không khớp chút nào, vì ranh giới `\b` sau không thể rơi giữa hai chữ số, khiến task đó lặng lẽ vừa không khử trùng vừa không được tạo; ranh giới từ vẫn chặn token kiểu `ST001` khớp nhầm, và buộc nuốt trọn dãy số để `T100` không bao giờ khớp bên trong `T1000`; cách này cũng nhận tiêu đề viết dạng `T001 ...`, `T001: ...` hay `[T001] ...`) và khi khớp một ID task của bạn, đánh dấu ID đó đã có issue. Dừng phân trang ngay khi mọi ID task đã khớp, hoặc khi hết trang, để không lấy mãi toàn bộ lịch sử issue của repo khi mọi ID task đã đủ. Việc này giới hạn số lần gọi trên repo có lịch sử issue lớn mà vẫn tránh trùng khi lệnh chạy lại sau khi `tasks.md` được sinh lại hay skill được gọi lại.
1. Với mỗi task trong danh sách, dùng GitHub MCP server tạo issue mới trong repo đại diện cho Git remote. Dòng task trong `tasks.md` bắt đầu bằng checkbox markdown, nên trước tiên lột phần đầu `- [ ]` (và mọi dấu `[P]` / `[US#]`) để lấy lại ID task và mô tả. Tạo issue với một tiêu đề chuẩn duy nhất dạng `T001: <description>`, với ID viết một lần rồi tới mô tả task (ví dụ dòng `- [ ] T001 Create project structure` thành tiêu đề `T001: Create project structure`).
   - **Bỏ qua** mọi task có ID đã hiện diện trong tập issue hiện có từ bước trước, và báo lại (ví dụ `T001 already has an issue, skipping`).
   - Chỉ tạo issue cho task chưa có issue khớp.

> [!CAUTION]
> KHÔNG BAO GIỜ TẠO ISSUE TRONG REPO KHÔNG KHỚP URL REMOTE DƯỚI MỌI HÌNH THỨC

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi chuyển tasks thành issues)**:
Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_taskstoissues`
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
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng
