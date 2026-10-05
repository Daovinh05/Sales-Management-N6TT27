import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';

const STATUS_LABELS = {
  CHO_DUYET: 'Chờ duyệt',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy'
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(value)).replace(',', '')
  : '—';

export default function OrderHistory({ notify, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => {
      setOrders(Array.isArray(data) ? data : []);
    }).catch(() => {
      notify?.('error', 'Không tải được lịch sử đơn hàng');
    }).finally(() => setLoading(false));
  }, [notify]);

  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Lịch sử đơn hàng</div>
        <button className="kh-detail-back" onClick={onBack}>
          <FontAwesomeIcon icon={faChevronLeft} /> Tiếp tục mua sắm
        </button>
        <h2 className="kh-detail-title">Lịch sử đơn hàng</h2>
        {loading ? <div className="kh-count">Đang tải...</div>
          : !orders.length ? <div className="kh-count">Bạn chưa có đơn hàng nào.</div>
            : (
              <div className="co-history">
                {orders.map((o) => (
                  <div key={o.code} className="co-history-row">
                    <div>
                      <div className="co-history-code">#{o.code}</div>
                      <div className="co-item-sub">{formatDateTime(o.createdAt)}</div>
                    </div>
                    <div className="co-history-status">{STATUS_LABELS[o.status] || o.status}</div>
                    <div className="co-item-total">{formatMoney(o.paymentAmount)}</div>
                  </div>
                ))}
              </div>
            )}
      </div>
    </div>
  );
}
