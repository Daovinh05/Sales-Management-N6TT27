# Research (hồi tố): Auth cơ bản

**Ngày**: 2026-10-15 | **Tính năng**: `008-auth-co-ban` (tách từ 007)

## Quyết định 1: Access ngắn + refresh xoay vòng

- **Quyết định**: Access 30p HS512 + refresh 7 ngày DB; refresh revoke cũ; logout revoke.
- **Lý do**: Giảm rủi ro lộ token, chống replay, stateless.
- **Phương án đã cân nhắc**: Session server — loại vì scale kém.

## Quyết định 2: Validate 2 lớp tiếng Việt

- **Quyết định**: FE chặn sớm + `RegisterRequest` chặn chắc; thêm ràng buộc mới chỉ cần `@Pattern` đúng mẫu có sẵn.
- **Lý do**: Curl trực tiếp vẫn bị chặn.
- **Phương án đã cân nhắc**: Chỉ validate FE — loại vì bypass được.

## Quyết định 3: Auto-refresh dedupe + 1 toast

- **Quyết định**: Gom concurrent 401 về 1 refresh; `auth:expired` 1 lần.
- **Lý do**: Từng bị toast trùng (đã fix).
- **Phương án đã cân nhắc**: Mỗi request tự refresh — loại vì race + spam.

## Quyết định 4: Logout revoke server (fix thật)

- **Quyết định**: `logout()` gọi API best-effort rồi xóa local; caller không đổi.
- **Lý do**: Chỉ xóa local thì refresh sống 7 ngày.

## Hiện trạng code

`AuthController.java:26-50`, `AuthServiceImpl.java:49-109`, `JwtFilter/Provider`, `SecurityConfig.java:37-61`, `RegisterRequest.java:13-28`, `store/auth.jsx`, `api.js:37-68`, `AuthModal.jsx`. Test: `AuthServiceTests`.
