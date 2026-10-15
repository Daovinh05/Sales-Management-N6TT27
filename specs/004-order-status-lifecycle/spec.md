# Đặc tả tính năng: Vòng đời trạng thái đơn hàng (6 trạng thái)

**Nhánh tính năng**: `004-order-status-lifecycle`

**Ngày tạo**: 2026-10-15

**Trạng thái**: Draft

**Đầu vào**: Chia nhỏ trạng thái đơn hàng từ 5 lên 6 (thêm Đang chuẩn bị hàng), siết chuyển trạng thái theo từng bước, kiểm soát quyền hủy đơn theo vai trò. Chưa tách payment_status / shipping_status.

## Kịch bản người dùng & kiểm thử *(bắt buộc)*

### Chuyện 1 - Shop xử lý đơn theo từng bước (Ưu tiên: P1)

Nhân viên/shop mở đơn ở `CHO_DUYET`, bấm xác nhận → đơn sang `DA_XAC_NHAN`; chuẩn bị hàng xong → sang `DANG_CHUAN_BI`; bàn giao vận chuyển → `DANG_GIAO`; khách nhận hàng → `HOAN_THANH`. Mỗi bước chỉ đi được trạng thái kế tiếp hợp lệ, không nhảy cóc (ví dụ không từ `CHO_DUYET` thẳng lên `DANG_GIAO`).

**Vì sao ưu tiên này**: Đây là luồng cốt lõi quản lý kho, giao hàng và đối soát; hiện tại thiếu bước chuẩn bị hàng nên không biết đơn đã lấy/đóng gói hay chưa.

**Kiểm thử độc lập**: Tạo đơn mới (Postman/curl `POST /api/orders`), lần lượt `PATCH /api/orders/{code}/status` qua từng trạng thái và xác nhận mỗi bước trả 200; thử nhảy cóc `CHO_DUYET → DANG_GIAO` phải trả 400.

**Kịch bản chấp nhận**:

1. **Cho** đơn ở `CHO_DUYET`, **Khi** admin cập nhật sang `DA_XAC_NHAN`, **Thì** trả 200 và đơn ở `DA_XAC_NHAN`.
2. **Cho** đơn ở `CHO_DUYET`, **Khi** cập nhật thẳng sang `DANG_GIAO`, **Thì** trả 400 “Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này”.
3. **Cho** đơn ở `DA_XAC_NHAN`, **Khi** cập nhật sang `DANG_GIAO`, **Thì** trả 400 (phải qua `DANG_CHUAN_BI` trước).
4. **Cho** đơn ở `HOAN_THANH` hoặc `DA_HUY`, **Khi** cập nhật sang bất kỳ trạng thái nào, **Thì** trả 400 (trạng thái kết thúc).

---

### Chuyện 2 - Khách tự hủy đơn khi còn được phép (Ưu tiên: P1)

Khách vào lịch sử đơn hàng, đơn ở `CHO_DUYET` hoặc `DA_XAC_NHAN` hiện nút “Hủy đơn”; bấm hủy → đơn sang `DA_HUY`, tồn kho được hoàn. Đơn đã sang `DANG_CHUAN_BI` trở đi thì không còn nút hủy (phải liên hệ shop).

**Vì sao ưu tiên này**: Tránh tranh chấp kho/tiền khi hàng đã đóng gói hoặc đang giao; giữ nguyên chính sách hiện tại (khách hủy được 2 trạng thái đầu).

**Kiểm thử độc lập**: Đăng nhập `customer/123456`, tạo 2 đơn: hủy đơn `CHO_DUYET` → 200; nhờ admin duyệt 1 đơn lên `DA_XAC_NHAN` rồi hủy → 200; nhờ admin đẩy lên `DANG_CHUAN_BI` rồi hủy → 400.

**Kịch bản chấp nhận**:

1. **Cho** đơn của chính khách ở `CHO_DUYET`, **Khi** `POST /api/orders/{code}/cancel`, **Thì** 200, trạng thái `DA_HUY`.
2. **Cho** đơn của chính khách ở `DA_XAC_NHAN`, **Khi** hủy, **Thì** 200, ghi chú “cần hoàn tiền” nếu đơn đã trừ kho.
3. **Cho** đơn ở `DANG_CHUAN_BI` trở đi, **Khi** khách hủy, **Thì** 400 “Đơn đang giao hoặc đã kết thúc, vui lòng liên hệ shop để hủy” và nút hủy không hiển thị trên UI.

---

### Chuyện 3 - Nhân viên hủy đơn chưa bàn giao (Ưu tiên: P2)

Admin/nhân viên kho được hủy đơn ở `CHO_DUYET`, `DA_XAC_NHAN`, `DANG_CHUAN_BI` (chưa bàn giao vận chuyển). Từ `DANG_GIAO` trở đi chỉ xử lý theo quy trình vận chuyển/hoàn hàng, không hủy trực tiếp trên hệ thống.

**Vì sao ưu tiên này**: Shop cần dọn đơn lỗi/khách bom hàng trước khi giao mà không cần can thiệp DB.

**Kiểm thử độc lập**: Đăng nhập admin, cập nhật đơn `DANG_CHUAN_BI → DA_HUY` → 200; cập nhật đơn `DANG_GIAO → DA_HUY` → kiểm tra hành vi theo bảng chuyển trạng thái (cho phép, vì admin toàn quyền thu hồi khi giao thất bại).

**Kịch bản chấp nhận**:

1. **Cho** đơn ở `DANG_CHUAN_BI`, **Khi** admin cập nhật sang `DA_HUY`, **Thì** 200 và tồn kho được hoàn.
2. **Cho** đơn ở `HOAN_THANH`, **Khi** cập nhật sang `DA_HUY`, **Thì** 400.

---

### Trường hợp biên

- Đơn VietQR đã thanh toán (`paid=true`, `stockDeducted=true`) bị hủy ở `DA_XAC_NHAN`: tồn kho cộng trả + ghi chú “Khách hủy sau thanh toán - cần hoàn tiền” (giữ hành vi cũ).
- Đơn COD hủy ở `CHO_DUYET`/`DA_XAC_NHAN`: chỉ nhả chỗ giữ (`reservedQuantity`), không động `quantity`.
- Dữ liệu cũ trong DB chỉ có 5 trạng thái: vẫn hợp lệ, không cần migrate (cột `status` là VARCHAR).
- Request đổi trạng thái với mã lạ (ví dụ `DANG_DONG_GOI`) → 400 “Trạng thái đơn hàng không hợp lệ”.

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: Hệ thống PHẢI có 6 trạng thái đơn: `CHO_DUYET`, `DA_XAC_NHAN`, `DANG_CHUAN_BI`, `DANG_GIAO`, `HOAN_THANH`, `DA_HUY` (`DA_HUY` là nhánh kết thúc riêng).
- **FR-002**: Chuyển trạng thái PHẢI đi từng bước: `CHO_DUYET → {DA_XAC_NHAN, DA_HUY}`; `DA_XAC_NHAN → {DANG_CHUAN_BI, DA_HUY}`; `DANG_CHUAN_BI → {DANG_GIAO, DA_HUY}`; `DANG_GIAO → {HOAN_THANH, DA_HUY}`; `HOAN_THANH → {}`; `DA_HUY → {}`.
- **FR-003**: Khách hàng PHẢI chỉ tự hủy được đơn ở `CHO_DUYET` và `DA_XAC_NHAN` (`POST /api/orders/{code}/cancel`).
- **FR-004**: Admin PHẢI đổi được trạng thái theo bảng FR-002 qua `PATCH /api/orders/{code}/status` (giữ `@PreAuthorize("hasRole('ADMIN')")`).
- **FR-005**: `OrderStatusRequest` PHẢI chấp nhận thêm `DANG_CHUAN_BI`.
- **FR-006**: Tồn kho khi hủy PHẢI giữ nguyên tắc kho chung một sự thật: chưa trừ kho thì nhả `reserved`, đã trừ kho thì cộng trả `quantity` (cờ `stockDeducted`).
- **FR-007**: Frontend PHẢI hiển thị nhãn/tab/màu cho `DANG_CHUAN_BI` ở lịch sử mua hàng và trang quản trị đơn; nút “Hủy đơn” chỉ hiện ở `CHO_DUYET`/`DA_XAC_NHAN`.
- **FR-008**: Mọi câu chữ mới (nhãn, lỗi) PHẢI tiếng Việt.

### Thực thể chính

- **Đơn hàng (Order)**: giữ nguyên trường; `status` thêm giá trị `DANG_CHUAN_BI`; quan hệ với `OrderDetail`, `Inventory` (giữ chỗ/trừ thật), `User` (chủ đơn) không đổi.
- **Ma trận chuyển trạng thái (NEXT_STATUSES)**: nguồn sự thật duy nhất cho bước đi hợp lệ, dùng chung cho admin đổi trạng thái.

## Tiêu chí thành công *(bắt buộc)*

### Kết quả đo được

- **SC-001**: 100% kịch bản nhảy cóc (`CHO_DUYET→DANG_GIAO`, `DA_XAC_NHAN→DANG_GIAO`, trạng thái kết thúc đổi tiếp) bị từ chối 400.
- **SC-002**: Khách hủy được 100% đơn của mình ở 2 trạng thái đầu và bị chặn 100% từ `DANG_CHUAN_BI` trở đi.
- **SC-003**: `mvn test` xanh (có test mới cho ma trận chuyển trạng thái và quyền hủy).
- **SC-004**: Không migrate DB; đơn cũ 5 trạng thái vẫn đọc/hiển thị bình thường.

## Giả định

- Giữ mã trạng thái tiếng Việt không dấu (`CHO_DUYET`...) thay vì enum tiếng Anh để tương thích dữ liệu cũ và frontend hiện tại.
- Chưa tách `payment_status` / `shipping_status`; chưa thêm `WAITING_FOR_PICKUP`, `DELIVERY_FAILED` — chỉ bổ sung khi nghiệp vụ thực sự cần.
- Admin giữ toàn quyền theo bảng FR-002 (kể cả hủy đơn `DANG_GIAO` khi giao thất bại); nhân viên kho thao tác qua endpoint admin hiện có.
- Quy tắc tồn kho/hoàn tiền khi hủy giữ nguyên như hiện tại, không đổi chính sách.
