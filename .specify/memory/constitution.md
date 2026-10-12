# TECHZONE Sales Management Constitution

## Core Principles

### I. Layered Architecture (NON-NEGOTIABLE)
Backend Spring Boot đi đúng tầng: Controller (nhận request, `@PreAuthorize`) → Service (nghiệp vụ + transaction) → Repository (truy vấn) → Entity/MySQL. Controller không gọi trực tiếp repository. Frontend React gọi REST qua `services/*.js`, không gọi chéo component.

### II. Spec Trước, Code Sau
Tính năng mới phải có đặc tả (`/speckit-specify`), plan (`/speckit-plan`) và task (`/speckit-tasks`) trước khi `/speckit-implement`. Không code khi chưa rõ input → output của từng bước.

### III. Test Làm Bằng Chứng
Luồng nghiệp vụ (tồn kho, trạng thái đơn, thanh toán) phải có test: JUnit 5 + Mockito cho service, giữ `mvn test` xanh. Test đỏ thì không merge. Concurrency (khóa bi quan) phải được lý giải bằng test hoặc kịch bản tay có bằng chứng.

### IV. Kho Chung Một Sự Thật
Bảng `inventory` dùng chung nhập/xuất. Công thức duy nhất: `bán được = quantity − reservedQuantity`. Nhập kho chỉ tăng `quantity`; bán hàng giữ chỗ `reserved`, trừ thật ở Hoàn thành; cờ `stockDeducted` chống trừ 2 lần. Mọi màn hình hiện số bán được, trừ trang kho đối chiếu đủ 3 cột.

### V. Tiếng Việt Cho Người Dùng
Mọi câu chữ UI, message lỗi trả về client và commit message đều tiếng Việt. Commit theo Conventional Commits: `type(scope): mô tả`, 1 commit = 1 việc/1 mảng.

### VI. Spec-kit Viết Bằng Tiếng Việt
Template và lệnh spec-kit gốc giữ nguyên tiếng Anh để tương thích khi update, nhưng mọi artifact sinh ra (constitution, spec.md, plan.md, tasks.md, checklist, báo cáo converge) và mọi trao đổi với người dùng đều viết bằng tiếng Việt.

## Security Requirements

JWT access 30 phút + refresh 7 ngày lưu DB; secret chỉ trong `.env`, không commit. Mọi endpoint ghi dữ liệu phải có `@PreAuthorize` đúng role; không tin giá client gửi lên — giá bán lấy từ DB server.

## Development Workflow

SRS → plan (task + tiêu chí kiểm tra) → làm từng task (đọc diff sau mỗi task) → verify độc lập (test xanh / curl / chạy tay) → commit nhỏ. Lỗi phải kèm bằng chứng log/message, không đoán mò.

## Governance

Constitution này cao hơn thói quen cá nhân; sửa đổi phải ghi lý do và thông báo cả nhóm. Mọi PR merge vào main phải qua review đúng người đúng mảng.

**Version**: 1.0.0 | **Ratified**: 2026-10-12 | **Last Amended**: 2026-10-12
