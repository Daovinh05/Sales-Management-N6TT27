# Tasks (hồi tố): Quản lý đơn

**Input**: `specs/013-quan-ly-don/` | Tách từ 006. Code đã có.

- [ ] T001 [P] Docker dev up; token admin; seed `DH01–DH08`
- [ ] T010 Đối chiếu `NEXT_STATUSES` + `updateStatus` (`:30-43,142-184`): terminal rỗng, chặn thiếu phương thức, trừ/hoàn 1 lần
- [ ] T011 Đối chiếu `OrderStatusRequest:7` + `OrderController` (`@PreAuthorize ADMIN`) + `OrderManagement.jsx`: filter 4 chiều, mirror, dialog, phân trang, export
- [ ] T012 Test: `mvn -Dtest='OrderServiceTests' test` → 11/11
- [ ] T013 Tay (quickstart): từng bước 200, nhảy cóc 400, 401/403 đúng
