# Research (hồi tố): Lịch sử đơn

**Ngày**: 2026-10-15 | **Tính năng**: `012-lich-su-don` (tách từ 005)

## Quyết định 1: Khách chỉ hủy 2 trạng thái đầu

- **Quyết định**: `cancelByOwner` chặn từ `DANG_CHUAN_BI`; hoàn kho theo `stockDeducted` + note hoàn tiền.
- **Lý do**: Hàng đã đóng gói hủy tự động gây rối kho/tiền.
- **Phương án đã cân nhắc**: Cho hủy cả `DANG_CHUAN_BI` — loại vì lý do trên.

## Quyết định 2: Thanh toán bù mở lại modal thay vì trang mới

- **Quyết định**: Nút "Thanh toán" ở đơn chưa trả mở lại `PaymentModal`, xong → `OrderSuccess`.
- **Lý do**: Tái dùng luồng 009, không code 2 lần.
- **Phương án đã cân nhắc**: Trang thanh toán riêng — loại vì trùng lặp.

## Hiện trạng code

`OrderServiceImpl.java:223-244`, `OrderHistory.jsx:48-274`, `OrderSuccess.jsx:28-127`. Test: hủy sau trừ kho, chặn hủy `DANG_CHUAN_BI`.
