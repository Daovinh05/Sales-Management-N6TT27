import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';

export default function ProductCard({ p, onAdd }) {
  const out = (p.stock ?? 10) <= 0;
  return (
    <div className={`tz-card ${out ? 'out' : ''}`}>
      <img src={p.image} alt={p.name} loading="lazy" />
      <div className="tz-card-name">{p.name}</div>
      <div className="tz-card-meta">{p.brand} • {p.category}</div>
      <div className="tz-price">
        <span className="tz-price-new">{p.salePrice}</span>
        <span className="tz-price-old">{p.price}</span>
      </div>
      <span className={`tz-badge ${out ? 'out' : p.stock < 5 ? 'low' : 'ok'}`}>
        {out ? 'Hết hàng' : p.stock < 5 ? `Sắp hết (còn ${p.stock})` : 'Còn hàng'}
      </span>
      <button className="tz-btn tz-btn-outline" disabled={out} onClick={() => onAdd?.(p)}>
        <FontAwesomeIcon icon={faCartShopping} /> Thêm giỏ
      </button>
    </div>
  );
}
