# Research (hồi tố): Đặt hàng

**Ngày**: 2026-10-15 | **Tính năng**: `010-dat-hang` (tách từ 005)

## Quyết định 1: Giữ chỗ 2 bước, giá từ DB

- **Quyết định**: `create` giữ `reserved` (khóa bi quan kho id=1), trừ thật ở Hoàn thành (004/011); `unitPrice` client bị bỏ qua.
- **Lý do**: Hỏi Agent trước khi code → chốt giữ chỗ để COD chưa thu không mất tồn; chống spoof giá.
- **Phương án đã cân nhắc**: Trừ ngay khi đặt — loại vì hoàn kho phức tạp, dễ bán lố.

## Hiện trạng code

`OrderServiceImpl.java:89-140`, `OrderController.java` (POST /), `OrderRequest.java`, `Checkout.jsx:54-202`. Test: `datHangDuTon_giuChoChuaTru`, `datHangVuotTon_baoLoiVaKhongTaoDon`, spoof giá.
