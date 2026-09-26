import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS, matchPrice } from '../../services/catalog.js';
import FilterSidebar from '../../components/shop/FilterSidebar.jsx';
import ShopProductCard from '../../components/shop/ShopProductCard.jsx';

const PAGE_SIZE = 8;

export default function CustomerHome({ query, onBuy }) {
  const [f, setF] = useState({ cat: '', price: 'tat-ca', brand: '' });
  const [page, setPage] = useState(1);

  const list = useMemo(() => {
    const q = (query || '').toLowerCase();
    return PRODUCTS.filter((p) =>
      (!f.cat || p.cat === f.cat) &&
      (!f.brand || p.brand === f.brand) &&
      matchPrice(p, f.price) &&
      (!q || p.name.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q))
    );
  }, [f, query]);

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const items = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Trang chủ</div>
        <div className="kh-layout">
          <FilterSidebar f={f} setF={(v) => { setF(v); setPage(1); }} />
          <main>
            <div className="kh-fhead">
              <h2>Tìm sản phẩm theo nhu cầu</h2>
              <button className="kh-fnow"><FontAwesomeIcon icon={faFilter} /> Dùng bộ lọc ngay</button>
            </div>
            <div className="kh-count">Tìm thấy {list.length} kết quả</div>
            <div className="kh-grid">
              {items.map((p) => <ShopProductCard key={p.id} p={p} onBuy={onBuy} />)}
            </div>
            <div className="kh-pages">
              <button disabled={cur <= 1} onClick={() => setPage(cur - 1)}>« Trước</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={cur === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Tiếp »</button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
