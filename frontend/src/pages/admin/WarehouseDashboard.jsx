import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWarehouse, faUsers, faFileInvoice, faEye, faXmark, faChevronLeft, faChevronRight, faPen, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import warehouseAdminService from '../../services/warehouseAdminService.js';
import Pagination from '../../components/admin/Pagination.jsx';

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
  const [staffQueries, setStaffQueries] = useState({ name: '', email: '' });
  const [staffFilters, setStaffFilters] = useState({ name: '', email: '' });
  const [staffPage, setStaffPage] = useState(1);
  const [staffPageSize, setStaffPageSize] = useState(10);
  const [staffTotal, setStaffTotal] = useState(0);

  const [history, setHistory] = useState([]);
  const [historyQueries, setHistoryQueries] = useState({ createdBy: '', supplierName: '', status: 'ALL', productKeyword: '' });
  const [historyFilters, setHistoryFilters] = useState({ createdBy: '', supplierName: '', status: 'ALL', productKeyword: '' });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', address: '', phone: '' });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'info') loadWarehouseInfo();
    else if (activeTab === 'staff') loadStaffs();
    else if (activeTab === 'history') loadHistory();
  }, [activeTab, staffPage, staffPageSize, staffFilters, historyPage, historyPageSize, historyFilters]);

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
      const data = await warehouseAdminService.getWarehouseStaffs(staffPage - 1, staffPageSize, staffFilters.name, staffFilters.email);
      setStaffs(data.content);
      setStaffTotal(data.totalElements);
    } catch (err) {
      setError('Lỗi tải danh sách nhân sự.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const status = historyFilters.status === 'ALL' ? '' : historyFilters.status;
      const data = await warehouseAdminService.getImportHistory(historyPage - 1, historyPageSize, historyFilters.createdBy, historyFilters.supplierName, status, historyFilters.productKeyword);
      setHistory(data.content);
      setHistoryTotal(data.totalElements);
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
      loadHistory();
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
          <form className="ad-supplier-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }} onSubmit={(e) => {
            e.preventDefault();
            setStaffPage(1);
            setStaffFilters({ name: staffQueries.name.trim(), email: staffQueries.email.trim() });
          }}>
            <label style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '6px' }}>HỌ TÊN
              <input value={staffQueries.name} onChange={(e) => setStaffQueries({ ...staffQueries, name: e.target.value })} placeholder="Nhập họ tên cần tìm..." />
            </label>
            <label style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '6px' }}>EMAIL
              <input value={staffQueries.email} onChange={(e) => setStaffQueries({ ...staffQueries, email: e.target.value })} placeholder="Nhập email cần tìm..." />
            </label>
            <div className="ad-filter-actions" style={{ flex: '1 1 250px', display: 'flex', gap: '10px' }}>
              <button className="ad-button ad-button-blue" type="submit" style={{ flex: 1, margin: 0 }}><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
              <button className="ad-button ad-button-quiet" type="button" style={{ flex: 1, margin: 0 }} onClick={() => {
                setStaffQueries({ name: '', email: '' });
                setStaffFilters({ name: '', email: '' });
                setStaffPage(1);
              }}>Làm mới</button>
            </div>
          </form>
          
          <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${staffTotal} bản ghi`}</p>
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
          <Pagination
            page={staffPage} pageSize={staffPageSize} total={staffTotal}
            onPage={setStaffPage}
            onPageSize={(size) => { setStaffPageSize(size); setStaffPage(1); }}
            onRefresh={loadStaffs}
          />
        </section>
      )}

      {/* TAB: LỊCH SỬ NHẬP KHO */}
      {activeTab === 'history' && (
        <section className="ad-brand-panel ad-brand-list">
          <h2><FontAwesomeIcon icon={faFileInvoice} /> Lịch sử phiếu nhập</h2>
          <form className="ad-supplier-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }} onSubmit={(e) => {
            e.preventDefault();
            setHistoryPage(1);
            setHistoryFilters({ createdBy: historyQueries.createdBy.trim(), supplierName: historyQueries.supplierName.trim(), status: historyQueries.status, productKeyword: historyQueries.productKeyword.trim() });
          }}>
            <label style={{ flex: '1 1 200px' }}>NGƯỜI TẠO
              <input value={historyQueries.createdBy} onChange={(e) => setHistoryQueries({ ...historyQueries, createdBy: e.target.value })} placeholder="Nhập tên người tạo..." />
            </label>
            <label style={{ flex: '1 1 200px' }}>NHÀ CUNG CẤP
              <input value={historyQueries.supplierName} onChange={(e) => setHistoryQueries({ ...historyQueries, supplierName: e.target.value })} placeholder="Nhập tên nhà cung cấp..." />
            </label>
            <label style={{ flex: '1 1 200px' }}>BIẾN THỂ
              <input value={historyQueries.productKeyword} onChange={(e) => setHistoryQueries({ ...historyQueries, productKeyword: e.target.value })} placeholder="Nhập mã/tên BT trong phiếu..." />
            </label>
            <label style={{ flex: '1 1 200px' }}>TRẠNG THÁI
              <select value={historyQueries.status} onChange={(e) => setHistoryQueries({ ...historyQueries, status: e.target.value })}>
                <option value="ALL">Tất cả</option>
                <option value="PENDING">Chờ duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </label>
            <div className="ad-filter-actions" style={{ flex: '1 1 200px', display: 'flex', gap: '10px' }}>
              <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
              <button className="ad-button ad-button-quiet" type="button" onClick={() => {
                setHistoryQueries({ createdBy: '', supplierName: '', status: 'ALL', productKeyword: '' });
                setHistoryFilters({ createdBy: '', supplierName: '', status: 'ALL', productKeyword: '' });
                setHistoryPage(1);
              }}>Làm mới</button>
            </div>
          </form>

          <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${historyTotal} bản ghi`}</p>
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
          <Pagination
            page={historyPage} pageSize={historyPageSize} total={historyTotal}
            onPage={setHistoryPage}
            onPageSize={(size) => { setHistoryPageSize(size); setHistoryPage(1); }}
            onRefresh={loadHistory}
          />
        </section>
      )}

      {/* MODAL CHI TIẾT PHIẾU NHẬP */}
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
              {selectedReceipt.loading ? <div style={{ padding: '20px' }}>Đang tải dữ liệu...</div> : (
                <>
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
                          <th>MÃ BT</th>
                          <th>TÊN BIẾN THỂ</th>
                          <th style={{ textAlign: 'center' }}>SỐ LƯỢNG</th>
                          <th style={{ textAlign: 'right' }}>ĐƠN GIÁ</th>
                          <th style={{ textAlign: 'right' }}>THÀNH TIỀN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReceipt.details?.length > 0 ? selectedReceipt.details.map((item, idx) => (
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
                </>
              )}
            </div>

            <div className="ad-dialog-actions" style={{ paddingTop: '16px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {selectedReceipt && !selectedReceipt.loading && selectedReceipt.status === 'PENDING' && (
                <>
                  <button className="ad-button" style={{ backgroundColor: '#10b981', color: '#fff' }} type="button" onClick={() => handleUpdateStatus('APPROVED')}>
                    Duyệt phiếu
                  </button>
                  <button className="ad-button" style={{ backgroundColor: '#ef4444', color: '#fff' }} type="button" onClick={() => handleUpdateStatus('REJECTED')}>
                    Từ chối
                  </button>
                </>
              )}
              <button className="ad-button ad-button-blue" type="button" onClick={() => setSelectedReceipt(null)}>
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
