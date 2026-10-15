# Implementation Plan (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Branch**: `007-auth-dang-nhap` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-auth-dang-nhap/spec.md`

> Hồi tố: code đã có trên `main`; plan này ghi lại quyết định kỹ thuật đã chốt khi làm thật. Có 1 fix thật trong đợt này: `logout()` FE gọi revoke server (trước đây chỉ xóa local).

## Summary

Đăng ký validate 2 lớp (FE chặn sớm + `RegisterRequest` chặn chắc, BCrypt + role `CUSTOMER` mặc định) → đăng nhập trả JWT access 30p + refresh xoay vòng 7 ngày → FE tự refresh 1 lần khi 401/403, hết phiên báo 1 toast → đăng xuất thu hồi refresh server (best-effort) + xóa local. Quên mật khẩu luôn 200 chống dò, mã demo khi chưa SMTP.

## Technical Context

**Language/Version**: Java 21, Spring Boot 4.1.1, React 18 + Vite 5

**Primary Dependencies**: Spring Security (JWT HS512, BCrypt), JPA, Axios, `MailService` (optional SMTP)

**Storage**: MySQL 8; `users` (username/email UK), `user_role`, `refresh_token` (`token` UK, `expires_at`, `revoked`), `password_reset` (mã 1 lần)

**Testing**: JUnit 5 + Mockito (`mvn -Dtest='AuthServiceTests,PasswordResetServiceTests' test`); tay bằng curl

**Target Platform**: Docker Compose — backend :8080, frontend :5173

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Đồ án nhỏ — login/register/refresh là 1–3 query; không SLA riêng

**Constraints**: Tiếng Việt toàn bộ UI/message/commit; secret JWT + SMTP chỉ trong `.env`, không commit

**Scale/Scope**: ~8 file backend + 3 file frontend; 1 fix FE (`store/auth.jsx` logout)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS — `AuthController` → `AuthServiceImpl` → Repository; FE qua `services/api.js` |
| II. Spec trước, code sau | HỒI TỐ GHI NHẬN — lúc làm thật dùng SRS tin nhắn thay spec file; nay bổ sung (không code mới ngoài fix logout 1 hàm) |
| III. Test làm bằng chứng | PASS — `AuthServiceTests` (login/register trùng/quên MK demo-thật) + `PasswordResetServiceTests` |
| IV. Kho chung một sự thật | N/A — auth không động kho |
| V. Tiếng Việt | PASS — message validation + notify + commit tiếng Việt |
| VI. Spec-kit tiếng Việt | PASS |
| Security | PASS — BCrypt, HS512, refresh xoay vòng + revoke, forgot chống dò, giá trị secret trong `.env` |

## Project Structure

### Documentation (this feature)

```text
specs/007-auth-dang-nhap/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-api.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/src/main/java/com/salemanagement/
├── controller/AuthController.java        # login/register/refresh/logout/forgot/reset
├── service/impl/AuthServiceImpl.java     # BCrypt, Jwt, refresh xoay vòng, forgot chống dò
├── security/JwtFilter.java + JwtProvider.java + config/SecurityConfig.java
└── dto/request/ (Register/Login/Refresh/ForgotPassword/ResetPassword)Request.java

frontend/src/
├── store/auth.jsx            # login/register/forgot/reset/logout (revoke best-effort) — FIX ở đây
├── services/api.js           # Bearer + auto-refresh dedupe + auth:expired 1 lần
└── components/auth/AuthModal.jsx  # LoginModal / RegisterModal / forgot 2 bước
```

**Structure Decision**: Web application — dùng nguyên auth hiện có, chỉ fix 1 hàm `logout()` FE.

## Complexity Tracking

> Không vi phạm cần biện minh ngoài mục II (hồi tố artifact, đã ghi lý do).
