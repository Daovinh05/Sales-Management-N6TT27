import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faEye, faXmark } from '@fortawesome/free-solid-svg-icons';
import warehouseStaffService from '../../services/warehouseStaffService.js';

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short'
  }).format(new Date(value));
};

const formatCurrency = (amount) => {
  if (amount == null) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND'
  }).format(amount);
};

const getStatusBadge = (status) => {
  const styles = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold', display: 'inline-block' };
  if (status === 'PENDING') return <span style={{ ...styles, backgroundColor: '#fff3cd', color: '#856404' }}>Chờ duyệt</span>;
  if (status === 'APPROVED') return <span style={{ ...styles, backgroundColor: '#d4edda', color: '#155724' }}>Đã duyệt</span>;
  if (status === 'REJECTED') return <span style={{ ...styles, backgroundColor: '#f8d7da', color: '#721c24' }}>Từ chối</span>;
  return <span>{status}</span>;
};

export default function ImportHistory({ notify }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await warehouseStaffService.getMyImports();
      setHistory(Array.isArray(data) ? data : data.content || []);
    } catch (err) {
      setError('Lỗi tải lịch sử nhập kho.');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (receipt) => {
    setSelectedReceipt(receipt);
    try {
      const detailData = await warehouseStaffService.getImportDetail(receipt.id);
      setSelectedReceipt(detailData);
    } catch (err) {
      if (notify) notify('error', 'Lỗi tải chi tiết phiếu nhập');
    }
  };

  return (
    <div className="ad-brand-page">
      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faFileInvoice} /> Lịch sử phiếu nhập của tôi</h2>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
        
        <div className="ad-table-wrap" style={{ marginTop: '15px' }}>
          <table className="ad-brand-table">
            <thead>
              <tr>
                <th>MÃ PHIẾU</th>
                <th>NHÀ CUNG CẤP</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY TẠO</th>
                <th>GHI CHÚ</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="7" className="ad-table-empty">Đang tải...</td></tr> :
               history.length === 0 ? <tr><td colSpan="7" className="ad-table-empty">Bạn chưa có phiếu nhập nào.</td></tr> :
               history.map(receipt => (
                 <tr key={receipt.id}>
                   <td>#{receipt.id}</td>
                   <td>{receipt.supplierName}</td>
                   <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{formatCurrency(receipt.totalAmount)}</td>
                   <td>{getStatusBadge(receipt.status)}</td>
                   <td>{formatDate(receipt.createdAt)}</td>
                   <td>{receipt.note || '—'}</td>
                   <td>
                     <button className="ad-button ad-button-quiet" onClick={() => viewDetail(receipt)}>
                       <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                     </button>
                   </td>
                 </tr>
               ))
              }
            </tbody>
          </table>
        </div>
      </section>

      {selectedReceipt && (
        <div className="ad-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedReceipt(null); }}>
          <div className="ad-brand-dialog" style={{ maxWidth: '700px', width: '90%' }}>
            <div className="ad-dialog-heading">
              <h2>Chi tiết phiếu nhập #{selectedReceipt.id}</h2>
              <button className="ad-icon-button" type="button" onClick={() => setSelectedReceipt(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            
            <div style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                <div>
                  <p><strong>Người tạo:</strong> {selectedReceipt.createdByName}</p>
                  <p><strong>Ngày nhập:</strong> {formatDate(selectedReceipt.createdAt)}</p>
                  <p><strong>Ghi chú:</strong> {selectedReceipt.note || 'Không có'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Trạng thái:</strong> {getStatusBadge(selectedReceipt.status)}</p>
                  <p><strong>Nhà cung cấp:</strong> {selectedReceipt.supplierName}</p>
                  <p><strong>Tổng tiền:</strong> <span style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: '1.2em' }}>{formatCurrency(selectedReceipt.totalAmount)}</span></p>
                </div>
              </div>

              <table className="ad-brand-table">
                <thead>
                  <tr>
                    <th>MÃ SẢN PHẨM</th>
                    <th>TÊN SẢN PHẨM</th>
                    <th>SỐ LƯỢNG</th>
                    <th>ĐƠN GIÁ</th>
                    <th>THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedReceipt.details || []).map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.variantCode}</td>
                      <td>{item.variantName}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ fontWeight: 'bold' }}>{formatCurrency(item.subTotal || (item.quantity * item.unitPrice))}</td>
                    </tr>
                  ))}
                  {(!selectedReceipt.details || selectedReceipt.details.length === 0) && (
                    <tr>
                      <td colSpan="5" className="ad-table-empty">Không có chi tiết sản phẩm.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="ad-dialog-actions" style={{ padding: '15px 20px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ad-button ad-button-primary" type="button" onClick={() => setSelectedReceipt(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
