# Implementation Plan (hồi tố): Cụm khách — Đặt hàng, thanh toán, lịch sử đơn

**Branch**: `005-khach-dat-thanh-toan` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-khach-dat-thanh-toan/spec.md`

> Hồi tố: code đã có trên `main`; plan này ghi lại quyết định kỹ thuật đã chốt khi làm thật. Auth tách riêng ở `007-auth-dang-nhap`, ở đây giả định đã đăng nhập.

## Summary

Khách đặt hàng `POST /api/orders` (giá từ DB, giữ chỗ `reserved` bằng khóa bi quan) → trả COD/VietQR qua `POST /{code}/payment` (giữ `CHO_DUYET`, trừ kho ở `HOAN_THANH`) + link PayOS/webhook HMAC idempotent (fallback demo khi chưa cấu hình) → theo dõi/hủy/thanh toán bù ở lịch sử đơn. Quy trình làm thật: Agent đọc codebase trả lời trước–code sau, vẽ sequence `mermaid/04-sequence-order.mmd` trước khi code payment, mỗi task 1 vòng kín (diff → chạy thử → commit nhỏ).

## Technical Context

**Language/Version**: Java 21, Spring Boot 4.1.1, React 18 + Vite 5

**Primary Dependencies**: Spring Data JPA, Axios, PayOS client (optional), `img.vietqr.io` fallback

**Storage**: MySQL 8 (`banhang`); `orders` (`status` VARCHAR), `order_detail`, `inventory` (`quantity`, `reservedQuantity`)

**Testing**: JUnit 5 + Mockito + AssertJ (`mvn -Dtest='OrderServiceTests,PaymentServiceTest' test`); tay bằng curl + DevTools + phpMyAdmin

**Target Platform**: Docker Compose — backend :8080, frontend :5173, mysql :3307, phpMyAdmin :8081

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Đồ án quy mô nhỏ — chuyển/payment là vài SELECT + 1 UPDATE; polling VietQR 3s/lần, không đặt SLA riêng

**Constraints**: Tiếng Việt toàn bộ UI/message/commit; phân tầng Controller → Service → Repository; giá server tính từ DB

**Scale/Scope**: 1 kho trung tâm (`CENTRAL_WAREHOUSE_ID = 1`); ~8 file backend + 4 file frontend (auth tách ở 007)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS — `OrderController/PaymentController` chỉ nhận request + `@PreAuthorize` → `OrderServiceImpl/PaymentServiceImpl` → Repository; FE gọi qua `services/api.js` |
| II. Spec trước, code sau | HỒI TỐ GHI NHẬN — lúc làm thật dùng SRS trong tin nhắn + mermaid thay spec file; nay bổ sung spec/plan/tasks để khớp chuẩn (lý do chính đáng, không code mới) |
| III. Test làm bằng chứng | PASS — `OrderServiceTests` (giữ chỗ/vượt tồn/spoof giá), `PaymentServiceTest` + webhook concurrency; giữ `mvn test` xanh |
| IV. Kho chung một sự thật | PASS — đặt giữ `reserved`, trừ thật ở Hoàn thành, hủy hoàn theo `stockDeducted`; `available = quantity − reserved` chặn ở cả giỏ và API |
| V. Tiếng Việt | PASS — message + nhãn + commit tiếng Việt |
| VI. Spec-kit tiếng Việt | PASS — artifact tiếng Việt |
| Security | PASS — `checkOwner` đúng chủ đơn; webhook verify HMAC + check khớp tiền; giá từ DB |

## Project Structure

### Documentation (this feature)

```text
specs/005-khach-dat-thanh-toan/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── order-payment-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/main/java/com/salemanagement/
├── controller/OrderController.java     # POST /, POST /{code}/payment, /vietqr-link, /cancel, GET /mine, /{code}/detail
├── service/impl/OrderServiceImpl.java  # create/reserve, confirmPayment, cancelByOwner
├── service/impl/PaymentServiceImpl.java# vietqr-link + payos-webhook (HMAC, idempotent)
└── dto/ (OrderRequest, PaymentConfirmRequest, VietQrLinkResponse)

frontend/src/
├── pages/shop/Checkout.jsx             # form + POST /orders + banner chờ trả
├── pages/shop/PaymentModal.jsx         # tab COD/VietQR, link, polling, hủy
└── pages/shop/OrderHistory.jsx + OrderSuccess.jsx
```

**Structure Decision**: Web application — dùng nguyên backend Spring Boot + frontend React hiện có, không thêm module.

## Complexity Tracking

> Không vi phạm cần biện minh ngoài mục II (hồi tố artifact, đã ghi lý do).
