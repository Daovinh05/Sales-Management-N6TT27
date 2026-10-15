# Tasks (hồi tố): Cụm admin — Quản lý đơn, thống kê

**Input**: `specs/006-admin-don-thong-ke/` (spec, plan, research, data-model, contracts, quickstart)

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

> Hồi tố: code đã có trên `main`. Mỗi task = "đối chiếu + chạy thử + ghi bằng chứng"; lệch thì sửa 1 commit = 1 việc.

## Phase 1: Setup (hạ tầng dùng chung)

- [ ] T001 [P] Dựng môi trường verify: Docker dev up, seed admin + 8 đơn `DH01–DH08`, kiểm tra `Order.java:25-30` đủ 6 hằng
- [ ] T002 [P] Đọc skill trước khi làm: `explore` tóm tắt trước, `02-erd.mmd` (`orders ↔ order_detail ↔ inventory`) mở khi giải thích

## Phase 2: US1 Duyệt đơn (P1) — 1 chiều, trừ/hoàn kho

- [ ] T010 [US1] Đối chiếu `NEXT_STATUSES` + `updateStatus` (`OrderServiceImpl.java:30-43,142-184`): terminal rỗng, chặn thiếu phương thức, `DA_HUY` hoàn kho, `HOAN_THANH` trừ 1 lần + COD đánh dấu thu
- [ ] T011 [US1] Đối chiếu `OrderStatusRequest.java:7` (regex 6 mã) + `OrderController.java` (`GET list/detail`, `PATCH /{code}/status`, `DELETE`) đúng `@PreAuthorize('ADMIN')`
- [ ] T012 [US1] Đối chiếu `OrderManagement.jsx` (`frontend/src/pages/admin/OrderManagement.jsx`): filter code/customer/status/payment, mirror `NEXT_STATUSES`, dialog duyệt, phân trang, export excel
- [ ] T013 [US1] Chạy test duyệt/hủy/kho: `mvn -Dtest='OrderServiceTests' test` → 11/11 xanh (đi từng bước, chặn nhảy cóc, trừ 1 lần, hủy đúng hoàn kho)
- [ ] T014 [US1] Chạy tay quickstart Kịch bản 1: đi từng bước 200, nhảy cóc 400, hoàn thành 2 lần trừ 1 lần

## Phase 3: US2 Thống kê (P1) — KPI/biểu đồ/top/tồn thấp

- [ ] T020 [US2] Đối chiếu `StatsController.java` + `StatsServiceImpl.java` + 4 DTO stats: overview/revenue-by-day (fill 0)/orders-by-status/top-products đúng contract
- [ ] T021 [US2] Đối chiếu `ThongKe.jsx` (`frontend/src/pages/admin/ThongKe.jsx`): 30 ngày mặc định, `Promise.all` 4 nguồn + inventory, bar-chart/donut/top-5/tồn thấp (`≤ 5`)/bảng detail/phân trang/export
- [ ] T022 [US2] Chạy test stats: `mvn -Dtest='StatsServiceTests' test` → 3/3 xanh (doanh thu chỉ `HOAN_THANH`, top đúng limit)
- [ ] T023 [US2] Chạy tay: đổi khoảng ngày → biểu đồ fill đủ ngày; kiểm tra tồn thấp hiện đúng; export Excel được
- [ ] T024 [US2] Ghi gap: `GET /api/orders` chưa lọc `from/to` nên ThongKe lọc ngày client → issue cải tiến (thêm param + test)

## Phase 4: US3 Bảo vệ role (P2) — 401/403

- [ ] T030 [US3] Đối chiếu `@PreAuthorize` mọi API admin; curl không token → 401 JSON tiếng Việt; token customer `PATCH /status` → 403
- [ ] T031 [US3] Kiểm tra FE không lộ logic: ẩn nút chỉ là UX, API tự chặn (gọi trực tiếp vẫn 403)

## Phase 5: Polish (chung)

- [ ] T040 [P] Rà tiếng Việt nhãn/message; `git log` 1 việc = 1 commit; đính output `mvn test` xanh + ảnh UI duyệt/thống kê làm bằng chứng bảo vệ
