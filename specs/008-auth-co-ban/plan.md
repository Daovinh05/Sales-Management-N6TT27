# Implementation Plan (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Branch**: `008-auth-co-ban` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md) | Tách từ 007 (superseded).

## Summary

Register validate 2 lớp (BCrypt + `CUSTOMER`) → login JWT access 30p + refresh xoay vòng 7 ngày → FE auto-refresh dedupe → logout revoke server (fix thật: `store/auth.jsx:94-108`).

## Technical Context

Java 21, Spring Boot 4.1.1 (Security HS512/BCrypt), React 18, Axios. MySQL (`users`, `refresh_token`). Test: `AuthServiceTests`. Ràng buộc: secret trong `.env`; tiếng Việt.

## Constitution Check

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS |
| II. Spec trước, code sau | HỒI TỐ — bổ sung sau (1 fix logout kèm theo) |
| III. Test làm bằng chứng | PASS |
| IV. Kho chung một sự thật | N/A |
| V–VI. Tiếng Việt | PASS |
| Security | PASS — xoay vòng + revoke + chống toast trùng |

## Project Structure

```text
specs/008-auth-co-ban/ ├── plan.md ├── research.md ├── data-model.md ├── quickstart.md ├── contracts/auth-core-api.md └── tasks.md
backend/.../ AuthController + AuthServiceImpl + JwtFilter/Provider + SecurityConfig + Register/Login/RefreshRequest
frontend/src/store/auth.jsx + services/api.js + components/auth/AuthModal.jsx
```

**Structure Decision**: Dùng code hiện có + 1 fix logout.

## Complexity Tracking

> Không vi phạm cần biện minh.
