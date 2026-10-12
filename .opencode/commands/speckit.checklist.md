---
description: Generate a custom checklist for the current feature based on user requirements.
---

## Mục đích của checklist: "Unit Tests for English" (Kiểm thử đơn vị cho văn xuôi tiếng Anh)

**KHÁI NIỆM THEN CHỐT**: Checklist là **UNIT TEST CHO VIỆC VIẾT YÊU CẦU** - chúng kiểm tra chất lượng, độ rõ ràng và độ đầy đủ của các yêu cầu trong một lĩnh vực cụ thể.

**KHÔNG dùng để kiểm chứng/kiểm thử**:

- ❌ KHÔNG phải "Kiểm chứng nút bấm hoạt động đúng"
- ❌ KHÔNG phải "Kiểm thử xử lý lỗi có chạy không"
- ❌ KHÔNG phải "Xác nhận API trả về 200"
- ❌ KHÔNG kiểm tra code/triển khai có khớp spec không

**DÙNG để kiểm tra chất lượng yêu cầu**:

- ✅ "Yêu cầu về thứ bậc hiển thị đã được định nghĩa cho mọi loại thẻ chưa?" (độ đầy đủ)
- ✅ "'Hiển thị nổi bật' đã được lượng hóa bằng kích thước/vị trí cụ thể chưa?" (độ rõ ràng)
- ✅ "Yêu cầu về trạng thái hover có nhất quán trên mọi thành phần tương tác không?" (tính nhất quán)
- ✅ "Yêu cầu về trợ năng cho điều hướng bàn phím đã được định nghĩa chưa?" (độ bao phủ)
- ✅ "Spec có định nghĩa điều gì xảy ra khi ảnh logo tải thất bại không?" (trường hợp biên)

**Ẩn dụ**: Nếu spec của bạn là code viết bằng tiếng Anh, checklist chính là bộ unit test cho nó. Bạn đang kiểm tra xem các yêu cầu có được viết tốt, đầy đủ, rõ ràng, sẵn sàng để triển khai hay không - CHỨ KHÔNG phải kiểm tra bản triển khai có chạy đúng không.

**Quyền sở hữu và vòng đời checkbox**:

- Checklist tùy chỉnh do lệnh này sinh ra là tài liệu rà soát chất lượng yêu cầu thuộc về người rà soát (reviewer).
- `[x]` nghĩa là người rà soát xác định tiêu chí chất lượng yêu cầu đã đạt.
- `[x]` KHÔNG có nghĩa là công việc triển khai đã xong.
- Lệnh này chỉ sinh ra hoặc bổ sung các mục checklist; nó PHẢI KHÔNG đánh dấu `[x]` cho các mục vừa sinh.
- Agent chỉ được hỗ trợ đánh giá các mục khi người rà soát yêu cầu rõ ràng.
- File `checklists/requirements.md` là checklist chất lượng spec tích hợp sẵn do `/speckit.specify` và `/speckit.clarify` duy trì; không áp dụng ngoại lệ đó cho các checklist tùy chỉnh sinh ra ở đây.

## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi sinh checklist)**:
- Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_checklist`
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

    Wait for the result of the hook command before proceeding to the Execution Steps.
    ```
    Sau khi xuất khối trên, bạn PHẢI thực sự gọi hook và chờ nó chạy xong trước khi tiếp tục. Chạy giống như cách bạn tự chạy lệnh trong agent/phiên này (cách gọi có thể khác với id `{command}` hiển thị theo nghĩa đen ở trên, ví dụ agent ở chế độ skills chạy dưới dạng `/skill:speckit-...` hoặc `$speckit-...`). Chỉ xuất khối thôi thì hook chưa chạy.
- Nếu không có hook nào được đăng ký hoặc file `.specify/extensions.yml` không tồn tại, bỏ qua trong im lặng

## Các bước thực thi

1. **Thiết lập**: Chạy `.specify/scripts/bash/check-prerequisites.sh --json --template checklist-template` từ thư mục gốc repo và phân tích JSON để lấy FEATURE_DIR, danh sách AVAILABLE_DOCS và TEMPLATE_CONTENT.
   - Mọi đường dẫn file phải là tuyệt đối.
   - Đối với dấu nháy đơn trong tham số như "I'm Groot", dùng cú pháp thoát: ví dụ 'I'\''m Groot' (hoặc dùng nháy kép nếu được: "I'm Groot").

2. **NẾU TỒN TẠI**: Nạp file `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.

3. **Làm rõ ý định (linh hoạt)**: Suy ra tối đa BA câu hỏi làm rõ ngữ cảnh ban đầu (không dùng danh mục soạn sẵn). Chúng PHẢI:
   - Được sinh ra từ cách diễn đạt của người dùng + tín hiệu trích xuất từ spec/plan/tasks
   - Chỉ hỏi về thông tin làm thay đổi thực chất nội dung checklist
   - Bỏ qua từng câu nếu `$ARGUMENTS` đã nêu rõ ràng
   - Ưu tiên chính xác hơn bao quát

   Thuật toán sinh câu hỏi:
    1. Trích xuất tín hiệu: từ khóa lĩnh vực của tính năng (ví dụ: auth, latency, UX, API), chỉ báo rủi ro ("critical", "must", "compliance"), gợi ý bên liên quan ("QA", "review", "security team"), và sản phẩm bàn giao tường minh ("a11y", "rollback", "contracts").
    2. Gom tín hiệu thành các vùng trọng tâm ứng viên (tối đa 4) xếp theo mức liên quan.
    3. Xác định đối tượng & thời điểm có thể (tác giả, người rà soát, QA, phát hành) nếu chưa nêu rõ.
    4. Phát hiện chiều còn thiếu: độ rộng phạm vi, độ sâu/mức chặt chẽ, nhấn mạnh rủi ro, ranh giới loại trừ, tiêu chí chấp nhận đo lường được.
    5. Soạn câu hỏi chọn từ các mẫu sau:
       - Tinh chỉnh phạm vi (ví dụ: "Checklist này có nên bao gồm điểm chạm tích hợp với X và Y hay chỉ giới hạn ở tính đúng đắn của module cục bộ?")
       - Ưu tiên rủi ro (ví dụ: "Vùng rủi ro tiềm ẩn nào trong số này cần kiểm tra chặn bắt buộc?")
       - Chuẩn độ sâu (ví dụ: "Đây là danh sách kiểm tra nhanh trước commit hay cổng phát hành chính thức?")
       - Khung đối tượng (ví dụ: "Danh sách này chỉ tác giả dùng hay đồng nghiệp dùng khi review PR?")
       - Loại trừ ranh giới (ví dụ: "Vòng này có nên loại trừ tường minh các mục tinh chỉnh hiệu năng không?")
       - Lỗ hổng lớp kịch bản (ví dụ: "Chưa thấy luồng khôi phục — các đường lỗi từng phần / rollback có thuộc phạm vi không?")

   Quy tắc định dạng câu hỏi:
    - Nếu đưa ra lựa chọn, sinh bảng gọn với các cột: Option | Candidate | Why It Matters
    - Giới hạn tối đa tùy chọn A–E; bỏ bảng nếu câu trả lời tự do rõ hơn
    - Không bao giờ yêu cầu người dùng nhắc lại điều họ đã nói
    - Tránh các nhóm suy đoán (không bịa đặt). Nếu chưa chắc, hỏi thẳng: "Hãy xác nhận X có thuộc phạm vi không."

   Giá trị mặc định khi không thể tương tác:
    - Độ sâu: Standard (Tiêu chuẩn)
    - Đối tượng: Người rà soát (PR) nếu liên quan code; ngược lại là Tác giả
    - Trọng tâm: 2 cụm liên quan nhất

   Xuất các câu hỏi (đánh nhãn Q1/Q2/Q3). Sau khi có câu trả lời: nếu còn ≥2 lớp kịch bản (Alternate / Exception / Recovery / Non-Functional) chưa rõ, bạn CÓ THỂ hỏi thêm tối đa HAI câu bám sát (Q4/Q5) kèm mỗi câu một dòng lý do (ví dụ: "Rủi ro đường khôi phục chưa được giải quyết"). Không hỏi quá tổng cộng năm câu. Bỏ qua leo thang nếu người dùng từ chối hỏi thêm.

4. **Hiểu yêu cầu của người dùng**: Kết hợp `$ARGUMENTS` + câu trả lời làm rõ:
    - Suy ra chủ đề checklist (ví dụ: bảo mật, rà soát, triển khai, ux)
    - Gom các mục phải có mà người dùng nêu tường minh
    - Ánh xạ lựa chọn trọng tâm sang khung nhóm
    - Suy luận ngữ cảnh còn thiếu từ spec/plan/tasks (KHÔNG bịa đặt)

5. **Nạp ngữ cảnh tính năng**: Đọc từ FEATURE_DIR:
    - spec.md: Yêu cầu và phạm vi tính năng
    - plan.md (nếu có): Chi tiết kỹ thuật, phụ thuộc
    - tasks.md (nếu có): Các công việc triển khai

   **Chiến lược nạp ngữ cảnh**:
    - Chỉ nạp phần cần thiết liên quan tới vùng trọng tâm đang xét (tránh đổ cả file)
    - Ưu tiên tóm tắt các đoạn dài thành các gạch đầu dòng kịch bản/yêu cầu ngắn gọn
    - Dùng tiết lộ dần dần: chỉ truy xuất bổ sung khi phát hiện lỗ hổng
    - Nếu tài liệu nguồn lớn, sinh các mục tóm tắt trung gian thay vì nhúng văn bản thô

6. **Sinh checklist** - Dùng TEMPLATE_CONTENT làm mẫu cấu trúc và tạo "Unit Test cho Yêu cầu":
   - Tạo thư mục `FEATURE_DIR/checklists/` nếu chưa tồn tại
   - Sinh tên file checklist duy nhất:
     - Dùng tên ngắn, mô tả theo lĩnh vực (ví dụ: `ux.md`, `api.md`, `security.md`)
     - Định dạng: `[domain].md`
   - Cách xử lý file:
     - Nếu file CHƯA tồn tại: Tạo file mới và đánh số mục từ CHK001
     - Nếu file đã tồn tại: Bổ sung mục mới vào cuối file, nối tiếp ID CHK cuối (ví dụ: mục cuối là CHK015 thì mục mới bắt đầu từ CHK016)
   - Không bao giờ xóa hay thay thế nội dung checklist hiện có - luôn giữ lại và bổ sung
   - Để mọi mục mới ở trạng thái chưa tích (`[ ]`); trạng thái checkbox thuộc về người rà soát

   **NGUYÊN TẮC CỐT LÕI - Kiểm tra Yêu cầu, không phải Bản triển khai**:
   Mỗi mục checklist PHẢI đánh giá CHÍNH CÁC YÊU CẦU về:
   - **Tính đầy đủ**: Đã có đủ các yêu cầu cần thiết chưa?
   - **Độ rõ ràng**: Các yêu cầu có rõ ràng, cụ thể không?
   - **Tính nhất quán**: Các yêu cầu có khớp nhau không?
   - **Tính đo lường được**: Các yêu cầu có thể kiểm chứng khách quan không?
   - **Độ bao phủ**: Đã xét đủ kịch bản/trường hợp biên chưa?

   **Cấu trúc nhóm** - Nhóm các mục theo chiều chất lượng yêu cầu:
   - **Tính đầy đủ của yêu cầu** (Đã tài liệu hóa đủ các yêu cầu cần thiết chưa?)
   - **Độ rõ ràng của yêu cầu** (Các yêu cầu có cụ thể, rõ ràng không?)
   - **Tính nhất quán của yêu cầu** (Các yêu cầu có khớp nhau, không xung đột?)
   - **Chất lượng tiêu chí chấp nhận** (Tiêu chí thành công có đo lường được không?)
   - **Bao phủ kịch bản** (Đã xét đủ luồng/trường hợp chưa?)
   - **Bao phủ trường hợp biên** (Đã định nghĩa điều kiện biên chưa?)
   - **Yêu cầu phi chức năng** (Hiệu năng, Bảo mật, Trợ năng, v.v. - đã được đặc tả chưa?)
   - **Phụ thuộc & Giả định** (Đã tài liệu hóa và kiểm chứng chưa?)
   - **Điểm mơ hồ & Xung đột** (Cần làm rõ điều gì?)

   **CÁCH VIẾT MỤC CHECKLIST - "Unit Test cho tiếng Anh"**:

   ❌ **SAI** (Kiểm thử bản triển khai):
   - "Kiểm chứng trang landing hiển thị 3 thẻ episode"
   - "Kiểm thử trạng thái hover trên desktop có chạy không"
   - "Xác nhận bấm logo điều hướng về trang chủ"

   ✅ **ĐÚNG** (Kiểm tra chất lượng yêu cầu):
   - "Số lượng và bố cục chính xác của các episode nổi bật đã được đặc tả chưa?" [Tính đầy đủ]
   - "Cụm 'hiển thị nổi bật' đã được lượng hóa bằng kích thước/vị trí cụ thể chưa?" [Độ rõ ràng]
   - "Yêu cầu trạng thái hover có nhất quán trên mọi thành phần tương tác không?" [Tính nhất quán]
   - "Yêu cầu điều hướng bàn phím đã được định nghĩa cho mọi UI tương tác chưa?" [Bao phủ]
   - "Hành vi dự phòng khi ảnh logo tải thất bại đã được đặc tả chưa?" [Trường hợp biên]
   - "Trạng thái tải (loading) cho dữ liệu episode bất đồng bộ đã được định nghĩa chưa?" [Tính đầy đủ]
   - "Spec có định nghĩa thứ bậc thị giác cho các UI cạnh tranh nhau không?" [Độ rõ ràng]

   **CẤU TRÚC MỤC**:
   Mỗi mục nên theo mẫu:
   - Dạng câu hỏi về chất lượng yêu cầu
   - Tập trung vào điều ĐÃ VIẾT (hoặc chưa viết) trong spec/plan
   - Kèm chiều chất lượng trong ngoặc [Tính đầy đủ/Độ rõ ràng/Tính nhất quán/v.v.]
   - Tham chiếu mục spec `[Spec §X.Y]` khi kiểm tra yêu cầu hiện có
   - Dùng dấu `[Gap]` khi kiểm tra yêu cầu còn thiếu

   **VÍ DỤ THEO CHIỀU CHẤT LƯỢNG**:

   Tính đầy đủ:
   - "Yêu cầu xử lý lỗi đã được định nghĩa cho mọi chế độ lỗi API chưa? [Gap]"
   - "Yêu cầu trợ năng đã được đặc tả cho mọi thành phần tương tác chưa? [Tính đầy đủ]"
   - "Yêu cầu breakpoint di động cho bố cục responsive đã được định nghĩa chưa? [Gap]"

   Độ rõ ràng:
   - "Cụm 'tải nhanh' đã được lượng hóa bằng ngưỡng thời gian cụ thể chưa? [Độ rõ ràng, Spec §NFR-2]"
   - "Tiêu chí chọn 'related episodes' đã được định nghĩa tường minh chưa? [Độ rõ ràng, Spec §FR-5]"
   - "Từ 'nổi bật' đã được định nghĩa bằng thuộc tính thị giác đo lường được chưa? [Mơ hồ, Spec §FR-4]"

   Tính nhất quán:
   - "Yêu cầu điều hướng có khớp nhau trên mọi trang không? [Tính nhất quán, Spec §FR-10]"
   - "Yêu cầu component thẻ có nhất quán giữa trang landing và trang chi tiết không? [Tính nhất quán]"

   Bao phủ:
   - "Yêu cầu cho kịch bản rỗng (không có episode) đã được định nghĩa chưa? [Bao phủ, Trường hợp biên]"
   - "Kịch bản nhiều người dùng đồng thời đã được xét tới chưa? [Bao phủ, Gap]"
   - "Yêu cầu cho lỗi tải dữ liệu từng phần đã được đặc tả chưa? [Bao phủ, Luồng ngoại lệ]"

   Tính đo lường được:
   - "Yêu cầu thứ bậc thị giác có đo lường/kiểm thử được không? [Tiêu chí chấp nhận, Spec §FR-1]"
   - "'Trọng số thị giác cân bằng' có kiểm chứng khách quan được không? [Đo lường được, Spec §FR-2]"

   **Phân loại & bao phủ kịch bản** (Tập trung chất lượng yêu cầu):
   - Kiểm tra đã có yêu cầu cho: kịch bản Chính, Thay thế, Ngoại lệ/Lỗi, Khôi phục, Phi chức năng chưa
   - Với mỗi lớp kịch bản, hỏi: "Yêu cầu [loại kịch bản] đã đầy đủ, rõ ràng, nhất quán chưa?"
   - Nếu thiếu lớp kịch bản: "Yêu cầu [loại kịch bản] là cố ý loại trừ hay đang thiếu? [Gap]"
   - Kèm khả năng phục hồi/rollback khi có thay đổi trạng thái: "Yêu cầu rollback cho lỗi migration đã được định nghĩa chưa? [Gap]"

   **Yêu cầu truy vết**:
   - TỐI THIỂU: ≥80% mục PHẢI có ít nhất một tham chiếu truy vết
   - Mỗi mục nên tham chiếu: mục spec `[Spec §X.Y]`, hoặc dùng dấu: `[Gap]`, `[Ambiguity]`, `[Conflict]`, `[Assumption]`
   - Nếu chưa có hệ ID: "Đã có sơ đồ ID cho yêu cầu & tiêu chí chấp nhận chưa? [Truy vết]"

   **Nêu & xử lý vấn đề** (Vấn đề chất lượng yêu cầu):
   Hỏi về chính các yêu cầu:
   - Mơ hồ: "Thuật ngữ 'nhanh' đã được lượng hóa bằng chỉ số cụ thể chưa? [Mơ hồ, Spec §NFR-1]"
   - Xung đột: "Yêu cầu điều hướng giữa §FR-10 và §FR-10a có xung đột không? [Xung đột]"
   - Giả định: "Giả định 'podcast API luôn sẵn sàng' đã được kiểm chứng chưa? [Giả định]"
   - Phụ thuộc: "Yêu cầu về podcast API bên ngoài đã được tài liệu hóa chưa? [Phụ thuộc, Gap]"
   - Thiếu định nghĩa: "'Thứ bậc thị giác' đã được định nghĩa bằng tiêu chí đo lường được chưa? [Gap]"

   **Gom nội dung**:
   - Ngưỡng mềm: Nếu ứng viên thô > 40 mục, ưu tiên theo rủi ro/tác động
   - Gộp các mục gần trùng cùng kiểm tra một khía cạnh yêu cầu
   - Nếu >5 trường hợp biên ít tác động, gom thành một mục: "Yêu cầu đã xét các trường hợp biên X, Y, Z chưa? [Bao phủ]"

   **🚫 TUYỆT ĐỐI CẤM** - Những điều này biến nó thành kiểm thử triển khai, không phải kiểm thử yêu cầu:
   - ❌ Mọi mục bắt đầu bằng "Verify", "Test", "Confirm", "Check" + hành vi triển khai
   - ❌ Tham chiếu tới thực thi code, hành động người dùng, hành vi hệ thống
   - ❌ "Hiển thị đúng", "chạy ổn", "hoạt động như mong đợi"
   - ❌ "Bấm", "điều hướng", "hiển thị", "tải", "thực thi"
   - ❌ Kịch bản kiểm thử, kế hoạch kiểm thử, quy trình QA
   - ❌ Chi tiết triển khai (framework, API, thuật toán)

   **✅ MẪU BẮT BUỘC** - Những điều này kiểm tra chất lượng yêu cầu:
   - ✅ "[Loại yêu cầu] đã được định nghĩa/đặc tả/tài liệu hóa cho [kịch bản] chưa?"
   - ✅ "Thuật ngữ mơ hồ [X] đã được lượng hóa/làm rõ bằng tiêu chí cụ thể chưa?"
   - ✅ "Yêu cầu có nhất quán giữa [mục A] và [mục B] không?"
   - ✅ "[Yêu cầu] có thể đo lường/kiểm chứng khách quan không?"
   - ✅ "[Trường hợp biên/kịch bản] đã được xét trong yêu cầu chưa?"
   - ✅ "Spec có định nghĩa [khía cạnh còn thiếu] không?"

7. **Tham chiếu cấu trúc**: Sinh checklist theo mẫu chuẩn trong `.specify/templates/checklist-template.md` về tiêu đề, mục meta, tiêu đề nhóm, ghi chú sở hữu, mục ghi chú và định dạng ID. Nếu không có mẫu, dùng: tiêu đề H1, dòng meta mục đích/ngày tạo, ghi chú sở hữu giải thích rằng `[x]` nghĩa là người rà soát duyệt chất lượng yêu cầu, các mục `##` chứa dòng `- [ ] CHK### <nội dung yêu cầu>` với ID tăng dần toàn cục từ CHK001, và ghi chú rằng `/speckit.implement` chỉ đọc trạng thái checklist chứ không sửa dấu.

8. **Báo cáo**: Xuất đường dẫn đầy đủ tới file checklist, số lượng mục, và tóm tắt lần chạy này tạo file mới hay bổ sung vào file hiện có. Tóm tắt:
   - Các vùng trọng tâm đã chọn
   - Mức độ sâu
   - Tác nhân/thời điểm
   - Mọi mục phải có do người dùng chỉ định đã được đưa vào

**Lưu ý**: Mỗi lần gọi `/speckit.checklist` dùng tên file checklist ngắn, mô tả và hoặc tạo file mới hoặc bổ sung vào file hiện có. Điều này cho phép:

- Nhiều checklist khác loại (ví dụ: `ux.md`, `test.md`, `security.md`)
- Tên file đơn giản, dễ nhớ, thể hiện mục đích checklist
- Dễ tìm và điều hướng trong thư mục `checklists/`

Để tránh rối, hãy dùng loại mô tả và dọn các checklist lỗi thời khi xong.

## Các loại checklist ví dụ & mục mẫu

**Chất lượng yêu cầu UX:** `ux.md`

Các mục mẫu (kiểm tra yêu cầu, KHÔNG phải bản triển khai):

- "Yêu cầu thứ bậc thị giác đã được định nghĩa bằng tiêu chí đo lường được chưa? [Độ rõ ràng, Spec §FR-1]"
- "Số lượng và vị trí các thành phần UI đã được đặc tả tường minh chưa? [Tính đầy đủ, Spec §FR-1]"
- "Yêu cầu trạng thái tương tác (hover, focus, active) đã được định nghĩa nhất quán chưa? [Tính nhất quán]"
- "Yêu cầu trợ năng đã được đặc tả cho mọi thành phần tương tác chưa? [Bao phủ, Gap]"
- "Hành vi dự phòng khi ảnh tải thất bại đã được định nghĩa chưa? [Trường hợp biên, Gap]"
- "'Hiển thị nổi bật' có đo lường khách quan được không? [Đo lường được, Spec §FR-4]"

**Chất lượng yêu cầu API:** `api.md`

Các mục mẫu:

- "Định dạng phản hồi lỗi đã được đặc tả cho mọi kịch bản thất bại chưa? [Tính đầy đủ]"
- "Yêu cầu giới hạn tần suất đã được lượng hóa bằng ngưỡng cụ thể chưa? [Độ rõ ràng]"
- "Yêu cầu xác thực có nhất quán trên mọi endpoint không? [Tính nhất quán]"
- "Yêu cầu retry/timeout cho phụ thuộc bên ngoài đã được định nghĩa chưa? [Bao phủ, Gap]"
- "Chiến lược phiên bản hóa đã được tài liệu hóa trong yêu cầu chưa? [Gap]"

**Chất lượng yêu cầu hiệu năng:** `performance.md`

Các mục mẫu:

- "Yêu cầu hiệu năng đã được lượng hóa bằng chỉ số cụ thể chưa? [Độ rõ ràng]"
- "Mục tiêu hiệu năng đã được định nghĩa cho mọi hành trình người dùng trọng yếu chưa? [Bao phủ]"
- "Yêu cầu hiệu năng dưới các điều kiện tải khác nhau đã được đặc tả chưa? [Tính đầy đủ]"
- "Yêu cầu hiệu năng có đo lường khách quan được không? [Đo lường được]"
- "Yêu cầu suy giảm khi tải cao đã được định nghĩa chưa? [Trường hợp biên, Gap]"

**Chất lượng yêu cầu bảo mật:** `security.md`

Các mục mẫu:

- "Yêu cầu xác thực đã được đặc tả cho mọi tài nguyên được bảo vệ chưa? [Bao phủ]"
- "Yêu cầu bảo vệ dữ liệu cho thông tin nhạy cảm đã được định nghĩa chưa? [Tính đầy đủ]"
- "Mô hình đe dọa đã được tài liệu hóa và yêu cầu đã bám theo nó chưa? [Truy vết]"
- "Yêu cầu bảo mật có nhất quán với nghĩa vụ tuân thủ không? [Tính nhất quán]"
- "Yêu cầu ứng phó sự cố rò rỉ/vi phạm bảo mật đã được định nghĩa chưa? [Gap, Luồng ngoại lệ]"

## Phản ví dụ: Điều KHÔNG nên làm

**❌ SAI - Những điều này kiểm thử bản triển khai, không phải yêu cầu:**

```markdown
- [ ] CHK001 - Verify landing page displays 3 episode cards [Spec §FR-001]
- [ ] CHK002 - Test hover states work correctly on desktop [Spec §FR-003]
- [ ] CHK003 - Confirm logo click navigates to home page [Spec §FR-010]
- [ ] CHK004 - Check that related episodes section shows 3-5 items [Spec §FR-005]
```

**✅ ĐÚNG - Những điều này kiểm tra chất lượng yêu cầu:**

```markdown
- [ ] CHK001 - Are the number and layout of featured episodes explicitly specified? [Completeness, Spec §FR-001]
- [ ] CHK002 - Are hover state requirements consistently defined for all interactive elements? [Consistency, Spec §FR-003]
- [ ] CHK003 - Are navigation requirements clear for all clickable brand elements? [Clarity, Spec §FR-010]
- [ ] CHK004 - Is the selection criteria for related episodes documented? [Gap, Spec §FR-005]
- [ ] CHK005 - Are loading state requirements defined for asynchronous episode data? [Gap]
- [ ] CHK006 - Can "visual hierarchy" requirements be objectively measured? [Measurability, Spec §FR-001]
```

**Khác biệt then chốt:**

- Sai: Kiểm tra hệ thống có chạy đúng không
- Đúng: Kiểm tra yêu cầu có được viết đúng không
- Sai: Kiểm chứng hành vi
- Đúng: Kiểm định chất lượng yêu cầu
- Sai: "Nó có làm X không?"
- Đúng: "X đã được đặc tả rõ ràng chưa?"

## Kiểm tra sau khi thực thi

**Kiểm tra extension hooks (sau khi sinh checklist)**:
Kiểm tra xem file `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_checklist`
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
