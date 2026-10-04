import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import ShopProductCard from '../../components/shop/ShopProductCard.jsx';
import { fetchDetail } from '../../services/shop.js';
import { fmt } from '../../services/catalog.js';

export default function ProductDetail({ code, onAdd, onBuyNow, onBack, onView, notify }) {
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelected(0);
    setQty(1);
    fetchDetail(code)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setError('Không tải được sản phẩm.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  const variants = detail?.variants || [];
  const variant = variants[selected] || null;
  const thumbs = useMemo(
    () => [...new Set(variants.map((v) => v.img).filter(Boolean))],
    [variants],
  );
  const mainImg = variant?.img || thumbs[0] || '';
  const stock = variant?.stockQuantity ?? 0;
  const out = !variant || stock <= 0;

  const buildItem = () => ({
    id: variant.code,
    name: variant.name ? `${detail.name} - ${variant.name}` : detail.name,
    brandName: detail.brandName || '',
    img: variant.img,
    price: Number(variant.price ?? 0),
    stock,
  });

  const guardStock = (want) => {
    if (out) { notify?.('error', 'Sản phẩm đã hết hàng'); return false; }
    if (want > stock) { notify?.('error', `Không đủ tồn kho, còn ${stock}`); return false; }
    return true;
  };

  const handleAdd = () => {
    if (!guardStock(qty)) return;
    onAdd?.(buildItem(), qty);
  };

  const handleBuyNow = () => {
    if (!guardStock(qty)) return;
    onBuyNow?.(buildItem(), qty);
  };

  if (loading) return <div className="kh-body"><div className="tz-container"><div className="kh-count">Đang tải sản phẩm...</div></div></div>;
  if (error || !detail) {
    return (
      <div className="kh-body"><div className="tz-container">
        <div className="kh-count">{error || 'Không tìm thấy sản phẩm.'}</div>
        <button className="kh-buy" onClick={onBack}>Quay lại</button>
      </div></div>
    );
  }

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">
          <a onClick={onBack} style={{ cursor: 'pointer' }}>Trang chủ</a>
          {' / '}{detail.categoryName || 'Danh mục'}{' / '}{detail.name}
        </div>
        <button className="kh-detail-back" onClick={onBack}>
          <FontAwesomeIcon icon={faChevronLeft} /> Quay lại
        </button>
        <h2 className="kh-detail-title">{detail.name}</h2>

        <div className="kh-detail-layout">
          <div>
            <div className="kh-detail-gallery">
              {mainImg ? <img src={mainImg} alt={detail.name} /> : <span>Không có hình</span>}
            </div>
            {thumbs.length > 1 && (
              <div className="kh-detail-thumbs">
                {thumbs.map((src) => (
                  <button
                    key={src}
                    type="button"
                    className={src === mainImg ? 'active' : ''}
                    onClick={() => {
                      const i = variants.findIndex((v) => v.img === src);
                      if (i >= 0) { setSelected(i); setQty(1); }
                    }}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
            <div className="kh-count">Mã sản phẩm: <strong>{detail.code}</strong> | Danh mục: <strong>{detail.categoryName || '—'}</strong></div>
          </div>

          <div>
            <div className="kh-detail-price">{variant ? fmt(variant.price) : 'Liên hệ'}</div>
            <div className={`kh-stock ${out ? 'out' : stock < 5 ? 'low' : 'ok'}`}>
              {!variant ? 'Chưa có biến thể' : out ? 'Hết hàng' : stock < 5 ? `Sắp hết hàng (${stock})` : 'Còn hàng'}
            </div>

            {variants.length > 0 && (
              <div className="kh-detail-opts">
                <span className="kh-detail-label">Phiên bản</span>
                <div className="kh-detail-grid">
                  {variants.map((v, i) => {
                    const vOut = (v.stockQuantity ?? 0) <= 0;
                    return (
                      <button
                        key={v.code}
                        type="button"
                        disabled={vOut}
                        className={`kh-detail-opt ${i === selected ? 'selected' : ''}`}
                        onClick={() => { setSelected(i); setQty(1); }}
                      >
                        <strong>{v.name || v.code}</strong>
                        <small>{[v.color, v.storage, v.ram].filter(Boolean).join(' • ')}</small>
                        <small className="kh-detail-opt-price">{fmt(v.price)}</small>
                        <small className={vOut ? 'out' : ''}>{vOut ? 'Hết hàng' : `Còn ${v.stockQuantity}`}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="kh-detail-actions">
              <div className="kh-detail-qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <input value={qty} readOnly />
                <button type="button" onClick={() => setQty((q) => Math.min(Math.max(stock, 1), q + 1))}>+</button>
              </div>
              <button type="button" className="kh-buy" disabled={out} onClick={handleAdd}>
                <FontAwesomeIcon icon={faCartPlus} /> Thêm vào giỏ
              </button>
            </div>
            <button type="button" className="kh-detail-buynow" disabled={out} onClick={handleBuyNow}>
              Mua ngay
            </button>
          </div>

          <div>
            <div className="kh-detail-info">
              <h4>Thông tin sản phẩm</h4>
              <ul>
                <li><strong>Thương hiệu:</strong> {detail.brandName || '—'}</li>
                <li><strong>Nhà cung cấp:</strong> {detail.supplierName || '—'}</li>
                <li><strong>Danh mục:</strong> {detail.categoryName || '—'}</li>
                <li><strong>Bảo hành:</strong> 12 tháng chính hãng</li>
                <li><strong>Khuyến mãi:</strong> Trả góp 0% lãi suất</li>
              </ul>
            </div>
          </div>
        </div>

        {detail.similar?.length > 0 && (
          <>
            <h3 className="kh-detail-similar">Sản phẩm tương tự</h3>
            <div className="kh-grid">
              {detail.similar.map((p) => (
                <ShopProductCard key={p.id} p={p} onBuy={(item) => onAdd?.(item, 1)} onView={onView} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
