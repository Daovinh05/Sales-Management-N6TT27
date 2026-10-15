# Research (hồi tố): Cụm admin

**Ngày**: 2026-10-15 | **Tính năng**: `006-admin-don-thong-ke`

## Quyết định 1: `NEXT_STATUSES` là nguồn sự thật duy nhất

- **Quyết định**: Mọi chuyển trạng thái đi qua `Map<String, Set<String>> NEXT_STATUSES`; sai bước → 400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này"; FE mirror bảng này (ẩn `DA_XAC_NHAN` khi chưa có phương thức).
- **Lý do**: Không hard-code if-else rời rạc; 2 phía luôn khớp; thêm `DANG_CHUAN_BI` (004) chỉ sửa 1 bảng.
- **Phương án đã cân nhắc**: If-else từng cặp trạng thái — loại vì khó kiểm tra bao phủ.

## Quyết định 2: Chặn duyệt đơn chưa có phương thức thanh toán

- **Quyết định**: Mọi bước đi từ `CHO_DUYET` yêu cầu `paymentMethod != null`, giữ cho cả bước mới.
- **Lý do**: Chống duyệt nhầm đơn khách tạo nhưng chưa chọn COD/VietQR (khách có thể đóng modal giữa chừng).
- **Phương án đã cân nhắc**: Cho duyệt rồi bổ sung sau — loại vì gây đơn treo không thu được tiền.

## Quyết định 3: Trừ/hoàn kho đúng 1 lần theo cờ `stockDeducted`

- **Quyết định**: 4 hàm kho (`reserve/release/deductIfNeeded/restore`) + cờ `stockDeducted`; `HOAN_THANH` trừ 1 lần, hủy cộng trả/nhả theo cờ, COD hoàn thành đánh dấu đã thu.
- **Lý do**: Đúng nguyên tắc IV (kho chung một sự thật); test `hoanThanh_truKhoDungMotLan` khóa hành vi.
- **Phương án đã cân nhắc**: Trừ kho khi duyệt — loại vì trùng với deduct ở Hoàn thành.

## Quyết định 4: Stats chỉ tính đơn `HOAN_THANH` cho tiền, fill ngày trống

- **Quyết định**: `revenueByDay`/`topSelling` lọc `status = HOAN_THANH`; `revenue-by-day` fill đủ ngày (trống = 0); tồn thấp lọc client (`available ≤ 5`).
- **Lý do**: Doanh thu chỉ ghi nhận khi khách đã nhận hàng; biểu đồ không đứt đoạn.
- **Phương án đã cân nhắc**: Tính cả đơn đang giao — loại vì tiền chưa về.

## Quyết định 5: Bảo vệ bằng `@PreAuthorize`, không tin ẩn nút

- **Quyết định**: `StatsController` khóa class-level ADMIN; `OrderController` khóa từng method; test tay 401/403 bằng curl trực tiếp.
- **Lý do**: Ẩn nút FE dễ bypass; API phải tự chặn.
- **Phương án đã cân nhắc**: Chỉ ẩn nút — loại vì lý do trên.

## Hiện trạng code (đã khảo sát)

- `OrderController.java`, `OrderServiceImpl.java` (ma trận + 4 hàm kho), `OrderStatusRequest.java`, `OrderRepository.java:43-58`.
- `StatsController.java` (4 API), `StatsServiceImpl.java`, 4 DTO stats.
- `pages/admin/OrderManagement.jsx` (filter/dialog/phân trang/export), `pages/admin/ThongKe.jsx` (KPI/charts/top/tồn thấp), `services/warehouseService.js:14-17`.
- Test: `OrderServiceTests.java` (11 case), `StatsServiceTests.java` (3 case).
