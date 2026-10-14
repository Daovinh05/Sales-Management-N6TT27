# Implementation Plan: Thanh toán PayOS + VietQR

**Branch**: `feat/quen_mat_khau` | **Date**: 2026-10-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-payos-vietqr/spec.md`

## Summary

Thay nút "Tôi đã chuyển khoản" tự khai bằng xác thực tiền về thật qua PayOS: backend tạo payment link gắn tài khoản shop (MB – 0389783619 – DAO VAN VINH), PayOS bắn webhook khi ngân hàng ghi nhận giao dịch, backend verify chữ ký HMAC-SHA256 rồi đánh dấu đơn `paid`. Shop vẫn giữ quyền duyệt đơn; tồn kho không đổi luồng. Phần lõi đã dựng và verify trên docker; plan này chốt kiến trúc và ghi 2 mục follow-up (nút tạo mã mới, job tự hủy đơn treo).

## Technical Context

**Language/Version**: Java 21 (backend), JavaScript + React (frontend Vite)

**Primary Dependencies**: Spring Boot 4.1.1 (webmvc, data-jpa, security, validation, mail), jjwt 0.11.5, PayOS Merchant API v2 qua REST (`RestTemplate`, không dùng SDK ngoài), React + axios

**Storage**: MySQL 8 (bảng `orders` thêm `payos_order_code`, `payment_link_id`, `paid`, `paid_at`; `ddl-auto=update`)

**Testing**: JUnit 5 + Mockito + AssertJ (`mvn test`); curl kiểm webhook; test tay quét QR thật

**Target Platform**: Docker Compose (backend :8080, frontend :5173, mysql :3307); webhook production cần HTTPS public, local dùng ngrok

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Webhook xử lý < 2 giây (tránh PayOS retry); polling frontend 3 giây/lần; chịu trùng webhook không tác dụng phụ

**Constraints**: 3 key PayOS chỉ trong biến môi trường; secret không vào log; webhook luôn HTTP 200; link PayOS mặc định hết hạn 15 phút; không tin giá client

**Scale/Scope**: Vài nghìn đơn/tháng; 1 webhook endpoint public + 1 endpoint tạo link (auth); không ví nội bộ, không đối soát sao kê tay trong phạm vi này

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Layered Architecture**: ĐẠT — `PaymentController`/`OrderController` → `PaymentService`/`PayosApiClient` → `OrderRepository` → `Order`; controller không chạm repository; frontend qua `services/api.js`.
- **II. Spec Trước, Code Sau**: CHẤP NHẬN LỆCH — code lõi dựng trước trong lúc thăm dò cùng user; plan/spec này hội tụ (converge) lại toàn bộ và khóa 2 mục còn thiếu cho `/speckit.tasks`. Không mở rộng phạm vi mới ngoài spec.
- **III. Test Làm Bằng Chứng**: ĐẠT — test HMAC round-trip/bị sửa, webhook (hợp lệ, trùng, lệch tiền, mã lạ, sai ký), tạo link (403/400/fallback); `mvn test` 51/51 xanh; verify tay bằng curl + docker.
- **IV. Kho Chung Một Sự Thật**: ĐẠT — webhook chỉ set `paid`, không động `reserved/quantity/stockDeducted`; luồng trừ kho giữ nguyên.
- **V. Tiếng Việt**: ĐẠT — UI/message/commit tiếng Việt; Conventional Commits.
- **Security**: ĐẠT — key trong `.env` (ignore), webhook xác thực chữ ký thay cho JWT, endpoint tạo link yêu cầu đúng chủ đơn, số tiền lấy từ DB.

*Re-check sau Phase 1: không phát sinh thực thể/quyền mới ngoài thiết kế trên — giữ nguyên kết luận.*

## Project Structure

### Documentation (this feature)

```text
specs/002-payos-vietqr/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── payos-payment-api.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/main/java/com/salemanagement/
│   ├── controller/
│   │   ├── OrderController.java      # + POST /{code}/vietqr-link (auth, chủ đơn)
│   │   └── PaymentController.java    # POST /payos-webhook (public, verify ký)
│   ├── service/
│   │   ├── PayosApiClient.java       # tạo link, verify chữ ký webhook
│   │   └── PaymentService.java       # điều phối link + webhook, không ném lỗi webhook
│   ├── service/impl/
│   │   ├── PayosApiClientImpl.java   # RestTemplate + HMAC-SHA256
│   │   └── PaymentServiceImpl.java
│   ├── dto/response/
│   │   ├── VietQrLinkResponse.java
│   │   └── OrderResponse.java        # + paid, paidAt
│   ├── entity/Order.java             # + payosOrderCode, paymentLinkId, paid, paidAt
│   ├── repository/OrderRepository.java # + findByPayosOrderCode
│   └── config/SecurityConfig.java    # permit /api/payments/payos-webhook
└── src/test/java/com/salemanagement/
    ├── PayosApiClientTest.java
    └── PaymentServiceTest.java

frontend/
└── src/pages/shop/PaymentModal.jsx   # luồng PayOS + polling 3s + fallback demo
```

**Structure Decision**: Giữ nguyên kiến trúc Controller → Service → Repository hiện có, thêm `PaymentService` riêng để không phình `OrderService`; `PayosApiClient` tách lớp gọi gateway để test chữ ký không cần mạng.

## Complexity Tracking

> Chỉ ghi khi vi phạm constitution cần lý giải.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Spec viết sau code (II) | Luồng PayOS được làm rõ dần qua thử nghiệm cùng user (key, webhook, expiry) | Viết spec trước khi hiểu webhook/signature PayOS dễ sai; đã converge đầy đủ tại đây |
