import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
  : '—';

const paymentLabel = (order) => {
  if (order?.paymentMethod === 'COD') return order?.status === 'HOAN_THANH' ? 'Tiền mặt (COD, đã thu)' : 'Tiền mặt (COD)';
  if (order?.paymentMethod === 'VIETQR') return order?.paid ? 'VietQR (đã thanh toán)' : 'VietQR (chờ thanh toán)';
  return 'Chưa chọn';
};

const resolveImage = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const root = (api.defaults.baseURL || '').replace(/\/api$/, '');
  return `${root}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function OrderSuccess({ code, order, onHome, onHistory }) {
  const [data, setData] = useState(order || null);
  const [variantMap, setVariantMap] = useState({});
  const [loading, setLoading] = useState(!order && !!code);

  // F5 giữa trang success: tải lại chi tiết theo mã đơn.
  useEffect(() => {
    setData(order || null);
    setLoading(!order && !!code);
    if (order || !code) return;
    api.get(`/orders/${encodeURIComponent(code)}/detail`)
      .then(({ data: fetched }) => setData(fetched))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [order, code]);

  useEffect(() => {
    api.get('/variants').then(({ data: list }) => {
      const map = {};
      (Array.isArray(list) ? list : []).forEach((v) => { map[v.code] = v; });
      setVariantMap(map);
    }).catch(() => {});
  }, []);

  const variantLine = (item) => {
    const variant = (item.variantCode && variantMap[item.variantCode]) || {};
    const parts = [variant.ram, variant.storage, variant.color].filter(Boolean);
    if (parts.length) return `Biến thể: ${parts.join('/')}`;
    return '';
  };

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Thanh toán thành công</div>
        <div className="co-success">
          <div className="co-success-head">
            <FontAwesomeIcon icon={faCircleCheck} className="co-success-icon" />
            <h2>Đặt hàng thành công!</h2>
            <p>Cảm ơn bạn đã đặt hàng tại cửa hàng chúng tôi.</p>
            <p>Mã đơn hàng của bạn là: <strong>{data?.code || code}</strong></p>
          </div>
          {loading && <p>Đang tải chi tiết đơn...</p>}
          {data && (
            <>
              <div className="pm-summary">
                <div className="pm-summary-item">
                  <div className="pm-label">NGÀY ĐẶT</div>
                  <div className="pm-value">{formatDateTime(data.createdAt)}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">PHƯƠNG THỨC</div>
                  <div className="pm-value">{paymentLabel(data)}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">NGƯỜI NHẬN</div>
                  <div className="pm-value">{data.customerName || '—'}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">ĐỊA CHỈ</div>
                  <div className="pm-value">{data.shippingAddress || '—'}</div>
                </div>
              </div>
              <table className="oh-table">
                <thead><tr><th>HÌNH ẢNH</th><th>Sản phẩm</th><th>Đơn giá</th><th>Số lượng</th><th>Tổng tiền</th></tr></thead>
                <tbody>
                  {(data.details || []).map((item, index) => {
                    const image = resolveImage((item.variantCode && variantMap[item.variantCode]?.imageUrl) || '');
                    return (
                      <tr key={item.id ?? index}>
                        <td><div className="oh-thumb oh-thumb-sm">{image ? <img src={image} alt={item.productName} /> : <span>—</span>}</div></td>
                        <td>
                          <div>{item.productName}</div>
                          {variantLine(item) && <div className="oh-item-sub">{variantLine(item)}</div>}
                        </td>
                        <td>{formatMoney(item.unitPrice)}</td>
                        <td>{item.quantity}</td>
                        <td className="oh-blue">{formatMoney(Number(item.unitPrice || 0) * Number(item.quantity || 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="pm-total-box">
                <div className="pm-row"><span>Tạm tính</span><span>{formatMoney(data.totalAmount)}</span></div>
                <div className="pm-row"><span>Khuyến mãi</span><span className="pm-discount">-{formatMoney(data.discountAmount)}</span></div>
                <div className="pm-row pm-row-total"><span>Tổng thanh toán</span><strong>{formatMoney(data.paymentAmount)}</strong></div>
              </div>
            </>
          )}
          <p className="co-success-note">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
          <div className="co-success-actions">
            <button className="co-outline-btn" type="button" onClick={onHome}>Tiếp tục mua sắm</button>
            <button className="co-outline-btn" type="button" onClick={onHistory}>Xem lịch sử đơn hàng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
