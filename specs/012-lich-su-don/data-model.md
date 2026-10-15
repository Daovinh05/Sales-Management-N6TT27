# Mô hình dữ liệu (hồi tố): Lịch sử đơn

**Tính năng**: `012-lich-su-don` | **Ngày**: 2026-10-15

Đọc từ `Order` + `OrderDetail` + `Inventory` (không thêm bảng).

- Badge "Đã thanh toán": `paid || (COD && HOAN_THANH)`.
- Hủy (`cancelByOwner`): chỉ `CHO_DUYET`/`DA_XAC_NHAN` → `DA_HUY`; chưa trừ kho → nhả `reserved`, đã trừ → cộng trả `quantity` + hạ cờ + note hoàn tiền.
- Tab: `ALL|CHO_DUYET|DA_XAC_NHAN|DANG_CHUAN_BI|DANG_GIAO|HOAN_THANH|DA_HUY` + counts.
