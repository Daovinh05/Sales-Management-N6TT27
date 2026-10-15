# Tasks (hồi tố): Đăng ký, đăng nhập, đăng xuất

**Input**: `specs/007-auth-dang-nhap/` (spec, plan, research, data-model, contracts, quickstart)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [ ] T001 [P] Dựng môi trường verify: Docker dev up, backend :8080, seed `customer/123456`
- [ ] T002 [P] Skill `explore` đọc nhóm file auth rồi tóm tắt trước khi chạm code

## Phase 2: US1 Đăng ký (P1)

- [ ] T010 [US1] Đối chiếu `RegisterRequest.java:13-28` + `AuthController.register:31-39` + `AuthServiceImpl.register` (check trùng, gán `ROLE_CUSTOMER`, BCrypt, `ACTIVE`) khớp FR-001 + contract
- [ ] T011 [US1] Đối chiếu `RegisterModal` (`AuthModal.jsx`): check khớp password, strip phone, notify "Đăng ký thành công, mời đăng nhập"
- [ ] T012 [US1] Chạy tay quickstart Kịch bản 1 (201 / 400 từng trường / trùng) → lưu output

## Phase 3: US2 Đăng nhập + gia hạn (P1)

- [ ] T020 [US2] Đối chiếu `AuthServiceImpl.login/refresh` + `JwtFilter/JwtProvider/SecurityConfig` khớp FR-002/FR-003/FR-006
- [ ] T021 [US2] Đối chiếu `store/auth.jsx:50-59` (login lưu 3 key) + `services/api.js:37-68` (Bearer, refresh dedupe, `auth:expired` 1 lần) + listener `auth.jsx:12-19`
- [ ] T022 [US2] Chạy test: `mvn -Dtest='AuthServiceTests,PasswordResetServiceTests' test` → xanh
- [ ] T023 [US2] Chạy tay: login sai → 401; access hết hạn → tự refresh 1 lần không văng

## Phase 4: US3 Đăng xuất (P1) — có fix thật

- [ ] T030 [US3] Fix `logout()` (`frontend/src/store/auth.jsx:94-108`): gọi `POST /api/auth/logout` best-effort rồi xóa local — caller `ShopLayout.jsx:37`, `CustomerHeader.jsx:206`, `UserManagement.jsx:164` không đổi vẫn chạy
- [ ] T031 [US3] Verify fix: login → logout → refresh cũ → 401; mất mạng lúc logout local vẫn sạch (quickstart Kịch bản 2)
- [ ] T032 [US3] Commit riêng `fix(frontend-auth): thu hồi refresh token server khi đăng xuất` sau khi xem `git diff`

## Phase 5: US4 Quên/đặt lại MK (P2)

- [ ] T040 [US4] Đối chiếu `forgotPassword/resetPassword` (`AuthController:52-77`, `AuthServiceImpl:111-150`, `PasswordResetService`, `MailService.isConfigured`) khớp FR-005: luôn 200 + mã demo khi `mailSent=false`
- [ ] T041 [US4] Chạy tay: user không tồn tại → 200 giống hệt; đặt lại → login bằng MK mới được

## Phase 6: Polish

- [ ] T050 [P] Rà tiếng Việt message/nhãn; kiểm tra secret chỉ trong `.env` (`git log -p -- .env` không ra gì); lưu bằng chứng demo
