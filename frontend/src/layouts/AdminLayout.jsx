import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faChartPie, faUsers, faList, faCopyright, faTruck,
  faStar, faSliders, faPercent, faCartShopping, faChartLine, faBolt,
  faRightFromBracket, faCalendarDay, faBoxOpen, faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../store/auth.jsx';
import AppToast from '../components/common/AppToast.jsx';
import WarehouseList from '../pages/admin/WarehouseList.jsx';

const MENU = [
  { id: 'overview', icon: faChartPie, label: 'Tổng quan' },
  { id: 'warehouse', icon: faWarehouse, label: 'Quản lý kho hàng' },
  { id: 'users', icon: faUsers, label: 'Quản lý người dùng' },
  { id: 'categories', icon: faList, label: 'Quản lý danh mục' },
  { id: 'brands', icon: faCopyright, label: 'Quản lý thương hiệu' },
  { id: 'suppliers', icon: faTruck, label: 'Quản lý nhà cung cấp' },
  { id: 'reviews', icon: faStar, label: 'Quản lý đánh giá' },
  { id: 'products', icon: faMobileScreen, label: 'Quản lý sản phẩm' },
  { id: 'variants', icon: faSliders, label: 'Quản lý biến thể' },
  { id: 'promotions', icon: faPercent, label: 'Quản lý khuyến mãi' },
  { id: 'orders', icon: faCartShopping, label: 'Quản lý đơn hàng' },
  { id: 'stats', icon: faChartLine, label: 'Thống kê' }
];

const ACTIONS = [
  { id: 'warehouse', icon: faWarehouse, label: 'Quản lý kho', desc: 'Thêm, sửa, xóa thông tin kho hàng', color: '#4361ee' },
  { id: 'users', icon: faUsers, label: 'Quản lý người dùng', desc: 'Thêm, sửa, xóa người dùng', color: '#3a0ca3' },
  { id: 'categories', icon: faList, label: 'Danh mục', desc: 'Quản lý danh mục', color: '#8b5cf6' },
  { id: 'brands', icon: faCopyright, label: 'Thương hiệu', desc: 'Quản lý thương hiệu', color: '#06b6d4' },
  { id: 'suppliers', icon: faTruck, label: 'Nhà cung cấp', desc: 'Quản lý nhà cung cấp', color: '#f17d63' },
  { id: 'products', icon: faBoxOpen, label: 'Sản phẩm', desc: 'Quản lý sản phẩm', color: '#10b981' },
  { id: 'variants', icon: faSliders, label: 'Biến thể', desc: 'Quản lý biến thể sản phẩm', color: '#f59e0b' },
  { id: 'promotions', icon: faPercent, label: 'Khuyến mãi', desc: 'Chương trình ưu đãi', color: '#ec4899' },
  { id: 'orders', icon: faCartShopping, label: 'Đơn hàng', desc: 'Quản lý đơn hàng', color: '#d97706' },
  { id: 'stats', icon: faChartLine, label: 'Thống kê', desc: 'Báo cáo doanh thu', color: '#1e4e48' }
];

export default function AdminLayout({ notify, toasts = [] }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('warehouse');
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'A') + '&background=4361ee&color=fff';

  return (
    <div className="ad-wrap">
      <AppToast toasts={toasts} />
      <aside className="ad-side">
        <div className="ad-brand"><FontAwesomeIcon icon={faMobileScreen} /> Phone Store</div>
        <nav className="ad-menu">
          {MENU.map((m) => (
            <a
              key={m.id}
              className={activeTab === m.id ? 'active' : ''}
              onClick={() => setActiveTab(m.id)}
            >
              <FontAwesomeIcon icon={m.icon} className="fa-fw" /> {m.label}
            </a>
          ))}
          <a onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} className="fa-fw" /> Đăng xuất</a>
        </nav>
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <div className="ad-title">
            {activeTab === 'warehouse' ? 'Quản lý kho hàng' : 'Dashboard'}
          </div>
          <div className="ad-user">
            <span>Xin chào: <strong>{user?.username}</strong> (Quản trị viên)</span>
            <img src={avatar} alt="admin" />
          </div>
        </header>
        <div className="ad-content">
          {activeTab === 'warehouse' ? (
            <WarehouseList notify={notify} />
          ) : (
            <>
              <div className="ad-welcome">
                <div>
                  <h2>Xin chào, {user?.username}! 👋</h2>
                  <p>Chào mừng bạn quay trở lại hệ thống quản lý bán hàng chuyên nghiệp</p>
                  <div className="d"><FontAwesomeIcon icon={faCalendarDay} /> {today}</div>
                </div>
                <FontAwesomeIcon icon={faWarehouse} className="big" />
              </div>
              <h2 className="ad-sec"><FontAwesomeIcon icon={faBolt} /> Hành động nhanh</h2>
              <div className="ad-grid">
                {ACTIONS.map((a) => (
                  <div
                    key={a.label}
                    className="ad-card"
                    onClick={() => setActiveTab(a.id)}
                  >
                    <div className="ad-ic" style={{ background: a.color }}>
                      <FontAwesomeIcon icon={a.icon} />
                    </div>
                    <div><h3>{a.label}</h3><p>{a.desc}</p></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
