# Implementation Plan (hồi tố): Lịch sử đơn

**Branch**: `012-lich-su-don` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 005 (superseded).

## Summary

`OrderHistory.jsx` (tab/badge/modal chi tiết) + trả bù qua 009 + `cancelByOwner` 2 trạng thái đầu hoàn kho theo cờ.

## Technical Context

React 18 (`OrderHistory.jsx`, `OrderSuccess.jsx`) + `GET /mine`, `/{code}/detail`, `POST /{code}/cancel`. Test: case hủy trong `OrderServiceTests`. Ràng buộc: nút hủy chỉ 2 trạng thái; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau |
| III. Test làm bằng chứng | PASS |
| IV. Kho chung một sự thật | PASS — hủy hoàn theo `stockDeducted` |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — đúng chủ đơn |

## Project Structure

```text
specs/012-lich-su-don/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/order-history-api.md └── tasks.md
backend/.../ OrderServiceImpl.cancelByOwner + OrderController (mine/detail/cancel)
frontend/src/pages/shop/OrderHistory.jsx + OrderSuccess.jsx
```

**Structure Decision**: Dùng code hiện có.

## Complexity Tracking

> Không vi phạm cần biện minh.
