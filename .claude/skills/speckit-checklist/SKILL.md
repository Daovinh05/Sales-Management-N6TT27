---
name: "speckit-checklist"
description: "Generate a custom checklist for the current feature based on user requirements."
argument-hint: "Domain or focus area for the checklist"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/checklist.md"
user-invocable: true
disable-model-invocation: false
---


## Mục đích của checklist: "Unit Tests cho tiếng Anh"

**KHÁI NIỆM THEN CHỐT**: Checklist là **UNIT TEST CHO VIỆC VIẾT YÊU CẦU** - chúng kiểm tra chất lượng, độ rõ ràng và độ đầy đủ của các yêu cầu trong một lĩnh vực nhất định.

**KHÔNG dùng để kiểm chứng/kiểm thử**:

- ❌ KHÔNG phải "Kiểm tra nút bấm có bấm được không"
- ❌ KHÔNG phải "Kiểm thử xử lý lỗi có chạy không"
- ❌ KHÔNG phải "Xác nhận API trả về 200"
- ❌ KHÔNG kiểm tra code/triển khai có khớp spec không

**DÙNG để kiểm tra chất lượng yêu cầu**:

- ✅ "Yêu cầu về thứ bậc thị giác đã được định nghĩa cho mọi loại thẻ chưa?" (đầy đủ)
- ✅ "'Hiển thị nổi bật' đã được lượng hóa bằng kích thước/vị trí cụ thể chưa?" (rõ ràng)
- ✅ "Yêu cầu về trạng thái hover có nhất quán trên mọi thành phần tương tác không?" (nhất quán)
- ✅ "Yêu cầu accessibility cho điều hướng bàn phím đã được định nghĩa chưa?" (bao phủ)
- ✅ "Spec đã định nghĩa chuyện gì xảy ra khi ảnh logo tải lỗi chưa?" (trường hợp biên)

**Ẩn dụ**: Nếu spec của bạn là code viết bằng tiếng Anh, checklist chính là bộ unit test của nó. Bạn đang kiểm tra xem các yêu cầu có được viết tốt, đầy đủ, rõ ràng và sẵn sàng để triển khai không - CHỨ KHÔNG phải kiểm tra bản triển khai có chạy không.

**Quyền sở hữu và vòng đời checkbox**:

- Checklist tùy chỉnh do lệnh này sinh ra là tài liệu đánh giá chất lượng yêu cầu thuộc về người đánh giá (reviewer).
- `[x]` nghĩa là người đánh giá xác định tiêu chí chất lượng yêu cầu đã đạt.
- `[x]` KHÔNG có nghĩa công việc triển khai đã xong.
- Lệnh này chỉ sinh ra hoặc nối thêm mục checklist; nó PHẢI KHÔNG đánh dấu `[x]` cho các mục vừa sinh.
- Agent chỉ được hỗ trợ đánh giá các mục khi người đánh giá yêu cầu tường minh.
- `checklists/requirements.md` là checklist chất lượng spec tích hợp riêng do `/speckit-specify` và `/speckit-clarify` duy trì; đừng coi ngoại lệ đó áp dụng cho checklist tùy chỉnh sinh ra ở đây.

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi sinh checklist)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_checklist`
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

    Wait for the result of the hook command before proceeding to the Execution Steps.
    ```
    Sau khi xuất khối trên bạn PHẢI thực sự gọi hook và chờ nó hoàn tất trước khi tiếp tục. Chạy nó giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` dạng chữ hiển thị ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối mà không chạy hook thì chưa tính là đã chạy.
- Nếu không có hook nào được đăng ký hoặc `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Các bước thực hiện

1. **Thiết lập**: Chạy `.specify/scripts/bash/check-prerequisites.sh --json --template checklist-template` từ thư mục gốc repo và phân tích JSON để lấy FEATURE_DIR, danh sách AVAILABLE_DOCS và TEMPLATE_CONTENT.
   - Mọi đường dẫn file phải là tuyệt đối.
   - Với dấu nháy đơn trong tham số kiểu "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng ngoặc kép nếu được: "I'm Groot").

2. **NẾU TỒN TẠI**: Nạp `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.

3. **Làm rõ ý định (linh hoạt)**: Suy ra tối đa BA câu hỏi làm rõ theo ngữ cảnh ban đầu (không dùng bộ câu hỏi soạn sẵn). Chúng PHẢI:
   - Được sinh từ cách diễn đạt của người dùng + tín hiệu trích từ spec/plan/tasks
   - Chỉ hỏi thông tin làm thay đổi thực chất nội dung checklist
   - Bỏ qua từng câu nếu `$ARGUMENTS` đã nói rõ
   - Ưu tiên chính xác hơn dàn trải

   Thuật toán sinh câu hỏi:
   1. Trích tín hiệu: từ khóa lĩnh vực của tính năng (ví dụ auth, độ trễ, UX, API), chỉ báo rủi ro ("critical", "must", "compliance"), gợi ý bên liên quan ("QA", "review", "security team"), và sản phẩm bàn giao tường minh ("a11y", "rollback", "contracts").
   2. Gom tín hiệu thành các vùng trọng tâm ứng viên (tối đa 4) xếp theo mức liên quan.
   3. Xác định đối tượng & thời điểm có thể là (tác giả, người đánh giá, QA, phát hành) nếu chưa nói rõ.
   4. Phát hiện chiều còn thiếu: độ rộng phạm vi, độ sâu/mức chặt chẽ, nhấn mạnh rủi ro, ranh giới loại trừ, tiêu chí chấp nhận đo được.
   5. Soạn câu hỏi chọn từ các kiểu sau:
      - Tinh chỉnh phạm vi (ví dụ "Checklist này có nên gồm cả điểm chạm tích hợp với X và Y hay chỉ giới hạn ở tính đúng đắn của module cục bộ?")
      - Xếp ưu tiên rủi ro (ví dụ "Trong các vùng rủi ro tiềm ẩn này, vùng nào cần cổng kiểm tra bắt buộc?")
      - Chuẩn độ sâu (ví dụ "Đây là danh sách kiểm sanity nhẹ trước commit hay cổng phát hành chính thức?")
      - Khung đối tượng (ví dụ "Danh sách này chỉ tác giả dùng hay đồng nghiệp dùng khi review PR?")
      - Loại trừ ranh giới (ví dụ "Vòng này có nên loại trừ tường minh các mục tuning hiệu năng không?")
      - Lỗ hổng lớp kịch bản (ví dụ "Chưa thấy luồng khôi phục — các đường lỗi từng phần / rollback có thuộc phạm vi không?")

   Quy tắc trình bày câu hỏi:
   - Nếu đưa lựa chọn, sinh bảng gọn với các cột: Option | Candidate | Why It Matters
   - Tối đa A–E; bỏ bảng nếu câu trả lời tự do rõ hơn
   - Không bao giờ bắt người dùng nhắc lại điều họ đã nói
   - Tránh hạng mục suy đoán (không bịa). Nếu chưa chắc, hỏi thẳng: "Xác nhận giúp X có thuộc phạm vi không."

   Giá trị mặc định khi không thể tương tác:
   - Độ sâu: Standard
   - Đối tượng: Người đánh giá (PR) nếu liên quan code; nếu không thì Tác giả
   - Trọng tâm: 2 cụm liên quan nhất

   Xuất các câu hỏi (đánh nhãn Q1/Q2/Q3). Sau khi có câu trả lời: nếu còn ≥2 lớp kịch bản (lĩnh vực Alternate / Exception / Recovery / Non-Functional) chưa rõ, bạn CÓ THỂ hỏi thêm tối đa HAI câu bám sát (Q4/Q5) kèm mỗi câu một dòng lý do (ví dụ "Rủi ro đường khôi phục chưa được giải quyết"). Không hỏi quá tổng cộng năm câu. Bỏ qua leo thang nếu người dùng từ chối hỏi thêm.

4. **Hiểu yêu cầu người dùng**: Kết hợp `$ARGUMENTS` + câu trả lời làm rõ:
   - Suy ra chủ đề checklist (ví dụ security, review, deploy, ux)
   - Gom các mục must-have tường minh mà người dùng nhắc
   - Ánh xạ lựa chọn trọng tâm sang khung hạng mục
   - Suy luận ngữ cảnh còn thiếu từ spec/plan/tasks (KHÔNG bịa đặt)

5. **Nạp ngữ cảnh tính năng**: Đọc từ FEATURE_DIR:
   - spec.md: Yêu cầu và phạm vi tính năng
   - plan.md (nếu có): Chi tiết kỹ thuật, phụ thuộc
   - tasks.md (nếu có): Các công việc triển khai

   **Chiến lược nạp ngữ cảnh**:
   - Chỉ nạp phần cần thiết liên quan tới vùng trọng tâm đang xét (tránh đổ cả file)
   - Ưu tiên tóm tắt các đoạn dài thành gạch đầu dòng kịch bản/yêu cầu ngắn gọn
   - Dùng tiết lộ dần dần: chỉ truy xuất bổ sung khi phát hiện lỗ hổng
   - Nếu tài liệu nguồn lớn, sinh các mục tóm tắt trung gian thay vì nhúng văn bản thô

6. **Sinh checklist** - Dùng TEMPLATE_CONTENT làm mẫu cấu trúc và tạo "Unit Tests cho yêu cầu":
   - Tạo thư mục `FEATURE_DIR/checklists/` nếu chưa có
   - Sinh tên file checklist duy nhất:
     - Dùng tên ngắn, mô tả theo lĩnh vực (ví dụ `ux.md`, `api.md`, `security.md`)
     - Định dạng: `[domain].md`
   - Cách xử lý file:
     - Nếu file CHƯA tồn tại: Tạo file mới và đánh số mục từ CHK001
     - Nếu file đã tồn tại: Nối thêm mục mới vào file hiện có, nối tiếp từ CHK ID cuối cùng (ví dụ mục cuối là CHK015 thì mục mới bắt đầu từ CHK016)
   - Không bao giờ xóa hay thay thế nội dung checklist hiện có - luôn giữ lại và nối thêm
   - Để mọi mục mới ở trạng thái chưa tích (`[ ]`); trạng thái checkbox thuộc về người đánh giá

   **NGUYÊN TẮC CỐT LÕI - Kiểm tra yêu cầu, không kiểm tra bản triển khai**:
   Mọi mục checklist PHẢI đánh giá CHÍNH BẢN YÊU CẦU về:
   - **Đầy đủ**: Đã có đủ các yêu cầu cần thiết chưa?
   - **Rõ ràng**: Yêu cầu có rõ ràng, cụ thể không?
   - **Nhất quán**: Các yêu cầu có khớp nhau không?
   - **Đo được**: Yêu cầu có thể kiểm chứng khách quan không?
   - **Bao phủ**: Mọi kịch bản/trường hợp biên đã được đề cập chưa?

   **Cấu trúc hạng mục** - Nhóm mục theo chiều chất lượng yêu cầu:
   - **Đầy đủ yêu cầu** (Đã ghi đủ các yêu cầu cần thiết chưa?)
   - **Rõ ràng yêu cầu** (Yêu cầu có cụ thể, rõ nghĩa chưa?)
   - **Nhất quán yêu cầu** (Các yêu cầu có khớp nhau, không mâu thuẫn?)
   - **Chất lượng tiêu chí chấp nhận** (Tiêu chí thành công có đo được không?)
   - **Bao phủ kịch bản** (Mọi luồng/trường hợp đã được đề cập chưa?)
   - **Bao phủ trường hợp biên** (Điều kiện biên đã được định nghĩa chưa?)
   - **Yêu cầu phi chức năng** (Hiệu năng, Bảo mật, Accessibility, v.v. - đã được quy định chưa?)
   - **Phụ thuộc & Giả định** (Đã được ghi lại và kiểm chứng chưa?)
   - **Mơ hồ & Mâu thuẫn** (Cái gì cần làm rõ?)

   **CÁCH VIẾT MỤC CHECKLIST - "Unit Tests cho tiếng Anh"**:

   ❌ **SAI** (Kiểm tra bản triển khai):
   - "Kiểm tra landing page hiển thị 3 thẻ episode"
   - "Kiểm thử hover chạy được trên desktop"
   - "Xác nhận bấm logo thì về trang chủ"

   ✅ **ĐÚNG** (Kiểm tra chất lượng yêu cầu):
   - "Số lượng và bố cục chính xác của các episode nổi bật đã được quy định chưa?" [Đầy đủ]
   - "Cụm 'hiển thị nổi bật' đã được lượng hóa bằng kích thước/vị trí cụ thể chưa?" [Rõ ràng]
   - "Yêu cầu trạng thái hover có nhất quán trên mọi thành phần tương tác không?" [Nhất quán]
   - "Yêu cầu điều hướng bàn phím đã được định nghĩa cho mọi UI tương tác chưa?" [Bao phủ]
   - "Hành vi dự phòng khi ảnh logo tải lỗi đã được quy định chưa?" [Trường hợp biên]
   - "Trạng thái tải (loading) cho dữ liệu episode bất đồng bộ đã được định nghĩa chưa?" [Đầy đủ]
   - "Spec đã định nghĩa thứ bậc thị giác cho các UI cạnh tranh nhau chưa?" [Rõ ràng]

   **CẤU TRÚC MỤC**:
   Mỗi mục nên theo mẫu sau:
   - Dạng câu hỏi về chất lượng yêu cầu
   - Tập trung vào cái ĐÃ VIẾT (hoặc chưa viết) trong spec/plan
   - Ghi chiều chất lượng trong ngoặc [Đầy đủ/Rõ ràng/Nhất quán/...]
   - Tham chiếu mục spec `[Spec §X.Y]` khi kiểm tra yêu cầu hiện có
   - Dùng dấu `[Gap]` khi kiểm tra yêu cầu còn thiếu

   **VÍ DỤ THEO CHIỀU CHẤT LƯỢNG**:

   Đầy đủ:
   - "Yêu cầu xử lý lỗi đã được định nghĩa cho mọi chế độ lỗi API chưa? [Gap]"
   - "Yêu cầu accessibility đã được quy định cho mọi thành phần tương tác chưa? [Đầy đủ]"
   - "Yêu cầu breakpoint mobile cho layout responsive đã được định nghĩa chưa? [Gap]"

   Rõ ràng:
   - "'Tải nhanh' đã được lượng hóa bằng ngưỡng thời gian cụ thể chưa? [Rõ ràng, Spec §NFR-2]"
   - "Tiêu chí chọn 'related episodes' đã được định nghĩa tường minh chưa? [Rõ ràng, Spec §FR-5]"
   - "'Nổi bật' đã được định nghĩa bằng thuộc tính thị giác đo được chưa? [Mơ hồ, Spec §FR-4]"

   Nhất quán:
   - "Yêu cầu điều hướng có khớp nhau trên mọi trang không? [Nhất quán, Spec §FR-10]"
   - "Yêu cầu component thẻ có nhất quán giữa trang landing và trang chi tiết không? [Nhất quán]"

   Bao phủ:
   - "Đã có yêu cầu cho kịch bản trạng thái rỗng (không có episode) chưa? [Bao phủ, Trường hợp biên]"
   - "Các kịch bản tương tác đồng thời của người dùng đã được đề cập chưa? [Bao phủ, Gap]"
   - "Đã quy định yêu cầu cho lỗi tải dữ liệu từng phần chưa? [Bao phủ, Luồng ngoại lệ]"

   Đo được:
   - "Yêu cầu thứ bậc thị giác có đo/kiểm được không? [Tiêu chí chấp nhận, Spec §FR-1]"
   - "'Cân bằng thị giác' có kiểm chứng khách quan được không? [Đo được, Spec §FR-2]"

   **Phân loại & bao phủ kịch bản** (Tập trung chất lượng yêu cầu):
   - Kiểm tra đã có yêu cầu cho: kịch bản Chính, Thay thế, Ngoại lệ/Lỗi, Khôi phục, Phi chức năng chưa
   - Với mỗi lớp kịch bản, hỏi: "Yêu cầu [loại kịch bản] đã đầy đủ, rõ ràng và nhất quán chưa?"
   - Nếu thiếu lớp kịch bản: "Yêu cầu [loại kịch bản] là cố tình loại trừ hay đang thiếu? [Gap]"
   - Gồm cả resilience/rollback khi có thay đổi trạng thái: "Đã có yêu cầu rollback cho lỗi migration chưa? [Gap]"

   **Yêu cầu truy vết**:
   - TỐI THIỂU: ≥80% mục PHẢI có ít nhất một tham chiếu truy vết
   - Mỗi mục nên tham chiếu: mục spec `[Spec §X.Y]`, hoặc dùng dấu: `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`
   - Nếu chưa có hệ ID: "Đã có scheme ID cho yêu cầu & tiêu chí chấp nhận chưa? [Truy vết]"

   **Nêu & xử lý vấn đề** (Vấn đề chất lượng yêu cầu):
   Hỏi về chính bản yêu cầu:
   - Mơ hồ: "Thuật ngữ 'nhanh' đã được lượng hóa bằng chỉ số cụ thể chưa? [Mơ hồ, Spec §NFR-1]"
   - Mâu thuẫn: "Yêu cầu điều hướng giữa §FR-10 và §FR-10a có mâu thuẫn không? [Mâu thuẫn]"
   - Giả định: "Giả định 'podcast API luôn sẵn sàng' đã được kiểm chứng chưa? [Giả định]"
   - Phụ thuộc: "Yêu cầu về podcast API ngoài đã được ghi lại chưa? [Phụ thuộc, Gap]"
   - Thiếu định nghĩa: "'Thứ bậc thị giác' đã được định nghĩa bằng tiêu chí đo được chưa? [Gap]"

   **Gom nội dung**:
   - Ngưỡng mềm: Nếu ứng viên thô > 40 mục, ưu tiên theo rủi ro/tác động
   - Gộp các mục gần trùng cùng kiểm tra một khía cạnh yêu cầu
   - Nếu >5 trường hợp biên ít tác động, gom thành một mục: "Yêu cầu đã đề cập các trường hợp biên X, Y, Z chưa? [Bao phủ]"

   **🚫 TUYỆT ĐỐI CẤM** - Những thứ này biến checklist thành bài kiểm tra bản triển khai, không phải kiểm tra yêu cầu:
   - ❌ Mọi mục bắt đầu bằng "Verify", "Test", "Confirm", "Check" + hành vi triển khai
   - ❌ Nhắc tới thực thi code, thao tác người dùng, hành vi hệ thống
   - ❌ "Hiển thị đúng", "chạy tốt", "hoạt động như mong đợi"
   - ❌ "Bấm", "điều hướng", "render", "tải", "thực thi"
   - ❌ Test case, kế hoạch kiểm thử, quy trình QA
   - ❌ Chi tiết triển khai (framework, API, thuật toán)

   **✅ MẪU BẮT BUỘC** - Những thứ này kiểm tra chất lượng yêu cầu:
   - ✅ "Đã định nghĩa/quy định/ghi lại [loại yêu cầu] cho [kịch bản] chưa?"
   - ✅ "Thuật ngữ mơ hồ [X] đã được lượng hóa/làm rõ bằng tiêu chí cụ thể chưa?"
   - ✅ "Yêu cầu có nhất quán giữa [mục A] và [mục B] không?"
   - ✅ "[Yêu cầu] có đo/kiểm khách quan được không?"
   - ✅ "[Trường hợp biên/kịch bản] đã được đề cập trong yêu cầu chưa?"
   - ✅ "Spec đã định nghĩa [khía cạnh còn thiếu] chưa?"

7. **Tham chiếu cấu trúc**: Sinh checklist theo mẫu chuẩn trong `.specify/templates/checklist-template.md` về tiêu đề, mục meta, tiêu đề hạng mục, ghi chú quyền sở hữu, mục ghi chú và định dạng ID. Nếu không có mẫu, dùng: tiêu đề H1, dòng meta mục đích/ngày tạo, ghi chú quyền sở hữu giải thích `[x]` nghĩa là người đánh giá đã duyệt chất lượng yêu cầu, các mục `##` theo hạng mục chứa dòng `- [ ] CHK### <nội dung yêu cầu>` với ID tăng dần toàn cục từ CHK001, và ghi chú rằng `/speckit-implement` chỉ đọc trạng thái checklist chứ không sửa dấu.

8. **Báo cáo**: Xuất đường dẫn đầy đủ tới file checklist, số mục, và tóm tắt lần chạy này tạo file mới hay nối vào file hiện có. Tóm tắt:
   - Các vùng trọng tâm đã chọn
   - Mức độ sâu
   - Tác nhân/thời điểm
   - Mọi mục must-have tường minh của người dùng đã đưa vào

**Lưu ý**: Mỗi lần gọi `/speckit-checklist` dùng tên file checklist ngắn, mô tả và tạo mới hoặc nối vào file hiện có. Việc này cho phép:

- Nhiều checklist khác loại (ví dụ `ux.md`, `test.md`, `security.md`)
- Tên file đơn giản, dễ nhớ, thể hiện mục đích checklist
- Dễ tìm và điều hướng trong thư mục `checklists/`

Để tránh lộn xộn, hãy dùng loại mô tả và dọn các checklist lỗi thời khi xong.

## Ví dụ loại checklist & mục mẫu

**Chất lượng yêu cầu UX:** `ux.md`

Mục mẫu (kiểm tra yêu cầu, KHÔNG kiểm tra bản triển khai):

- "Yêu cầu thứ bậc thị giác đã được định nghĩa bằng tiêu chí đo được chưa? [Rõ ràng, Spec §FR-1]"
- "Số lượng và vị trí thành phần UI đã được quy định tường minh chưa? [Đầy đủ, Spec §FR-1]"
- "Yêu cầu trạng thái tương tác (hover, focus, active) đã được định nghĩa nhất quán chưa? [Nhất quán]"
- "Yêu cầu accessibility đã được quy định cho mọi thành phần tương tác chưa? [Bao phủ, Gap]"
- "Hành vi dự phòng khi ảnh tải lỗi đã được định nghĩa chưa? [Trường hợp biên, Gap]"
- "'Hiển thị nổi bật' có đo khách quan được không? [Đo được, Spec §FR-4]"

**Chất lượng yêu cầu API:** `api.md`

Mục mẫu:

- "Định dạng phản hồi lỗi đã được quy định cho mọi kịch bản lỗi chưa? [Đầy đủ]"
- "Yêu cầu giới hạn tần suất (rate limiting) đã được lượng hóa bằng ngưỡng cụ thể chưa? [Rõ ràng]"
- "Yêu cầu xác thực có nhất quán trên mọi endpoint không? [Nhất quán]"
- "Yêu cầu retry/timeout cho phụ thuộc ngoài đã được định nghĩa chưa? [Bao phủ, Gap]"
- "Chiến lược versioning đã được ghi trong yêu cầu chưa? [Gap]"

**Chất lượng yêu cầu hiệu năng:** `performance.md`

Mục mẫu:

- "Yêu cầu hiệu năng đã được lượng hóa bằng chỉ số cụ thể chưa? [Rõ ràng]"
- "Mục tiêu hiệu năng đã được định nghĩa cho mọi hành trình người dùng trọng yếu chưa? [Bao phủ]"
- "Yêu cầu hiệu năng dưới các điều kiện tải khác nhau đã được quy định chưa? [Đầy đủ]"
- "Yêu cầu hiệu năng có đo khách quan được không? [Đo được]"
- "Yêu cầu suy giảm (degradation) cho kịch bản tải cao đã được định nghĩa chưa? [Trường hợp biên, Gap]"

**Chất lượng yêu cầu bảo mật:** `security.md`

Mục mẫu:

- "Yêu cầu xác thực đã được quy định cho mọi tài nguyên được bảo vệ chưa? [Bao phủ]"
- "Yêu cầu bảo vệ dữ liệu cho thông tin nhạy cảm đã được định nghĩa chưa? [Đầy đủ]"
- "Mô hình đe dọa đã được ghi lại và yêu cầu đã bám theo nó chưa? [Truy vết]"
- "Yêu cầu bảo mật có nhất quán với nghĩa vụ tuân thủ không? [Nhất quán]"
- "Yêu cầu ứng phó sự cố/vi phạm bảo mật đã được định nghĩa chưa? [Gap, Luồng ngoại lệ]"

## Phản ví dụ: Điều KHÔNG nên làm

**❌ SAI - Những thứ này kiểm tra bản triển khai, không phải yêu cầu:**

```markdown
- [ ] CHK001 - Verify landing page displays 3 episode cards [Spec §FR-001]
- [ ] CHK002 - Test hover states work correctly on desktop [Spec §FR-003]
- [ ] CHK003 - Confirm logo click navigates to home page [Spec §FR-010]
- [ ] CHK004 - Check that related episodes section shows 3-5 items [Spec §FR-005]
```

**✅ ĐÚNG - Những thứ này kiểm tra chất lượng yêu cầu:**

```markdown
- [ ] CHK001 - Are the number and layout of featured episodes explicitly specified? [Completeness, Spec §FR-001]
- [ ] CHK002 - Are hover state requirements consistently defined for all interactive elements? [Consistency, Spec §FR-003]
- [ ] CHK003 - Are navigation requirements clear for all clickable brand elements? [Clarity, Spec §FR-010]
- [ ] CHK004 - Is the selection criteria for related episodes documented? [Gap, Spec §FR-005]
- [ ] CHK005 - Are loading state requirements defined for asynchronous episode data? [Gap]
- [ ] CHK006 - Can "visual hierarchy" requirements be objectively measured? [Measurability, Spec §FR-001]
```

**Điểm khác biệt chính:**

- Sai: Kiểm tra hệ thống có chạy đúng không
- Đúng: Kiểm tra yêu cầu có được viết đúng không
- Sai: Kiểm chứng hành vi
- Đúng: Kiểm định chất lượng yêu cầu
- Sai: "Nó có làm X không?"
- Đúng: "X đã được quy định rõ chưa?"

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi sinh checklist)**:
Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_checklist`
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
