import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWarehouse,
  faPlus,
  faUpload,
  faDownload,
  faMagnifyingGlass,
  faPen,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import warehouseService from '../../services/warehouseService.js';
import WarehouseForm from './WarehouseForm.jsx';

const formatDate = (value) => (value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '—');

function downloadCsv(warehouses) {
  const rows = [
    ['Mã kho', 'Tên kho hàng', 'Địa chỉ', 'Điện thoại', 'Trạng thái', 'Ngày tạo'],
    ...warehouses.map((w) => [
      w.id,
      w.name,
      w.address || '',
      w.phone || '',
      w.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động',
      formatDate(w.createdAt)
    ])
  ];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'danh-sach-kho-hang.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function WarehouseList({ notify }) {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState({ name: '', keyword: '' });
  const [filters, setFilters] = useState({ name: '', keyword: '' });
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await warehouseService.getAll();
      setWarehouses(Array.isArray(data) ? data : []);
    } catch {
      setError('Không tải được danh sách kho hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const filteredWarehouses = useMemo(() => {
    const nameQ = filters.name.trim().toLowerCase();
    const keyQ = filters.keyword.trim().toLowerCase();
    return warehouses.filter((w) => {
      const matchName = !nameQ || w.name?.toLowerCase().includes(nameQ);
      const matchKey = !keyQ || (
        w.address?.toLowerCase().includes(keyQ) ||
        w.phone?.toLowerCase().includes(keyQ)
      );
      return matchName && matchKey;
    });
  }, [warehouses, filters]);

  const handleCreate = () => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
    setError('');
    setNotice('');
  };

  const handleEdit = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
    setError('');
    setNotice('');
  };

  const handleDelete = async (warehouse) => {
    if (!window.confirm(`Xóa kho hàng "${warehouse.name}"?`)) return;
    setError('');
    setNotice('');
    try {
      await warehouseService.delete(warehouse.id);
      const successMsg = `Đã xóa kho hàng "${warehouse.name}".`;
      setNotice(successMsg);
      notify?.('success', successMsg);
      await fetchWarehouses();
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể xóa kho hàng.';
      setError(msg);
      notify?.('error', msg);
    }
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
      const rows = lines.slice(1).map((line) => {
        const parts = line.split(',').map((f) => f.trim().replace(/^"|"$/g, '').replaceAll('""', '"'));
        return {
          name: parts[0] || parts[1],
          address: parts[2] || '',
          phone: parts[3] || '',
          status: 'ACTIVE'
        };
      }).filter((r) => r.name);

      if (!rows.length) {
        setError('Tệp CSV không có dữ liệu hợp lệ. Vui lòng kiểm tra lại cấu trúc tệp.');
        return;
      }

      setError('');
      let imported = 0;
      for (const row of rows) {
        try {
          await warehouseService.create(row);
          imported += 1;
        } catch {
          // Bỏ qua dòng bị lỗi để tiếp tục nhập các dòng hợp lệ
        }
      }

      await fetchWarehouses();
      const resultMsg = imported
        ? `Đã nhập thành công ${imported}/${rows.length} kho hàng.`
        : 'Không có kho hàng mới nào được nhập.';
      setNotice(resultMsg);
      notify?.(imported ? 'success' : 'warning', resultMsg);
    } catch {
      setError('Lỗi khi đọc tệp CSV.');
    }
  };

  return (
    <div className="ad-brand-page ad-supplier-page">
      {/* Search & Filter Panel */}
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faWarehouse} /> Quản lý Kho hàng</h2>
            <p>Tìm kiếm và quản lý danh sách các kho hàng trong hệ thống.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={handleCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới kho hàng
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => fileInput.current?.click()}>
              <FontAwesomeIcon icon={faUpload} /> Nhập CSV
            </button>
            <input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={importCsv} />
            <button
              className="ad-button ad-button-pink"
              type="button"
              onClick={() => downloadCsv(filteredWarehouses)}
              disabled={!filteredWarehouses.length}
            >
              <FontAwesomeIcon icon={faDownload} /> Xuất CSV
            </button>
          </div>
        </div>

        <form
          className="ad-supplier-filter"
          onSubmit={(e) => {
            e.preventDefault();
            setFilters({ name: queries.name.trim(), keyword: queries.keyword.trim() });
          }}
        >
          <label>
            TÊN KHO HÀNG
            <input
              value={queries.name}
              onChange={(e) => setQueries({ ...queries, name: e.target.value })}
              placeholder="Nhập tên kho cần tìm..."
            />
          </label>
          <label>
            ĐỊA CHỈ / SỐ ĐIỆN THOẠI
            <input
              value={queries.keyword}
              onChange={(e) => setQueries({ ...queries, keyword: e.target.value })}
              placeholder="Nhập địa chỉ hoặc số điện thoại..."
            />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit">
              <FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm
            </button>
            <button
              className="ad-button ad-button-quiet"
              type="button"
              onClick={() => {
                setQueries({ name: '', keyword: '' });
                setFilters({ name: '', keyword: '' });
              }}
            >
              Làm mới
            </button>
          </div>
        </form>

        {error && <p className="ad-brand-message" role="alert">{error}</p>}
        {notice && <p className="ad-user-notice" role="status">{notice}</p>}
      </section>

      {/* Warehouse Table Panel */}
      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faWarehouse} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count">
          <strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredWarehouses.length} bản ghi`}
        </p>

        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-supplier-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>STT</th>
                <th>TÊN KHO HÀNG</th>
                <th>ĐỊA CHỈ</th>
                <th style={{ width: '150px' }}>SỐ ĐIỆN THOẠI</th>
                <th style={{ width: '140px' }}>TRẠNG THÁI</th>
                <th style={{ width: '160px' }}>NGÀY TẠO</th>
                <th style={{ width: '140px', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="ad-table-empty">Đang tải dữ liệu...</td>
                </tr>
              ) : filteredWarehouses.length ? (
                filteredWarehouses.map((w, index) => (
                  <tr key={w.id}>
                    <td className="ad-brand-index">{index + 1}</td>
                    <td style={{ fontWeight: 650, color: '#1e293b' }}>
                      <FontAwesomeIcon icon={faWarehouse} style={{ marginRight: '8px', color: '#2563eb' }} />
                      {w.name}
                    </td>
                    <td>{w.address || '—'}</td>
                    <td>{w.phone || '—'}</td>
                    <td>
                      <span className={`ad-role-badge ${w.status === 'ACTIVE' ? 'admin' : ''}`}>
                        {w.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td>{formatDate(w.createdAt)}</td>
                    <td className="ad-brand-row-actions">
                      <button
                        className="ad-button ad-button-edit"
                        type="button"
                        title="Sửa kho hàng"
                        onClick={() => handleEdit(w)}
                      >
                        <FontAwesomeIcon icon={faPen} />
                        <span>Sửa</span>
                      </button>
                      <button
                        className="ad-button ad-button-delete"
                        type="button"
                        title="Xóa kho hàng"
                        onClick={() => handleDelete(w)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="ad-table-empty">Chưa có kho hàng phù hợp.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <WarehouseForm
          warehouse={selectedWarehouse}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchWarehouses}
          notify={notify}
        />
      )}
    </div>
  );
}
