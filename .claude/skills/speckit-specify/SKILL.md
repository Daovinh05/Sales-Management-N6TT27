---
name: "speckit-specify"
description: "Create or update the feature specification from a natural language feature description."
argument-hint: "Describe the feature you want to specify"
compatibility: "Requires spec-kit project structure with .specify/ directory"
metadata:
  author: "github-spec-kit"
  source: "templates/commands/specify.md"
user-invocable: true
disable-model-invocation: false
---


## Đầu vào của người dùng

```text
$ARGUMENTS
```

Bạn **PHẢI** xem xét đầu vào của người dùng trước khi tiếp tục (nếu không rỗng).

## Kiểm tra trước khi thực thi

**Kiểm tra extension hooks (trước khi viết đặc tả)**:
- Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.before_specify`
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

Đoạn chữ người dùng gõ sau `/speckit-specify` trong thông điệp kích hoạt **chính là** mô tả tính năng. Mặc định bạn luôn có nó trong hội thoại này ngay cả khi `$ARGUMENTS` hiện ra dạng chữ ở dưới. Đừng bắt người dùng nhắc lại trừ khi họ gọi lệnh rỗng.

Với mô tả tính năng đó, làm như sau:

1. **Đặt tên ngắn gọn** (2-4 từ) cho tính năng:
   - Phân tích mô tả tính năng và trích từ khóa ý nghĩa nhất
   - Tạo tên ngắn 2-4 từ nắm được bản chất tính năng
   - Dùng dạng hành động-danh từ khi được (ví dụ "add-user-auth", "fix-payment-bug")
   - Giữ thuật ngữ kỹ thuật và từ viết tắt (OAuth2, API, JWT, v.v.)
   - Giữ ngắn gọn nhưng đủ mô tả để nhìn thoáng qua đã hiểu tính năng
   - Ví dụ:
     - "I want to add user authentication" → "user-auth"
     - "Implement OAuth2 integration for the API" → "oauth2-api-integration"
     - "Create a dashboard for analytics" → "analytics-dashboard"
     - "Fix payment processing timeout bug" → "fix-payment-timeout"

2. **Tạo nhánh** (tùy chọn, qua hook):

   Nếu hook `before_specify` đã chạy thành công ở mục Kiểm tra trước khi thực thi trên, nó sẽ đã tạo/chuyển sang nhánh git và xuất JSON chứa `BRANCH_NAME` và `FEATURE_NUM`. Ghi nhận các giá trị này để tham khảo, nhưng tên nhánh **không** quyết định tên thư mục spec.

   Nếu người dùng đưa tường minh `GIT_BRANCH_NAME`, truyền thẳng cho hook để script nhánh dùng đúng giá trị đó làm tên nhánh (bỏ qua mọi sinh tiền tố/hậu tố).

3. **Tạo thư mục tính năng cho spec**:

   Spec nằm dưới thư mục `specs/` mặc định trừ khi người dùng đưa tường minh `SPECIFY_FEATURE_DIRECTORY`.

   **Thứ tự giải quyết `SPECIFY_FEATURE_DIRECTORY`**:
   1. Nếu người dùng đưa tường minh `SPECIFY_FEATURE_DIRECTORY` (ví dụ qua biến môi trường, tham số hay cấu hình), dùng nguyên giá trị đó
   2. Nếu không, tự sinh dưới `specs/`:
      - Kiểm tra `.specify/init-options.json` lấy `feature_numbering` (ưu tiên) hoặc `branch_numbering` (cũ, chỉ để migration — sẽ gỡ trong bản phát hành tới)
      - Nếu `"timestamp"`: tiền tố là `YYYYMMDD-HHMMSS` (timestamp hiện tại)
      - Nếu `"sequential"` hoặc vắng mặt: tiền tố là `NNN` (số 3 chữ số còn trống tiếp theo sau khi quét thư mục hiện có trong `specs/`)
      - Ghép tên thư mục: `<prefix>-<short-name>` (ví dụ `003-user-auth` hay `20260319-143022-user-auth`)
      - Đặt `SPECIFY_FEATURE_DIRECTORY` thành `specs/<directory-name>`
      - Nếu đã dùng `branch_numbering` (mà `feature_numbering` vắng mặt), cảnh báo một dòng: "⚠️ `branch_numbering` in init-options.json is deprecated. Rename to `feature_numbering`."

   **Tạo thư mục và file spec**:
   - `mkdir -p SPECIFY_FEATURE_DIRECTORY`
   - Giải quyết `spec-template` đang hiệu lực qua ngăn xếp giải quyết preset/template của Spec Kit (tương đương `specify preset resolve spec-template`)
   - Chép file `spec-template` đã giải quyết thành `SPECIFY_FEATURE_DIRECTORY/spec.md` làm điểm khởi đầu
   - Đặt `SPEC_FILE` thành `SPECIFY_FEATURE_DIRECTORY/spec.md`
   - Lưu đường dẫn đã giải quyết vào `.specify/feature.json`:
     ```json
     {
       "feature_directory": "<resolved feature dir>"
     }
     ```
     Ghi giá trị đường dẫn thư mục đã giải quyết thực tế (ví dụ `specs/003-user-auth`), không ghi chuỗi chữ `SPECIFY_FEATURE_DIRECTORY`.
     Việc này giúp các lệnh tiếp theo (`/speckit-plan`, `/speckit-tasks`, v.v.) tìm thư mục tính năng mà không phụ thuộc quy ước tên nhánh git.

   **QUAN TRỌNG**:
   - Bạn chỉ được tạo một tính năng cho mỗi lần gọi `/speckit-specify`
   - Tên thư mục spec và tên nhánh git độc lập nhau — chúng có thể trùng nhưng đó là lựa chọn của người dùng
   - Thư mục và file spec luôn do lệnh này tạo, không bao giờ do hook tạo

4. Nạp file `spec-template` đang hiệu lực đã giải quyết để hiểu các mục bắt buộc.

5. **NẾU TỒN TẠI**: Nạp `.specify/memory/constitution.md` để lấy nguyên tắc và ràng buộc quản trị của dự án.

6. Thực hiện theo luồng sau:
    1. Phân tích mô tả người dùng từ tham số
       Nếu rỗng: ERROR "No feature description provided"
    2. Trích khái niệm chính từ mô tả
       Xác định: actor, hành động, dữ liệu, ràng buộc
    3. Với khía cạnh chưa rõ:
       - Đoán có cơ sở dựa trên ngữ cảnh và chuẩn ngành
       - Chỉ đánh dấu [NEEDS CLARIFICATION: câu hỏi cụ thể] nếu:
         - Lựa chọn tác động đáng kể tới phạm vi tính năng hay trải nghiệm người dùng
         - Tồn tại nhiều cách hiểu hợp lý với hệ quả khác nhau
         - Không có giá trị mặc định hợp lý
       - **GIỚI HẠN: Tối đa 3 dấu [NEEDS CLARIFICATION]**
       - Ưu tiên làm rõ theo tác động: phạm vi > bảo mật/riêng tư > trải nghiệm người dùng > chi tiết kỹ thuật
    4. Điền mục Kịch bản người dùng & kiểm thử
       Nếu không ra luồng người dùng rõ ràng: ERROR "Cannot determine user scenarios"
    5. Sinh yêu cầu chức năng
       Mỗi yêu cầu phải kiểm thử được
       Dùng giá trị mặc định hợp lý cho chi tiết chưa ghi (ghi giả định vào mục Assumptions)
    6. Định nghĩa tiêu chí thành công
       Tạo kết quả đo được, bất khả tri công nghệ
       Gồm cả metric định lượng (thời gian, hiệu năng, khối lượng) lẫn thước đo định tính (hài lòng người dùng, hoàn tất việc)
       Mỗi tiêu chí phải kiểm chứng được mà không cần chi tiết triển khai
    7. Nhận diện thực thể chính (nếu có dữ liệu)
    8. Trả về: SUCCESS (spec sẵn sàng để plan)

7. Ghi đặc tả vào SPEC_FILE theo cấu trúc mẫu, thay placeholder bằng chi tiết cụ thể suy từ mô tả tính năng (tham số) đồng thời giữ nguyên thứ tự và tiêu đề các mục.

8. **Kiểm định chất lượng đặc tả**: Sau khi ghi spec ban đầu, kiểm tra theo tiêu chí chất lượng:

   a. **Tạo Checklist chất lượng Spec**: Sinh file checklist tại `SPECIFY_FEATURE_DIRECTORY/checklists/requirements.md` theo cấu trúc mẫu checklist với các mục kiểm tra sau:

      ```markdown
      # Specification Quality Checklist: [FEATURE NAME]

      **Purpose**: Validate specification completeness and quality before proceeding to planning
      **Created**: [DATE]
      **Feature**: [Link to spec.md]

      ## Content Quality

      - [ ] No implementation details (languages, frameworks, APIs)
      - [ ] Focused on user value and business needs
      - [ ] Written for non-technical stakeholders
      - [ ] All mandatory sections completed

      ## Requirement Completeness

      - [ ] No [NEEDS CLARIFICATION] markers remain
      - [ ] Requirements are testable and unambiguous
      - [ ] Success criteria are measurable
      - [ ] Success criteria are technology-agnostic (no implementation details)
      - [ ] All acceptance scenarios are defined
      - [ ] Edge cases are identified
      - [ ] Scope is clearly bounded
      - [ ] Dependencies and assumptions identified

      ## Feature Readiness

      - [ ] All functional requirements have clear acceptance criteria
      - [ ] User scenarios cover primary flows
      - [ ] Feature meets measurable outcomes defined in Success Criteria
      - [ ] No implementation details leak into specification

      ## Notes

      - Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`
      ```

   b. **Chạy kiểm tra**: Đối chiếu spec với từng mục checklist:
      - Với mỗi mục, xác định đạt hay lỗi
      - Ghi vấn đề cụ thể tìm thấy (trích mục spec liên quan)

   c. **Xử lý kết quả kiểm tra**:

      - **Nếu mọi mục đạt**: Đánh dấu checklist xong và sang mục Hook bắt buộc sau khi thực thi

      - **Nếu có mục lỗi (trừ [NEEDS CLARIFICATION])**:
        1. Liệt kê mục lỗi và vấn đề cụ thể
        2. Cập nhật spec để xử lý từng vấn đề
        3. Chạy lại kiểm tra cho tới khi mọi mục đạt (tối đa 3 vòng)
        4. Nếu sau 3 vòng vẫn lỗi, ghi vấn đề còn lại vào ghi chú checklist và cảnh báo người dùng

      - **Nếu còn dấu [NEEDS CLARIFICATION]**:
        1. Trích mọi dấu [NEEDS CLARIFICATION: ...] từ spec
        2. **KIỂM TRA GIỚI HẠN**: Nếu hơn 3 dấu, chỉ giữ 3 dấu trọng yếu nhất (theo tác động phạm vi/bảo mật/UX) và đoán có cơ sở cho phần còn lại
        3. Với mỗi điểm cần làm rõ (tối đa 3), trình bày lựa chọn cho người dùng theo định dạng:

           ```markdown
           ## Question [N]: [Topic]

           **Context**: [Quote relevant spec section]

           **What we need to know**: [Specific question from NEEDS CLARIFICATION marker]

           **Suggested Answers**:

           | Option | Answer | Implications |
           |--------|--------|--------------|
           | A      | [First suggested answer] | [What this means for the feature] |
           | B      | [Second suggested answer] | [What this means for the feature] |
           | C      | [Third suggested answer] | [What this means for the feature] |
           | Custom | Provide your own answer | [Explain how to provide custom input] |

           **Your choice**: _[Wait for user response]_
           ```

        4. **TRỌNG YẾU - Định dạng bảng**: Đảm bảo bảng markdown đúng định dạng:
           - Dùng khoảng cách nhất quán, gióng pipe
           - Mỗi ô có khoảng trắng quanh nội dung: `| Content |` chứ không phải `|Content|`
           - Dòng phân cách tiêu đề có ít nhất 3 gạch: `|--------|`
           - Kiểm tra bảng vẽ đúng trong xem trước markdown
        5. Đánh số câu hỏi tuần tự (Q1, Q2, Q3 - tối đa 3)
        6. Trình bày mọi câu hỏi cùng lúc rồi chờ phản hồi
        7. Chờ người dùng trả lời lựa chọn cho mọi câu (ví dụ "Q1: A, Q2: Custom - [chi tiết], Q3: B")
        8. Cập nhật spec bằng cách thay mỗi dấu [NEEDS CLARIFICATION] bằng đáp án người dùng đã chọn/cung cấp
        9. Chạy lại kiểm tra sau khi mọi điểm làm rõ đã giải quyết

   d. **Cập nhật Checklist**: Sau mỗi vòng kiểm tra, cập nhật file checklist với trạng thái đạt/lỗi hiện tại

## Hook bắt buộc sau khi thực thi

**Bạn PHẢI hoàn tất mục này trước khi báo hoàn tất cho người dùng.**

Kiểm tra xem `.specify/extensions.yml` có tồn tại ở thư mục gốc dự án không.
- Nếu không tồn tại, hoặc không có hook nào đăng ký dưới `hooks.after_specify`, bỏ qua tới Báo cáo hoàn tất.
- Nếu tồn tại, đọc file và tìm các mục dưới khóa `hooks.after_specify`.
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

Báo hoàn tất cho người dùng gồm:
- `SPECIFY_FEATURE_DIRECTORY` — đường dẫn thư mục tính năng
- `SPEC_FILE` — đường dẫn file spec
- Tóm tắt kết quả checklist
- Sẵn sàng cho pha tiếp theo (`/speckit-clarify` hoặc `/speckit-plan`)

**LƯU Ý:** Tạo nhánh do hook `before_specify` đảm nhiệm (extension git). Tạo thư mục và file spec luôn do lệnh lõi này đảm nhiệm.

## Hướng dẫn nhanh

- Tập trung vào người dùng cần **GÌ** và **VÌ SAO**.
- Tránh cách triển khai ra sao (HOW) (không stack công nghệ, API, cấu trúc code).
- Viết cho bên kinh doanh, không phải developer.
- KHÔNG tạo checklist nào nhúng trong spec. Đó sẽ là lệnh riêng.

### Yêu cầu theo mục

- **Mục bắt buộc**: Phải xong cho mọi tính năng
- **Mục tùy chọn**: Chỉ gồm khi liên quan tới tính năng
- Khi mục không áp dụng, gỡ hẳn (đừng để "N/A")

### Cho AI sinh spec

Khi tạo spec từ prompt người dùng:

1. **Đoán có cơ sở**: Dùng ngữ cảnh, chuẩn ngành và mẫu phổ biến để lấp chỗ trống
2. **Ghi giả định**: Ghi giá trị mặc định hợp lý vào mục Assumptions
3. **Hạn chế làm rõ**: Tối đa 3 dấu [NEEDS CLARIFICATION] - chỉ dùng cho quyết định trọng yếu mà:
   - Tác động đáng kể tới phạm vi tính năng hay trải nghiệm người dùng
   - Có nhiều cách hiểu hợp lý với hệ quả khác nhau
   - Không có giá trị mặc định hợp lý
4. **Ưu tiên làm rõ**: phạm vi > bảo mật/riêng tư > trải nghiệm người dùng > chi tiết kỹ thuật
5. **Nghĩ như tester**: Mọi yêu cầu mơ hồ đều phải rớt mục checklist "kiểm thử và rõ nghĩa được"
6. **Vùng hay cần làm rõ** (chỉ khi không có mặc định hợp lý):
   - Phạm vi và ranh giới tính năng (gồm/loại use case cụ thể)
   - Loại người dùng và quyền (nếu có nhiều cách hiểu mâu thuẫn)
   - Yêu cầu bảo mật/tuân thủ (khi có ý nghĩa pháp lý/tài chính)

**Ví dụ mặc định hợp lý** (đừng hỏi về những thứ này):

- Lưu dữ liệu: Theo thông lệ chuẩn ngành cho lĩnh vực
- Mục tiêu hiệu năng: Kỳ vọng app web/mobile chuẩn trừ khi có ghi khác
- Xử lý lỗi: Thông báo thân thiện với dự phòng phù hợp
- Cách xác thực: Session chuẩn hoặc OAuth2 cho web app
- Mẫu tích hợp: Dùng mẫu phù hợp dự án (REST/GraphQL cho dịch vụ web, gọi hàm cho thư viện, tham số CLI cho công cụ, v.v.)

### Hướng dẫn tiêu chí thành công

Tiêu chí thành công phải:

1. **Đo được**: Gồm metric cụ thể (thời gian, phần trăm, số lượng, tỷ lệ)
2. **Bất khả tri công nghệ**: Không nhắc framework, ngôn ngữ, CSDL hay công cụ
3. **Hướng tới người dùng**: Mô tả kết quả từ góc nhìn người dùng/kinh doanh, không phải nội bộ hệ thống
4. **Kiểm chứng được**: Có thể test/kiểm tra mà không cần biết chi tiết triển khai

**Ví dụ tốt**:

- "Người dùng hoàn tất thanh toán trong dưới 3 phút"
- "Hệ thống chịu được 10.000 người dùng đồng thời"
- "95% tìm kiếm trả kết quả trong dưới 1 giây"
- "Tỷ lệ hoàn tất việc tăng 40%"

**Ví dụ xấu** (hướng triển khai):

- "Thời gian đáp ứng API dưới 200ms" (quá kỹ thuật, hãy dùng "Người dùng thấy kết quả ngay")
- "CSDL chịu được 1000 TPS" (chi tiết triển khai, hãy dùng metric hướng người dùng)
- "Component React render hiệu quả" (gắn framework)
- "Tỷ lệ trúng cache Redis trên 80%" (gắn công nghệ)

## Điều kiện xong

- [ ] Đặc tả đã ghi vào `SPEC_FILE` và kiểm định theo checklist chất lượng
- [ ] Extension hooks đã điều phối hoặc bỏ qua theo đúng quy tắc trong mục Hook bắt buộc sau khi thực thi ở trên
- [ ] Đã báo hoàn tất cho người dùng kèm thư mục tính năng, đường dẫn file spec và kết quả checklist
