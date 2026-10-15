# Mô hình dữ liệu (hồi tố): Quản lý đơn

**Tính năng**: `013-quan-ly-don` | **Ngày**: 2026-10-15

Không thêm bảng/cột. Nguồn sự thật: `NEXT_STATUSES` — `CHO_DUYET → {DA_XAC_NHAN, DA_HUY}`; `DA_XAC_NHAN → {DANG_CHUAN_BI, DA_HUY}`; `DANG_CHUAN_BI → {DANG_GIAO, DA_HUY}`; `DANG_GIAO → {HOAN_THANH, DA_HUY}`; terminal rỗng.

- Duyệt từ `CHO_DUYET` yêu cầu `paymentMethod != null`.
- `HOAN_THANH`: `deductStockIfNeeded` 1 lần + COD chưa trả → `paid/paidAt`.
- `DA_HUY`: chưa trừ → nhả `reserved`; đã trừ → cộng trả `quantity` + hạ cờ.
