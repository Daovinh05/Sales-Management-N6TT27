# Tasks (hồi tố): Auth cơ bản

**Input**: `specs/008-auth-co-ban/` | Tách từ 007. Code đã có + 1 fix logout.

- [ ] T001 [P] Docker dev up; skill `explore` đọc nhóm auth trước
- [ ] T010 Đối chiếu BE: `AuthController:26-50`, `AuthServiceImpl:49-109`, JwtFilter/Provider, `SecurityConfig:37-61`, `RegisterRequest:13-28`
- [ ] T011 Đối chiếu FE: `store/auth.jsx`, `api.js:37-68` (dedupe + 1 toast), `AuthModal.jsx`, nút logout (`ShopLayout:37`, `CustomerHeader:206`)
- [ ] T012 Fix `logout()` (`auth.jsx:94-108`): revoke best-effort rồi xóa local — xem diff → commit riêng
- [ ] T013 Test: `mvn -Dtest='AuthServiceTests' test` → xanh
- [ ] T014 Tay (quickstart): register/login/refresh/logout-revoke 401; secret chỉ trong `.env`
