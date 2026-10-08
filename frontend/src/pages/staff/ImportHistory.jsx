import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faEye, faXmark, faUsers, faWarehouse } from '@fortawesome/free-solid-svg-icons';
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
          <div className="ad-brand-dialog" style={{ maxWidth: '850px', width: '95%' }}>
            <div className="ad-dialog-heading">
              <div className="ad-title" style={{ fontSize: '18px' }}>Chi tiết phiếu nhập #{selectedReceipt.id}</div>
              <button className="ad-icon-button" type="button" onClick={() => setSelectedReceipt(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            
            <div style={{ maxHeight: '75vh', overflowY: 'auto', padding: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px dashed #d8e2ef' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Người tạo:</span> <span style={{ fontWeight: 600 }}>{selectedReceipt.createdByName}</span></div>
                  <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Ngày tạo phiếu:</span> <span style={{ fontWeight: 600 }}>{formatDate(selectedReceipt.createdAt)}</span></div>
                  <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Ghi chú:</span> <span style={{ fontStyle: selectedReceipt.note ? 'normal' : 'italic', color: selectedReceipt.note ? 'inherit' : '#94a3b8' }}>{selectedReceipt.note || 'Không có ghi chú'}</span></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Nhà cung cấp:</span> <span style={{ fontWeight: 600 }}>{selectedReceipt.supplierName}</span></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Trạng thái:</span> <span>{getStatusBadge(selectedReceipt.status)}</span></div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><span style={{ color: '#64748b', minWidth: '110px' }}>Tổng tiền:</span> <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '18px' }}>{formatCurrency(selectedReceipt.totalAmount)}</span></div>
                </div>
              </div>

              <div className="ad-table-wrap">
                <table className="ad-brand-table">
                  <thead>
                    <tr>
                      <th>MÃ SP</th>
                      <th>TÊN SẢN PHẨM</th>
                      <th style={{ textAlign: 'center' }}>SỐ LƯỢNG</th>
                      <th style={{ textAlign: 'right' }}>ĐƠN GIÁ</th>
                      <th style={{ textAlign: 'right' }}>THÀNH TIỀN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedReceipt.details || []).length > 0 ? selectedReceipt.details.map((item, idx) => (
                      <tr key={idx}>
                        <td className="ad-brand-code">{item.variantCode}</td>
                        <td style={{ fontWeight: 500 }}>{item.variantName}</td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(item.subTotal || item.quantity * item.unitPrice)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="ad-table-empty">Không có sản phẩm nào.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="ad-dialog-actions" style={{ paddingTop: '16px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ad-button ad-button-blue" type="button" onClick={() => setSelectedReceipt(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
