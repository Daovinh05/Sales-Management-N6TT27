# Research (hồi tố): Thống kê

**Ngày**: 2026-10-15 | **Tính năng**: `014-thong-ke` (tách từ 006)

## Quyết định 1: Tiền chỉ tính `HOAN_THANH`, fill ngày trống

- **Quyết định**: `revenueByDay/topSelling` lọc completed; biểu đồ fill 0.
- **Lý do**: Tiền chưa về không ghi doanh thu; biểu đồ không đứt.
- **Phương án đã cân nhắc**: Tính cả đang giao — loại vì tiền chưa về.

## Quyết định 2: Tồn thấp lọc client

- **Quyết định**: `available ≤ 5` từ `GET /admin/warehouses/inventory` phía FE.
- **Lý do**: Không thêm API mới cho đồ án; đủ dùng.
- **Phương án đã cân nhắc**: API low-stock riêng — loại vì thừa.

## Hiện trạng code

`StatsController.java`, `StatsServiceImpl.java`, 4 DTO, `ThongKe.jsx`, `warehouseService.js:14-17`. Test: `StatsServiceTests` 3 case.
