# Implementation Plan (hồi tố): Đặt hàng giữ chỗ kho

**Branch**: `010-dat-hang` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 005 (superseded).

## Summary

`POST /api/orders`: giá từ DB, giữ chỗ `reserved` bằng khóa bi quan kho trung tâm, đơn mới `CHO_DUYET` → mở payment (009).

## Technical Context

Java 21, Spring Boot 4.1.1, React 18 + Vite 5. JPA + MySQL 8 (`orders`, `order_detail`, `inventory`). Test: `OrderServiceTests` (giữ chỗ/vượt tồn/spoof). Docker dev :8080/:5173. Ràng buộc: tiếng Việt; giá server tính từ DB; 1 kho trung tâm.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS — Controller → Service → Repository; FE qua `services/api.js` |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau, không code mới |
| III. Test làm bằng chứng | PASS — 2 case đặt hàng xanh |
| IV. Kho chung một sự thật | PASS — giữ `reserved`, `available = quantity − reserved` |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — `checkOwner`, không tin giá client |

## Project Structure

```text
specs/010-dat-hang/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/order-create-api.md └── tasks.md
backend/.../ controller/OrderController.java (POST /) + service/impl/OrderServiceImpl.java (create/reserveStock)
frontend/src/pages/shop/Checkout.jsx
```

**Structure Decision**: Dùng code hiện có, không thêm module.

## Complexity Tracking

> Không vi phạm cần biện minh.
