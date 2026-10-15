# Implementation Plan (hồi tố): Admin quản lý, duyệt đơn

**Branch**: `013-quan-ly-don` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 006 (superseded).

## Summary

Lọc 4 chiều + duyệt 1 chiều theo `NEXT_STATUSES` (FE mirror) + trừ/hoàn kho 1 lần theo cờ + `@PreAuthorize ADMIN`.

## Technical Context

Java 21, Spring Boot 4.1.1, React 18. JPQL `filter`, `write-excel-file` export. Test: `OrderServiceTests` 11 case. Ràng buộc: terminal rỗng; chặn duyệt thiếu phương thức; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau |
| III. Test làm bằng chứng | PASS — ma trận/trừ 1 lần/hủy xanh |
| IV. Kho chung một sự thật | PASS — 4 hàm kho + cờ |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — ADMIN + 401/403 |

## Project Structure

```text
specs/013-quan-ly-don/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/order-admin-api.md └── tasks.md
backend/.../ OrderController (list/detail/status/delete) + OrderServiceImpl.updateStatus + OrderStatusRequest + OrderRepository.filter
frontend/src/pages/admin/OrderManagement.jsx
```

**Structure Decision**: Dùng code hiện có.

## Complexity Tracking

> Không vi phạm cần biện minh.
