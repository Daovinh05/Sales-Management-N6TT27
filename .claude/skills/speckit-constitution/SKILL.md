---
name: "speckit-constitution"
description: "Create or update the project constitution from interactive or provided principle inputs."
argument-hint: "Principles or values for the project constitution"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/constitution.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Rào chắn phạm vi

Công việc của chính lệnh này chỉ giới hạn ở việc cập nhật constitution của dự án. Các mẫu (template) phụ thuộc và các lệnh khác đọc constitution lúc chạy và không bị sửa ở đây.

- Phân loại mọi phần trong đầu vào của người dùng thành nội dung constitution hoặc ý định riêng không thuộc quản trị.
- Nếu đầu vào gồm yêu cầu triển khai tính năng, sinh code, refactor, build hay triển khai, bạn **PHẢI KHÔNG** thực hiện chúng. Thay vào đó, tách chúng ra thành ý định hoãn lại.
- Bạn **PHẢI KHÔNG** tạo, sửa hay xóa file mã nguồn ứng dụng, route tính năng, component, test, file triển khai hay tài liệu khác không liên quan tới quy trình constitution.
- Nếu chưa rõ một chỉ dẫn có phải nội dung constitution không, hỏi làm rõ trước khi thay đổi.
- Sau khi cập nhật constitution xong, thêm mục `Next Actions` cho mỗi ý định hoãn lại. Liệt kê ý định gốc và gợi ý lệnh Spec Kit tiếp theo phù hợp, ví dụ `/speckit-specify`, mà không gọi nó.
- Nếu không có ý định phi quản trị nào, bỏ mục `Next Actions`.

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi cập nhật constitution)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_constitution`
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

Bạn đang cập nhật constitution của dự án tại `.specify/memory/constitution.md`. Khung constitution đang hiệu lực được giải quyết lúc chạy lệnh từ `constitution-template` qua ngăn xếp giải quyết preset/template của Spec Kit.

Thực hiện theo luồng sau:

1. Chạy `.specify/scripts/bash/resolve-template.sh constitution-template --json` từ thư mục gốc repo và phân tích `TEMPLATE_CONTENT` làm mẫu đang hiệu lực.
   - Bộ giải quyết chung áp dụng ghi đè của dự án, ghép các lớp preset và lớp extension trước khi về mẫu lõi. Nó PHẢI thành công mới được tiếp tục.
   - Nếu lỗi, dừng lại và báo lỗi giải quyết; không tiếp tục khi chỉ có một lớp template đóng góp.
   - Nếu `.specify/memory/constitution.md` đã tồn tại, nạp nó làm nguồn giá trị và bổ sung riêng của dự án hiện tại. Giữ lại thông tin còn dùng được khi áp khung mới vừa giải quyết.
   - Nếu chưa tồn tại, dùng mẫu đã giải quyết làm tài liệu khởi đầu.
   - Không ghi ngược vào bất kỳ lớp mẫu được version nào.
   - Nhận diện mọi token placeholder dạng `[ALL_CAPS_IDENTIFIER]`.
   **LƯU Ý**: Người dùng có thể cần ít hoặc nhiều nguyên tắc hơn số nguyên tắc trong mẫu. Nếu có con số cụ thể, hãy tôn trọng — bám mẫu chung. Bạn sẽ cập nhật tài liệu tương ứng.

2. Thu thập/suy ra giá trị cho placeholder:
   - Nếu đầu vào của người dùng (hội thoại) đã cho giá trị, dùng nó.
   - Nếu không, suy từ ngữ cảnh repo hiện có (README, docs, bản constitution trước nếu có nhúng).
   - Với ngày quản trị: `RATIFICATION_DATE` là ngày thông qua gốc (nếu không biết thì hỏi hoặc đánh dấu TODO), `LAST_AMENDED_DATE` là hôm nay nếu có thay đổi, nếu không giữ ngày cũ.
   - `CONSTITUTION_VERSION` phải tăng theo quy tắc version ngữ nghĩa:
     - MAJOR: Gỡ bỏ hoặc định nghĩa lại quản trị/nguyên tắc gây không tương thích ngược.
     - MINOR: Thêm nguyên tắc/mục mới hoặc mở rộng đáng kể hướng dẫn.
     - PATCH: Làm rõ, chỉnh lời văn, sửa typo, tinh chỉnh không đổi ngữ nghĩa.
   - Nếu kiểu tăng version chưa rõ, nêu lý do trước khi chốt.

3. Soạn nội dung constitution cập nhật dùng mẫu đã giải quyết làm cấu trúc bắt buộc:
   - Thay mọi placeholder bằng văn bản cụ thể (không còn token ngoặc vuông trừ khe mẫu cố tình giữ lại mà dự án chọn chưa định nghĩa — phải giải thích tường minh chỗ giữ lại).
   - Giữ thứ bậc tiêu đề và có thể xóa comment khi đã thay thế xong trừ khi chúng còn hướng dẫn làm rõ hữu ích.
   - Đảm bảo mỗi mục Nguyên tắc: dòng tên ngắn gọn, đoạn văn (hoặc danh sách gạch đầu dòng) nêu quy tắc bất khả thương lượng, lý do tường minh nếu chưa hiển nhiên.
   - Đảm bảo mục Quản trị liệt kê thủ tục sửa đổi, chính sách version và kỳ vọng rà soát tuân thủ.

4. Sinh Báo cáo tác động đồng bộ (Sync Impact Report) dưới dạng comment HTML ở đầu file constitution sau khi cập nhật. Báo cáo này là nháp tạm để con người rà soát sửa đổi, không phải nội dung quản trị; dự kiến gỡ bỏ trước khi commit file constitution đã sửa.
   - Thay đổi version: cũ → mới
   - Danh sách nguyên tắc đã sửa (tiêu đề cũ → tiêu đề mới nếu đổi tên)
   - Mục đã thêm
   - Mục đã gỡ
   - TODO tiếp theo nếu có placeholder cố tình hoãn.

5. Kiểm tra trước khi xuất cuối:
   - Không còn token ngoặc vuông chưa giải thích.
   - Dòng version khớp báo cáo.
   - Ngày theo định dạng ISO YYYY-MM-DD.
   - Các nguyên tắc mang tính tuyên bố, kiểm thử được và không dùng từ mơ hồ ("should" → thay bằng lý do MUST/SHOULD phù hợp).

6. Ghi constitution hoàn chỉnh trở lại `.specify/memory/constitution.md` (ghi đè).

7. Xuất tóm tắt cuối cho người dùng gồm:
   - Version mới và lý do tăng.
   - Placeholder TODO hay mục hoãn cần làm thủ công tiếp theo.
   - Thông điệp commit gợi ý (ví dụ `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).
   - Mục `Next Actions` cho mọi ý định phi quản trị đã hoãn.

Yêu cầu trình bày & văn phong:

- Dùng tiêu đề Markdown đúng như trong mẫu (không hạ/nâng cấp).
- Ngắt dòng lý do dài để dễ đọc (<100 ký tự là đẹp) nhưng đừng ngắt gượng ép.
- Giữ một dòng trống giữa các mục.
- Tránh khoảng trắng cuối dòng.

Nếu người dùng chỉ cập nhật từng phần (ví dụ chỉ sửa một nguyên tắc), vẫn thực hiện đủ bước kiểm tra và quyết định version.

Nếu thiếu thông tin trọng yếu (ví dụ ngày thông qua thực sự không biết), chèn `TODO(<FIELD_NAME>): giải thích` và đưa vào Báo cáo tác động đồng bộ dưới dạng mục hoãn.

Chỉ ghi `.specify/memory/constitution.md`; không tạo hay sửa file mẫu nguồn.

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi cập nhật constitution)**:
Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_constitution`
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
