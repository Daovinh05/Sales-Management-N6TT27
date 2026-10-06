import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faUsers, faFileInvoice, faEye, faXmark, faChevronLeft, faChevronRight, faPen } from '@fortawesome/free-solid-svg-icons';
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

const getStatusBadge = (status) => {
  const styles = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em', fontWeight: 'bold', display: 'inline-block' };
  if (status === 'PENDING') return <span style={{ ...styles, backgroundColor: '#fff3cd', color: '#856404' }}>Chờ duyệt</span>;
  if (status === 'APPROVED') return <span style={{ ...styles, backgroundColor: '#d4edda', color: '#155724' }}>Đã duyệt</span>;
  if (status === 'REJECTED') return <span style={{ ...styles, backgroundColor: '#f8d7da', color: '#721c24' }}>Từ chối</span>;
  return <span>{status}</span>;
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);

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

  const handleUpdateStatus = async (status) => {
    try {
      await warehouseAdminService.updateImportStatus(selectedReceipt.id, status);
      alert(`Đã ${status === 'APPROVED' ? 'duyệt' : 'từ chối'} phiếu nhập thành công!`);
      loadHistory(page);
      setSelectedReceipt(null);
    } catch (err) {
      alert(err?.response?.data?.message || 'Lỗi cập nhật trạng thái phiếu nhập');
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
        <section className="ad-brand-panel ad-brand-list">
          <h2><FontAwesomeIcon icon={faWarehouse} /> Thông tin kho</h2>
          <div className="ad-table-wrap" style={{ marginTop: '15px' }}>
            <table className="ad-brand-table">
              <thead>
                <tr>
                  <th>MÃ KHO</th>
                  <th>TÊN KHO</th>
                  <th>ĐỊA CHỈ</th>
                  <th>SỐ ĐIỆN THOẠI</th>
                  <th>TRẠNG THÁI</th>
                  <th>NGÀY TẠO</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="7" className="ad-table-empty">Đang tải...</td></tr> : warehouseInfo ? (
                  <tr>
                    <td>{warehouseInfo.id}</td>
                    <td>{warehouseInfo.name}</td>
                    <td>{warehouseInfo.address}</td>
                    <td>{warehouseInfo.phone}</td>
                    <td>{warehouseInfo.status === 'ACTIVE' ? <span className="ad-badge ad-badge-success">Đang hoạt động</span> : <span className="ad-badge ad-badge-danger">Tạm dừng</span>}</td>
                    <td>{formatDate(warehouseInfo.createdAt)}</td>
                    <td>
                      <button className="ad-button ad-button-quiet" onClick={() => {
                        setEditForm({ name: warehouseInfo.name, address: warehouseInfo.address, phone: warehouseInfo.phone });
                        setIsEditModalOpen(true);
                      }}>
                        <FontAwesomeIcon icon={faPen} /> Sửa
                      </button>
                    </td>
                  </tr>
                ) : <tr><td colSpan="7" className="ad-table-empty">Không có thông tin kho.</td></tr>}
              </tbody>
            </table>
          </div>
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
                  <th>TRẠNG THÁI</th>
                  <th>NGÀY TẠO</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="7" className="ad-table-empty">Đang tải...</td></tr> :
                 history.length === 0 ? <tr><td colSpan="7" className="ad-table-empty">Chưa có phiếu nhập nào.</td></tr> :
                 history.map(receipt => (
                   <tr key={receipt.id}>
                     <td>#{receipt.id}</td>
                     <td>{receipt.createdByName}</td>
                     <td>{receipt.supplierName}</td>
                     <td style={{ color: '#d32f2f', fontWeight: 'bold' }}>{formatCurrency(receipt.totalAmount)}</td>
                     <td>{getStatusBadge(receipt.status)}</td>
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
                      <p><strong>Trạng thái:</strong> {getStatusBadge(selectedReceipt.status)}</p>
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

            <div className="ad-dialog-actions" style={{ padding: '15px 20px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedReceipt && !selectedReceipt.loading && selectedReceipt.status === 'PENDING' && (
                <>
                  <button className="ad-button ad-button-primary" style={{ backgroundColor: '#28a745', borderColor: '#28a745' }} type="button" onClick={() => handleUpdateStatus('APPROVED')}>
                    Duyệt phiếu
                  </button>
                  <button className="ad-button ad-button-primary" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }} type="button" onClick={() => handleUpdateStatus('REJECTED')}>
                    Từ chối
                  </button>
                </>
              )}
              <button className="ad-button ad-button-quiet" type="button" onClick={() => setSelectedReceipt(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA KHO */}
      {isEditModalOpen && (
        <div className="ad-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditModalOpen(false); }}>
          <div className="ad-brand-dialog">
            <div className="ad-dialog-heading">
              <h2>Sửa thông tin kho</h2>
              <button className="ad-icon-button" type="button" onClick={() => setIsEditModalOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setEditLoading(true);
              try {
                await warehouseAdminService.updateWarehouse(warehouseInfo.id, editForm);
                alert('Cập nhật thông tin kho thành công!');
                setIsEditModalOpen(false);
                loadWarehouseInfo();
              } catch (err) {
                alert(err?.response?.data?.message || 'Lỗi cập nhật thông tin kho');
              } finally {
                setEditLoading(false);
              }
            }}>
              <div className="ad-dialog-content">
                <div className="ad-form-group">
                  <label>Tên kho <span style={{color: 'red'}}>*</span></label>
                  <input type="text" className="ad-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                <div className="ad-form-group">
                  <label>Địa chỉ</label>
                  <input type="text" className="ad-input" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="ad-form-group">
                  <label>Số điện thoại <span style={{color: 'red'}}>*</span></label>
                  <input type="text" className="ad-input" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} required pattern="^(0|\\+84)[0-9]{9,10}$" title="Số điện thoại không hợp lệ" />
                </div>
              </div>
              <div className="ad-dialog-actions">
                <button className="ad-button ad-button-quiet" type="button" onClick={() => setIsEditModalOpen(false)} disabled={editLoading}>Hủy</button>
                <button className="ad-button ad-button-primary" type="submit" disabled={editLoading}>
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
