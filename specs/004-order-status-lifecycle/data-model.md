# Mô hình dữ liệu: Vòng đời trạng thái đơn hàng

**Tính năng**: `004-order-status-lifecycle` | **Ngày**: 2026-10-15

Không tạo bảng/cột mới. Chỉ mở rộng miền giá trị của trường đã có.

## Thực thể: Đơn hàng (`orders` → `Order`)

| Trường | Kiểu | Ràng buộc | Thay đổi |
|---|---|---|---|
| `code` | VARCHAR(20), PK | Khóa chính, mã `DHnn` | Không đổi |
| `status` | VARCHAR(30), NOT NULL | Một trong 6 mã dưới đây | **Mở rộng miền giá trị** |
| `paymentMethod` | VARCHAR | `COD` / `VIETQR` / null | Không đổi (điều kiện duyệt giữ nguyên) |
| `paid` / `paidAt` | boolean / datetime | Cờ thanh toán | Không đổi |
| `stockDeducted` | boolean | Đã trừ kho thật hay chưa | Không đổi |

### Miền trạng thái mới (nguồn sự thật: `Order.STATUS_*` + `NEXT_STATUSES`)

| Mã | Nhãn tiếng Việt | Ý nghĩa | Bước tiếp hợp lệ |
|---|---|---|---|
| `CHO_DUYET` | Chờ xác nhận | Đơn mới, đã giữ chỗ kho | `DA_XAC_NHAN`, `DA_HUY` |
| `DA_XAC_NHAN` | Đã xác nhận | Shop chấp nhận (bắt buộc đã chọn phương thức thanh toán) | `DANG_CHUAN_BI`, `DA_HUY` |
| `DANG_CHUAN_BI` *(mới)* | Đang chuẩn bị hàng | Đang lấy/đóng gói, chưa bàn giao vận chuyển | `DANG_GIAO`, `DA_HUY` |
| `DANG_GIAO` | Đang giao | Vận chuyển đã nhận hàng | `HOAN_THANH`, `DA_HUY` |
| `HOAN_THANH` | Hoàn thành | Khách đã nhận; COD đánh dấu đã thu | *(kết thúc)* |
| `DA_HUY` | Đã hủy | Nhánh kết thúc riêng | *(kết thúc)* |

### Quy tắc kiểm chứng

- Mọi mã ngoài 6 giá trị trên → 400 ở tầng validation (`OrderStatusRequest`) và tầng service (`STATUSES`).
- Chuyển sai bước → 400 “Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này” (dùng `NEXT_STATUSES`, không hard-code if-else rời rạc).
- `HOAN_THANH` / `DA_HUY` là trạng thái kết thúc: mọi chuyển tiếp đều 400.
- Sang `DA_XAC_NHAN` (và mọi bước từ `CHO_DUYET`) yêu cầu đơn đã có `paymentMethod`, giữ quy tắc cũ chống duyệt đơn chưa chọn thanh toán.
- Hủy (`DA_HUY`): chưa trừ kho → nhả `reservedQuantity`; đã trừ kho → cộng trả `quantity` + hạ cờ `stockDeducted`; hủy sau thanh toán ở `DA_XAC_NHAN` ghi chú “cần hoàn tiền” (giữ nguyên).

### Quan hệ (không đổi)

- `Order 1—n OrderDetail` (cascade theo đơn).
- `Order → Inventory` gián tiếp qua `variantCode` (giữ chỗ `reservedQuantity` lúc tạo; trừ `quantity` lúc hoàn thành COD/webhook VietQR; hoàn lúc hủy).
- `Order.username → User` (chủ đơn, dùng `checkOwner` cho hủy của khách).

### Tương thích dữ liệu cũ

Đơn cũ chỉ mang 5 mã hiện tại vẫn hợp lệ vì miền mới là siêu tập; không migration, không backfill. Đơn đang ở `DA_XAC_NHAN` trước khi deploy đi tiếp sang `DANG_CHUAN_BI` như đơn mới.
