import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faReceipt, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';
import PaymentModal from './PaymentModal.jsx';

const STATUS_LABELS = {
  CHO_DUYET: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy'
};

const STATUS_COLORS = {
  CHO_DUYET: { background: '#e8f5e9', color: '#2e7d32' },
  DA_XAC_NHAN: { background: '#dbeafe', color: '#1d4ed8' },
  DANG_GIAO: { background: '#e0f2fe', color: '#0369a1' },
  HOAN_THANH: { background: '#f1f5f9', color: '#475569' },
  DA_HUY: { background: '#fee2e2', color: '#b91c1c' }
};

const TABS = ['ALL', 'CHO_DUYET', 'DA_XAC_NHAN', 'DANG_GIAO', 'HOAN_THANH', 'DA_HUY'];

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date(value)).replace(',', '')
  : '—';

const resolveImage = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const root = (api.defaults.baseURL || '').replace(/\/api$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function OrderHistory({ notify, onBack }) {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [variantMap, setVariantMap] = useState({});
  const [detail, setDetail] = useState(null);
  const [payingOrder, setPayingOrder] = useState(null);

  const refreshOrder = (updated) => {
    setOrders((list) => list.map((o) => (o.code === updated.code ? updated : o)));
  };

  const cancelOrder = async (code) => {
    try {
      const { data } = await api.post(`/orders/${encodeURIComponent(code)}/cancel`);
      refreshOrder(data);
      notify?.('success', `Đã hủy đơn hàng ${data.code}, tồn kho được hoàn lại.`);
    } catch {
      notify?.('error', 'Không thể hủy đơn. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => {
      setOrders(Array.isArray(data) ? data : []);
    }).catch(() => {
      notify?.('error', 'Không tải được lịch sử đơn hàng');
    }).finally(() => setLoading(false));
    api.get('/variants').then(({ data }) => {
      const map = {};
      (Array.isArray(data) ? data : []).forEach((v) => { map[v.code] = v; });
      setVariantMap(map);
    }).catch(() => {});
  }, [notify]);

  const counts = useMemo(() => {
    const result = { ALL: orders.length };
    TABS.slice(1).forEach((s) => { result[s] = orders.filter((o) => o.status === s).length; });
    return result;
  }, [orders]);

  const visible = tab === 'ALL' ? orders : orders.filter((o) => o.status === tab);

  const variantLine = (item) => {
    const variant = (item.variantCode && variantMap[item.variantCode]) || {};
    const parts = [variant.ram, variant.storage, variant.color].filter(Boolean);
    if (parts.length) return `Biến thể: ${parts.join('/')}`;
    return '';
  };

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Lịch sử mua hàng</div>
        <h2 className="oh-title">Đơn hàng của bạn</h2>

        <div className="oh-tabs">
          {TABS.map((s) => (
            <button
              key={s} type="button"
              className={`oh-tab${tab === s ? ' active' : ''}`}
              onClick={() => setTab(s)}
            >
              {s === 'ALL' ? 'Tất cả' : STATUS_LABELS[s]} ({counts[s] ?? 0})
            </button>
          ))}
        </div>

        {loading ? <div className="kh-count">Đang tải...</div>
          : !visible.length ? (
            <div className="oh-empty">
              <div className="oh-empty-title">Chưa có đơn hàng ở giai đoạn này</div>
              <div className="oh-empty-sub">Hãy bắt đầu mua sắm để có đơn hàng đầu tiên</div>
              <button className="oh-shop-btn" type="button" onClick={onBack}>Mua sắm ngay</button>
            </div>
          )
            : visible.map((o) => (
              <section key={o.code} className="oh-card">
                <div className="oh-card-head">
                  <div>
                    <div className="oh-code">Đơn hàng #{o.code}</div>
                    <div className="oh-date">Đặt ngày: {formatDateTime(o.createdAt)}</div>
                  </div>
                  <span
                    className="oh-badge"
                    style={STATUS_COLORS[o.status] || STATUS_COLORS.CHO_DUYET}
                  >
                    {STATUS_LABELS[o.status] || o.status}
                  </span>
                </div>
                {(o.details || []).map((item, index) => {
                  const variant = (item.variantCode && variantMap[item.variantCode]) || {};
                  const image = resolveImage(variant.imageUrl);
                  return (
                    <div key={item.id ?? index} className="oh-item">
                      <div className="oh-thumb">{image ? <img src={image} alt={item.productName} /> : <span>Err</span>}</div>
                      <div className="oh-item-info">
                        <div className="oh-item-name">{item.productName}</div>
                        <div className="oh-item-sub">Số lượng: {item.quantity}</div>
                        {variantLine(item) && <div className="oh-item-sub">{variantLine(item)}</div>}
                        <div className="oh-item-price">{formatMoney(item.unitPrice)}</div>
                      </div>
                      {index === 0 && (
                        <div className="oh-item-right">
                          <div className="oh-item-sub">Số tiền thanh toán</div>
                          <div className="oh-pay">{formatMoney(o.paymentAmount)}</div>
                          <div className="oh-actions">
                            {o.status === 'CHO_DUYET' && !o.paymentMethod && (
                              <button className="oh-detail-btn oh-btn-green" type="button" onClick={() => setPayingOrder(o)}>
                                Thanh toán
                              </button>
                            )}
                            {(o.status === 'CHO_DUYET' || o.status === 'DA_XAC_NHAN') && (
                              <button className="oh-detail-btn oh-btn-red" type="button" onClick={() => cancelOrder(o.code)}>
                                Hủy đơn
                              </button>
                            )}
                            <button className="oh-detail-btn oh-btn-blue" type="button" onClick={() => setDetail(o)}>
                              <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
      </div>

      {detail && (
        <div className="ad-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetail(null);
        }}>
          <div className="oh-modal">
            <div className="oh-modal-head">
              <span><FontAwesomeIcon icon={faReceipt} /> Chi tiết đơn hàng #{detail.code}</span>
              <button type="button" aria-label="Đóng" onClick={() => setDetail(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="oh-modal-body">
              <div className="oh-modal-cols">
                <div>
                  <h4>Thông tin đơn hàng</h4>
                  <div className="oh-kv"><span>Mã đơn hàng:</span><strong>{detail.code}</strong></div>
                  <div className="oh-kv"><span>Ngày đặt:</span><strong>{formatDateTime(detail.createdAt)}</strong></div>
                  <div className="oh-kv"><span>Trạng thái:</span>
                    <span className="oh-badge" style={STATUS_COLORS[detail.status] || STATUS_COLORS.CHO_DUYET}>
                      {STATUS_LABELS[detail.status] || detail.status}
                    </span>
                  </div>
                  <div className="oh-kv"><span>Thanh toán:</span><strong className="oh-red">{formatMoney(detail.paymentAmount)}</strong></div>
                </div>
                <div>
                  <h4>Thông tin giao hàng</h4>
                  <div className="oh-kv"><span>Người nhận:</span><strong>{detail.customerName}</strong></div>
                  <div className="oh-kv"><span>Số điện thoại:</span><strong>{detail.customerPhone || '—'}</strong></div>
                  <div className="oh-kv"><span>Địa chỉ:</span><strong>{detail.shippingAddress || '—'}</strong></div>
                  <div className="oh-kv"><span>Phương thức:</span><strong>{detail.paymentMethod === 'COD' ? 'Tiền mặt (COD)' : detail.paymentMethod === 'VIETQR' ? 'VietQR' : 'Chưa chọn'}</strong></div>
                </div>
              </div>
              <h4>Chi tiết sản phẩm</h4>
              <table className="oh-table">
                <thead><tr><th>HÌNH ẢNH</th><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Tổng tiền</th></tr></thead>
                <tbody>
                  {(detail.details || []).map((item, index) => {
                    const image = resolveImage((item.variantCode && variantMap[item.variantCode]?.imageUrl) || '');
                    return (
                      <tr key={item.id ?? index}>
                        <td><div className="oh-thumb oh-thumb-sm">{image ? <img src={image} alt={item.productName} /> : <span>—</span>}</div></td>
                        <td>{item.productName}</td>
                        <td>{formatMoney(item.unitPrice)}</td>
                        <td>{item.quantity}</td>
                        <td className="oh-blue">{formatMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="oh-modal-foot">
              <div className="oh-sum"><span>Tạm tính:</span><strong>{formatMoney(detail.totalAmount)}</strong></div>
              <div className="oh-sum"><span>Khuyến mãi:</span><strong>-{formatMoney(detail.discountAmount)}</strong></div>
              <div className="oh-sum oh-sum-total"><span>Số tiền cần thanh toán:</span><strong className="oh-red">{formatMoney(detail.paymentAmount)}</strong></div>
            </div>
          </div>
        </div>
      )}
      {payingOrder && (
        <PaymentModal
          order={payingOrder}
          notify={notify}
          onPaid={(paid) => { refreshOrder(paid); setPayingOrder(null); }}
          onCancelled={(cancelled) => { refreshOrder(cancelled); setPayingOrder(null); }}
          onClose={() => setPayingOrder(null)}
        />
      )}
    </div>
  );
}
