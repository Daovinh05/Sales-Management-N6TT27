import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { fmt } from '../../services/catalog.js';

export default function CartSidebar({ open, items, onClose, onQty, onRemove, onViewCart, onCheckout }) {
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  const count = items.reduce((s, it) => s + it.qty, 0);
  return (
    <>
      {open && <div className="kh-overlay" onClick={onClose} />}
      <div className={`kh-cside ${open ? 'active' : ''}`}>
        <div className="kh-chead">
          <span>GIỎ HÀNG ({count})</span>
          <FontAwesomeIcon icon={faXmark} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div className="kh-cbody">
          {items.length === 0 && <div className="kh-cempty">Chưa có sản phẩm trong giỏ hàng...</div>}
          {items.map((it) => (
            <div key={it.id} className="kh-citem">
              {it.img ? <img src={it.img} alt={it.name} /> : <div className="kh-cnoimg">Không có hình</div>}
              <div>
                <div className="n">{it.name}</div>
                <div className="v">{it.brandName} • SL: {it.qty}</div>
                <div className="p">{fmt(it.price)}</div>
                <div className="kh-cqty">
                  <button type="button" onClick={() => onQty?.(it, it.qty - 1)}>-</button>
                  <span>{it.qty}</span>
                  <button type="button" onClick={() => onQty?.(it, it.qty + 1)}>+</button>
                </div>
              </div>
              <button className="rm" onClick={() => onRemove?.(it)}><FontAwesomeIcon icon={faXmark} size="xs" /></button>
            </div>
          ))}
        </div>
        <div className="kh-cfoot">
          <div className="tot"><span>Tổng số phụ:</span><strong>{fmt(total)}</strong></div>
          <div className="kh-cbtns">
            <button className="view" onClick={onViewCart}>Xem giỏ hàng</button>
            <button className="pay" onClick={onCheckout}>Thanh toán</button>
          </div>
        </div>
      </div>
    </>
  );
}
