# Implementation Plan (hồi tố): Quên / đặt lại mật khẩu

**Branch**: `009-quen-mat-khau` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 007 (superseded).

## Summary

Xin mã luôn 200 chống dò (mã demo khi chưa SMTP) + đặt lại bằng mã 1 lần có hạn, 2 bước trong `AuthModal`.

## Technical Context

Java 21, Spring Boot 4.1.1, `MailService` (optional SMTP), React 18. Test: `PasswordResetServiceTests`. Ràng buộc: không lộ user tồn tại; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau |
| III. Test làm bằng chứng | PASS |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — mã 1 lần + chống enumeration |

## Project Structure

```text
specs/009-quen-mat-khau/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/password-reset-api.md └── tasks.md
backend/.../ AuthController (forgot/reset + alias) + AuthServiceImpl.forgot/reset + PasswordResetService
frontend/src/components/auth/AuthModal.jsx (forgot 2 bước) + store/auth.jsx (forgotPassword/resetPassword)
```

**Structure Decision**: Dùng code hiện có.

## Complexity Tracking

> Không vi phạm cần biện minh.
