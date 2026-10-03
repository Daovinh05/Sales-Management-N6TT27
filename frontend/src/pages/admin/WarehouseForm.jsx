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
      setError('Tên kho hàng không được để trống');
      return;
    }

    setSubmitting(true);
    try {
      if (warehouse?.id) {
        await warehouseService.update(warehouse.id, form);
        notify?.('success', 'Cập nhật kho hàng thành công');
      } else {
        await warehouseService.create(form);
        notify?.('success', 'Thêm mới kho hàng thành công');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi lưu thông tin kho';
      setError(msg);
      notify?.('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tz-overlay" onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
        <span className="tz-close" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </span>
        <div className="tz-title">
          {warehouse ? 'CẬP NHẬT KHO HÀNG' : 'THÊM MỚI KHO HÀNG'}
        </div>

        {error && <div className="tz-alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="tz-field">
            <label>
              Tên kho hàng <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ví dụ: Kho Tổng Hà Nội"
              required
            />
          </div>

          <div className="tz-field">
            <label>Số điện thoại</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Ví dụ: 0912345678"
            />
          </div>

          <div className="tz-field">
            <label>Địa chỉ</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows="3"
              placeholder="Nhập địa chỉ chi tiết kho"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="tz-field">
            <label>Trạng thái</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                outline: 'none',
                fontSize: '14px',
                background: '#fff'
              }}
            >
              <option value="ACTIVE">Hoạt động (ACTIVE)</option>
              <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              className="tz-btn tz-btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="tz-btn tz-btn-primary"
              disabled={submitting}
            >
              <FontAwesomeIcon icon={faFloppyDisk} />{' '}
              {submitting ? 'Đang lưu...' : warehouse ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
