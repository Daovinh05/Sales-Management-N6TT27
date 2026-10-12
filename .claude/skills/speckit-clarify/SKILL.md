---
name: "speckit-clarify"
description: "Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec."
argument-hint: "Optional areas to clarify in the spec"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/clarify.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi làm rõ (clarify))**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_clarify`
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

Mục tiêu: Phát hiện và giảm mơ hồ hoặc điểm quyết định còn thiếu trong đặc tả (spec) tính năng đang làm, rồi ghi thẳng các điểm đã làm rõ vào file spec.

Lưu ý: Quy trình làm rõ này dự kiến chạy (và hoàn tất) TRƯỚC khi gọi `/speckit-plan`. Nếu người dùng nói rõ muốn bỏ qua làm rõ (ví dụ spike thăm dò), bạn có thể tiếp tục nhưng phải cảnh báo nguy cơ phải làm lại ở bước sau sẽ tăng.

Các bước thực hiện:

1. Chạy `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` từ thư mục gốc repo **một lần** (chế độ gộp `--json --paths-only` / `-Json -PathsOnly`). Phân tích các trường JSON tối thiểu:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Tùy chọn lấy `IMPL_PLAN`, `TASKS` cho các luồng nối tiếp sau này.)
   - Nếu phân tích JSON lỗi, dừng lại và hướng dẫn người dùng chạy lại `/speckit-specify` hoặc kiểm tra môi trường nhánh tính năng.
   - Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

2. **NẾU TỒN TẠI**: Nạp `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.

3. Nạp file spec hiện tại. Quét mơ hồ & bao phủ có cấu trúc theo taxonomy dưới đây. Với mỗi hạng mục, đánh trạng thái: Rõ / Một phần / Thiếu. Dựng bản đồ bao phủ nội bộ để xếp ưu tiên (không xuất bản đồ thô trừ khi sẽ không hỏi câu nào).

   Phạm vi & hành vi chức năng:
   - Mục tiêu người dùng cốt lõi & tiêu chí thành công
   - Tuyên bố ngoài phạm vi tường minh
   - Phân biệt vai trò / persona người dùng

   Lĩnh vực & mô hình dữ liệu:
   - Thực thể, thuộc tính, quan hệ
   - Quy tắc định danh & duy nhất
   - Vòng đời/chuyển trạng thái
   - Giả định khối lượng / quy mô dữ liệu

   Luồng tương tác & UX:
   - Hành trình / chuỗi người dùng trọng yếu
   - Trạng thái lỗi/rỗng/tải
   - Ghi chú accessibility hoặc bản địa hóa

   Thuộc tính chất lượng phi chức năng:
   - Hiệu năng (mục tiêu độ trễ, thông lượng)
   - Khả năng mở rộng (ngang/dọc, giới hạn)
   - Độ tin cậy & sẵn sàng (uptime, kỳ vọng khôi phục)
   - Khả năng quan sát (log, metric, tín hiệu tracing)
   - Bảo mật & riêng tư (authN/Z, bảo vệ dữ liệu, giả định đe dọa)
   - Ràng buộc tuân thủ / pháp lý (nếu có)

   Tích hợp & phụ thuộc ngoài:
   - Dịch vụ/API ngoài và chế độ lỗi
   - Định dạng import/export dữ liệu
   - Giả định giao thức/versioning

   Trường hợp biên & xử lý lỗi:
   - Kịch bản tiêu cực
   - Giới hạn tần suất / throttling
   - Giải quyết xung đột (ví dụ sửa đồng thời)

   Ràng buộc & đánh đổi:
   - Ràng buộc kỹ thuật (ngôn ngữ, lưu trữ, hosting)
   - Đánh đổi tường minh hoặc phương án đã bác

   Thuật ngữ & nhất quán:
   - Thuật ngữ chuẩn trong glossary
   - Từ đồng nghĩa tránh dùng / thuật ngữ không dùng nữa

   Tín hiệu hoàn tất:
   - Tính kiểm thử được của tiêu chí chấp nhận
   - Chỉ báo Kiểu Định nghĩa hoàn tất (Definition of Done) đo được

   Linh tinh / Placeholder:
   - Dấu TODO / quyết định chưa chốt
   - Tính từ mơ hồ ("robust", "trực quan") thiếu lượng hóa

   Với mỗi hạng mục ở trạng thái Một phần hoặc Thiếu, thêm một cơ hội đặt câu hỏi ứng viên trừ khi:
   - Làm rõ cũng không thay đổi thực chất cách triển khai hay chiến lược kiểm chứng
   - Nội dung đó cụ thể về phương pháp triển khai, so sánh tech-stack hay chia task (ghi chú nội bộ)

4. Sinh (nội bộ) hàng đợi ứng viên câu hỏi làm rõ đã xếp ưu tiên (tối đa 5). KHÔNG xuất tất cả một lúc. Áp dụng các ràng buộc:
    - Tối đa tổng cộng 5 câu hỏi cho cả phiên.
    - Mỗi câu phải trả lời được bằng MỘT trong hai cách:
       - Chọn trắc nghiệm ngắn (2–5 phương án khác nhau, loại trừ nhau), HOẶC
       - Câu trả lời một từ / cụm ngắn (ràng buộc tường minh: "Trả lời <=5 từ").
    - Chỉ gồm câu hỏi mà câu trả lời tác động thực chất tới kiến trúc, mô hình dữ liệu, chia task, thiết kế kiểm thử, hành vi UX, sẵn sàng vận hành hay kiểm chứng tuân thủ.
    - Đảm bảo cân bằng bao phủ hạng mục: ưu tiên hạng mục chưa được giải quyết có tác động lớn nhất trước; tránh hỏi hai câu tác động thấp khi một vùng tác động cao (ví dụ tư thế bảo mật) còn bỏ ngỏ.
    - Loại câu hỏi đã được trả lời, sở thích văn phong vụn vặt, hoặc chi tiết thực thi ở tầm plan (trừ khi chặn tính đúng).
    - Ưu tiên làm rõ giúp giảm nguy cơ làm lại ở bước sau hoặc tránh lệch kiểm thử chấp nhận.
    - Nếu còn hơn 5 hạng mục chưa giải quyết, chọn top 5 theo heuristic (Tác động * Mức chưa chắc chắn).

5. Vòng hỏi tuần tự (tương tác):
    - Mỗi lần trình bày ĐÚNG MỘT câu hỏi.
    - **Chất lượng viết câu hỏi (áp dụng cho mọi câu, trắc nghiệm hay trả lời ngắn):**
       - Mở đầu bằng `**Question:**` rồi viết đầy đủ câu nghi vấn kết thúc bằng `?`. Phần chữ trước `?` phải tự nó đã có nghĩa.
       - KHÔNG BAO GIỜ dùng nhãn chủ đề, tiêu đề mục hay id yêu cầu làm chính câu hỏi. Ví dụ `Acceptance device/runtime matrix (FR-023)` là KHÔNG HỢP LỆ — đó là nhãn, không phải câu hỏi.
       - Sau `?`, hậu tố duy nhất được phép là id yêu cầu/câu hỏi trong ngoặc đơn. Định dạng chính xác: `**Question:** <câu nghi vấn>?` hoặc `**Question:** <câu nghi vấn>? (FR-023)`. Không bao giờ đặt id trước `?`, và không bao giờ dùng id (đứng một mình hay kèm nhãn chủ đề) làm toàn bộ câu hỏi.
       - Ngay sau dòng câu hỏi, thêm một câu "Vì sao quan trọng" bằng lời lẽ đời thường (cái được/mất cho chấp nhận hay phát hành) trước phần khuyến nghị/lựa chọn.
       - Dùng từ ngữ đời thường; chỉ đưa thuật ngữ nếu định nghĩa ngay trong câu. Tự kiểm tra: người chưa biết Spec Kit phải trả lời được chỉ từ dòng Question. Ngắn gọn thì được; nhãn khó hiểu thì không.
    - Với câu trắc nghiệm:
       - **Phân tích mọi phương án** và xác định **phương án phù hợp nhất** dựa trên:
          - Thực hành tốt nhất cho loại dự án
          - Mẫu phổ biến trong các bản triển khai tương tự
          - Giảm rủi ro (bảo mật, hiệu năng, dễ bảo trì)
          - Phù hợp với mục tiêu hay ràng buộc tường minh của dự án thể hiện trong spec
       - Trình bày **phương án khuyến nghị nổi bật** lên đầu kèm lý do rõ ràng (1-2 câu giải thích vì sao đây là lựa chọn tốt nhất).
       - Định dạng: `**Recommended:** Option [X] - <lý do>`
       - Rồi vẽ mọi phương án dưới dạng bảng Markdown:

       | Option | Description |
       |--------|-------------|
       | A | <Mô tả phương án A> |
       | B | <Mô tả phương án B> |
       | C | <Mô tả phương án C> (thêm D/E nếu cần, tối đa 5) |
       | Short | Đưa câu trả lời ngắn khác (<=5 từ) (Chỉ gồm nếu phương án tự do thay thế phù hợp) |

       - Sau bảng, thêm: `Bạn có thể trả lời bằng chữ cái phương án (ví dụ "A"), chấp nhận khuyến nghị bằng cách nói "yes" hoặc "recommended", hoặc đưa câu trả lời ngắn của riêng bạn.`
    - Với kiểu trả lời ngắn (không có lựa chọn rời rạc ý nghĩa):
       - Đưa **câu trả lời gợi ý** dựa trên thực hành tốt nhất và ngữ cảnh.
       - Định dạng: `**Suggested:** <câu trả lời bạn đề xuất> - <lý do ngắn>`
       - Rồi xuất: `Định dạng: Câu trả lời ngắn (<=5 từ). Bạn có thể chấp nhận gợi ý bằng cách nói "yes" hoặc "suggested", hoặc đưa câu trả lời của riêng bạn.`
    - Sau khi người dùng trả lời:
       - Nếu người dùng đáp "yes", "recommended" hay "suggested", dùng khuyến nghị/gợi ý bạn đã nêu làm câu trả lời.
       - Nếu không, kiểm tra câu trả lời ánh xạ tới một phương án hay vừa khung <=5 từ.
       - Nếu mơ hồ, hỏi làm rõ nhanh (vẫn tính cùng một câu; không chuyển tiếp).
       - Khi đã đạt, ghi vào bộ nhớ làm việc (chưa ghi đĩa) rồi sang câu hỏi xếp hàng tiếp theo.
    - Dừng hỏi tiếp khi:
       - Mọi mơ hồ trọng yếu đã được giải quyết sớm (các mục còn xếp hàng trở nên không cần thiết), HOẶC
       - Người dùng ra hiệu xong ("done", "good", "no more"), HOẶC
       - Bạn đã hỏi tới 5 câu.
    - Không bao giờ hé lộ trước các câu hỏi xếp hàng sau.
    - Nếu ngay từ đầu không có câu hỏi hợp lệ, báo ngay không có mơ hồ trọng yếu.

6. Tích hợp sau MỖI câu trả lời được chấp nhận (cách cập nhật tăng dần):
    - Giữ biểu diễn spec trong bộ nhớ (nạp một lần lúc đầu) cộng nội dung file thô.
    - Với câu trả lời tích hợp đầu tiên trong phiên:
       - Đảm bảo mục `## Clarifications` tồn tại (tạo ngay sau mục bối cảnh/tổng quan cấp cao nhất theo mẫu spec nếu thiếu).
       - Dưới nó, tạo (nếu chưa có) tiêu đề con `### Session YYYY-MM-DD` cho hôm nay.
    - Nối ngay một dòng gạch đầu dòng sau khi chấp nhận: `- Q: <câu hỏi> → A: <câu trả lời cuối>`.
    - Rồi áp ngay điểm đã làm rõ vào (các) mục phù hợp nhất:
       - Mơ hồ chức năng → Cập nhật hoặc thêm gạch đầu dòng trong Yêu cầu chức năng.
       - Tương tác người dùng / phân biệt actor → Cập nhật Câu chuyện người dùng hoặc mục con Actors (nếu có) với vai trò, ràng buộc hay kịch bản đã làm rõ.
       - Hình dạng dữ liệu / thực thể → Cập nhật Mô hình dữ liệu (thêm trường, kiểu, quan hệ) giữ nguyên thứ tự; ghi ràng buộc mới ngắn gọn.
       - Ràng buộc phi chức năng → Thêm/sửa tiêu chí đo được trong Tiêu chí thành công > Kết quả đo được (chuyển tính từ mơ hồ thành metric hoặc mục tiêu tường minh).
       - Trường hợp biên / luồng tiêu cực → Thêm gạch đầu dòng mới dưới Trường hợp biên / Xử lý lỗi (hoặc tạo mục con nếu mẫu có placeholder cho nó).
       - Xung đột thuật ngữ → Chuẩn hóa thuật ngữ trên toàn spec; chỉ giữ từ gốc khi cần bằng cách thêm `(trước đây gọi là "X")` một lần.
    - Nếu điểm đã làm rõ làm mất hiệu lực phát biểu mơ hồ trước đó, thay thế phát biểu đó thay vì trùng lặp; không để lại văn bản cũ mâu thuẫn.
    - Lưu file spec SAU mỗi lần tích hợp để giảm nguy cơ mất ngữ cảnh (ghi đè nguyên tử).
    - Giữ định dạng: không sắp lại các mục không liên quan; giữ nguyên thứ bậc tiêu đề.
    - Giữ mỗi điểm làm rõ được chèn tối thiểu và kiểm thử được (tránh trôi dạt kể chuyện).

7. Kiểm tra (thực hiện sau MỖI lần ghi cộng một lượt cuối):
   - Phiên làm rõ chứa đúng một gạch đầu dòng cho mỗi câu trả lời được chấp nhận (không trùng).
   - Tổng số câu đã hỏi (được chấp nhận) ≤ 5.
   - Các mục được cập nhật không còn placeholder mơ hồ mà câu trả lời mới đáng ra đã giải quyết.
   - Không còn phát biểu cũ mâu thuẫn (quét xem các lựa chọn thay thế nay đã vô hiệu đã được gỡ).
   - Cấu trúc Markdown hợp lệ; chỉ được thêm tiêu đề mới: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Nhất quán thuật ngữ: cùng một thuật ngữ chuẩn dùng khắp các mục đã cập nhật.

8. Ghi spec đã cập nhật trở lại `FEATURE_SPEC`.

9. **Tái kiểm tra Checklist chất lượng Spec** (nếu tồn tại):
   - Kiểm tra `FEATURE_DIR/checklists/requirements.md` có tồn tại không.
   - Nếu KHÔNG tồn tại, lặng lẽ bỏ qua bước này.
   - Nếu tồn tại:
     1. Đọc file checklist.
     2. Nhận diện mọi dòng checkbox kiểu GitHub task-list — dòng khớp `- [ ]`, `- [x]` hay `- [X]` (không phân biệt hoa thường, chịu được khoảng trắng đầu dòng cho mục lồng nhau) nằm ngoài code fence. Bỏ qua mọi nội dung khác (tiêu đề, ghi chú, gạch đầu dòng không phải checkbox, metadata).
     3. Với mỗi dòng checkbox, ghi trạng thái dấu hiện tại (đã tích hay chưa) và nội dung mục vào danh sách ảnh chụp trước.
     4. Đánh giá lại từng mục checkbox theo spec **đã cập nhật** (bản vừa lưu ở bước 7).
     5. Với mỗi mục checkbox, chỉ cập nhật nếu trạng thái tích/chưa tích thực sự đổi:
        - Nếu mục nay đạt mà trước chưa tích: đổi `[ ]` thành `[x]`.
        - Nếu mục nay lỗi mà trước đã tích: đổi `[x]`/`[X]` thành `[ ]`.
        - Nếu trạng thái không đổi: giữ dấu như cũ (giữ nguyên hoa/thường để tránh diff hình thức).
     6. Lưu file checklist đã cập nhật. **Chỉ bật phần dấu `[ ]`/`[x]` của dòng checkbox có đổi trạng thái.** Mọi nội dung khác — tiêu đề, metadata, ghi chú, thứ tự dòng, khoảng trắng — phải giữ nguyên để tránh diff nhiễu.
     7. So ảnh chụp trước với trạng thái hiện tại để tính ba danh sách cho Báo cáo hoàn tất:
        - **Mới đạt**: mục chuyển từ chưa tích sang đã tích.
        - **Hồi quy**: mục chuyển từ đã tích sang chưa tích.
        - **Vẫn chưa**: mục vẫn chưa tích.
     8. Ghi số lượng đạt trước/sau dạng đã tích/tổng mục checkbox (ví dụ "12/16 → 15/16 mục đạt").

Quy tắc hành xử:

- Nếu không thấy mơ hồ có ý nghĩa (hoặc mọi câu hỏi tiềm năng đều tác động thấp), đáp: "Không phát hiện mơ hồ trọng yếu nào đáng làm rõ chính thức." và gợi ý tiếp tục.
- Nếu thiếu file spec, hướng dẫn người dùng chạy `/speckit-specify` trước (không tạo spec mới ở đây).
- Không bao giờ hỏi quá tổng cộng 5 câu (lần hỏi lại làm rõ cho cùng một câu không tính là câu mới).
- Tránh câu hỏi suy đoán về tech stack trừ khi thiếu nó thì chặn độ rõ chức năng.
- Tôn trọng tín hiệu dừng sớm của người dùng ("stop", "done", "proceed").
- Nếu không hỏi câu nào vì đã bao phủ đủ, xuất tóm tắt bao phủ gọn (mọi hạng mục đều Rõ) rồi gợi ý đi tiếp.
- Nếu đã hết quota mà còn hạng mục tác động cao chưa giải quyết, gắn cờ tường minh dưới dạng Deferred kèm lý do.

Ngữ cảnh để xếp ưu tiên: $ARGUMENTS

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn tất mục này trước khi báo hoàn tất cho người dùng.**

Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_clarify`, bỏ qua tới Báo cáo hoàn tất.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_clarify`.
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

Báo cáo hoàn tất (sau khi vòng hỏi kết thúc hoặc dừng sớm):
- Số câu hỏi đã hỏi & đã trả lời.
- Đường dẫn tới spec đã cập nhật.
- Các mục đã chạm tới (liệt kê tên).
- Trạng thái checklist chất lượng spec (nếu `FEATURE_DIR/checklists/requirements.md` đã được tái kiểm tra): hiện số đạt trước/sau (ví dụ "Checklist chất lượng Spec: 12/16 → 15/16 mục đạt") và liệt kê mục đổi trạng thái — cả mục mới tích (chưa tích → đã tích) lẫn hồi quy (đã tích → chưa tích). Nếu còn mục chưa tích, liệt kê là điểm cần chú ý.
- Bảng tóm tắt bao phủ liệt kê mỗi hạng mục taxonomy với Trạng thái: Đã giải quyết (trước là Một phần/Thiếu và đã xử lý), Tạm hoãn (vượt quota câu hỏi, hoặc nội dung còn lại cụ thể về phương pháp triển khai, so sánh tech-stack hay chia task), Đã rõ (vốn đã đủ), Còn tồn (vẫn Một phần/Thiếu nhưng tác động thấp).
- Nếu còn Tồn hoặc Tạm hoãn, khuyến nghị nên tiếp tục tới `/speckit-plan` hay chạy lại `/speckit-clarify` sau khi có plan.
- Lệnh tiếp theo gợi ý.

## Điều kiện xong

- [ ] Mơ hồ trong spec đã được nhận diện và điểm làm rõ đã tích hợp vào file spec
- [ ] Checklist chất lượng spec đã tái kiểm tra theo spec mới (nếu `FEATURE_DIR/checklists/requirements.md` tồn tại)
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo đúng quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn tất cho người dùng kèm số câu đã trả lời, mục đã chạm, trạng thái checklist và tóm tắt bao phủ
