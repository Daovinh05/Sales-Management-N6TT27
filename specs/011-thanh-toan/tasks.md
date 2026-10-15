# Tasks (hồi tố): Thanh toán

**Input**: `specs/011-thanh-toan/` | Tách từ 005. Code đã có.

- [ ] T001 [P] Đơn `CHO_DUYET` + token customer sẵn sàng
- [ ] T010 Đối chiếu sequence `mermaid/04-sequence-order.mmd` với code (skill graphify); sửa nhánh cart lệch
- [ ] T011 Đối chiếu `confirmPayment` + `PaymentServiceImpl:30-122` + `PaymentConfirmRequest`: giữ `CHO_DUYET`, HMAC, idempotent, khớp tiền
- [ ] T012 Đối chiếu `PaymentModal.jsx:31-398`: tab, link 1 lần/đơn, polling 3s, demo, hủy + confirm rời
- [ ] T013 Test: `mvn -Dtest='PaymentServiceTest,PaymentWebhookConcurrencyTest' test` → xanh
- [ ] T014 Tay (quickstart): COD/VietQR giữ `CHO_DUYET`; đóng modal → banner
