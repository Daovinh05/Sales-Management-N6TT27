# Contract: API lịch sử đơn (khách)

**Tính năng**: `012-lich-su-don`

- `GET /api/orders/mine` → đơn của chính chủ (401 không token).
- `GET /api/orders/{code}/detail` → chi tiết (403 sai chủ).
- `POST /api/orders/{code}/cancel` → 200 `DA_HUY` + hoàn kho; từ `DANG_CHUAN_BI` → 400 "vui lòng liên hệ shop".
