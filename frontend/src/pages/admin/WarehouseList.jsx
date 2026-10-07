import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWarehouse,
  faPen,
  faBoxOpen,
  faFileInvoice
} from '@fortawesome/free-solid-svg-icons';
import warehouseService from '../../services/warehouseService.js';
import WarehouseForm from './WarehouseForm.jsx';

export default function WarehouseList({ notify }) {
  const [warehouse, setWarehouse] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [warehouseData, inventoryData] = await Promise.all([
        warehouseService.getCentralWarehouse(),
        warehouseService.getInventory()
      ]);
      setWarehouse(warehouseData);
      setInventory(Array.isArray(inventoryData) ? inventoryData : []);
    } catch {
      setError('Không tải được dữ liệu kho. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = () => {
    setIsModalOpen(true);
    setError('');
  };

  return (
    <div className="ad-brand-page ad-supplier-page">
      {/* Search & Filter Panel - Repurposed as Header for Central Warehouse */}
      <section className="ad-brand-panel">
        <div className="ad-brand-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2><FontAwesomeIcon icon={faWarehouse} /> Quản lý Tồn kho & Cấu hình Kho Tổng</h2>
            <p>Thông tin kho tổng hiện tại.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={handleEdit} disabled={!warehouse}>
              <FontAwesomeIcon icon={faPen} /> Cập nhật thông tin
            </button>
          </div>
        </div>

        {error && <p className="ad-brand-message" role="alert">{error}</p>}
        
        {loading ? (
          <p>Đang tải thông tin kho...</p>
        ) : warehouse ? (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#0f172a' }}>{warehouse.name}</h3>
            <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#475569' }}>
              <p><strong>Địa chỉ:</strong> {warehouse.address || 'Chưa cập nhật'}</p>
              <p><strong>Điện thoại:</strong> {warehouse.phone || 'Chưa cập nhật'}</p>
              <p>
                <strong>Trạng thái:</strong>{' '}
                <span className={`ad-role-badge ${warehouse.status === 'ACTIVE' ? 'admin' : ''}`}>
                  {warehouse.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <p>Không có thông tin kho tổng.</p>
        )}
      </section>

      {/* Inventory Table Panel */}
      <section className="ad-brand-panel ad-brand-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h2><FontAwesomeIcon icon={faBoxOpen} /> Bảng tồn kho</h2>
            <p className="ad-brand-count">
              <strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${inventory.length} sản phẩm`}
            </p>
          </div>
          <button className="ad-button ad-button-blue" type="button">
            <FontAwesomeIcon icon={faFileInvoice} /> Tạo phiếu nhập
          </button>
        </div>

        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-supplier-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th>MÃ SKU</th>
                <th>TÊN SẢN PHẨM</th>
                <th style={{ textAlign: 'center' }}>TỒN THỰC TẾ</th>
                <th style={{ textAlign: 'center' }}>ĐANG GIỮ CHỖ</th>
                <th style={{ textAlign: 'center' }}>KHẢ DỤNG</th>
                <th style={{ width: '140px' }}>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="ad-table-empty">Đang tải dữ liệu...</td>
                </tr>
              ) : inventory.length ? (
                inventory.map((item, index) => (
                  <tr key={item.variantCode}>
                    <td className="ad-brand-index">{index + 1}</td>
                    <td style={{ fontWeight: 650, color: '#1e293b' }}>
                      {item.variantCode}
                    </td>
                    <td>{item.name}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'center', color: '#eab308' }}>{item.reservedQuantity}</td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: item.availableQuantity > 0 ? '#10b981' : '#ef4444' }}>
                      {item.availableQuantity}
                    </td>
                    <td>
                      <span className={`ad-role-badge ${item.availableQuantity > 0 ? 'admin' : ''}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="ad-table-empty">Chưa có sản phẩm nào trong kho.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Sửa */}
      {isModalOpen && (
        <WarehouseForm
          warehouse={warehouse}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
          notify={notify}
        />
      )}
    </div>
  );
}
