---
description: Create or update the project constitution from interactive or provided principle inputs.
handoffs:
  - label: Build Specification
    agent: speckit.specify
    prompt: Implement the feature specification based on the updated constitution. I want to build...
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Vùng giới hạn phạm vi

Công việc của riêng lệnh này giới hạn ở việc cập nhật bản hiến pháp dự án (constitution) mà thôi. Các mẫu và lệnh phụ thuộc đọc constitution lúc chạy và không bị sửa ở đây.

- Phân loại mọi phần trong đầu vào của người dùng thành nội dung constitution hoặc ý định riêng không thuộc quản trị.
- Nếu đầu vào gồm yêu cầu triển khai tính năng, sinh code, tái cấu trúc, build hoặc triển khai, bạn **PHẢI KHÔNG** thực thi chúng. Hãy tách ra thành các ý định hoãn lại.
- Bạn **PHẢI KHÔNG** tạo, sửa hay xóa file mã nguồn ứng dụng, route tính năng, component, test, file triển khai hay tài liệu khác không liên quan tới quy trình constitution.
- Nếu chưa rõ một chỉ dẫn có phải nội dung constitution không, hãy hỏi làm rõ trước khi thay đổi.
- Sau khi cập nhật constitution xong, hãy đưa mục `Next Actions` (Việc tiếp theo) cho mỗi ý định hoãn lại. Liệt kê ý định gốc và gợi ý lệnh Spec Kit phù hợp tiếp theo, ví dụ `/speckit.specify`, mà không gọi nó.
- Nếu không có ý định phi quản trị nào, bỏ mục `Next Actions`.

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi cập nhật constitution)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_constitution`
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

Bạn đang cập nhật bản hiến pháp dự án (constitution) tại `.specify/memory/constitution.md`. Khung constitution đang dùng được giải quyết lúc chạy lệnh từ `constitution-template` qua ngăn xếp giải quyết preset/template của Spec Kit.

Làm theo luồng thực thi sau:

1. Chạy `.specify/scripts/bash/resolve-template.sh constitution-template --json` từ thư mục gốc repo và phân tích `TEMPLATE_CONTENT` làm mẫu đang dùng.
   - Bộ giải quyết chung áp dụng ghi đè của dự án, ghép các lớp preset và lớp extension trước khi dùng mẫu lõi dự phòng. Nó PHẢI thành công trước khi tiếp tục.
   - Nếu thất bại, dừng lại và báo lỗi giải quyết; không tiếp tục khi chỉ có một lớp mẫu đóng góp.
   - Nếu `.specify/memory/constitution.md` đã tồn tại, nạp nó làm nguồn giá trị và bổ sung đặc thù dự án hiện tại. Giữ lại thông tin vẫn còn đúng khi áp khung mới vừa giải quyết.
   - Nếu chưa tồn tại, dùng mẫu đã giải quyết làm tài liệu khởi đầu.
   - Không ghi ngược vào bất kỳ lớp mẫu được version hóa nào.
   - Xác định mọi token placeholder dạng `[ALL_CAPS_IDENTIFIER]`.
   **QUAN TRỌNG**: Người dùng có thể cần ít hoặc nhiều nguyên tắc hơn mẫu. Nếu có con số cụ thể, hãy tôn trọng — bám theo mẫu chung. Bạn sẽ cập nhật tài liệu tương ứng.

2. Thu thập/suy ra giá trị cho các placeholder:
   - Nếu đầu vào của người dùng (hội thoại) có giá trị, dùng nó.
   - Ngược lại suy ra từ ngữ cảnh repo hiện có (README, docs, bản constitution trước nếu có nhúng).
   - Với ngày quản trị: `RATIFICATION_DATE` là ngày thông qua gốc (nếu không rõ thì hỏi hoặc đánh dấu TODO), `LAST_AMENDED_DATE` là hôm nay nếu có thay đổi, ngược lại giữ ngày cũ.
   - `CONSTITUTION_VERSION` phải tăng theo quy tắc version ngữ nghĩa:
     - MAJOR: Loại bỏ hay định nghĩa lại quản trị/nguyên tắc gây không tương thích ngược.
     - MINOR: Thêm nguyên tắc/mục mới hoặc mở rộng đáng kể hướng dẫn.
     - PATCH: Làm rõ, chỉnh chữ, sửa lỗi chính tả, tinh chỉnh không đổi ngữ nghĩa.
   - Nếu loại tăng version chưa rõ, nêu lý do trước khi chốt.

3. Soạn thảo nội dung constitution cập nhật dùng mẫu đã giải quyết làm cấu trúc bắt buộc:
   - Thay mọi placeholder bằng văn bản cụ thể (không còn token ngoặc vuông trừ khe mẫu cố ý giữ lại mà dự án chọn chưa định nghĩa — phải giải thích rõ chỗ giữ lại).
   - Giữ nguyên thứ bậc tiêu đề và có thể xóa comment khi đã thay thế xong trừ khi chúng vẫn còn hướng dẫn làm rõ.
   - Đảm bảo mỗi mục Nguyên tắc: dòng tên ngắn gọn, đoạn văn (hoặc danh sách gạch đầu dòng) nêu quy tắc không thể thương lượng, lý do tường minh nếu chưa hiển nhiên.
   - Đảm bảo mục Quản trị liệt kê thủ tục sửa đổi, chính sách version và kỳ vọng rà soát tuân thủ.

4. Sinh Báo cáo tác động đồng bộ (Sync Impact Report) dưới dạng comment HTML ở đầu file constitution sau khi cập nhật. Báo cáo này là tài liệu nháp tạm để con người rà soát sửa đổi, không phải nội dung quản trị; nó được kỳ vọng sẽ xóa trước khi commit file constitution đã sửa.
   - Thay đổi version: cũ → mới
   - Danh sách nguyên tắc đã sửa (tiêu đề cũ → tiêu đề mới nếu đổi tên)
   - Mục đã thêm
   - Mục đã xóa
   - TODO tiếp theo nếu có placeholder cố ý hoãn.

5. Kiểm tra hợp lệ trước khi xuất cuối:
   - Không còn token ngoặc vuông chưa giải thích.
   - Dòng version khớp báo cáo.
   - Ngày tháng định dạng ISO YYYY-MM-DD.
   - Các nguyên tắc mang tính tuyên bố, kiểm thử được, không dùng ngôn ngữ mơ hồ ("should" → thay bằng lý do MUST/SHOULD phù hợp).

6. Ghi constitution hoàn chỉnh trở lại `.specify/memory/constitution.md` (ghi đè).

7. Xuất tóm tắt cuối cho người dùng gồm:
   - Version mới và lý do tăng.
   - Mọi placeholder TODO hay mục hoãn cần theo dõi thủ công.
   - Thông điệp commit gợi ý (ví dụ: `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).
   - Mục `Next Actions` (Việc tiếp theo) cho mọi ý định phi quản trị đã hoãn.

Yêu cầu định dạng & phong cách:

- Dùng tiêu đề Markdown đúng như trong mẫu (không hạ/tăng cấp).
- Ngắt dòng lý do dài để dễ đọc (<100 ký tự là lý tưởng) nhưng không ép ngắt vụng về.
- Giữ một dòng trống giữa các mục.
- Tránh khoảng trắng cuối dòng.

Nếu người dùng chỉ cập nhật từng phần (ví dụ: chỉ sửa một nguyên tắc), vẫn thực hiện đủ bước kiểm định và quyết định version.

Nếu thiếu thông tin trọng yếu (ví dụ: thực sự không rõ ngày thông qua), chèn `TODO(<FIELD_NAME>): explanation` và đưa vào Báo cáo tác động đồng bộ dưới mục hoãn lại.

Chỉ ghi file `.specify/memory/constitution.md`; không tạo hay sửa file mẫu nguồn.

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi cập nhật constitution)**:
Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_constitution`
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
