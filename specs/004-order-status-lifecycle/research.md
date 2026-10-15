# Research: Vòng đời trạng thái đơn hàng

**Ngày**: 2026-10-15 | **Tính năng**: `004-order-status-lifecycle`

## Quyết định 1: Giữ mã trạng thái tiếng Việt, thêm `DANG_CHUAN_BI`

- **Quyết định**: Thêm hằng `STATUS_PREPARING = "DANG_CHUAN_BI"` vào `Order`, giữ quy ước mã Việt không dấu thay vì enum tiếng Anh (`PENDING_CONFIRMATION`, `CONFIRMED`...) như đề xuất ban đầu.
- **Lý do**: DB cũ đã có đơn ở 5 mã hiện tại; frontend (3 trang), `OrderStatusRequest`, `DataSeeder` và báo cáo thống kê đều dùng mã Việt. Đổi sang enum tiếng Anh đồng nghĩa migrate dữ liệu + sửa toàn bộ hiển thị, lợi ích không tương xứng trong phạm vi đồ án.
- **Phương án đã cân nhắc**: Enum `OrderStatus` tiếng Anh + converter JPA — loại vì tốn migrate và rủi ro vỡ tương thích với đơn cũ, trong khi yêu cầu chỉ cần thêm 1 bước kiểm soát.

## Quyết định 2: Siết `DA_XAC_NHAN → DANG_GIAO` thành đi qua `DANG_CHUAN_BI`

- **Quyết định**: Ma trận mới `CHO_DUYET → {DA_XAC_NHAN, DA_HUY}`; `DA_XAC_NHAN → {DANG_CHUAN_BI, DA_HUY}`; `DANG_CHUAN_BI → {DANG_GIAO, DA_HUY}`; `DANG_GIAO → {HOAN_THANH, DA_HUY}`; hai trạng thái kết thúc đi đâu cũng 400.
- **Lý do**: Đúng yêu cầu “không nhảy cóc”; bước chuẩn bị hàng là điểm kiểm soát lấy/đóng gói trước khi bàn giao vận chuyển. Frontend admin (`OrderManagement.jsx:37-43`) mirror bảng này nên hai phía luôn khớp.
- **Phương án đã cân nhắc**: Giữ cho phép `DA_XAC_NHAN → DANG_GIAO` để tương thích thao tác cũ — loại vì phá mục tiêu kiểm soát, và UI admin chỉ cho chọn bước kế tiếp nên không ai bị kẹt.

## Quyết định 3: Khách chỉ hủy ở 2 trạng thái đầu, admin hủy được tới `DANG_CHUAN_BI`

- **Quyết định**: `cancelByOwner` giữ điều kiện `CHO_DUYET`/`DA_XAC_NHAN`; `updateStatus` của admin cho hủy từ `CHO_DUYET`, `DA_XAC_NHAN`, `DANG_CHUAN_BI`, `DANG_GIAO` (theo ma trận, phục vụ case giao thất bại cần thu hồi).
- **Lý do**: Khớp ma trận quyền trong yêu cầu (khách “có điều kiện” ở Đã xác nhận = vẫn hủy được vì hàng chưa đóng gói; từ chuẩn bị hàng trở đi phải liên hệ shop). Admin toàn quyền theo bảng FR-002.
- **Phương án đã cân nhắc**: Cho khách hủy cả `DANG_CHUAN_BI` — loại vì hàng đã lấy/đóng gói, hủy tự động gây rối kho và hoàn tiền.

## Quyết định 4: Không động đến luồng tồn kho và thanh toán

- **Quyết định**: `DANG_CHUAN_BI` không reserve/deduct/restore kho; hủy ở trạng thái mới (chỉ admin) tái dùng nhánh `CANCELLED` có sẵn (nhả `reserved` hoặc cộng trả `quantity` theo `stockDeducted`).
- **Lý do**: Nghiên cứu `OrderServiceImpl:160-179, 300-323` cho thấy reserve lúc tạo đơn, trừ thật lúc `HOAN_THANH` (COD) hoặc webhook VietQR, hoàn khi hủy — đã đúng nguyên tắc IV. Bước chuẩn bị hàng thuần thông tin điều phối, không cần bút toán kho mới.
- **Phương án đã cân nhắc**: Trừ kho ngay khi sang `DANG_CHUAN_BI` — loại vì trùng với deduct ở `HOAN_THANH` và cần chống trừ 2 lần phức tạp thêm.

## Quyết định 5: Chưa tách `payment_status` / `shipping_status`, chưa thêm `WAITING_FOR_PICKUP` / `DELIVERY_FAILED`

- **Quyết định**: Hoãn theo đúng chốt của người dùng — chỉ làm 6 trạng thái chính.
- **Lý do**: Đồ án nhỏ, một trường `status` + cờ `paid`/`stockDeducted` đã diễn tả đủ; tách bảng/trường mới tăng độ phức tạp không mang lại lợi ích hiện tại.
- **Phương án đã cân nhắc**: Tách ngay — loại, ghi nhận làm việc tương lai khi có đối soát vận chuyển thật.

## Hiện trạng code liên quan (đã khảo sát)

- `Order.java:25-29` — 5 hằng trạng thái; thêm 1 hằng là đủ, cột `status` VARCHAR(30) chứa vừa `DANG_CHUAN_BI` (13 ký tự).
- `OrderServiceImpl.java:37-42` (`NEXT_STATUSES`), `:154-158` (chặn duyệt khi chưa có phương thức thanh toán — giữ nguyên cho mọi bước đi tiếp từ `CHO_DUYET`), `:160-168` (nhánh hủy hoàn kho — tái dùng), `:224-242` (`cancelByOwner` — chỉ nới comment, không đổi điều kiện).
- `OrderStatusRequest.java:7` — regex cần thêm `DANG_CHUAN_BI`, nếu không request hợp lệ bị 400 ở tầng validation trước khi vào service.
- `OrderManagement.jsx:14-43, 370-377` — nhãn/màu/mirror + dropdown lọc `DA_XAC_NHAN` khi chưa có phương thức thanh toán (giữ nguyên logic lọc, áp cho option mới nếu cần).
- `OrderHistory.jsx:8-24, 177-181` — nhãn/màu/tab + nút hủy (giữ điều kiện 2 trạng thái).
- `ThongKe.jsx:13-23, 129-130` — nhãn/màu/thẻ đếm (thêm 1 thẻ “Chuẩn bị hàng” hoặc gộp vào “Đang giao”? — quyết định ở data-model: thêm thẻ riêng để quản lý kho thấy được lượng chờ đóng gói).
- `OrderServiceTests.java` — đã có test duyệt/hủy/hoàn (dòng 122-174); bổ sung test cho bước mới.
- `StatsServiceTests.java:73-80` — đếm theo trạng thái, dữ liệu seed không có `DANG_CHUAN_BI` nên không vỡ.
