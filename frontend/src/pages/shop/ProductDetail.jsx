import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus, faChevronLeft, faStar as faStarSolid, faStarHalfStroke } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import ShopProductCard from '../../components/shop/ShopProductCard.jsx';
import { fetchDetail, fetchReviews, postReview } from '../../services/shop.js';
import { fmt } from '../../services/catalog.js';

function Stars({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(value)) stars.push(<FontAwesomeIcon key={i} icon={faStarSolid} />);
    else if (i - value < 1 && value > 0) stars.push(<FontAwesomeIcon key={i} icon={faStarHalfStroke} />);
    else stars.push(<FontAwesomeIcon key={i} icon={faStarRegular} />);
  }
  return <span className="kh-detail-stars">{stars}</span>;
}

function ReviewModal({ onClose, onSubmit, sending }) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  return (
    <div className="kh-detail-modal-overlay" onClick={onClose}>
      <div className="kh-detail-modal" onClick={(e) => e.stopPropagation()}>
        <h4>Viết đánh giá</h4>
        <div className="kh-detail-modal-stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} sao`}>
              <FontAwesomeIcon icon={s <= rating ? faStarSolid : faStarRegular} size="lg" />
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
          rows={4}
        />
        <div className="kh-detail-modal-actions">
          <button type="button" className="kh-detail-back" onClick={onClose}>Hủy</button>
          <button
            type="button" className="kh-buy" disabled={sending}
            onClick={() => onSubmit({ rating, content })}
          >
            {sending ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail({ code, onAdd, onBuyNow, onBack, onView, notify }) {
  const [detail, setDetail] = useState(null);
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState({ average: 0, total: 0, distribution: [], reviews: [] });
  const [reviewModal, setReviewModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setSelected(0);
    setQty(1);
    setReviewModal(false);
    Promise.all([fetchDetail(code), fetchReviews(code).catch(() => null)])
      .then(([d, r]) => {
        if (cancelled) return;
        setDetail(d);
        if (r) setReviewData(r);
      })
      .catch(() => { if (!cancelled) setError('Không tải được sản phẩm.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [code]);

  const variants = detail?.variants || [];
  const variant = variants[selected] || null;
  const prices = variants.map((v) => Number(v.price ?? 0)).filter((n) => n > 0);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const discount = maxPrice > 0 && maxPrice > minPrice ? Math.round((1 - minPrice / maxPrice) * 100) : 0;
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

  const reloadReviews = async () => {
    try {
      setReviewData(await fetchReviews(code));
    } catch { /* giữ dữ liệu cũ */ }
  };

  const submitReview = async ({ rating, content }) => {
    if (!content.trim()) { notify?.('warning', 'Vui lòng nhập nội dung đánh giá'); return; }
    setSending(true);
    try {
      await postReview(code, { rating, content: content.trim() });
      setReviewModal(false);
      notify?.('success', 'Gửi đánh giá thành công');
      await reloadReviews();
    } catch (e) {
      notify?.('error', e.response?.data?.message || e.response?.data?.content || 'Không gửi được đánh giá');
    } finally {
      setSending(false);
    }
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

  const totalReviews = reviewData.total || 0;

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">
          <a onClick={onBack} style={{ cursor: 'pointer' }}>Trang chủ</a>
          {' / Chi tiết sản phẩm'}
        </div>
        <div className="kh-crumb">
          <a onClick={onBack} style={{ cursor: 'pointer' }}>Trang chủ</a>
          {' / '}{detail.categoryName || 'Danh mục'}{' / '}{detail.name}
        </div>

        <h2 className="kh-detail-title">{detail.name}</h2>
        <div className="kh-detail-ratingline">
          <Stars value={reviewData.average || 0} />
          <span className="kh-count">({totalReviews} Đánh giá)</span>
        </div>

        <div className="kh-detail-layout">
          <div>
            <div className="kh-detail-gallery">
              <span className="kh-detail-badge">-{discount}%</span>
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
            <h3 className="kh-detail-subtitle">{detail.name}</h3>
            <div className="kh-detail-price">
              {minPrice && minPrice !== maxPrice
                ? `${fmt(minPrice)} - ${fmt(maxPrice)}`
                : variant ? fmt(variant.price) : 'Liên hệ'}
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
                        <strong>{[v.color, v.storage, v.ram].filter(Boolean).join(' - ') || v.name || v.code}</strong>
                        <small className="kh-detail-opt-price">{fmt(v.price)}</small>
                        <small className={vOut ? 'out' : 'in'}>({vOut ? 'Hết hàng' : `Còn hàng: ${v.stockQuantity} sản phẩm`})</small>
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
              <button
                type="button" className="kh-detail-addcart" disabled={out}
                onClick={() => { if (guardStock(qty)) onAdd?.(buildItem(), qty); }}
              >
                <FontAwesomeIcon icon={faCartPlus} /> Thêm vào giỏ
              </button>
            </div>
            <button
              type="button" className="kh-detail-buynow" disabled={out}
              onClick={() => { if (guardStock(qty)) onBuyNow?.(buildItem(), qty); }}
            >
              Mua ngay
              <span className="kh-detail-buynow-sub">Giao hàng tận nơi hoặc nhận tại cửa hàng</span>
            </button>
            <div className="kh-detail-install">
              <button type="button">Trả góp 0%<span>Xét duyệt qua điện thoại</span></button>
              <button type="button">Trả góp qua thẻ<span>Visa, Master Card, JCB</span></button>
            </div>
          </div>

          <div>
            <div className="kh-detail-info">
              <h4>Thông tin sản phẩm</h4>
              <ul>
                {[
                  ['Thương hiệu', detail.brandName || '-'],
                  ['Nhà cung cấp', detail.supplierName || '-'],
                  ['Danh mục', detail.categoryName || '-'],
                  ['Mô tả', 'Chưa có mô tả'],
                  ['Bảo hành', '12 tháng chính hãng'],
                  ['Khuyến mãi', 'Trả góp 0% lãi suất'],
                  ['Ưu đãi thêm', 'Giảm 50k phí vận chuyển'],
                ].map(([label, value], i) => (
                  <li key={label}>
                    <span className="kh-detail-num">{i + 1}</span>
                    <span><strong>{label}:</strong> {value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="kh-detail-review-head">
          {totalReviews} đánh giá cho {detail.name}
        </div>
        <div className="kh-detail-review-box">
          <div className="kh-detail-review-left">
            <div className="kh-detail-score">{Number(reviewData.average || 0).toFixed(2)} <FontAwesomeIcon icon={faStarSolid} /></div>
            <div className="kh-count">Đánh giá trung bình</div>
          </div>
          <div className="kh-detail-review-mid">
            {(reviewData.distribution || []).map((d) => (
              <div className="kh-detail-bar-row" key={d.stars}>
                <span className="kh-detail-bar-label">{d.stars} <FontAwesomeIcon icon={faStarSolid} /></span>
                <div className="kh-detail-bar-bg"><div className="kh-detail-bar-fill" style={{ width: `${d.percent}%` }} /></div>
                <span className="kh-detail-bar-text">{d.percent}% | {d.count} đánh giá</span>
              </div>
            ))}
          </div>
          <div className="kh-detail-review-right">
            <button type="button" className="kh-detail-review-btn" onClick={() => setReviewModal(true)}>Đánh giá ngay</button>
          </div>
        </div>
        <div className="kh-detail-review-list">
          {(reviewData.reviews || []).map((r) => (
            <div className="kh-detail-review-item" key={r.id}>
              <div className="kh-detail-avatar">{(r.customerName || '?').charAt(0).toUpperCase()}</div>
              <div>
                <span className="kh-detail-reviewer">{r.customerName}</span>
                <div className="kh-detail-stars small"><Stars value={r.rating} /></div>
                <p>{r.content}</p>
                {r.reply && (
                  <div className="kh-detail-seller">
                    <span className="kh-detail-seller-head">Phản hồi của người bán:</span>
                    <span>{r.reply}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {totalReviews === 0 && <p className="kh-detail-no-review">Chưa có đánh giá nào cho sản phẩm này.</p>}
        </div>

        {detail.similar?.length > 0 && (
          <>
            <h3 className="kh-detail-similar">Sản phẩm tương tự</h3>
            <div className="kh-grid">
              {detail.similar.map((p) => (
                <ShopProductCard key={p.id} p={p} badgeText="-0%" onBuy={(item) => onAdd?.(item, 1)} onView={onView} />
              ))}
            </div>
          </>
        )}
      </div>
      {reviewModal && (
        <ReviewModal onClose={() => setReviewModal(false)} onSubmit={submitReview} sending={sending} />
      )}
    </div>
  );
}
