# Contract: API quản lý đơn (admin)

**Tính năng**: `013-quan-ly-don` — mọi endpoint `@PreAuthorize("hasRole('ADMIN')")`.

- `GET /api/orders?code&customer&status&payment` (`''`=tất cả, `EMPTY`=chưa có phương thức).
- `GET /api/orders/{code}` chi tiết full.
- `PATCH /api/orders/{code}/status {status}` (6 mã): sai bước/kết thúc → 400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này"; thiếu phương thức → 400.
- `DELETE /api/orders/{code}` — hoàn kho theo cờ.
