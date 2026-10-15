# Research (hồi tố): Quản lý đơn

**Ngày**: 2026-10-15 | **Tính năng**: `013-quan-ly-don` (tách từ 006)

## Quyết định 1: `NEXT_STATUSES` nguồn sự thật duy nhất, FE mirror

- **Quyết định**: Backend 1 bảng, FE mirror + ẩn option thiếu phương thức; không if-else rời rạc.
- **Lý do**: Thêm trạng thái (004) chỉ sửa 1 bảng mỗi phía.
- **Phương án đã cân nhắc**: If-else từng cặp — loại vì khó bao phủ test.

## Quyết định 2: Chặn duyệt thiếu phương thức + trừ/hoàn 1 lần theo cờ

- **Quyết định**: Giữ quy tắc chống đơn treo; 4 hàm kho + `stockDeducted`.
- **Lý do**: Nguyên tắc IV; test `hoanThanh_truKhoDungMotLan` khóa hành vi.

## Quyết định 3: API tự chặn role, không tin ẩn nút

- **Quyết định**: `@PreAuthorize ADMIN` + verify 401/403 bằng curl.
- **Lý do**: Ẩn nút bypass được.

## Hiện trạng code

`OrderServiceImpl.java:30-43,142-184`, `OrderStatusRequest.java:7`, `OrderController.java`, `OrderManagement.jsx`. Test: `OrderServiceTests` 11 case.
