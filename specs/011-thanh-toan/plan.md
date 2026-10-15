# Implementation Plan (hồi tố): Thanh toán COD / VietQR

**Branch**: `011-thanh-toan` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 005 (superseded).

## Summary

`POST /{code}/payment` giữ `CHO_DUYET` + `/{code}/vietqr-link` (PayOS/fallback demo) + webhook HMAC idempotent + polling FE 3s. Sequence vẽ trước khi code.

## Technical Context

Java 21, Spring Boot 4.1.1, React 18. PayOS client (optional), `img.vietqr.io` fallback. Test: `PaymentServiceTest` + `PaymentWebhookConcurrencyTest`. Ràng buộc: trừ kho ở Hoàn thành, không trừ khi trả; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — thay bằng sequence diagram vẽ trước (chấp nhận được, ghi nhận) |
| III. Test làm bằng chứng | PASS — link/webhook/idempotent xanh |
| IV. Kho chung một sự thật | PASS — không động kho khi trả |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — HMAC + khớp tiền + đúng chủ |

## Project Structure

```text
specs/011-thanh-toan/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/payment-api.md └── tasks.md
backend/.../ PaymentServiceImpl.java + OrderServiceImpl.confirmPayment + PaymentConfirmRequest + VietQrLinkResponse
frontend/src/pages/shop/PaymentModal.jsx + mermaid/04-sequence-order.mmd
```

**Structure Decision**: Dùng code hiện có.

## Complexity Tracking

> Không vi phạm cần biện minh.
