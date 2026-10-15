# Đặc tả tính năng (hồi tố): Cụm admin — Quản lý đơn hàng, thống kê

**Nhánh tính năng**: `006-admin-don-thong-ke`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Superseded (hồi tố)

> **Đã tách nhỏ**: nội dung spec này được thay bằng `013-quan-ly-don` (quản lý/duyệt đơn) và `014-thong-ke` (thống kê). File này giữ lại làm lịch sử, không dùng để implement.

**Đầu vào**: Ghi lại phần việc admin của Đào Văn Vinh đã triển khai trên `main`: quản lý đơn (`OrderManagement.jsx` + `PATCH /orders/{code}/status`), thống kê (`ThongKe.jsx` + 4 API `/api/admin/stats/*`).

> **Ghi chú hồi tố**: Code đã có trên `main`. Artifact này viết sau để chứng minh quy trình SRS → plan → từng task và việc dùng skill (explore trước mọi task, graphify/mermaid `02-erd.mmd`, soạn commit/commit-linter, diff + log + Network verify).

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Admin duyệt đơn từng bước (Ưu tiên: P1)

Admin mở trang quản lý đơn (`GET /api/orders?code&customer&status&payment`), lọc trạng thái/phương thức, mở chi tiết (`GET /api/orders/{code}`), duyệt 1 chiều qua dialog (`PATCH /api/orders/{code}/status`): `CHO_DUYET → DA_XAC_NHAN → DANG_CHUAN_BI → DANG_GIAO → HOAN_THANH`, hoặc hủy (`→ DA_HUY`). Nhảy cóc/lùi/kết thúc đổi tiếp → 400. Duyệt đơn chưa có `paymentMethod` → 400. `HOAN_THANH` COD trừ kho thật 1 lần (cờ `stockDeducted`) + đánh dấu đã thu; hủy hoàn kho theo cờ.

**Vì sao ưu tiên này**: Cốt lõi điều phối kho–giao–đối soát; sai 1 bước là lệch tồn hoặc mất tiền.

**Kiểm thử độc lập**: Đi từng bước 1 đơn → 4 lần 200; nhảy `CHO_DUYET → DANG_GIAO` → 400; hoàn thành 2 lần → lần 2 báo kết thúc, kho trừ đúng 1 lần.

**Kịch bản chấp nhận**:

1. **Cho** đơn `CHO_DUYET` có `paymentMethod`, **Khi** `PATCH {DA_XAC_NHAN}`, **Thì** 200.
2. **Cho** đơn `CHO_DUYET` chưa có `paymentMethod`, **Khi** duyệt, **Thì** 400 "Đơn chưa chọn phương thức thanh toán".
3. **Cho** đơn `HOAN_THANH`/`DA_HUY`, **Khi** đổi tiếp, **Thì** 400.
4. **Cho** đơn `DANG_CHUAN_BI`, **Khi** admin hủy, **Thì** 200 + hoàn kho.

---

### Chuyện 2 - Thống kê doanh thu (Ưu tiên: P1)

Admin mở `ThongKe.jsx` (mặc định 30 ngày): `GET /api/admin/stats/overview` (KPI), `/revenue-by-day` (bar-chart, ngày trống = 0), `/orders-by-status` (donut + thẻ đếm), `/top-products?limit=5` (top bán chạy), tồn thấp lọc client từ `GET /admin/warehouses/inventory` (`available ≤ 5`), bảng chi tiết + export Excel, phân trang dùng chung.

**Vì sao ưu tiên này**: Thay ghi sổ giấy — nhìn được doanh thu/top/tồn thấp để nhập–xuất.

**Kiểm thử độc lập**: Seed 8 đơn `DH01–DH08` → overview chỉ tính doanh thu `HOAN_THANH`; đổi khoảng ngày → biểu đồ fill đủ ngày.

**Kịch bản chấp nhận**:

1. **Cho** khoảng ngày có đơn hủy, **Khi** `GET /overview`, **Thì** `revenue` chỉ cộng đơn `HOAN_THANH`.
2. **Cho** `limit=5`, **Khi** `GET /top-products`, **Thì** xếp theo tổng số lượng giảm dần, tối đa 5 dòng.
3. **Cho** tồn `available ≤ 5`, **Khi** mở ThongKe, **Thì** hiện ở mục tồn thấp.

---

### Chuyện 3 - Bảo vệ bằng role (Ưu tiên: P2)

Mọi API admin giữ `@PreAuthorize("hasRole('ADMIN')")` ở class (`StatsController`) hoặc method (`OrderController`). Gọi không token → 401 JSON "Chưa đăng nhập hoặc token hết hạn"; sai role → 403. Không chỉ dựa vào ẩn nút FE.

**Vì sao ưu tiên này**: Chống vượt quyền gọi API trực tiếp.

**Kiểm thử độc lập**: `curl` không token → 401; token customer gọi `PATCH /status` → 403.

**Kịch bản chấp nhận**:

1. **Cho** request không token tới `/api/admin/stats/overview`, **Khi** gọi, **Thì** 401.
2. **Cho** token `customer`, **Khi** `PATCH /api/orders/{code}/status`, **Thì** 403.

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: `PATCH /api/orders/{code}/status` PHẢI đi theo `NEXT_STATUSES` (6 trạng thái, terminal rỗng), sai bước → 400 tiếng Việt.
- **FR-002**: Duyệt sang `DA_XAC_NHAN` (mọi bước từ `CHO_DUYET`) yêu cầu đã có `paymentMethod`.
- **FR-003**: `HOAN_THANH` PHẢI trừ kho đúng 1 lần (`stockDeducted`); COD chưa trả → `paid = true + paidAt`; hủy (`DA_HUY`) hoàn kho theo cờ.
- **FR-004**: `GET /api/orders` PHẢI lọc `code/customer/status/payment` (`''` = tất cả, `EMPTY` = chưa có phương thức).
- **FR-005**: 4 API stats PHẢI đúng: overview (revenue/completed/total/cancelled), revenue-by-day (fill ngày trống), orders-by-status, top-products (`GROUP BY variant, ORDER BY sum(qty) DESC`, cắt limit).
- **FR-006**: Frontend PHẢI mirror `NEXT_STATUSES` (ẩn `DA_XAC_NHAN` khi chưa có phương thức), nhãn/màu/tab cho `DANG_CHUAN_BI`, nút hủy khách chỉ 2 trạng thái đầu.
- **FR-007**: Mọi API admin PHẢI `@PreAuthorize("hasRole('ADMIN')")`; chữ UI/message tiếng Việt.

### Thực thể chính

- **Order**: như 005 + `NEXT_STATUSES` là nguồn sự thật duy nhất cho bước đi.
- **StatsOverview/RevenuePoint/StatusCount/TopProduct**: DTO đọc từ `orders` + `order_detail`, chỉ tính `HOAN_THANH` cho doanh thu/top.

## Tiêu chí thành công *(bắt buộc)*

- **SC-001**: 100% nhảy cóc/kết thúc đổi tiếp bị 400; hoàn thành 2 lần kho trừ 1 lần.
- **SC-002**: `mvn -Dtest='OrderServiceTests,StatsServiceTests' test` xanh.
- **SC-003**: Không token → 401, sai role → 403 trên mọi API admin.
- **SC-004**: Không migrate DB; đơn cũ hiển thị bình thường.

## Giả định

- Nhân viên kho thao tác qua endpoint admin hiện có; chưa tách `payment_status`/`shipping_status`.
- `GET /api/orders` chưa có lọc `from/to` nên ThongKe lọc ngày detail phía client (ghi nhận để cải tiến).
