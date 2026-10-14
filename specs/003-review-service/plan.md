# Implementation Plan: Review Service Layer

**Branch**: `003-review-service` | **Date**: 2026-10-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-review-service/spec.md`

## Summary

Tách nghiệp vụ Review khỏi controller về `ReviewService` + `ReviewServiceImpl` và chuyển 2 record nội bộ thành DTO ngoài (`dto/request`, `dto/response`), giữ nguyên validation, mã hiển thị `DG..`, thứ tự mới nhất trước và phân quyền ADMIN để frontend không phải sửa.

## Technical Context

**Language/Version**: Java 21 (backend), không đổi frontend

**Primary Dependencies**: Spring Boot 4.1.1 (web, data-jpa, security, validation), Lombok, Hibernate `@CreationTimestamp`

**Storage**: MySQL 8 bảng `reviews` (không migration, `ddl-auto=update`), truy vấn `findAllByOrderByCreatedAtDesc`

**Testing**: JUnit 5 + Mockito + AssertJ (`mvn test -Dtest=ReviewServiceTest`), kiểm tay Swagger + trang Quản lý đánh giá

**Target Platform**: Docker Compose (backend :8080, frontend :5173, mysql :3306)

**Project Type**: Web application (đổi backend, frontend giữ nguyên)

**Performance Goals**: List vài trăm bản ghi < 1 giây; CRUD đơn bản ghi phản hồi ngay

**Constraints**: Giữ nguyên path `/api/reviews`, JSON field, message tiếng Việt; `@PreAuthorize("hasRole('ADMIN')")` giữ ở controller; không tin giá trị chưa trim

**Scale/Scope**: 1 service + 2 DTO + 1 test class + gọn controller; không phân trang server, không FK mới

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture**: ĐẠT — sau plan controller chỉ gọi `ReviewService`, service gọi `ReviewRepository`; DTO ngoài đúng tầng.
- **II. Spec Trước, Code Sau**: ĐẠT — spec + plan + tasks trước implement.
- **III. Test Làm Bằng Chứng**: ĐẠT — `ReviewServiceTest` mock repository, cộng quickstart tay.
- **IV. Kho Chung Một Sự Thật**: Không liên quan (không động inventory).
- **V. Tiếng Việt Cho Người Dùng**: ĐẠT — message giữ tiếng Việt, commit Conventional Commits tiếng Việt.
- **VI. Spec-kit Tiếng Việt**: ĐẠT — artifact tiếng Việt.
- **Security**: ĐẠT — giữ `@PreAuthorize` ADMIN, validation server-side, trim chống blank né validation.

*Re-check sau Phase 1: không thêm entity/quyền/endpoint mới — giữ nguyên kết luận.*

## Project Structure

### Documentation (this feature)

```text
specs/003-review-service/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── review-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/main/java/com/salemanagement/
│   ├── controller/
│   │   └── ReviewController.java      # gọn: inject ReviewService, giữ @PreAuthorize + mapping
│   ├── service/
│   │   └── ReviewService.java         # mới: list/create/update/delete
│   ├── service/impl/
│   │   └── ReviewServiceImpl.java     # mới: trim, reply rỗng→null, map code DG.., 404
│   ├── dto/request/
│   │   └── ReviewRequest.java         # mới (chuyển từ record nội bộ)
│   ├── dto/response/
│   │   └── ReviewResponse.java        # mới (chuyển từ record nội bộ)
│   ├── entity/Review.java             # không đổi
│   └── repository/ReviewRepository.java # không đổi
└── src/test/java/com/salemanagement/
    └── ReviewServiceTest.java         # mới: JUnit5 + Mockito

frontend/
└── src/pages/admin/ReviewManagement.jsx # không đổi (kiểm hồi quy)
```

**Structure Decision**: Web application — chỉ đổi backend theo mẫu Brand/Category (Service interface + Impl + DTO ngoài), frontend giữ nguyên để chứng minh hợp đồng không vỡ.

## Complexity Tracking

> Chỉ ghi khi vi phạm constitution cần lý giải.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | Không vi phạm | — |
