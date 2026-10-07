import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import warehouseService from '../../services/warehouseService.js';

export default function WarehouseForm({ warehouse, onClose, onSuccess, notify }) {
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    status: 'ACTIVE'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (warehouse) {
      setForm({
        name: warehouse.name || '',
        address: warehouse.address || '',
        phone: warehouse.phone || '',
        status: warehouse.status || 'ACTIVE'
      });
    }
  }, [warehouse]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Tên kho hàng không được để trống.');
      return;
    }

    setSubmitting(true);
    try {
      await warehouseService.updateCentralWarehouse(form);
      notify?.('success', 'Cập nhật thông tin kho tổng thành công.');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể lưu kho hàng. Vui lòng kiểm tra lại dữ liệu.';
      setError(msg);
      notify?.('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="ad-dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="ad-brand-dialog"
        onSubmit={handleSubmit}
        style={{ width: 'min(500px, 100%)' }}
      >
        <div className="ad-dialog-heading">
          <h2>Cập nhật thông tin kho tổng</h2>
          <button
            className="ad-icon-button"
            type="button"
            aria-label="Đóng"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <label>
          Tên kho hàng (*)
          <input
            required
            maxLength="150"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ví dụ: Kho Tổng Hà Nội"
            autoFocus
          />
        </label>

        <label>
          Số điện thoại
          <input
            type="tel"
            maxLength="20"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Ví dụ: 0912345678"
          />
        </label>

        <label>
          Địa chỉ kho
          <input
            maxLength="255"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Ví dụ: Số 123 Đường Cầu Giấy, Hà Nội"
          />
        </label>

        <label>
          Trạng thái
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
          </select>
        </label>

        {error && <p className="ad-brand-message" role="alert">{error}</p>}

        <div className="ad-dialog-actions">
          <button
            className="ad-button ad-button-quiet"
            type="button"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </button>
          <button
            className="ad-button ad-button-primary"
            type="submit"
            disabled={submitting}
          >
            <FontAwesomeIcon icon={faFloppyDisk} />{' '}
            {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}
