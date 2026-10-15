# Tasks (hồi tố): Đặt hàng

**Input**: `specs/010-dat-hang/` | Tách từ 005. Code đã có; mỗi task = đối chiếu + chạy thử + bằng chứng.

- [ ] T001 [P] Docker dev up; token customer (theo 013)
- [ ] T010 Đối chiếu `OrderServiceImpl.create/reserveStock` (`:89-140`): giá DB, khóa bi quan kho 1, message vượt tồn
- [ ] T011 Đối chiếu `Checkout.jsx:54-202`: form, `POST /orders`, banner chờ trả
- [ ] T012 Test: `mvn -Dtest='OrderServiceTests#datHangDuTon_giuChoChuaTru+datHangVuotTon_baoLoiVaKhongTaoDon' test` → xanh
- [ ] T013 Tay (quickstart): 201 + `reserved` tăng; vượt tồn 400; spoof giá bị bỏ qua
