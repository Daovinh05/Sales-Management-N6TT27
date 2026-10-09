import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCartShopping, faCircleCheck, faTruckFast, faClock, faMagnifyingGlass,
  faDownload, faTriangleExclamation, faListUl
} from '@fortawesome/free-solid-svg-icons';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';
import warehouseService from '../../services/warehouseService.js';
import Pagination from '../../components/admin/Pagination.jsx';

const STATUS_LABELS = {
  CHO_DUYET: 'Chờ xác nhận',
  DA_XAC_NHAN: 'Đã xác nhận',
  DANG_GIAO: 'Đang giao',
  HOAN_THANH: 'Hoàn thành',
  DA_HUY: 'Đã hủy'
};

const STATUS_COLORS = {
  CHO_DUYET: '#f59e0b',
  DA_XAC_NHAN: '#3b82f6',
  DANG_GIAO: '#06b6d4',
  HOAN_THANH: '#10b981',
  DA_HUY: '#ef4444'
};

const PAY_LABELS = {
  COD: 'Thanh toán khi nhận (COD)',
  VIETQR: 'Chuyển khoản VietQR'
};

const PAY_COLORS = { COD: '#f59e0b', VIETQR: '#8b5cf6', EMPTY: '#94a3b8' };

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date(value)).replace(',', '')
  : '—';

const toInputDate = (date) => date.toISOString().slice(0, 10);

const lastDays = (days) => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: toInputDate(from), to: toInputDate(to) };
};

// Đã thu tiền: trả VietQR, hoặc đơn hoàn thành (COD thu lúc giao).
const isPaid = (order) => order.paymentMethod === 'VIETQR' || order.status === 'HOAN_THANH';

export default function ThongKe({ notify }) {
  const init = useMemo(() => lastDays(30), []);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [code, setCode] = useState('');
  const [customer, setCustomer] = useState('');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async (fromDate, toDate, codeQuery, customerQuery) => {
    setLoading(true);
    try {
      const params = { from: fromDate, to: toDate };
      const [rev, st, top, inv, ords] = await Promise.all([
        api.get('/admin/stats/revenue-by-day', { params }).then(({ data }) => data),
        api.get('/admin/stats/orders-by-status', { params }).then(({ data }) => data),
        api.get('/admin/stats/top-products', { params: { ...params, limit: 5 } }).then(({ data }) => data),
        warehouseService.getInventory().catch(() => []),
        api.get('/orders', { params: { code: codeQuery || '', customer: customerQuery || '' } }).then(({ data }) => data)
      ]);
      setRevenue(Array.isArray(rev) ? rev : []);
      setByStatus(Array.isArray(st) ? st : []);
      setTopProducts(Array.isArray(top) ? top : []);
      setLowStock((Array.isArray(inv) ? inv : []).filter((it) => Number(it.availableQuantity ?? 0) <= 5));
      setOrders(Array.isArray(ords) ? ords : []);
    } catch {
      notify?.('error', 'Không tải được số liệu thống kê');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(init.from, init.to, '', ''); }, []);

  const applyFilter = () => {
    setPage(1);
    load(from, to, code.trim(), customer.trim());
  };

  const resetFilter = () => {
    const next = lastDays(30);
    setFrom(next.from);
    setTo(next.to);
    setCode('');
    setCustomer('');
    setPage(1);
    load(next.from, next.to, '', '');
  };

  // Lọc theo ngày phía client (API đơn hàng chưa hỗ trợ khoảng ngày).
  const detailOrders = useMemo(() => {
    const start = new Date(`${from}T00:00:00`).getTime();
    const end = new Date(`${to}T23:59:59`).getTime();
    return orders.filter((order) => {
      const time = new Date(order.createdAt).getTime();
      return Number.isFinite(time) && time >= start && time <= end;
    });
  }, [orders, from, to]);

  const statusMap = useMemo(() => {
    const map = {};
    byStatus.forEach((row) => { map[row.status] = Number(row.count || 0); });
    return map;
  }, [byStatus]);

  const statCards = [
    { icon: faCartShopping, label: 'Tổng Đơn Hàng', value: detailOrders.length, color: '#93c5fd' },
    { icon: faCircleCheck, label: 'Đơn Hoàn Thành', value: statusMap.HOAN_THANH || 0, color: '#4ade80' },
    { icon: faTruckFast, label: 'Đang Giao', value: statusMap.DANG_GIAO || 0, color: '#60a5fa' },
    { icon: faClock, label: 'Chờ Duyệt', value: statusMap.CHO_DUYET || 0, color: '#fbbf24' }
  ];

  const payStats = useMemo(() => {
    const groups = {};
    detailOrders.forEach((order) => {
      const key = order.paymentMethod || 'EMPTY';
      if (!groups[key]) groups[key] = { count: 0, amount: 0 };
      groups[key].count += 1;
      groups[key].amount += Number(order.paymentAmount || 0);
    });
    return Object.entries(groups).map(([key, value]) => ({
      key,
      label: PAY_LABELS[key] || 'Chưa chọn phương thức',
      color: PAY_COLORS[key] || '#94a3b8',
      ...value
    }));
  }, [detailOrders]);

  const maxRevenue = useMemo(() => Math.max(1, ...revenue.map((r) => Number(r.revenue || 0))), [revenue]);
  const totalStatus = useMemo(() => byStatus.reduce((s, r) => s + Number(r.count || 0), 0), [byStatus]);

  const donut = useMemo(() => {
    if (!totalStatus) return '';
    let acc = 0;
    const parts = byStatus.map((row) => {
      const start = (acc / totalStatus) * 360;
      acc += Number(row.count || 0);
      const end = (acc / totalStatus) * 360;
      return `${STATUS_COLORS[row.status] || '#94a3b8'} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  }, [byStatus, totalStatus]);

  const pageCount = Math.max(1, Math.ceil(detailOrders.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageOrders = detailOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

  const exportExcel = async () => {
    const rows = [
      ['Mã ĐH', 'Khách hàng', 'Điện thoại', 'Ngày tạo', 'Trạng thái', 'Phương thức', 'Trạng thái TT', 'Tổng tiền', 'Khuyến mãi', 'Thanh toán'],
      ...detailOrders.map((order) => [
        order.code, order.customerName, order.customerPhone || '',
        formatDateTime(order.createdAt),
        STATUS_LABELS[order.status] || order.status,
        PAY_LABELS[order.paymentMethod] || 'Chưa chọn',
        isPaid(order) ? 'Đã thanh toán' : 'Chưa thanh toán',
        Number(order.totalAmount || 0), Number(order.discountAmount || 0),
        isPaid(order) ? Number(order.paymentAmount || 0) : 0
      ])
    ];
    await writeXlsxFile(rows, { sheet: 'Thong ke' }).toFile('thong-ke-don-hang.xlsx');
  };

  return (
    <div className="ad-brand-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2>Thống Kê</h2>
            <p>Theo dõi và phân tích cửa hàng điện thoại.</p>
          </div>
        </div>

        <div className="tk-stats">
          {statCards.map((card) => (
            <div key={card.label} className="tk-stat">
              <FontAwesomeIcon icon={card.icon} style={{ color: card.color }} />
              <div className="tk-stat-value">{loading ? '...' : card.value}</div>
              <div className="tk-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="tk-filters">
          <label>TỪ NGÀY
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>ĐẾN NGÀY
            <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>MÃ ĐƠN HÀNG
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Nhập mã đơn hàng..." />
          </label>
          <label>TÊN KHÁCH HÀNG
            <input value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nhập tên khách hàng..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="button" onClick={applyFilter} disabled={loading}>
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Lọc
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={resetFilter}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!detailOrders.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </div>
      </section>

      <div className="tk-grid">
        <section className="ad-brand-panel">
          <h2 className="tk-title">Thống Kê Theo Phương Thức Thanh Toán</h2>
          {loading ? <div className="ad-table-empty">Đang tải...</div> : !payStats.length ? (
            <div className="ad-table-empty">Chưa có đơn hàng trong kỳ.</div>
          ) : payStats.map((row) => (
            <div key={row.key} className="tk-pay-row">
              <span className="tk-dot" style={{ background: row.color }} />
              <span>{row.label}</span>
              <span className="tk-pay-count" style={{ background: `${row.color}22`, color: row.color }}>
                {row.count} đơn
              </span>
              <strong className="tk-pay-amount">{formatMoney(row.amount)}</strong>
            </div>
          ))}
        </section>

        <section className="ad-brand-panel">
          <h2 className="tk-title">Top Sản Phẩm Bán Chạy</h2>
          {loading ? <div className="ad-table-empty">Đang tải...</div> : !topProducts.length ? (
            <div className="ad-table-empty">Chưa có đơn hoàn thành trong kỳ.</div>
          ) : topProducts.map((item, index) => (
            <div key={`${item.variantCode}-${index}`} className="tk-rank-row">
              <span className="tk-rank">{index + 1}. {item.productName || item.variantCode}</span>
              <span>{item.quantity} cái <strong className="tk-pay-amount">{formatMoney(item.revenue)}</strong></span>
            </div>
          ))}
        </section>
      </div>

      <section className="ad-brand-panel">
        <h2 className="tk-title">Doanh thu theo ngày</h2>
        {loading ? <div className="ad-table-empty">Đang tải...</div> : (
          <div className="tk-bars">
            {revenue.map((point, index) => {
              const value = Number(point.revenue || 0);
              const showLabel = revenue.length <= 14 || index % Math.ceil(revenue.length / 14) === 0;
              return (
                <div key={point.date} className="tk-bar" title={`${point.date}: ${formatMoney(value)} (${point.orders} đơn)`}>
                  <div className="tk-bar-fill" style={{ height: `${Math.max(2, (value / maxRevenue) * 100)}%` }} />
                  <div className="tk-bar-label">{showLabel ? point.date.slice(5) : ''}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="tk-grid">
        <section className="ad-brand-panel">
          <h2 className="tk-title">Đơn hàng theo trạng thái</h2>
          {loading ? <div className="ad-table-empty">Đang tải...</div> : totalStatus === 0 ? (
            <div className="ad-table-empty">Chưa có đơn hàng trong kỳ.</div>
          ) : (
            <div className="tk-donut-row">
              <div className="tk-donut" style={{ background: donut }}>
                <div className="tk-donut-center">
                  <strong>{totalStatus}</strong>
                  <span>đơn</span>
                </div>
              </div>
              <ul className="tk-legend">
                {byStatus.map((row) => (
                  <li key={row.status}>
                    <span className="tk-dot" style={{ background: STATUS_COLORS[row.status] || '#94a3b8' }} />
                    {STATUS_LABELS[row.status] || row.status}
                    <strong>{row.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="ad-brand-panel">
          <h2 className="tk-title">
            <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: '#d97706' }} /> Tồn kho thấp (còn ≤ 5)
          </h2>
          {loading ? <div className="ad-table-empty">Đang tải...</div> : !lowStock.length ? (
            <div className="ad-table-empty">Tồn kho ổn định, không có mặt hàng sắp hết.</div>
          ) : (
            <div className="ad-table-wrap">
              <table className="ad-brand-table">
                <thead><tr><th>MÃ BIẾN THỂ</th><th>SẢN PHẨM</th><th>BÁN ĐƯỢC</th></tr></thead>
                <tbody>
                  {lowStock.map((item) => (
                    <tr key={item.variantCode}>
                      <td className="ad-brand-code">{item.variantCode}</td>
                      <td>{item.name}</td>
                      <td style={{ color: '#b45309', fontWeight: 700 }}>{item.availableQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="ad-brand-panel ad-brand-list">
        <h2 className="tk-title"><FontAwesomeIcon icon={faListUl} /> Thống Kê Đơn Hàng Chi Tiết</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${detailOrders.length} đơn hàng`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table">
            <thead><tr><th>MÃ ĐH</th><th>KHÁCH HÀNG</th><th>NGÀY TẠO</th><th>TRẠNG THÁI</th><th>PHƯƠNG THỨC TT</th><th>TRẠNG THÁI TT</th><th>TỔNG TIỀN</th><th>KHUYẾN MÃI</th><th>THANH TOÁN</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="9" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageOrders.length ? pageOrders.map((order) => {
                  const paid = isPaid(order);
                  return (
                    <tr key={order.code}>
                      <td className="ad-brand-code">{order.code}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{order.customerPhone}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(order.createdAt)}</td>
                      <td>
                        <span className="oh-badge" style={{ background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] || '#475569' }}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        <span className="oh-badge" style={order.paymentMethod === 'COD'
                          ? { background: '#ffedd5', color: '#9a3412' }
                          : order.paymentMethod === 'VIETQR'
                            ? { background: '#ede9fe', color: '#6d28d9' }
                            : { background: '#f1f5f9', color: '#475569' }}>
                          {order.paymentMethod === 'COD' ? 'cod' : order.paymentMethod === 'VIETQR' ? 'vietqr' : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="oh-badge" style={paid
                          ? { background: '#dcfce7', color: '#15803d' }
                          : { background: '#fef3c7', color: '#92400e' }}>
                          {paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td style={{ color: '#15803d', fontWeight: 700 }}>{formatMoney(order.totalAmount)}</td>
                      <td style={{ color: '#dc2626', fontWeight: 700 }}>-{formatMoney(order.discountAmount)}</td>
                      <td style={{ color: '#15803d', fontWeight: 700 }}>{formatMoney(paid ? order.paymentAmount : 0)}</td>
                    </tr>
                  );
                }) : <tr><td colSpan="9" className="ad-table-empty">Chưa có đơn hàng phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination
          page={safePage} pageSize={pageSize} total={detailOrders.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={applyFilter}
        />
      </section>
    </div>
  );
}
