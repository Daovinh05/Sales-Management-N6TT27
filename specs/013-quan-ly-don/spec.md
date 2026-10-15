# Đặc tả tính năng (hồi tố): Admin quản lý, duyệt đơn

**Nhánh tính năng**: `013-quan-ly-don`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft (hồi tố)

**Đầu vào**: Tách từ `006-admin-don-thong-ke` (US1 + US3). Admin lọc/duyệt/hủy đơn 1 chiều; mọi API khóa ADMIN.

> Code đã có trên `main`.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Duyệt đơn từng bước (Ưu tiên: P1)

`GET /api/orders?code&customer&status&payment` (`''`=tất cả, `EMPTY`=chưa có phương thức) → mở chi tiết → dialog duyệt 1 chiều `PATCH /{code}/status` theo `NEXT_STATUSES` (FE mirror, ẩn `DA_XAC_NHAN` khi chưa có phương thức). Nhảy cóc/lùi/kết thúc đổi tiếp → 400; duyệt thiếu phương thức → 400. `HOAN_THANH`: trừ kho 1 lần (`stockDeducted`) + COD chưa trả → `paid/paidAt`. `DA_HUY`: hoàn kho theo cờ. `DELETE /{code}` tương tự.

**Kiểm thử độc lập**: Đi từng bước 1 đơn → 200 hết; nhảy cóc → 400; hoàn thành 2 lần → kho trừ 1 lần.

**Kịch bản chấp nhận**:

1. **Cho** đơn `CHO_DUYET` có phương thức, **Khi** duyệt `DA_XAC_NHAN`, **Thì** 200.
2. **Cho** đơn chưa có phương thức, **Khi** duyệt, **Thì** 400 "Đơn chưa chọn phương thức thanh toán...".
3. **Cho** đơn `HOAN_THANH`/`DA_HUY`, **Khi** đổi tiếp, **Thì** 400.
4. **Cho** đơn `DANG_CHUAN_BI`, **Khi** admin hủy, **Thì** 200 + hoàn kho.

---

### Chuyện 2 - Chặn vượt quyền (Ưu tiên: P2)

`@PreAuthorize("hasRole('ADMIN')")` từng method; không token → 401 "Chưa đăng nhập hoặc token hết hạn"; token customer → 403. Không dựa vào ẩn nút FE.

**Kịch bản chấp nhận**:

1. **Cho** không token, **Khi** gọi API đơn admin, **Thì** 401.
2. **Cho** token customer, **Khi** `PATCH /status`, **Thì** 403.

## Yêu cầu *(bắt buộc)*

- **FR-001**: Đi đúng `NEXT_STATUSES` (6 trạng thái, terminal rỗng); sai → 400 tiếng Việt.
- **FR-002**: Trừ/hoàn kho đúng 1 lần theo `stockDeducted`.
- **FR-003**: Lọc đủ 4 chiều; export Excel + phân trang FE.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: 100% nhảy cóc bị 400; `OrderServiceTests` 11/11 xanh.
- **SC-002**: 401/403 đúng mọi API admin.

## Giả định

- Ma trận trạng thái theo 004; nhân viên kho dùng endpoint admin.
