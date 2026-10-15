# Implementation Plan (hồi tố): Admin thống kê doanh thu

**Branch**: `014-thong-ke` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 006 (superseded).

## Summary

4 API stats (overview/revenue-by-day/orders-by-status/top-products, chỉ tính `HOAN_THANH`) + `ThongKe.jsx` (KPI/charts/top-5/tồn thấp/bảng/export).

## Technical Context

Java 21, Spring Boot 4.1.1, React 18. JPQL group-by + fill ngày trống. Test: `StatsServiceTests` 3 case. Ràng buộc: class-level ADMIN; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau |
| III. Test làm bằng chứng | PASS |
| IV. Kho chung một sự thật | PASS — tồn thấp từ `available` |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — ADMIN |

## Project Structure

```text
specs/014-thong-ke/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/stats-api.md └── tasks.md
backend/.../ StatsController + StatsServiceImpl + 4 DTO + OrderRepository.revenueByDay + OrderDetailRepository.topSelling
frontend/src/pages/admin/ThongKe.jsx + services/warehouseService.js
```

**Structure Decision**: Dùng code hiện có.

## Complexity Tracking

> Không vi phạm cần biện minh.
