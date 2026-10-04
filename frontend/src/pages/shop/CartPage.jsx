import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faTrash } from '@fortawesome/free-solid-svg-icons';
import { clearCart, fetchCart, removeCartItem, updateCartQty } from '../../services/cart.js';
import { fmt } from '../../services/catalog.js';

export default function CartPage({ notify, onBack, onChanged }) {
  const [items, setItems] = useState([]);
  const [checked, setChecked] = useState({});
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const cart = await fetchCart();
      setItems(cart.items);
      onChanged?.(cart.items);
      setChecked(Object.fromEntries(cart.items.map((it) => [it.id, true])));
    } catch {
      notify?.('error', 'Không tải được giỏ hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selected = useMemo(() => items.filter((it) => checked[it.id]), [items, checked]);
  const total = selected.reduce((s, it) => s + it.price * it.qty, 0);
  const allChecked = items.length > 0 && items.every((it) => checked[it.id]);

  const changeQty = async (it, qty) => {
    const want = Math.max(1, qty);
    if (want > it.stock) { notify?.('error', `Không đủ tồn kho, còn ${it.stock}`); return; }
    try {
      const cart = await updateCartQty(it.variantCode, want);
      setItems(cart.items);
      onChanged?.(cart.items);
    } catch (e) {
      notify?.('error', e.response?.data?.message || 'Không cập nhật được số lượng');
    }
  };

  const remove = async (it) => {
    try {
      const cart = await removeCartItem(it.variantCode);
      setItems(cart.items);
      onChanged?.(cart.items);
      setChecked((c) => { const next = { ...c }; delete next[it.id]; return next; });
    } catch (e) {
      notify?.('error', e.response?.data?.message || 'Không xóa được sản phẩm');
    }
  };

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb kh-detail-crumb">
          <a onClick={onBack} style={{ cursor: 'pointer' }}>Trang chủ</a>{' / Giỏ hàng'}
        </div>
        <button className="kh-detail-back" onClick={onBack}>
          <FontAwesomeIcon icon={faChevronLeft} /> Tiếp tục mua sắm
        </button>
        <div className="kh-cart-title-row">
          <h2 className="kh-detail-title">Giỏ hàng của bạn</h2>
          {!loading && items.length > 0 && (
            <button
              type="button" className="kh-cart-clear"
              onClick={async () => {
                if (!window.confirm('Xóa tất cả sản phẩm trong giỏ?')) return;
                try {
                  await clearCart();
                  setItems([]);
                  onChanged?.([]);
                  setChecked({});
                } catch {
                  notify?.('error', 'Không xóa được giỏ hàng');
                }
              }}
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {loading ? (
          <div className="kh-count">Đang tải giỏ hàng...</div>
        ) : items.length === 0 ? (
          <div className="kh-count">Chưa có sản phẩm trong giỏ hàng.</div>
        ) : (
          <div className="kh-cart-layout">
            <div className="kh-cart-table">
              <div className="kh-cart-head kh-cart-row">
                <label><input type="checkbox" checked={allChecked} onChange={(e) => setChecked(Object.fromEntries(items.map((it) => [it.id, e.target.checked])))} /> Tất cả</label>
                <span>Sản phẩm</span><span>Đơn giá</span><span>Số lượng</span><span>Thành tiền</span><span />
              </div>
              {items.map((it) => (
                <div className="kh-cart-row" key={it.id}>
                  <input type="checkbox" checked={!!checked[it.id]} onChange={(e) => setChecked((c) => ({ ...c, [it.id]: e.target.checked }))} />
                  <div className="kh-cart-prod">
                    {it.img ? <img src={it.img} alt={it.name} /> : <div className="kh-cart-noimg">Không có hình</div>}
                    <div><div className="n">{it.name}</div><div className="v">{it.brandName}</div></div>
                  </div>
                  <div className="p">{fmt(it.price)}</div>
                  <div className="kh-detail-qty">
                    <button type="button" onClick={() => changeQty(it, it.qty - 1)}>-</button>
                    <input value={it.qty} readOnly />
                    <button type="button" onClick={() => changeQty(it, it.qty + 1)}>+</button>
                  </div>
                  <div className="p"><strong>{fmt(it.price * it.qty)}</strong></div>
                  <button type="button" className="kh-cart-rm" title="Xóa" onClick={() => remove(it)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
            </div>
            <div className="kh-cart-summary">
              <h4>Tóm tắt đơn hàng</h4>
              <div className="row"><span>Đã chọn:</span><strong>{selected.length} sản phẩm</strong></div>
              <div className="row total"><span>Tổng tiền:</span><strong>{fmt(total)}</strong></div>
              <div className="kh-cart-coupon">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Nhập mã giảm giá..." />
                <button type="button" onClick={() => notify?.('warning', 'Mã giảm giá sẽ áp dụng ở bước thanh toán')}>Áp dụng</button>
              </div>
              <button
                type="button" className="kh-detail-buynow" disabled={selected.length === 0}
                onClick={() => notify?.('warning', 'Thanh toán sẽ làm ở phase đặt hàng')}
              >
                Tiến hành thanh toán
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
