import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload, faMoneyBillWave, faQrcode, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';

// Demo: QR hiển thị được nhưng không có webhook ngân hàng,
// khách tự bấm "Tôi đã chuyển khoản" để chốt đơn.
const DEMO_BANK_CODE = 'MB';
const DEMO_BANK_NAME = 'MB Bank';
const DEMO_ACCOUNT = '0825303888';
const DEMO_ACCOUNT_NAME = 'TECHZONE';
const DEMO_BENEFICIARY = 'TECHZONE';

const TABS = [
  { value: 'COD', label: 'Tiền mặt (COD)', icon: faMoneyBillWave },
  { value: 'VIETQR', label: 'Chuyển khoản VietQR', icon: faQrcode }
];

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
  : '—';

export default function PaymentModal({ order, notify, onPaid, onCancelled, onClose }) {
  const [tab, setTab] = useState('COD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [showDl, setShowDl] = useState(false);

  const amount = Math.max(0, Math.round(Number(order?.paymentAmount || 0)));

  const qrUrl = useMemo(() => {
    if (!order?.code) return '';
    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: order.code,
      accountName: DEMO_ACCOUNT_NAME
    });
    return `https://img.vietqr.io/image/${DEMO_BANK_CODE}-${DEMO_ACCOUNT}-compact2.png?${params.toString()}`;
  }, [order, amount]);

  const transferRows = useMemo(() => ([
    { key: 'bank', label: 'Ngân hàng', value: DEMO_BANK_NAME },
    { key: 'name', label: 'Thụ hưởng', value: DEMO_BENEFICIARY },
    { key: 'account', label: 'Số tài khoản', value: DEMO_ACCOUNT, copyText: DEMO_ACCOUNT },
    { key: 'amount', label: 'Số tiền', value: formatMoney(amount), copyText: String(amount) },
    { key: 'content', label: 'Nội dung CK', value: order?.code || '', copyText: order?.code || '' }
  ]), [order, amount]);

  const confirm = async (method) => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${encodeURIComponent(order.code)}/payment`, {
        paymentMethod: method
      });
      notify?.('success', method === 'COD'
        ? `Đặt hàng thành công: ${data.code}`
        : `Thanh toán thành công: ${data.code}`);
      onPaid?.(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể thanh toán. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const cancelOrder = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/orders/${encodeURIComponent(order.code)}/cancel`);
      notify?.('success', `Đã hủy đơn hàng ${data.code}, tồn kho được hoàn lại.`);
      onCancelled?.(data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể hủy đơn. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const copy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
    }
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="ad-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose?.();
    }}>
      <div className="oh-modal">
        <div className="oh-modal-head">
          <span>Thanh toán đơn hàng #{order?.code} — {formatMoney(amount)}</span>
          <button type="button" aria-label="Đóng" onClick={onClose} disabled={saving}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="oh-modal-body">
          <div className="oh-tabs">
            {TABS.map((t) => (
              <button
                key={t.value} type="button"
                className={`oh-tab${tab === t.value ? ' active' : ''}`}
                onClick={() => { setTab(t.value); setError(''); }}
                disabled={saving}
              >
                <FontAwesomeIcon icon={t.icon} /> {t.label}
              </button>
            ))}
          </div>

          {tab === 'COD' ? (
            <>
              <div className="pm-summary">
                <div className="pm-summary-item">
                  <div className="pm-label">MÃ ĐƠN</div>
                  <div className="pm-value">#{order?.code}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">NGÀY ĐẶT</div>
                  <div className="pm-value">{formatDateTime(order?.createdAt)}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">PHƯƠNG THỨC</div>
                  <div className="pm-value">Tiền mặt (COD)</div>
                </div>
              </div>

              <div className="pm-total-box">
                <div className="pm-row"><span>Tạm tính</span><span>{formatMoney(order?.totalAmount)}</span></div>
                <div className="pm-row"><span>Khuyến mãi</span><span className="pm-discount">-{formatMoney(order?.discountAmount)}</span></div>
                <div className="pm-row pm-row-total"><span>Tổng thanh toán</span><strong>{formatMoney(amount)}</strong></div>
              </div>

              <p className="co-item-sub">
                Thanh toán <strong>{formatMoney(amount)}</strong> bằng tiền mặt
                khi nhận được hàng. Đơn sẽ được shop xác nhận và giao đi.
              </p>
            </>
          ) : (
            <>
              <div className="pm-summary">
                <div className="pm-summary-item">
                  <div className="pm-label">MÃ ĐƠN</div>
                  <div className="pm-value">#{order?.code}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">NGÀY ĐẶT</div>
                  <div className="pm-value">{formatDateTime(order?.createdAt)}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">TỔNG THANH TOÁN</div>
                  <div className="pm-value">{formatMoney(amount)}</div>
                </div>
                <div className="pm-summary-item">
                  <div className="pm-label">PHƯƠNG THỨC</div>
                  <div className="pm-value">Chuyển khoản VietQR</div>
                </div>
              </div>

              <div className="pm-paybox">
                <div className="pm-paybox-title">Thanh toán qua chuyển khoản ngân hàng</div>
                <div className="pm-paycols">
                  <div>
                    <p className="pm-way">Cách 1: Mở app ngân hàng/Ví và <strong>quét mã QR</strong></p>
                    {qrUrl && <img src={qrUrl} alt={`VietQR ${order?.code}`} className="pm-qr" />}
                    <div className="pm-center">
                      <button
                        type="button" className="pm-icon-btn" aria-label="Tải ảnh QR"
                        title="Tải ảnh QR" onClick={() => setShowDl((v) => !v)}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    </div>
                    {showDl && (
                      <div className="pm-center">
                        <a className="pm-dl-link" href={qrUrl} download={`VietQR-${order?.code}.png`}>
                          Tải ảnh QR về máy
                        </a>
                      </div>
                    )}
                    <p className="pm-status">Trạng thái: Chờ thanh toán...</p>
                  </div>
                  <div>
                    <p className="pm-way">Cách 2: Chuyển khoản <strong>thủ công</strong> theo thông tin</p>
                    <table className="pm-bank">
                      <tbody>
                        {transferRows.map((row) => (
                          <tr key={row.key}>
                            <td>{row.label}</td>
                            <td>
                              {row.value}
                              {row.copyText && (
                                copied === row.key
                                  ? <span className="pm-copied">Đã chép</span>
                                  : <button
                                    type="button" className="pm-copy" aria-label={`Chép ${row.label}`}
                                    onClick={() => copy(row.key, row.copyText)}
                                  >
                                    <FontAwesomeIcon icon={faCopy} />
                                  </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="pm-note">
                      Lưu ý: Vui lòng giữ nguyên nội dung chuyển khoản <strong>{order?.code}</strong> để
                      shop xác nhận đơn nhanh nhất.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {error && <p className="tz-alert">{error}</p>}
        </div>
        <div className="oh-modal-foot pm-foot">
          <button type="button" className="oh-detail-btn oh-btn-red" disabled={saving} onClick={cancelOrder}>
            Hủy đơn hàng
          </button>
          {tab === 'COD' ? (
            <button type="button" className="tz-btn tz-btn-dark" disabled={saving} onClick={() => confirm('COD')}>
              {saving ? 'ĐANG XỬ LÝ...' : 'Xác nhận đặt hàng (COD)'}
            </button>
          ) : (
            <button type="button" className="tz-btn tz-btn-dark" disabled={saving} onClick={() => confirm('VIETQR')}>
              {saving ? 'ĐANG XỬ LÝ...' : 'Tôi đã chuyển khoản'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
