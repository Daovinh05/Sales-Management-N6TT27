import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faMagnifyingGlass, faEye, faXmark } from '@fortawesome/free-solid-svg-icons';
import warehouseStaffService from '../../services/warehouseStaffService.js';
import Pagination from '../../components/admin/Pagination.jsx';
import { resolveImage } from '../../services/shop.js';

export default function StaffInventory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [inventory, setInventory] = useState([]);
  const [inventoryKeyword, setInventoryKeyword] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize, setInventoryPageSize] = useState(10);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [selectedInventory, setSelectedInventory] = useState(null);

  useEffect(() => {
    loadInventory();
  }, [inventoryPage, inventoryPageSize, inventoryFilter]);

  const loadInventory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await warehouseStaffService.getInventory(inventoryPage - 1, inventoryPageSize, inventoryFilter);
      setInventory(data.content || []);
      setInventoryTotal(data.totalElements || 0);
    } catch (err) {
      setError('Lỗi tải danh sách tồn kho.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-brand-page">
      {error && <p className="ad-brand-message" role="alert" style={{ marginBottom: '15px' }}>{error}</p>}

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faBox} /> Danh sách Tồn kho</h2>
        <form className="ad-supplier-filter" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'flex-end' }} onSubmit={(e) => {
          e.preventDefault();
          setInventoryPage(1);
          setInventoryFilter(inventoryKeyword.trim());
        }}>
          <label style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '6px' }}>TÌM KIẾM
            <input value={inventoryKeyword} onChange={(e) => setInventoryKeyword(e.target.value)} placeholder="Nhập mã, tên sản phẩm hoặc biến thể..." />
          </label>
          <div className="ad-filter-actions" style={{ flex: '0 0 auto', display: 'flex', gap: '10px' }}>
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setInventoryKeyword('');
              setInventoryFilter('');
              setInventoryPage(1);
            }}>Làm mới</button>
          </div>
        </form>
        
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${inventoryTotal} bản ghi`}</p>
        <div className="ad-table-wrap" style={{ marginTop: '15px' }}>
          <table className="ad-brand-table">
            <thead>
              <tr>
                <th>HÌNH ẢNH</th>
                <th>MÃ BT</th>
                <th>TÊN BIẾN THỂ</th>
                <th>TÌNH TRẠNG KHO</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="ad-table-empty">Đang tải...</td></tr> :
               inventory.length === 0 ? <tr><td colSpan="5" className="ad-table-empty">Không có dữ liệu.</td></tr> :
               inventory.map(item => {
                 const stock = item.stockQuantity || 0;
                 const reserved = item.reservedQuantity || 0;
                 const available = stock - reserved;
                 return (
                 <tr key={item.code}>
                   <td>
                      <img src={item.imageUrl ? resolveImage(item.imageUrl) : 'https://via.placeholder.com/50?text=No+Image'} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/50?text=No+Image'; }} />
                   </td>
                   <td>{item.code}</td>
                   <td>
                      <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                      <div style={{ fontSize: '0.9em', color: '#666' }}>{item.name}</div>
                      <div style={{ fontSize: '0.85em', color: '#888' }}>
                        {item.ram && <span>RAM: {item.ram} </span>}
                        {item.storage && <span>ROM: {item.storage} </span>}
                        {item.color && <span>Màu: {item.color}</span>}
                      </div>
                   </td>
                   <td>
                      <div>
                        <div>Tổng: {stock}</div>
                        <div className="text-warning" style={{ color: '#f59e0b' }}>Đang xử lý: {reserved}</div>
                        <div className="text-success" style={{ color: '#10b981' }}>Khả dụng: <strong>{available}</strong></div>
                      </div>
                   </td>
                   <td>
                     <button className="ad-button ad-button-quiet" onClick={() => setSelectedInventory(item)}>
                       <FontAwesomeIcon icon={faEye} /> Xem chi tiết
                     </button>
                   </td>
                 </tr>
               )})}
            </tbody>
          </table>
        </div>
        <Pagination
          page={inventoryPage} pageSize={inventoryPageSize} total={inventoryTotal}
          onPage={setInventoryPage}
          onPageSize={(size) => { setInventoryPageSize(size); setInventoryPage(1); }}
          onRefresh={loadInventory}
        />
      </section>

      {selectedInventory && (
        <div className="ad-dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedInventory(null); }}>
          <div className="ad-brand-dialog" style={{ maxWidth: '600px', width: '95%' }}>
            <div className="ad-dialog-heading">
              <div className="ad-title" style={{ fontSize: '18px' }}>Chi tiết tồn kho: {selectedInventory.code}</div>
              <button className="ad-icon-button" type="button" onClick={() => setSelectedInventory(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            
            <div className="ad-dialog-content" style={{ display: 'flex', gap: '20px', padding: '20px' }}>
              <div style={{ flex: '0 0 150px' }}>
                <img 
                  src={selectedInventory.imageUrl ? resolveImage(selectedInventory.imageUrl) : 'https://via.placeholder.com/150?text=No+Image'} 
                  alt={selectedInventory.name} 
                  style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }} 
                />
              </div>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#1e293b' }}>{selectedInventory.productName}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Mã biến thể:</span>
                  <span style={{ fontWeight: '600' }}>{selectedInventory.code}</span>
                  
                  <span style={{ color: '#64748b' }}>Tên biến thể:</span>
                  <span>{selectedInventory.name || '---'}</span>
                  
                  <span style={{ color: '#64748b' }}>RAM:</span>
                  <span>{selectedInventory.ram || '---'}</span>
                  
                  <span style={{ color: '#64748b' }}>ROM:</span>
                  <span>{selectedInventory.storage || '---'}</span>
                  
                  <span style={{ color: '#64748b' }}>Màu sắc:</span>
                  <span>{selectedInventory.color || '---'}</span>
                </div>
                
                <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Tổng tồn</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{selectedInventory.stockQuantity || 0}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Đang giữ</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>{selectedInventory.reservedQuantity || 0}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#64748b', fontSize: '13px', marginBottom: '4px' }}>Khả dụng</div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>{(selectedInventory.stockQuantity || 0) - (selectedInventory.reservedQuantity || 0)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="ad-dialog-actions" style={{ paddingTop: '16px', borderTop: '1px solid #e9ecef', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="ad-button ad-button-blue" type="button" onClick={() => setSelectedInventory(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
