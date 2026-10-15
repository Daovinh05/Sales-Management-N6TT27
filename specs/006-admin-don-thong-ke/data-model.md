# Mô hình dữ liệu (hồi tố): Cụm admin

**Tính năng**: `006-admin-don-thong-ke` | **Ngày**: 2026-10-15

Không tạo bảng/cột mới. Đọc từ bảng đã có.

## Thực thể

| Thực thể | Trường dùng | Ghi chú |
|---|---|---|
| `Order` | `code`, `customerName/Phone`, `status` (6 mã), `paymentMethod`, `paid/paidAt`, `total/discount/paymentAmount`, `createdAt` | `NEXT_STATUSES` là nguồn sự thật duy nhất |
| `OrderDetail` | `variantCode`, `productName`, `quantity`, `unitPrice` | `topSelling`: `GROUP BY variantCode,productName,unitPrice ORDER BY sum(qty) DESC` |
| `Inventory` | `quantity`, `reservedQuantity` | Tồn thấp: `available = quantity − reserved ≤ 5` (lọc client) |

## Ma trận chuyển trạng thái (nguồn sự thật)

`CHO_DUYET → {DA_XAC_NHAN, DA_HUY}`; `DA_XAC_NHAN → {DANG_CHUAN_BI, DA_HUY}`; `DANG_CHUAN_BI → {DANG_GIAO, DA_HUY}`; `DANG_GIAO → {HOAN_THANH, DA_HUY}`; `HOAN_THANH → {}`; `DA_HUY → {}`.

## Quy tắc kiểm chứng

- Mọi mã ngoài 6 giá trị → 400 ở validation + service.
- Sai bước/kết thúc đổi tiếp → 400 "Không thể chuyển đơn từ trạng thái hiện tại sang trạng thái này".
- Duyệt từ `CHO_DUYET` yêu cầu đã có `paymentMethod`.
- `HOAN_THANH`: trừ kho 1 lần (`stockDeducted`); COD chưa trả → `paid/pa idAt`.
- `DA_HUY`: chưa trừ → nhả `reserved`; đã trừ → cộng trả `quantity` + hạ cờ.
- Stats: doanh thu/top chỉ tính `HOAN_THANH`; `revenue-by-day` fill ngày trống = 0.
