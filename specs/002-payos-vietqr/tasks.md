# Tasks: Thanh toán PayOS + VietQR

- [X] T1. Key PayOS + env + compose (`PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY`, `APP_FRONTEND_URL`, mẫu placeholder). Kiểm tra: container nhận đủ key, thiếu key app vẫn chạy demo.
- [X] T2. Order thêm `payosOrderCode`, `paymentLinkId`, `paid`, `paidAt` + `OrderResponse`. Kiểm tra: cột tự tạo, `mvn test` xanh.
- [X] T3. `PayosApiClient` ký HMAC-SHA256 + tạo link + verify webhook. Kiểm tra: unit test chữ ký 4 case xanh.
- [X] T4. `PaymentService` + 2 endpoint (`vietqr-link` auth, webhook public luôn 200). Kiểm tra: curl sai ký/mã lạ/lệch tiền đều `success=false`; thiếu token 403.
- [X] T5. Test tạo link + webhook 9 case (`PaymentServiceTest`). Kiểm tra: `mvn test` xanh.
- [X] T12. Chống race webhook (khóa bi quan dòng đơn) + mã link chống trùng cùng mili-giây + test 2 webhook đồng thời. Kiểm tra: `mvn test` 52/52 xanh, đúng 1 luồng ghi nhận.
- [X] T6. Modal VietQR kiểu trang PayOS (QR tại chỗ, sao chép, Hủy, mở trang PayOS) + polling 3s + fallback demo. Kiểm tra: trả thử tiền về MB, modal tự chốt.
- [X] T7. Lịch sử đơn (Thanh toán tiếp, huy hiệu Đã thanh toán, chữ COD) + trang success chi tiết. Kiểm tra: click tay full luồng, F5 không trắng trang.
- [ ] T8. Nút "Tạo mã mới" khi link hết hạn trong `PaymentModal`. Kiểm tra: link cũ hết hạn vẫn lấy mã mới không cần tạo lại đơn.
- [ ] T9. Job tự hủy đơn treo quá hạn + hoàn hàng giữ (`OrderAutoCancelService` mới). Kiểm tra: đơn treo 30 phút chưa trả tự `DA_HUY`, tồn hoàn lại.
- [ ] T10. Huy hiệu "Đã thanh toán" ở trang quản trị `OrderManagement`. Kiểm tra: admin phân biệt được đơn đã/chưa trả.
- [ ] T11. Chạy 4 kịch bản `quickstart.md` với key thật. Kiểm tra: tạo link, thanh toán, webhook, fallback đều đạt.
