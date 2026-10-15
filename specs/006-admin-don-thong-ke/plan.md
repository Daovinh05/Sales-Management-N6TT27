# Implementation Plan (hồi tố): Cụm admin — Quản lý đơn, thống kê

**Branch**: `006-admin-don-thong-ke` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-admin-don-thong-ke/spec.md`

> Hồi tố: code đã có trên `main`; plan này ghi lại quyết định kỹ thuật đã chốt khi làm thật.

## Summary

Admin lọc/duyệt đơn 1 chiều theo `NEXT_STATUSES` (`PATCH /orders/{code}/status`, chặn duyệt thiếu phương thức, trừ/hoàn kho theo cờ `stockDeducted` đúng 1 lần) + xem thống kê qua 4 API (`overview`, `revenue-by-day`, `orders-by-status`, `top-products`) vẽ KPI/biểu đồ/top-5/tồn thấp trên `ThongKe.jsx`. Tất cả API admin khóa `@PreAuthorize("hasRole('ADMIN')")`.

## Technical Context

**Language/Version**: Java 21, Spring Boot 4.1.1, React 18 + Vite 5

**Primary Dependencies**: Spring Data JPA (JPQL `filter/revenueByDay/topSelling`), Spring Security, `write-excel-file` (export)

**Storage**: MySQL 8; đọc từ `orders` + `order_detail` + `inventory`; không thêm bảng/cột

**Testing**: JUnit 5 + Mockito (`mvn -Dtest='OrderServiceTests,StatsServiceTests' test`); tay bằng curl + UI + phpMyAdmin

**Target Platform**: Docker Compose — backend :8080, frontend :5173

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Đồ án nhỏ — duyệt đơn 1 UPDATE; stats là JPQL group-by theo khoảng ngày, không SLA riêng

**Constraints**: Tiếng Việt; phân tầng Controller → Service → Repository; FE mirror `NEXT_STATUSES`, không hard-code if-else rời rạc

**Scale/Scope**: 1 kho trung tâm; ~8 file backend + 2 trang frontend + 2 file test

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS — `OrderController/StatsController` → `OrderServiceImpl/StatsServiceImpl` → Repository; FE qua `services/api.js` |
| II. Spec trước, code sau | HỒI TỐ GHI NHẬN — như 005 (SRS tin nhắn + mermaid thay spec file lúc làm thật) |
| III. Test làm bằng chứng | PASS — `OrderServiceTests` (ma trận/hủy/hoàn/trừ 1 lần) + `StatsServiceTests` (3 case) |
| IV. Kho chung một sự thật | PASS — duyệt/hủy dùng đúng 4 hàm kho (`reserve/release/deductIfNeeded/restore`) + cờ `stockDeducted`; ThongKe hiện `available`, trang kho đủ 3 cột |
| V. Tiếng Việt | PASS |
| VI. Spec-kit tiếng Việt | PASS |
| Security | PASS — `@PreAuthorize("hasRole('ADMIN')")` giữ nguyên; không tin giá client |

## Project Structure

### Documentation (this feature)

```text
specs/006-admin-don-thong-ke/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-orders-stats-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/main/java/com/salemanagement/
├── controller/OrderController.java       # GET list/detail, PATCH /{code}/status, DELETE
├── service/impl/OrderServiceImpl.java    # NEXT_STATUSES, updateStatus, 4 hàm kho
├── controller/StatsController.java       # 4 API /api/admin/stats/*
├── service/impl/StatsServiceImpl.java    # overview/revenue/status/top
└── repository/OrderRepository.java + OrderDetailRepository.java

frontend/src/pages/admin/
├── OrderManagement.jsx  # filter, mirror NEXT_STATUSES, dialog duyệt, phân trang, export
└── ThongKe.jsx          # KPI, bar-chart, donut, top-5, tồn thấp, bảng detail, export
```

**Structure Decision**: Web application — mở rộng endpoint/trang hiện có, không thêm module.

## Complexity Tracking

> Không vi phạm cần biện minh ngoài mục II (hồi tố artifact, đã ghi lý do).
