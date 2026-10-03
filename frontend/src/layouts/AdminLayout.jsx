import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faChartPie, faUsers, faList, faCopyright, faTruck,
  faStar, faSliders, faPercent, faCartShopping, faChartLine, faBolt,
  faRightFromBracket, faCalendarDay, faMugHot, faGift, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../store/auth.jsx';
import BrandManagement from '../pages/admin/BrandManagement.jsx';
import ReviewManagement from '../pages/admin/ReviewManagement.jsx';
import UserManagement from '../pages/admin/UserManagement.jsx';

const MENU = [
  { icon: faChartPie, label: 'Tổng quan', active: true },
  { icon: faUsers, label: 'Quản lý người dùng' },
  { icon: faList, label: 'Quản lý danh mục' },
  { icon: faCopyright, label: 'Quản lý thương hiệu' },
  { icon: faTruck, label: 'Quản lý nhà cung cấp' },
  { icon: faStar, label: 'Quản lý đánh giá' },
  { icon: faMobileScreen, label: 'Quản lý sản phẩm' },
  { icon: faSliders, label: 'Quản lý biến thể' },
  { icon: faPercent, label: 'Quản lý khuyến mãi' },
  { icon: faCartShopping, label: 'Quản lý đơn hàng' },
  { icon: faChartLine, label: 'Thống kê' }
];

const ACTIONS = [
  { icon: faUsers, label: 'Quản lý người dùng', page: 'Quản lý người dùng', desc: 'Thêm, sửa, xóa người dùng', color: '#4361ee' },
  { icon: faList, label: 'Danh mục', page: 'Quản lý danh mục', desc: 'Quản lý danh mục', color: '#8b5cf6' },
  { icon: faCopyright, label: 'Thương hiệu', page: 'Quản lý thương hiệu', desc: 'Quản lý thương hiệu', color: '#06b6d4' },
  { icon: faTruck, label: 'Nhà cung cấp', page: 'Quản lý nhà cung cấp', desc: 'Quản lý nhà cung cấp', color: '#f17d63' },
  { icon: faBoxOpen, label: 'Sản phẩm', page: 'Quản lý sản phẩm', desc: 'Quản lý sản phẩm', color: '#10b981' },
  { icon: faSliders, label: 'Biến thể', page: 'Quản lý biến thể', desc: 'Quản lý biến thể sản phẩm', color: '#f59e0b' },
  { icon: faGift, label: 'Khuyến mãi', page: 'Quản lý khuyến mãi', desc: 'Chương trình ưu đãi', color: '#ec4899' },
  { icon: faStar, label: 'Đánh giá', page: 'Quản lý đánh giá', desc: 'Quản lý đánh giá', color: '#ec4899' },
  { icon: faCartShopping, label: 'Đơn hàng', page: 'Quản lý đơn hàng', desc: 'Quản lý đơn hàng', color: '#f59e0b' },
  { icon: faChartLine, label: 'Thống kê', page: 'Thống kê', desc: 'Báo cáo doanh thu', color: '#1e4e48' }
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState('Tổng quan');
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'A') + '&background=4361ee&color=fff';

  return (
    <div className="ad-wrap">
      <aside className="ad-side">
        <div className="ad-brand"><FontAwesomeIcon icon={faMobileScreen} /> Phone Store</div>
        <nav className="ad-menu">
          {MENU.map((m, index) => (
            <button key={`${m.label}-${index}`} type="button" className={activePage === m.label ? 'active' : ''} onClick={() => setActivePage(m.label)}>
              <FontAwesomeIcon icon={m.icon} className="fa-fw" /> {m.label}
            </button>
          ))}
          <button type="button" onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} className="fa-fw" /> Đăng xuất</button>
        </nav>
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <div className="ad-title">{activePage === 'Tổng quan' ? 'Dashboard' : activePage}</div>
          <div className="ad-user">
            <span>Xin chào: <strong>{user?.username}</strong> (Quản trị viên)</span>
            <img src={avatar} alt="admin" />
          </div>
        </header>
        <div className="ad-content">
          {activePage === 'Quản lý thương hiệu' ? <BrandManagement />
            : activePage === 'Quản lý người dùng' ? <UserManagement />
              : activePage === 'Quản lý đánh giá' ? <ReviewManagement /> : <>
          <div className="ad-welcome">
            <div>
              <h2>Xin chào, {user?.username}! 👋</h2>
              <p>Chào mừng bạn quay trở lại hệ thống quản lý cà phê chuyên nghiệp</p>
              <div className="d"><FontAwesomeIcon icon={faCalendarDay} /> {today}</div>
            </div>
            <FontAwesomeIcon icon={faMugHot} className="big" />
          </div>
          <h2 className="ad-sec"><FontAwesomeIcon icon={faBolt} /> Hành động nhanh</h2>
          <div className="ad-grid">
            {ACTIONS.map((a) => (
              <button key={a.label} type="button" className="ad-card" onClick={() => setActivePage(a.page)}>
                <div className="ad-ic" style={{ background: a.color }}>
                  <FontAwesomeIcon icon={a.icon} />
                </div>
                <div><h3>{a.label}</h3><p>{a.desc}</p></div>
              </button>
            ))}
          </div>
          </>}
        </div>
      </div>
    </div>
  );
}
