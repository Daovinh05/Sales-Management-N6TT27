import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBagShopping, faDownload, faEye, faListUl, faLock,
  faMagnifyingGlass, faMoneyBillWave, faPen, faPhone, faEnvelope,
  faLocationDot, faReceipt, faTrash, faXmark
} from '@fortawesome/free-solid-svg-icons';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';

const STATUS_LABELS = {
  CHO_DUYET: 'Chờ duyệt',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy'
};

const STATUS_COLORS = {
  CHO_DUYET: { background: '#fef3c7', color: '#92400e' },
  DA_XAC_NHAN: { background: '#dbeafe', color: '#1d4ed8' },
  DANG_GIAO: { background: '#e0f2fe', color: '#0369a1' },
  HOAN_THANH: { background: '#dcfce7', color: '#15803d' },
  DA_HUY: { background: '#fee2e2', color: '#b91c1c' }
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} ₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(value)).replace(',', '')
  : '—';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [queries, setQueries] = useState({ code: '', customer: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [variantMap, setVariantMap] = useState({});

  const loadOrders = async (params = queries) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/orders', {
        params: {
          code: params.code.trim(),
          customer: params.customer.trim()
        }
      });
      setOrders(data);
    } catch {
      setError('Không tải được danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders({ code: '', customer: '' }); }, []);

  useEffect(() => {
    api.get('/variants').then(({ data }) => {
      const map = {};
      (Array.isArray(data) ? data : []).forEach((v) => { map[v.code] = v; });
      setVariantMap(map);
    }).catch(() => {});
  }, []);

  const openDetail = async (order) => {
    setDetailLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/orders/${encodeURIComponent(order.code)}`);
      setDetail(data);
      setPendingStatus(data.status);
    } catch {
      setError('Không tải được chi tiết đơn hàng. Vui lòng thử lại.');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (code, status) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/orders/${encodeURIComponent(code)}/status`, { status });
      setDetail(data);
      setOrders((list) => list.map((o) => (o.code === code ? { ...o, status: data.status } : o)));
      setNotice(`Đã cập nhật đơn ${code} sang "${STATUS_LABELS[status]}".`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const removeOrder = async (order) => {
    if (!window.confirm(`Xóa đơn hàng ${order.code} của ${order.customerName}?`)) return;
    setError('');
    setNotice('');
    try {
      await api.delete(`/orders/${encodeURIComponent(order.code)}`);
      setNotice(`Đã xóa đơn hàng ${order.code}.`);
      await loadOrders();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa đơn hàng.');
    }
  };

  const exportExcel = async () => {
    const rows = [
      ['STT', 'Mã ĐH', 'Khách hàng', 'Điện thoại', 'Tổng tiền', 'Khuyến mãi', 'Thanh toán', 'Trạng thái', 'Ngày tạo'],
      ...orders.map((order, index) => [
        index + 1, order.code, order.customerName, order.customerPhone || '',
        Number(order.totalAmount || 0), Number(order.discountAmount || 0),
        Number(order.paymentAmount || 0),
        STATUS_LABELS[order.status] || order.status, formatDateTime(order.createdAt)
      ])
    ];
    await writeXlsxFile(rows, { sheet: 'Don hang' }).toFile('danh-sach-don-hang.xlsx');
  };

  return (
    <div className="ad-brand-page ad-order-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faReceipt} /> Quản lý Đơn Hàng</h2>
            <p>Theo dõi và quản lý các đơn hàng trong quán.</p>
          </div>
        </div>

        <form className="ad-supplier-filter" onSubmit={(event) => {
          event.preventDefault();
          loadOrders();
        }}>
          <label>MÃ ĐƠN HÀNG
            <input value={queries.code} onChange={(event) => setQueries({ ...queries, code: event.target.value })} placeholder="Nhập mã đơn hàng..." />
          </label>
          <label>TÊN KHÁCH HÀNG
            <input value={queries.customer} onChange={(event) => setQueries({ ...queries, customer: event.target.value })} placeholder="Nhập tên khách hàng..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              const cleared = { code: '', customer: '' };
              setQueries(cleared);
              loadOrders(cleared);
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!orders.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
        {notice && <p className="ad-user-notice" role="status">{notice}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faListUl} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> <em>{loading ? 'Đang tải...' : `${orders.length} bản ghi`}</em></p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-order-table">
            <thead>
              <tr>
                <th>STT</th><th>MÃ ĐH</th><th>KHÁCH HÀNG</th><th>TỔNG TIỀN</th>
                <th>KHUYẾN MÃI</th><th>THANH TOÁN</th><th>TRẠNG THÁI</th>
                <th>NGÀY TẠO</th><th>CHI TIẾT</th><th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="10" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : orders.length ? orders.map((order, index) => {
                  const badge = STATUS_COLORS[order.status] || STATUS_COLORS.CHO_DUYET;
                  return (
                    <tr key={order.code}>
                      <td className="ad-brand-index">{index + 1}</td>
                      <td className="ad-brand-code">{order.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        {order.customerPhone && (
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            <FontAwesomeIcon icon={faPhone} /> {order.customerPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ color: '#15803d', fontWeight: 700 }}>{formatMoney(order.totalAmount)}</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>-{formatMoney(order.discountAmount)}</td>
                      <td style={{ color: '#15803d', fontWeight: 700 }}>{formatMoney(order.paymentAmount)}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '4px 10px', borderRadius: 6,
                          fontSize: 12, fontWeight: 700, ...badge
                        }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <button className="ad-button ad-button-primary" type="button" onClick={() => openDetail(order)} disabled={detailLoading}>
                          <FontAwesomeIcon icon={faEye} /><span>Xem</span>
                        </button>
                      </td>
                      <td>
                        <button className="ad-button ad-button-delete" type="button" onClick={() => removeOrder(order)}>
                          <FontAwesomeIcon icon={faTrash} /><span>Xóa</span>
                        </button>
                      </td>
                    </tr>
                  );
                }) : <tr><td colSpan="10" className="ad-table-empty">Chưa có đơn hàng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {detail && (
        <div className="ad-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDetail(null);
        }}>
          <div className="ad-brand-dialog" style={{ maxWidth: 1020, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="ad-dialog-heading">
              <h2>Đơn hàng <span style={{ color: '#4f46e5' }}>#{detail.code}</span></h2>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="ad-button ad-button-delete" type="button"
                  onClick={async () => {
                    await removeOrder(detail);
                    setDetail(null);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} /><span>Xóa</span>
                </button>
                <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDetail(null)}>
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
            </div>

            <div className="ad-order-detail-grid">
              <div className="ad-order-detail-col">
                <div className="ad-order-card ad-order-customer">
                  <div className="ad-order-avatar">
                    {(detail.customerName || '?').trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="ad-order-customer-name">{detail.customerName}</div>
                  <div className="ad-order-customer-role">Khách hàng</div>
                  <div className="ad-order-contact">
                    <div className="ad-order-contact-label">
                      <FontAwesomeIcon icon={faPhone} style={{ color: '#16a34a' }} /> SỐ ĐIỆN THOẠI
                    </div>
                    <div className="ad-order-phone">{detail.customerPhone || '—'}</div>
                  </div>
                  <div className="ad-order-contact">
                    <div className="ad-order-contact-label">
                      <FontAwesomeIcon icon={faEnvelope} style={{ color: '#dc2626' }} /> EMAIL
                    </div>
                    <div className="ad-order-email">{detail.email || '—'}</div>
                  </div>
                </div>

                <div className="ad-order-card">
                  <div className="ad-order-contact-label">CẬP NHẬT TRẠNG THÁI</div>
                  <div style={{ margin: '8px 0' }}>
                    Hiện tại:{' '}
                    <span style={{
                      display: 'inline-block', padding: '4px 10px', borderRadius: 6,
                      fontSize: 12, fontWeight: 700,
                      ...(STATUS_COLORS[detail.status] || STATUS_COLORS.CHO_DUYET)
                    }}>
                      {STATUS_LABELS[detail.status] || detail.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <select
                      value={pendingStatus} disabled={saving}
                      onChange={(event) => setPendingStatus(event.target.value)}
                      style={{
                        flex: 1, height: 38, border: '1px solid #4f46e5', borderRight: 'none',
                        borderRadius: '6px 0 0 6px', padding: '0 10px', outline: 'none',
                        font: 'inherit', fontSize: 13, fontWeight: 600, color: '#15803d', background: '#fff'
                      }}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <button
                      type="button" title="Áp dụng trạng thái" disabled={saving || pendingStatus === detail.status}
                      onClick={() => updateStatus(detail.code, pendingStatus)}
                      style={{
                        width: 44, borderRadius: '0 6px 6px 0', background: '#2563eb',
                        color: '#fff', display: 'grid', placeItems: 'center'
                      }}
                    >
                      <FontAwesomeIcon icon={faLock} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="ad-order-detail-col">
                <div className="ad-order-card">
                  <div className="ad-order-card-title ad-order-title-red">
                    <FontAwesomeIcon icon={faLocationDot} /> Địa chỉ nhận hàng
                  </div>
                  <div>{detail.shippingAddress || '—'}</div>
                </div>

                <div className="ad-order-card">
                  <div className="ad-order-card-title">
                    <FontAwesomeIcon icon={faMoneyBillWave} /> Chi tiết thanh toán
                  </div>
                  <div className="ad-order-pay-row"><span>Tạm tính:</span><span>{formatMoney(detail.totalAmount)}</span></div>
                  <div className="ad-order-pay-row"><span>Giảm giá:</span><span style={{ color: '#dc2626' }}>-{formatMoney(detail.discountAmount)}</span></div>
                  <div className="ad-order-pay-total">
                    <span>TỔNG THANH TOÁN:</span><span style={{ color: '#dc2626' }}>{formatMoney(detail.paymentAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="ad-order-detail-col">
                <div className="ad-order-card">
                  <div className="ad-order-card-title ad-order-title-yellow">
                    <FontAwesomeIcon icon={faBagShopping} /> Sản phẩm đơn hàng
                  </div>
                  {(detail.details || []).length ? detail.details.map((item, index) => {
                    const variant = variantMap[item.variantCode] || {};
                    const specs = [variant.color ? `Màu: ${variant.color}` : null,
                      variant.ram ? `Ram: ${variant.ram}` : null,
                      variant.storage || null].filter(Boolean).join(' | ');
                    const image = variant.imageUrl
                      ? (variant.imageUrl.startsWith('http') ? variant.imageUrl : `http://localhost:8080${variant.imageUrl}`)
                      : '';
                    return (
                      <div key={item.id ?? index} className="ad-order-item">
                        <div className="ad-order-thumb">
                          {image ? <img src={image} alt={item.productName} /> : <span>Err</span>}
                          <span className="ad-order-qty">x{item.quantity}</span>
                        </div>
                        <div>
                          <div className="ad-order-item-name">{item.productName || item.variantCode}</div>
                          {specs && <div className="ad-order-item-spec">{specs}</div>}
                          <div className="ad-order-item-price">Giá: {formatMoney(item.unitPrice)}</div>
                        </div>
                      </div>
                    );
                  }) : <div className="ad-table-empty">Đơn hàng chưa có dòng sản phẩm.</div>}
                </div>

                <div className="ad-order-card">
                  <div className="ad-order-card-title">
                    <FontAwesomeIcon icon={faPen} /> GHI CHÚ KHÁCH HÀNG:
                  </div>
                  <textarea readOnly value={detail.note || 'Không có ghi chú'} rows={2} style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
