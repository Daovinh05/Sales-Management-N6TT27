import { useCallback, useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import FilterSidebar from '../../components/shop/FilterSidebar.jsx';
import ShopProductCard from '../../components/shop/ShopProductCard.jsx';
import { fetchBrands, fetchCategories, fetchProducts, fetchRandom } from '../../services/shop.js';

const PAGE_SIZE = 8;

export default function CustomerHome({ query, onBuy, onView }) {
  const [f, setF] = useState({ cat: '', price: 'tat-ca', brand: '' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [categories, setCategories] = useState([{ id: '', name: 'Tất cả' }]);
  const [brands, setBrands] = useState([{ id: '', name: 'Tất cả' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [randomItems, setRandomItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchBrands()])
      .then(([cats, brs]) => {
        if (!cancelled) {
          if (cats.length > 1) setCategories(cats);
          if (brs.length > 1) setBrands(brs);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchProducts({ ...f, search: query, page, size: PAGE_SIZE });
      setData(result);
      // Hết kết quả khi đang tìm kiếm: gợi ý ngẫu nhiên như PHP (ORDER BY RAND LIMIT 7).
      if (result.items.length === 0 && (query || '').trim()) {
        try {
          setRandomItems(await fetchRandom(7));
        } catch {
          setRandomItems([]);
        }
      } else {
        setRandomItems([]);
      }
    } catch {
      setError('Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [f, query, page]);

  useEffect(() => { load(); }, [load]);

  // Query gõ từ header đổi -> về trang đầu (giữ filter).
  useEffect(() => { setPage(0); }, [query]);

  const changeFilter = (v) => { setF(v); setPage(0); };
  const pages = Math.max(1, data.pages);
  const cur = Math.min(page, pages - 1);

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Trang chủ</div>
        <div className="kh-layout">
          <FilterSidebar f={f} setF={changeFilter} categories={categories} brands={brands} />
          <main>
            <div className="kh-fhead">
              <h2>Tìm sản phẩm theo nhu cầu</h2>
              <button className="kh-fnow" onClick={load}><FontAwesomeIcon icon={faFilter} /> Dùng bộ lọc ngay</button>
            </div>
            {(query || '').trim() && !loading && !error ? (
              <div className="kh-search-head">
                <h2>Kết quả tìm kiếm cho: <span className="kh-search-query">"{query.trim()}"</span></h2>
                <div className="kh-count">{data.total} sản phẩm được tìm thấy</div>
              </div>
            ) : (
              <div className="kh-count">
                {loading ? 'Đang tải...' : `Tìm thấy ${data.total} kết quả`}
                {error && ` — ${error}`}
              </div>
            )}
            <div className="kh-grid">
              {data.items.map((p) => <ShopProductCard key={p.id} p={p} onBuy={onBuy} onView={onView} />)}
            </div>
            {!loading && data.items.length === 0 && !error && (
              <div className="kh-noresult">
                <h3>Không tìm thấy sản phẩm nào</h3>
                <p>Chúng tôi không tìm thấy sản phẩm nào phù hợp{(query || '').trim() && <> với từ khóa <strong>"{query.trim()}"</strong></>}.</p>
                <p>Vui lòng thử lại với từ khóa khác.</p>
                {randomItems.length > 0 && (
                  <>
                    <div className="kh-suggest-title">Một số gợi ý tìm kiếm:</div>
                    <div className="kh-suggest-rail">
                      {randomItems.map((p) => (
                        <div key={p.id} className="kh-suggest-card" onClick={() => onView?.(p.code)}>
                          {p.img ? <img src={p.img} alt={p.name} /> : <div className="kh-noimg">Không có hình</div>}
                          <div className="kh-suggest-name">{p.name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            <div className="kh-pages">
              <button disabled={cur <= 0} onClick={() => setPage(cur - 1)}>« Trước</button>
              {Array.from({ length: pages }, (_, i) => (
                <button key={i} className={cur === i ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>
              ))}
              <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Tiếp »</button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
