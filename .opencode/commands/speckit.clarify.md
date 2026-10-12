---
description: Identify underspecified areas in the current feature spec by asking up to 5 highly targeted clarification questions and encoding answers back into the spec.
handoffs:
  - label: Build Technical Plan
    agent: speckit.plan
    prompt: Create a plan for the spec. I am building with...
---

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi làm rõ - clarify)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_clarify`
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

Mục tiêu: Phát hiện và giảm mơ hồ hoặc điểm quyết định còn thiếu trong đặc tả (spec) của tính năng đang làm, rồi ghi các làm rõ trực tiếp vào file spec.

Lưu ý: Quy trình làm rõ (clarify) này được kỳ vọng chạy (và hoàn tất) TRƯỚC khi gọi `/speckit.plan`. Nếu người dùng nói rõ muốn bỏ qua làm rõ (ví dụ: spike thăm dò), bạn có thể tiếp tục, nhưng phải cảnh báo rủi ro phải làm lại ở bước sau sẽ tăng lên.

Các bước thực thi:

1. Chạy `.specify/scripts/bash/check-prerequisites.sh --json --paths-only` từ thư mục gốc repo **một lần** (chế độ gộp `--json --paths-only` / `-Json -PathsOnly`). Phân tích các trường JSON tối thiểu:
   - `FEATURE_DIR`
   - `FEATURE_SPEC`
   - (Có thể lấy thêm `IMPL_PLAN`, `TASKS` cho các luồng nối tiếp sau này.)
   - Nếu phân tích JSON thất bại, dừng lại và hướng dẫn người dùng chạy lại `/speckit.specify` hoặc kiểm tra môi trường nhánh tính năng.
   - Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

2. **NẾU TỒN TẠI**: Nạp file `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.

3. Nạp file spec hiện tại. Thực hiện quét mơ hồ & bao phủ có cấu trúc theo phân loại dưới đây. Với mỗi nhóm, đánh dấu trạng thái: Rõ / Một phần / Thiếu. Tạo bản đồ bao phủ nội bộ để ưu tiên (không xuất bản đồ thô trừ khi sẽ không hỏi câu nào).

   Phạm vi & hành vi chức năng:
   - Mục tiêu cốt lõi của người dùng & tiêu chí thành công
   - Tuyên bố tường minh ngoài phạm vi
   - Phân biệt vai trò / persona người dùng

   Lĩnh vực & mô hình dữ liệu:
   - Thực thể, thuộc tính, quan hệ
   - Quy tắc định danh & duy nhất
   - Vòng đời/chuyển trạng thái
   - Giả định khối lượng / quy mô dữ liệu

   Luồng tương tác & UX:
   - Hành trình / chuỗi thao tác trọng yếu của người dùng
   - Trạng thái lỗi/rỗng/đang tải
   - Ghi chú trợ năng hoặc bản địa hóa

   Thuộc tính chất lượng phi chức năng:
   - Hiệu năng (mục tiêu độ trễ, thông lượng)
   - Khả năng mở rộng (ngang/dọc, giới hạn)
   - Độ tin cậy & sẵn sàng (uptime, kỳ vọng khôi phục)
   - Khả năng quan sát (logging, metrics, tín hiệu tracing)
   - Bảo mật & riêng tư (authN/Z, bảo vệ dữ liệu, giả định đe dọa)
   - Ràng buộc tuân thủ / pháp lý (nếu có)

   Tích hợp & phụ thuộc bên ngoài:
   - Dịch vụ/API bên ngoài và chế độ lỗi
   - Định dạng nhập/xuất dữ liệu
   - Giả định giao thức/phiên bản

   Trường hợp biên & xử lý lỗi:
   - Kịch bản tiêu cực
   - Giới hạn tần suất / tiết lưu
   - Giải quyết xung đột (ví dụ: sửa đồng thời)

   Ràng buộc & đánh đổi:
   - Ràng buộc kỹ thuật (ngôn ngữ, lưu trữ, hosting)
   - Đánh đổi tường minh hoặc phương án đã bác

   Thuật ngữ & nhất quán:
   - Thuật ngữ chuẩn trong bảng thuật ngữ
   - Từ đồng nghĩa tránh dùng / thuật ngữ lỗi thời

   Tín hiệu hoàn thành:
   - Tính kiểm thử được của tiêu chí chấp nhận
   - Chỉ báo kiểu Định nghĩa hoàn thành đo lường được

   Linh tinh / Placeholder:
   - Dấu TODO / quyết định chưa giải quyết
   - Tính từ mơ hồ ("mạnh mẽ", "trực quan") thiếu lượng hóa

   Với mỗi nhóm ở trạng thái Một phần hoặc Thiếu, thêm một cơ hội đặt câu hỏi ứng viên trừ khi:
   - Việc làm rõ không làm thay đổi thực chất chiến lược triển khai hay kiểm thử
   - Mục đó cụ thể về cách triển khai, so sánh công nghệ, hay chia nhỏ task (ghi chú nội bộ)

4. Sinh (nội bộ) hàng đợi câu hỏi làm rõ ứng viên theo thứ tự ưu tiên (tối đa 5). KHÔNG xuất tất cả cùng lúc. Áp dụng các ràng buộc:
    - Tối đa tổng cộng 5 câu hỏi trong cả phiên.
    - Mỗi câu phải trả lời được bằng MỘT trong hai cách:
       - Chọn một đáp án trắc nghiệm ngắn (2–5 lựa chọn phân biệt, loại trừ nhau), HOẶC
       - Câu trả lời một từ / cụm ngắn (ràng buộc rõ: "Trả lời <=5 từ").
    - Chỉ đưa câu hỏi mà câu trả lời tác động thực chất tới kiến trúc, mô hình dữ liệu, chia task, thiết kế kiểm thử, hành vi UX, sẵn sàng vận hành, hoặc kiểm định tuân thủ.
    - Đảm bảo cân bằng bao phủ nhóm: ưu tiên nhóm chưa giải quyết có tác động lớn nhất trước; tránh hỏi hai câu tác động thấp khi còn một vùng tác động cao (ví dụ: tư thế bảo mật) chưa giải quyết.
    - Loại trừ câu hỏi đã được trả lời, sở thích phong cách vụn vặt, hoặc chi tiết thực thi ở tầng plan (trừ khi chặn tính đúng đắn).
    - Ưu tiên các làm rõ giúp giảm rủi ro làm lại ở bước sau hoặc tránh lệch kiểm thử chấp nhận.
    - Nếu còn hơn 5 nhóm chưa giải quyết, chọn 5 nhóm đứng đầu theo cách ước lượng (Tác động * Mức chưa chắc chắn).

5. Vòng hỏi tuần tự (tương tác):
    - Mỗi lần trình bày ĐÚNG MỘT câu hỏi.
    - **Chất lượng viết câu hỏi (áp dụng cho mọi câu, trắc nghiệm hay trả lời ngắn):**
       - Mở đầu bằng `**Question:**` kèm một câu hỏi đầy đủ kết thúc bằng `?`. Phần chữ trước dấu `?` phải tự nó đã có nghĩa.
       - KHÔNG BAO GIỜ dùng nhãn chủ đề, tiêu đề mục, hay id yêu cầu làm câu hỏi. Ví dụ `Acceptance device/runtime matrix (FR-023)` là KHÔNG HỢP LỆ — đó là nhãn, không phải câu hỏi.
       - Sau dấu `?`, hậu tố duy nhất cho phép là id yêu cầu/câu hỏi trong ngoặc đơn. Định dạng đúng: `**Question:** <câu hỏi>?` hoặc `**Question:** <câu hỏi>? (FR-023)`. Không bao giờ đặt id trước dấu `?`, và không bao giờ dùng id (riêng lẻ hay kèm nhãn chủ đề) làm toàn bộ câu hỏi.
       - Ngay sau dòng câu hỏi, thêm một câu "Vì sao quan trọng" bằng ngôn ngữ đời thường (cái giá cho việc chấp nhận hay phát hành) trước phần khuyến nghị/lựa chọn.
       - Dùng từ ngữ đời thường; chỉ đưa thuật ngữ chuyên môn nếu định nghĩa ngay trong cùng câu. Tự kiểm tra: người chưa biết Spec Kit vẫn trả lời được chỉ từ dòng Question. Ngắn gọn thì được; ghi nhãn khó hiểu thì không.
    - Với câu trắc nghiệm:
       - **Phân tích mọi phương án** và xác định **phương án phù hợp nhất** dựa trên:
          - Thực hành tốt nhất cho loại dự án
          - Mẫu phổ biến trong các triển khai tương tự
          - Giảm rủi ro (bảo mật, hiệu năng, dễ bảo trì)
          - Phù hợp với mục tiêu hay ràng buộc tường minh trong spec
       - Trình bày **phương án khuyến nghị nổi bật** lên đầu kèm lý do rõ ràng (1-2 câu giải thích vì sao đây là lựa chọn tốt nhất).
       - Định dạng: `**Recommended:** Option [X] - <lý do>`
       - Sau đó hiển thị mọi phương án dưới dạng bảng Markdown:

       | Option | Description |
       |--------|-------------|
       | A | <Mô tả phương án A> |
       | B | <Mô tả phương án B> |
       | C | <Mô tả phương án C> (thêm D/E nếu cần, tối đa 5) |
       | Short | Đưa câu trả lời ngắn khác (<=5 từ) (Chỉ đưa vào nếu phương án tự do là phù hợp) |

       - Sau bảng, thêm: `Bạn có thể trả lời bằng chữ cái (ví dụ: "A"), chấp nhận khuyến nghị bằng cách nói "yes" hoặc "recommended", hoặc đưa câu trả lời ngắn của riêng bạn.`
    - Với kiểu trả lời ngắn (không có lựa chọn rời rạc ý nghĩa):
       - Đưa **câu trả lời gợi ý** dựa trên thực hành tốt nhất và ngữ cảnh.
       - Định dạng: `**Suggested:** <câu trả lời gợi ý> - <lý do ngắn>`
       - Sau đó xuất: `Định dạng: Trả lời ngắn (<=5 từ). Bạn có thể chấp nhận gợi ý bằng cách nói "yes" hoặc "suggested", hoặc đưa câu trả lời của riêng bạn.`
    - Sau khi người dùng trả lời:
       - Nếu người dùng trả lời "yes", "recommended" hoặc "suggested", dùng khuyến nghị/gợi ý đã nêu làm câu trả lời.
       - Ngược lại, kiểm tra câu trả lời có ánh xạ tới một phương án hay vừa khung <=5 từ không.
       - Nếu mơ hồ, yêu cầu làm rõ nhanh (vẫn tính là cùng một câu; không chuyển tiếp).
       - Khi đã đạt, ghi vào bộ nhớ làm việc (chưa ghi ra đĩa) rồi chuyển sang câu tiếp theo trong hàng đợi.
    - Dừng hỏi tiếp khi:
       - Mọi mơ hồ trọng yếu đã giải quyết sớm (các mục còn lại trong hàng đợi không còn cần thiết), HOẶC
       - Người dùng ra hiệu xong ("done", "good", "no more"), HOẶC
       - Bạn đã hỏi đủ 5 câu.
    - Không bao giờ tiết lộ trước các câu hỏi trong hàng đợi.
    - Nếu ngay từ đầu không có câu hỏi hợp lệ, báo ngay không có mơ hồ trọng yếu.

6. Tích hợp sau MỖI câu trả lời được chấp nhận (cách cập nhật tăng dần):
    - Giữ biểu diễn spec trong bộ nhớ (nạp một lần lúc đầu) cộng với nội dung file thô.
    - Với câu trả lời tích hợp đầu tiên trong phiên này:
       - Đảm bảo tồn tại mục `## Clarifications` (tạo ngay sau mục bối cảnh/tổng quan cấp cao nhất theo mẫu spec nếu thiếu).
       - Dưới nó, tạo (nếu chưa có) tiêu đề con `### Session YYYY-MM-DD` cho hôm nay.
    - Bổ sung ngay một dòng gạch đầu dòng sau khi chấp nhận: `- Q: <câu hỏi> → A: <câu trả lời cuối>`.
    - Sau đó áp dụng ngay làm rõ vào (các) mục phù hợp nhất:
       - Mơ hồ chức năng → Cập nhật hoặc thêm gạch đầu dòng trong Yêu cầu chức năng.
       - Tương tác người dùng / phân biệt tác nhân → Cập nhật Câu chuyện người dùng hoặc mục Tác nhân (nếu có) với vai trò, ràng buộc hay kịch bản đã làm rõ.
       - Hình dạng dữ liệu / thực thể → Cập nhật Mô hình dữ liệu (thêm trường, kiểu, quan hệ) giữ nguyên thứ tự; ghi ràng buộc bổ sung ngắn gọn.
       - Ràng buộc phi chức năng → Thêm/sửa tiêu chí đo lường được trong Tiêu chí thành công > Kết quả đo lường (chuyển tính từ mơ hồ thành chỉ số hoặc mục tiêu tường minh).
       - Trường hợp biên / luồng tiêu cực → Thêm gạch đầu dòng mới dưới Trường hợp biên / Xử lý lỗi (hoặc tạo mục con nếu mẫu có placeholder cho nó).
       - Xung đột thuật ngữ → Chuẩn hóa thuật ngữ trên toàn spec; chỉ giữ từ gốc khi cần bằng cách thêm `(trước đây gọi là "X")` một lần.
    - Nếu làm rõ khiến phát biểu mơ hồ trước đó hết hiệu lực, hãy thay thế phát biểu đó thay vì trùng lặp; không để lại văn bản mâu thuẫn lỗi thời.
    - Lưu file spec SAU mỗi lần tích hợp để giảm rủi ro mất ngữ cảnh (ghi đè nguyên tử).
    - Giữ định dạng: không sắp xếp lại các mục không liên quan; giữ nguyên thứ bậc tiêu đề.
    - Giữ mỗi làm rõ chèn vào tối thiểu và kiểm thử được (tránh lan man).

7. Kiểm tra hợp lệ (thực hiện sau MỖI lần ghi cộng với lần duyệt cuối):
   - Phiên làm rõ chứa đúng một gạch đầu dòng cho mỗi câu trả lời được chấp nhận (không trùng).
   - Tổng số câu đã hỏi (được chấp nhận) ≤ 5.
   - Các mục đã cập nhật không còn placeholder mơ hồ mà câu trả lời mới nhằm giải quyết.
   - Không còn phát biểu mâu thuẫn cũ (quét để loại bỏ các lựa chọn thay thế nay đã hết hiệu lực).
   - Cấu trúc Markdown hợp lệ; chỉ được thêm tiêu đề mới: `## Clarifications`, `### Session YYYY-MM-DD`.
   - Nhất quán thuật ngữ: cùng một thuật ngữ chuẩn dùng xuyên suốt các mục đã cập nhật.

8. Ghi spec đã cập nhật trở lại `FEATURE_SPEC`.

9. **Tái kiểm định Checklist chất lượng Spec** (nếu tồn tại):
   - Kiểm tra file `FEATURE_DIR/checklists/requirements.md` có tồn tại không.
   - Nếu KHÔNG tồn tại, lặng lẽ bỏ qua bước này.
   - Nếu tồn tại:
     1. Đọc file checklist.
     2. Xác định mọi dòng checkbox kiểu GitHub — dòng khớp `- [ ]`, `- [x]` hoặc `- [X]` (không phân biệt hoa thường, chấp nhận thụt đầu dòng cho mục lồng nhau) nằm ngoài code fence. Bỏ qua mọi nội dung khác (tiêu đề, ghi chú, gạch đầu dòng không phải checkbox, metadata).
     3. Với mỗi dòng checkbox, ghi lại trạng thái dấu hiện tại (đã tích hay chưa) và nội dung mục vào danh sách ảnh chụp trước.
     4. Đánh giá lại từng mục checkbox theo **spec đã cập nhật** (bản vừa lưu ở bước 7).
     5. Với mỗi mục checkbox, chỉ cập nhật nếu trạng thái tích/bỏ tích thực sự thay đổi:
        - Nếu mục nay đạt mà đang bỏ trống: đổi `[ ]` thành `[x]`.
        - Nếu mục nay trượt mà đang tích: đổi `[x]`/`[X]` thành `[ ]`.
        - Nếu trạng thái không đổi: giữ nguyên dấu (giữ nguyên chữ hoa/thường để tránh diff mỹ phẩm).
     6. Lưu file checklist đã cập nhật. **Chỉ bật tắt phần dấu `[ ]`/`[x]` của các dòng checkbox đổi trạng thái.** Mọi nội dung khác — tiêu đề, metadata, ghi chú, thứ tự dòng, khoảng trắng — phải giữ nguyên để tránh diff nhiễu.
     7. So ảnh chụp trước với trạng thái hiện tại để tính ba danh sách cho Báo cáo hoàn thành:
        - **Mới đạt**: mục chuyển từ chưa tích sang đã tích.
        - **Hồi quy**: mục chuyển từ đã tích sang chưa tích.
        - **Vẫn chưa đạt**: mục vẫn chưa tích.
     8. Ghi số lượng đạt trước/sau dưới dạng đã tích/tổng số mục checkbox (ví dụ: "12/16 → 15/16 mục đạt").

Quy tắc hành xử:

- Nếu không thấy mơ hồ có ý nghĩa (hoặc mọi câu hỏi tiềm năng đều tác động thấp), trả lời: "Không phát hiện mơ hồ trọng yếu nào đáng làm rõ chính thức." và gợi ý tiếp tục.
- Nếu thiếu file spec, hướng dẫn người dùng chạy `/speckit.specify` trước (không tạo spec mới ở đây).
- Không bao giờ hỏi quá tổng cộng 5 câu (lần hỏi lại làm rõ cho cùng một câu không tính là câu mới).
- Tránh câu hỏi suy đoán về công nghệ trừ khi thiếu nó sẽ chặn độ rõ chức năng.
- Tôn trọng tín hiệu dừng sớm của người dùng ("stop", "done", "proceed").
- Nếu không hỏi câu nào nhờ bao phủ đầy đủ, xuất tóm tắt bao phủ gọn (mọi nhóm đều Rõ) rồi gợi ý bước tiếp.
- Nếu đã hết quota mà còn nhóm tác động cao chưa giải quyết, gắn cờ tường minh dưới mục Hoãn lại kèm lý do.

Ngữ cảnh để ưu tiên: $ARGUMENTS

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn thành mục này trước khi báo hoàn thành cho người dùng.**

Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_clarify`, bỏ qua tới Báo cáo hoàn thành.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_clarify`.
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

Báo cáo hoàn thành (sau khi vòng hỏi kết thúc hoặc dừng sớm):
- Số câu hỏi đã hỏi & đã trả lời.
- Đường dẫn tới spec đã cập nhật.
- Các mục đã chạm tới (liệt kê tên).
- Trạng thái checklist chất lượng spec (nếu `FEATURE_DIR/checklists/requirements.md` đã được tái kiểm định): hiện số đạt trước/sau (ví dụ: "Checklist chất lượng Spec: 12/16 → 15/16 mục đạt") và liệt kê mọi mục đổi trạng thái — cả mục mới tích (chưa tích → đã tích) lẫn hồi quy (đã tích → chưa tích). Nếu còn mục chưa tích, liệt kê như các điểm cần chú ý.
- Bảng tóm tắt bao phủ liệt kê mỗi nhóm phân loại với Trạng thái: Đã giải quyết (trước là Một phần/Thiếu và đã xử lý), Hoãn lại (vượt quota câu hỏi, hoặc mục còn lại cụ thể về cách triển khai, so sánh công nghệ, hay chia task), Rõ (đã đủ), Còn tồn (vẫn Một phần/Thiếu nhưng tác động thấp).
- Nếu còn Tồn hoặc Hoãn lại, khuyến nghị nên tiếp tục tới `/speckit.plan` hay chạy lại `/speckit.clarify` sau khi có plan.
- Lệnh tiếp theo gợi ý.

## Điều kiện xong

- [ ] Mơ hồ trong spec đã xác định và tích hợp làm rõ vào file spec
- [ ] Checklist chất lượng spec đã tái kiểm định theo spec cập nhật (nếu `FEATURE_DIR/checklists/requirements.md` tồn tại)
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn thành cho người dùng kèm số câu đã trả lời, mục đã chạm, trạng thái checklist và tóm tắt bao phủ
