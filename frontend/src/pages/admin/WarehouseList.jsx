import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWarehouse,
  faPlus,
  faPenToSquare,
  faTrashCan,
  faRotateRight,
  faMagnifyingGlass,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import warehouseService from '../../services/warehouseService.js';
import WarehouseForm from './WarehouseForm.jsx';

export default function WarehouseList({ notify }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getAll();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách kho hàng';
      notify?.('error', msg);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const handleCreate = () => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await warehouseService.delete(id);
      notify?.('success', 'Đã xóa kho hàng thành công');
      setDeleteConfirm(null);
      fetchWarehouses();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa kho hàng';
      notify?.('error', msg);
    } finally {
      setDeleting(false);
    }
  };

  const filteredWarehouses = warehouses.filter((w) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      w.name?.toLowerCase().includes(q) ||
      w.address?.toLowerCase().includes(q) ||
      w.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header section */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
            <FontAwesomeIcon icon={faWarehouse} style={{ marginRight: '10px', color: '#4361ee' }} />
            Quản lý Kho hàng
          </h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '14px' }}>
            Danh sách và thông tin các kho lưu trữ trong hệ thống
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="button"
            className="tz-btn tz-btn-outline"
            onClick={fetchWarehouses}
            title="Tải lại danh sách"
          >
            <FontAwesomeIcon icon={faRotateRight} /> Tải lại
          </button>
          <button
            type="button"
            className="tz-btn tz-btn-primary"
            onClick={handleCreate}
          >
            <FontAwesomeIcon icon={faPlus} /> Thêm kho mới
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="ad-card" style={{ padding: '16px 20px', minHeight: 'auto' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="tz-search" style={{ width: '100%', maxWidth: '360px', background: '#f1f5f9' }}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, địa chỉ, SĐT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Tổng số: <strong>{filteredWarehouses.length}</strong> kho
          </span>
        </div>
      </div>

      {/* Table Section */}
      <div className="ad-card" style={{ padding: 0, overflow: 'hidden', minHeight: 'auto' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '14px 20px', width: '60px' }}>STT</th>
                <th style={{ padding: '14px 20px' }}>Tên kho</th>
                <th style={{ padding: '14px 20px' }}>Địa chỉ</th>
                <th style={{ padding: '14px 20px', width: '150px' }}>Số điện thoại</th>
                <th style={{ padding: '14px 20px', width: '140px' }}>Trạng thái</th>
                <th style={{ padding: '14px 20px', width: '160px' }}>Ngày tạo</th>
                <th style={{ padding: '14px 20px', width: '150px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Đang tải dữ liệu kho hàng...
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Không tìm thấy kho hàng nào.
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((w, index) => (
                  <tr
                    key={w.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', color: '#94a3b8' }}>{index + 1}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1e293b' }}>
                      <FontAwesomeIcon icon={faWarehouse} style={{ marginRight: '8px', color: '#4361ee' }} />
                      {w.name}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {w.address || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#475569' }}>
                      {w.phone || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      {w.status === 'ACTIVE' ? (
                        <span className="tz-badge ok">Hoạt động</span>
                      ) : (
                        <span className="tz-badge out">Ngừng hoạt động</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>
                      {w.createdAt
                        ? new Date(w.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="tz-btn tz-btn-outline"
                          style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                          onClick={() => handleEdit(w)}
                          title="Chỉnh sửa kho"
                        >
                          <FontAwesomeIcon icon={faPenToSquare} /> Sửa
                        </button>
                        <button
                          type="button"
                          className="tz-btn tz-btn-danger"
                          style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                          onClick={() => setDeleteConfirm(w)}
                          title="Xóa kho"
                        >
                          <FontAwesomeIcon icon={faTrashCan} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <WarehouseForm
          warehouse={selectedWarehouse}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchWarehouses}
          notify={notify}
        />
      )}

      {/* Modal Xác nhận Xóa */}
      {deleteConfirm && (
        <div className="tz-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="tz-modal" onClick={(e) => e.stopPropagation()} style={{ width: '450px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--danger)', fontSize: '42px' }}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>
            <div className="tz-title" style={{ marginBottom: '12px' }}>XÁC NHẬN XÓA KHO</div>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
              Bạn có chắc chắn muốn xóa kho <strong>"{deleteConfirm.name}"</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="tz-btn tz-btn-outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="tz-btn tz-btn-danger"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleting}
              >
                <FontAwesomeIcon icon={faTrashCan} /> {deleting ? 'Đang xóa...' : 'Đồng ý xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
