import { fmt } from '../../services/catalog.js';

export function stockOf(p) {
  if (p.stock <= 0) return { cls: 'out', text: 'Hết hàng' };
  if (p.stock < 5) return { cls: 'low', text: `Sắp hết hàng (${p.stock})` };
  return { cls: 'ok', text: 'Còn hàng' };
}

export default function ShopProductCard({ p, onBuy, onView, badgeText }) {
  const st = stockOf(p);
  const pct = p.sale ? Math.round((1 - p.sale / p.price) * 100) : 0;
  const view = () => onView?.(p.code || p.id);
  return (
    <div className={`kh-card ${st.cls === 'out' ? 'out' : ''}`}>
      {pct > 0 ? <span className="kh-sticker">-{pct}%</span>
        : badgeText != null ? <span className="kh-sticker">{badgeText}</span> : null}
      {p.img
        ? <img src={p.img} alt={p.name} loading="lazy" onClick={view} style={onView ? { cursor: 'pointer' } : undefined} />
        : <div className="kh-noimg" onClick={view} style={onView ? { cursor: 'pointer' } : undefined}>Không có hình</div>}
      <div className="kh-name" onClick={view} style={onView ? { cursor: 'pointer' } : undefined}>{p.name}</div>
      {p.sale ? (
        <>
          <div className="kh-old">{fmt(p.price)}</div>
          <div className="kh-new">{fmt(p.sale)}</div>
        </>
      ) : p.minPrice != null && p.maxPrice != null && p.minPrice !== p.maxPrice ? (
        <div className="kh-new">{fmt(p.minPrice)} - {fmt(p.maxPrice)}</div>
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
