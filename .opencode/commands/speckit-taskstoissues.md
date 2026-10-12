---
description: "Deprecated: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts."
tools: ['github/github-mcp-server/list_issues', 'github/github-mcp-server/issue_write']
---

## Thông báo ngừng hỗ trợ

Bạn **PHẢI hiển thị cảnh báo ngắn gọn sau trước tiên**, là bước đầu tiên của lệnh này và trước các mục Đầu vào người dùng và Kiểm tra trước khi thực thi bên dưới:

> ⚠️ `/speckit.taskstoissues` đã lỗi thời và sẽ bị xóa trong một bản minor tới. Hãy dùng extension `github` đi kèm: chạy `specify extension add github`, rồi gọi `/speckit.github.taskstoissues`.

Tiếp tục quy trình hiện có không đổi. Không tự cài hay bật extension, không dừng lại, và không chạy lệnh thay thế.

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi chuyển tasks thành issues)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_taskstoissues`
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

1. Chạy `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` từ thư mục gốc repo và phân tích danh sách FEATURE_DIR và AVAILABLE_DOCS. Mọi đường dẫn phải là tuyệt đối. Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").
1. **NẾU TỒN TẠI**: Nạp file `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.
1. Từ script đã chạy, trích đường dẫn tới **tasks**.
1. Lấy Git remote bằng cách chạy:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> CHỈ TIẾP TỤC CÁC BƯỚC TIẾP THEO NẾU REMOTE LÀ URL GITHUB

1. **Lấy issue hiện có để khử trùng lặp**: Trước khi tạo gì, dựng tập ID task sắp xử lý từ `tasks.md` (mỗi ID là chữ `T` kèm **ít nhất** ba chữ số, ví dụ `T001` — `/speckit.converge` gán ID mới bằng `T{M+1:03d}`, đây là sàn chứ không phải trần, nên khi file có hơn 999 task thì ID dài bốn chữ số trở lên). Sau đó dùng công cụ `list_issues` của GitHub MCP server để tìm issue đã bao phủ các ID đó. Không truyền giá trị `state`, vì bỏ trống sẽ khiến công cụ trả về cả issue mở lẫn đóng. Yêu cầu `perPage: 100` để giảm số lần gọi, và vì công cụ dùng phân trang bằng con trỏ, hãy xin trang bằng tham số `after` (dùng `endCursor` từ phản hồi trước). Với mỗi tiêu đề issue, khớp nó với mẫu ID task `\bT\d{3,}\b` (lượng `{3,}` chấp nhận ID bốn chữ số trở lên — với `\d{3}` thì tiêu đề chứa `T1000` sẽ không khớp chút nào, vì `\b` cuối không thể rơi giữa hai chữ số, khiến task đó lặng lẽ vừa không khử trùng vừa không tạo; ranh giới từ vẫn chặn token kiểu `ST001` khớp nhầm, và buộc nuốt trọn dãy số để `T100` không bao giờ khớp trong `T1000`; điều này cũng nhận diện tiêu đề dạng `T001 ...`, `T001: ...` hay `[T001] ...`) và, khi khớp với một ID task của bạn, đánh dấu ID đó đã có issue. Dừng phân trang ngay khi mọi ID task đã khớp, hoặc khi hết trang, để không lấy mãi toàn bộ lịch sử issue của repo khi mọi ID đã đủ. Cách này giới hạn số lần gọi trên repo có lịch sử issue lớn mà vẫn tránh trùng khi lệnh chạy lại sau khi `tasks.md` tái sinh hay skill gọi lại.
1. Với mỗi task trong danh sách, dùng GitHub MCP server để tạo issue mới trong repository đại diện cho Git remote. Dòng task trong `tasks.md` bắt đầu bằng checkbox markdown, nên trước tiên hãy lột phần mở đầu `- [ ]` (và mọi dấu `[P]` / `[US#]`) để lấy ID task và mô tả. Tạo issue với tiêu đề chuẩn duy nhất dạng `T001: <description>`, với ID viết một lần kèm mô tả task (ví dụ: dòng `- [ ] T001 Create project structure` thành tiêu đề `T001: Create project structure`).
   - **Bỏ qua** mọi task mà ID đã có trong tập issue hiện có từ bước trước, và báo lại (ví dụ: `T001 already has an issue, skipping`).
   - Chỉ tạo issue cho task chưa có issue khớp.

> [!CAUTION]
> KHÔNG BAO GIỜ TẠO ISSUE TRONG REPO KHÔNG KHỚP URL REMOTE DƯỚI MỌI HOÀN CẢNH

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi chuyển tasks thành issues)**:
Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_taskstoissues`
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
