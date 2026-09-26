import { fmt } from '../../services/catalog.js';

export function stockOf(p) {
  if (p.stock <= 0) return { cls: 'out', text: 'Hết hàng' };
  if (p.stock < 5) return { cls: 'low', text: `Sắp hết hàng (${p.stock})` };
  return { cls: 'ok', text: 'Còn hàng' };
}

export default function ShopProductCard({ p, onBuy }) {
  const st = stockOf(p);
  const pct = p.sale ? Math.round((1 - p.sale / p.price) * 100) : 0;
  return (
    <div className={`kh-card ${st.cls === 'out' ? 'out' : ''}`}>
      {pct > 0 && <span className="kh-sticker">-{pct}%</span>}
      <img src={p.img} alt={p.name} loading="lazy" />
      <div className="kh-name">{p.name}</div>
      {p.sale ? (
        <>
          <div className="kh-old">{fmt(p.price)}</div>
          <div className="kh-new">{fmt(p.sale)}</div>
        </>
      ) : (
        <div className="kh-new">{fmt(p.price)}</div>
      )}
      <div className={`kh-stock ${st.cls}`}>{st.text}</div>
      <button className="kh-buy" disabled={st.cls === 'out'} onClick={() => onBuy?.(p)}>
        Mua ngay
      </button>
    </div>
  );
}
