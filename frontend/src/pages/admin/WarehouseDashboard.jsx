import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faUsers, faFileInvoice, faEye, faXmark, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import warehouseAdminService from '../../services/warehouseAdminService.js';

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

export default function WarehouseDashboard() {
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States
  const [warehouseInfo, setWarehouseInfo] = useState(null);
  const [staffs, setStaffs] = useState([]);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'info') loadWarehouseInfo();
    else if (activeTab === 'staff') loadStaffs();
    else if (activeTab === 'history') loadHistory(0);
  }, [activeTab]);

  const loadWarehouseInfo = async () => {
    setLoading(true);
    try {
      const data = await warehouseAdminService.getWarehouseConfig(1);
      setWarehouseInfo(data);
    } catch (err) {
      setError('Lỗi tải thông tin kho.');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffs = async () => {
    setLoading(true);
    try {
      const data = await warehouseAdminService.getWarehouseStaffs();
      setStaffs(data);
    } catch (err) {
      setError('Lỗi tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (pageNo) => {
    setLoading(true);
    try {
      const data = await warehouseAdminService.getImportHistory(pageNo, 10);
      setHistory(data.content);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Lỗi tải lịch sử nhập kho.');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (id) => {
    setDetailLoading(true);
    setSelectedReceipt({ id, loading: true }); // temporary open modal
    try {
      const data = await warehouseAdminService.getImportDetail(id);
      setSelectedReceipt(data);
    } catch (err) {
      alert('Không thể tải chi tiết phiếu nhập.');
      setSelectedReceipt(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="ad-brand-page">
      <div className="ad-brand-panel" style={{ marginBottom: '20px', padding: '15px 25px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            className={`ad-button ${activeTab === 'info' ? 'ad-button-primary' : 'ad-button-quiet'}`}
            onClick={() => setActiveTab('info')}
          >
            <FontAwesomeIcon icon={faWarehouse} style={{ marginRight: '8px' }}/> Thông tin kho
          </button>
          <button 
            className={`ad-button ${activeTab === 'staff' ? 'ad-button-primary' : 'ad-button-quiet'}`}
            onClick={() => setActiveTab('staff')}
          >
            <FontAwesomeIcon icon={faUsers} style={{ marginRight: '8px' }}/> Nhân sự kho
          </button>
          <button 
            className={`ad-button ${activeTab === 'history' ? 'ad-button-primary' : 'ad-button-quiet'}`}
            onClick={() => setActiveTab('history')}
          >
            <FontAwesomeIcon icon={faFileInvoice} style={{ marginRight: '8px' }}/> Lịch sử nhập kho
          </button>
        </div>
      </div>

      {error && <p className="ad-brand-message" role="alert" style={{ marginBottom: '15px' }}>{error}</p>}

      {/* TAB: THÔNG TIN KHO */}
      {activeTab === 'info' && (
        <section className="ad-brand-panel">
          <h2><FontAwesomeIcon icon={faWarehouse} /> Cấu hình kho tổng</h2>
          {loading ? <p>Đang tải...</p> : warehouseInfo ? (
            <div style={{ marginTop: '20px', lineHeight: '1.8' }}>
              <p><strong>Mã kho:</strong> {warehouseInfo.id}</p>
              <p><strong>Tên kho:</strong> {warehouseInfo.name}</p>
              <p><strong>Địa chỉ:</strong> {warehouseInfo.address}</p>
              <p><strong>Số điện thoại:</strong> {warehouseInfo.phone}</p>
              <p><strong>Trạng thái:</strong> {warehouseInfo.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}</p>
              <p><strong>Ngày tạo:</strong> {formatDate(warehouseInfo.createdAt)}</p>
            </div>
          ) : <p>Không có thông tin kho.</p>}
        </section>
      )}

      {/* TAB: NHÂN SỰ KHO */}
      {activeTab === 'staff' && (
        <section className="ad-brand-panel ad-brand-list">
          <h2><FontAwesomeIcon icon={faUsers} /> Danh sách nhân sự kho</h2>
          <div className="ad-table-wrap" style={{ marginTop: '15px' }}>
            <table className="ad-brand-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TÀI KHOẢN</th>
                  <th>HỌ TÊN</th>
                  <th>EMAIL</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="ad-table-empty">Đang tải...</td></tr> :
                 staffs.length === 0 ? <tr><td colSpan="5" className="ad-table-empty">Chưa có nhân sự nào.</td></tr> :
                 staffs.map(staff => (
                   <tr key={staff.id}>
                     <td>{staff.id}</td>
                     <td>{staff.username}</td>
                     <td>{staff.fullName}</td>
                     <td>{staff.email}</td>
                     <td>{staff.phone}</td>
                   </tr>
                 ))
                }
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB: LỊCH SỬ NHẬP KHO */}
      {activeTab === 'history' && (
        <section className="ad-brand-panel ad-brand-list">
          <h2><FontAwesomeIcon icon={faFileInvoice} /> Lịch sử phiếu nhập</h2>
          <div className="ad-table-wrap" style={{ marginTop: '15px' }}>
            <table className="ad-brand-table">
              <thead>
                <tr>
                  <th>MÃ PHIẾU</th>
                  <th>NGƯỜI TẠO</th>
                  <th>NHÀ CUNG CẤP</th>
                  <th>TỔNG TIỀN</th>
                  <th>NGÀY TẠO</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="6" className="ad-table-empty">Đang tải...</td></tr> :
                 history.length === 0 ? <tr><td colSpan="6" className="ad-table-empty">Chưa có phiếu nhập nào.</td></tr> :
                 history.map(receipt => (
                   <tr key={receipt.id}>
                     <td>#{receipt.id}</td>
                     <td>{receipt.createdByName}</td>
                     <td>{receipt.supplierName}</td>
                     <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{formatCurrency(receipt.totalAmount)}</td>
                     <td>{formatDate(receipt.createdAt)}</td>
                     <td>
                       <button className="ad-button ad-button-quiet" onClick={() => viewDetail(receipt.id)}>
                         <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                       </button>
                     </td>
                   </tr>
                 ))
                }
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
              <button className="ad-button ad-button-quiet" disabled={page === 0} onClick={() => loadHistory(page - 1)}>
                <FontAwesomeIcon icon={faChevronLeft} /> Trước
              </button>
              <span style={{ display: 'flex', alignItems: 'center' }}>Trang {page + 1} / {totalPages}</span>
              <button className="ad-button ad-button-quiet" disabled={page === totalPages - 1} onClick={() => loadHistory(page + 1)}>
                Sau <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* MODAL CHI TIẾT PHIẾU NHẬP */}
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
              {selectedReceipt.loading ? <p>Đang tải dữ liệu...</p> : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                    <div>
                      <p><strong>Người tạo:</strong> {selectedReceipt.createdByName}</p>
                      <p><strong>Ngày nhập:</strong> {formatDate(selectedReceipt.createdAt)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p><strong>Nhà cung cấp:</strong> {selectedReceipt.supplierName}</p>
                      <p><strong>Tổng tiền:</strong> <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{formatCurrency(selectedReceipt.totalAmount)}</span></p>
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
                      {selectedReceipt.details?.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.variantCode}</td>
                          <td>{item.variantName}</td>
                          <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td style={{ fontWeight: 'bold' }}>{formatCurrency(item.subTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
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
