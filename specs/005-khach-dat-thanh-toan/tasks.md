# Tasks (hồi tố): Cụm khách — Đặt hàng, thanh toán, lịch sử đơn

**Input**: `specs/005-khach-dat-thanh-toan/` (spec, plan, research, data-model, contracts, quickstart)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

> Hồi tố: code đã có trên `main`. Auth tách ở `007-auth-dang-nhap`. Mỗi task = "đối chiếu + chạy thử + ghi bằng chứng"; lệch thì sửa 1 commit = 1 việc.

## Phase 1: Setup (hạ tầng dùng chung)

- [ ] T001 [P] Dựng môi trường verify: `docker compose -f docker-compose.dev.yml up -d`, kiểm tra `sales-mysql` healthy, backend :8080, frontend :5173, đăng nhập `customer/123456` lấy token (theo 007)
- [ ] T002 [P] Đọc skill trước khi làm: `explore` (đọc nhiều file rồi tóm tắt), commit nhỏ Conventional Commits tiếng Việt, `git diff` trước mọi commit

## Phase 2: US1 Đặt hàng (P1) — giữ chỗ kho

- [ ] T010 [US1] Đối chiếu `OrderServiceImpl.create/reserveStock` (`backend/src/main/java/com/salemanagement/service/impl/OrderServiceImpl.java:89-140`): giá từ DB, khóa bi quan kho id=1, message vượt tồn tiếng Việt
- [ ] T011 [US1] Đối chiếu `Checkout.jsx` (`frontend/src/pages/shop/Checkout.jsx`): form, `POST /api/orders`, banner chờ trả, warning đóng modal
- [ ] T012 [US1] Chạy test đặt hàng: `mvn -Dtest='OrderServiceTests#datHangDuTon_giuChoChuaTru+datHangVuotTon_baoLoiVaKhongTaoDon' test` → xanh, đơn vượt tồn không `save()`
- [ ] T013 [US1] Chạy tay: đặt đủ tồn → `CHO_DUYET` + `reserved` tăng (phpMyAdmin); đặt vượt → 400 kèm số bán được

## Phase 3: US2 Thanh toán (P1) — COD/VietQR

- [ ] T020 [US2] Vẽ/đối chiếu sequence `mermaid/04-sequence-order.mmd` với code thật trước khi chạm payment (skill graphify); sửa nhánh `POST /api/cart/items` lệch (giỏ thật ở FE)
- [ ] T021 [US2] Đối chiếu `confirmPayment` + `PaymentServiceImpl.createVietQrLink/webhook` (`PaymentServiceImpl.java:30-122`, `OrderServiceImpl.java:202-221`, `dto/request/PaymentConfirmRequest.java`): giữ `CHO_DUYET`, HMAC, idempotent, khớp tiền
- [ ] T022 [US2] Đối chiếu `PaymentModal.jsx` (`frontend/src/pages/shop/PaymentModal.jsx:31-398`): tab COD/VietQR, link 1 lần/đơn, polling 3s, fallback demo, nút hủy + confirm rời
- [ ] T023 [US2] Chạy test payment: `mvn -Dtest='PaymentServiceTest,PaymentWebhookConcurrencyTest' test` → xanh
- [ ] T024 [US2] Chạy tay: trả COD/VietQR giữ `CHO_DUYET`; webhook 2 lần 1 ghi nhận; đóng modal → banner + confirm rời

## Phase 4: US3 Lịch sử đơn (P2) — bù/hủy/banner

- [ ] T030 [US3] Đối chiếu `cancelByOwner` (`OrderServiceImpl.java:223-244`) + `OrderHistory.jsx` (`frontend/src/pages/shop/OrderHistory.jsx:48-274`): nút hủy 2 trạng thái, nút trả bù, badge, modal chi tiết
- [ ] T031 [US3] Chạy tay: hủy `CHO_DUYET` → `DA_HUY` + hoàn kho; hủy `DANG_CHUAN_BI` → 400 + không nút; trả bù đơn chưa trả → thành công
- [ ] T032 [US3] Chạy full suite cụm khách: `mvn -Dtest='OrderServiceTests,PaymentServiceTest' test` → BUILD SUCCESS

## Phase 5: Polish (chung)

- [ ] T040 [P] Rà tiếng Việt toàn bộ message/nhãn mới; `git log` 1 việc = 1 commit `type(scope): mô tả`
- [ ] T041 [P] Chụp bằng chứng demo bảo vệ: sequence diagram + 4 ảnh (đặt → trả QR → admin duyệt → kho trừ) + output test xanh
