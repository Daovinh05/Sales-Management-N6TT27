import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../store/auth.jsx';
import PaymentModal from './PaymentModal.jsx';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

export default function Checkout({ items, notify, onPlaced, onBack }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', note: '' });
  const [promotions, setPromotions] = useState([]);
  const [voucher, setVoucher] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [variantMap, setVariantMap] = useState({});
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => {
      setForm((f) => ({
        ...f,
        name: data.fullName || user?.username || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || user?.email || ''
      }));
    }).catch(() => {
      setForm((f) => ({ ...f, name: user?.username || '', email: user?.email || '' }));
    });
    api.get('/promotions').then(({ data }) => {
      setPromotions(Array.isArray(data) ? data : []);
    }).catch(() => {});
    api.get('/variants').then(({ data }) => {
      const map = {};
      (Array.isArray(data) ? data : []).forEach((v) => { map[v.code] = v; });
      setVariantMap(map);
    }).catch(() => {});
  }, [user]);

  const subtotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0),
    [items]
  );
  const discount = useMemo(() => {
    const promo = promotions.find((p) => p.code === voucher);
    if (!promo) return 0;
    return Math.min(Number(promo.discountAmount || 0), subtotal);
  }, [promotions, voucher, subtotal]);
  const total = Math.max(0, subtotal - discount);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    if (!items.length) return;
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim() || !form.email.trim()) {
      setError('Vui lòng nhập đầy đủ họ tên, địa chỉ, số điện thoại và email.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        email: form.email.trim(),
        shippingAddress: form.address.trim(),
        note: form.note.trim() || null,
        discountAmount: discount,
        items: items.map((it) => ({
          variantCode: it.variantCode || null,
          productName: it.name,
          quantity: Number(it.qty || 1),
          unitPrice: Number(it.price || 0)
        }))
      });
      // Đơn ở CHO_DUYET + giữ chỗ kho, mở modal để khách chọn COD / VietQR.
      setCreatedOrder(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể đặt hàng. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!items.length) {
    return (
      <div className="kh-body">
        <div className="tz-container">
          <div className="kh-crumb">Trang chủ / Thanh toán</div>
          <div className="co-empty">
            <p>Không có sản phẩm nào để thanh toán.</p>
            <button className="tz-btn tz-btn-dark" type="button" onClick={onBack}>← Tiếp tục mua sắm</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Thanh toán</div>
        <div className="co-layout">
          <section className="co-main">
            <h2 className="co-title">THÔNG TIN THANH TOÁN</h2>
            <form onSubmit={submit}>
              <label className="co-field">Họ và tên *
                <input value={form.name} onChange={set('name')} placeholder="Nhập họ và tên" />
              </label>
              <label className="co-field">Địa chỉ *
                <input value={form.address} onChange={set('address')} placeholder="Nhập địa chỉ nhận hàng" />
              </label>
              <button className="co-add-address" type="button" onClick={() => setForm({ ...form, address: '' })}>
                + Thêm địa chỉ mới
              </button>
              <label className="co-field">Số điện thoại *
                <input value={form.phone} onChange={set('phone')} placeholder="Nhập số điện thoại" />
              </label>
              <label className="co-field">Địa chỉ email *
                <input type="email" value={form.email} onChange={set('email')} placeholder="Nhập email" />
              </label>

              <h2 className="co-title" style={{ marginTop: 28 }}>THÔNG TIN BỔ SUNG</h2>
              <label className="co-field">Ghi chú đơn hàng (Tùy chọn)
                <textarea
                  value={form.note} onChange={set('note')} rows={5}
                  placeholder="Ví dụ: Thời gian hay chỉ dẫn địa điểm giao hàng chi tiết hơn."
                />
              </label>
              {error && <p className="tz-alert">{error}</p>}
            </form>
          </section>

          <aside className="co-side">
            <h2 className="co-title">ĐƠN HÀNG CỦA BẠN</h2>
            <div className="co-box">
              <div className="co-row co-head"><span>SẢN PHẨM</span><span>TẠM TÍNH</span></div>
              {items.map((it) => {
                const variant = (it.variantCode && variantMap[it.variantCode]) || {};
                const specs = [
                  variant.ram && variant.storage ? `BIẾN THỂ: ${variant.ram}/${variant.storage}${variant.color ? `/${variant.color}` : ''}` : null,
                  variant.color ? `MÀU SẮC: ${variant.color}` : null,
                  variant.storage ? `DUNG LƯỢNG: ${variant.storage}` : null
                ].filter(Boolean);
                return (
                  <div key={it.id} className="co-item">
                    <div>
                      <div className="co-item-name">{it.name} × {it.qty}</div>
                      {specs.length ? specs.map((line) => (
                        <div key={line} className="co-item-spec">{line}</div>
                      )) : it.brandName && <div className="co-item-spec">{it.brandName}</div>}
                    </div>
                    <div className="co-item-total">{formatMoney(Number(it.price || 0) * Number(it.qty || 1))}</div>
                  </div>
                );
              })}
              <div className="co-row"><span>Tạm tính ({items.reduce((s, it) => s + Number(it.qty || 1), 0)} sản phẩm)</span><span>{formatMoney(subtotal)}</span></div>
              <label className="co-row">Khuyến mãi (Voucher)
                <select value={voucher} onChange={(e) => setVoucher(e.target.value)}>
                  <option value="">-- Chọn voucher --</option>
                  {promotions.map((p) => (
                    <option key={p.code} value={p.code}>{p.name} (-{formatMoney(p.discountAmount)})</option>
                  ))}
                </select>
              </label>
              {!promotions.length && <div className="co-item-sub">Không có voucher nào</div>}
              <div className="co-row co-discount"><span><em>Giảm giá</em></span><span><em>-{formatMoney(discount)}</em></span></div>
              <div className="co-row co-total"><span>Tổng</span><span>{formatMoney(total)}</span></div>
              <button className="co-submit" type="button" disabled={saving} onClick={submit}>
                {saving ? 'ĐANG ĐẶT...' : 'ĐẶT HÀNG'}
              </button>
            </div>
          </aside>
        </div>
      </div>
      {createdOrder && (
        <PaymentModal
          order={createdOrder}
          notify={notify}
          onPaid={(paid) => { setCreatedOrder(null); onPlaced?.(paid); }}
          onCancelled={() => { setCreatedOrder(null); onBack?.(); }}
          onClose={() => setCreatedOrder(null)}
        />
      )}
    </div>
  );
}
