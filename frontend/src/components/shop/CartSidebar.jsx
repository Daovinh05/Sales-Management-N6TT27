import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { fmt } from '../../services/catalog.js';

export default function CartSidebar({ open, items, onClose, onRemove }) {
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
          {items.map((it, i) => (
            <div key={it.id} className="kh-citem">
              <img src={it.img} alt={it.name} />
              <div>
                <div className="n">{it.name}</div>
                <div className="v">{it.brandName} • SL: {it.qty}</div>
                <div className="p">{fmt(it.price)}</div>
              </div>
              <button className="rm" onClick={() => onRemove?.(i)}><FontAwesomeIcon icon={faXmark} size="xs" /></button>
            </div>
          ))}
        </div>
        <div className="kh-cfoot">
          <div className="tot"><span>Tổng số phụ:</span><strong>{fmt(total)}</strong></div>
          <div className="kh-cbtns">
            <button className="view">Xem giỏ hàng</button>
            <button className="pay">Thanh toán</button>
          </div>
        </div>
      </div>
    </>
  );
}
