import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faClock, faCheckCircle, faTimesCircle, faHistory, faPlus } from '@fortawesome/free-solid-svg-icons';
import warehouseStaffService from '../../services/warehouseStaffService.js';
import { useAuth } from '../../store/auth.jsx';

export default function StaffDashboard({ notify }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await warehouseStaffService.getImportStats();
      setStats(data);
    } catch (err) {
      notify('error', 'Không thể tải thống kê: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const go = (path) => {
    window.location.hash = path;
  };

  return (
    <div className="ad-brand-page">
      <div className="ad-brand-panel">
        <div className="ad-brand-heading">
          <h2>Bàn làm việc Nhân viên Kho</h2>
          <p>Xin chào, <strong>{user?.username}</strong>! Chúc bạn một ngày làm việc hiệu quả.</p>
        </div>
      </div>

      <div className="ad-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="ad-card" style={{ borderColor: '#2563eb', borderTop: '4px solid #2563eb' }}>
          <div className="ad-ic" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FontAwesomeIcon icon={faFileInvoice} />
          </div>
          <h3>Tổng phiếu nhập</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginTop: 'auto' }}>
            {loading ? '...' : stats?.totalImports || 0}
          </p>
        </div>

        <div className="ad-card" style={{ borderColor: '#d97706', borderTop: '4px solid #d97706' }}>
          <div className="ad-ic" style={{ background: '#fffbeb', color: '#d97706' }}>
            <FontAwesomeIcon icon={faClock} />
          </div>
          <h3>Chờ duyệt</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706', marginTop: 'auto' }}>
            {loading ? '...' : stats?.pendingImports || 0}
          </p>
        </div>

        <div className="ad-card" style={{ borderColor: '#16a34a', borderTop: '4px solid #16a34a' }}>
          <div className="ad-ic" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <h3>Đã duyệt</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', marginTop: 'auto' }}>
            {loading ? '...' : stats?.approvedImports || 0}
          </p>
        </div>

        <div className="ad-card" style={{ borderColor: '#dc2626', borderTop: '4px solid #dc2626' }}>
          <div className="ad-ic" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <FontAwesomeIcon icon={faTimesCircle} />
          </div>
          <h3>Từ chối</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginTop: 'auto' }}>
            {loading ? '...' : stats?.rejectedImports || 0}
          </p>
        </div>
      </div>

      <div className="ad-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '20px' }}>
        <div className="ad-brand-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            <FontAwesomeIcon icon={faHistory} style={{ color: '#2563eb' }} /> Lịch sử nhập kho
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px', flex: 1, lineHeight: '1.5' }}>
            Xem danh sách các phiếu nhập đã tạo, kiểm tra chi tiết và theo dõi trạng thái phê duyệt từ Quản trị viên.
          </p>
          <div style={{ marginTop: '20px' }}>
            <button className="ad-button ad-button-blue" onClick={() => go('/staff/imports')}>
              Xem lịch sử
            </button>
          </div>
        </div>

        <div className="ad-brand-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            <FontAwesomeIcon icon={faPlus} style={{ color: '#0bb783' }} /> Lập phiếu nhập mới
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '12px', flex: 1, lineHeight: '1.5' }}>
            Tra cứu thông tin sản phẩm và lập phiếu nhập hàng mới vào kho chờ Admin phê duyệt.
          </p>
          <div style={{ marginTop: '20px' }}>
            <button className="ad-button ad-button-primary" onClick={() => go('/staff/imports/create')}>
              Lập phiếu nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
