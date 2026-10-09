import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMobileScreen, faChartPie, faUsers, faList, faCopyright, faTruck,
  faStar, faSliders, faPercent, faCartShopping, faChartLine, faBolt,
  faCalendarDay, faBoxOpen, faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../store/auth.jsx';
import AppToast from '../components/common/AppToast.jsx';
import AccountMenu from '../components/common/AccountMenu.jsx';
import WarehouseDashboard from '../pages/admin/WarehouseDashboard.jsx';
import BrandManagement from '../pages/admin/BrandManagement.jsx';
import CategoryManagement from '../pages/admin/CategoryManagement.jsx';
import PromotionManagement from '../pages/admin/PromotionManagement.jsx';
import ProductManagement from '../pages/admin/ProductManagement.jsx';
import VariantManagement from '../pages/admin/VariantManagement.jsx';
import ReviewManagement from '../pages/admin/ReviewManagement.jsx';
import OrderManagement from '../pages/admin/OrderManagement.jsx';
import SupplierManagement from '../pages/admin/SupplierManagement.jsx';
import UserManagement from '../pages/admin/UserManagement.jsx';

const MENU = [
  { icon: faChartPie, label: 'Tổng quan', path: '/' },
  { icon: faUsers, label: 'Quản lý người dùng', path: '/nguoi-dung/danh-sach' },
  { icon: faList, label: 'Quản lý danh mục', path: '/danh-muc/danh-sach' },
  { icon: faCopyright, label: 'Quản lý thương hiệu', path: '/thuong-hieu/danh-sach' },
  { icon: faTruck, label: 'Quản lý nhà cung cấp', path: '/nha-cung-cap/danh-sach' },
  { icon: faWarehouse, label: 'Quản lý kho hàng', path: '/kho-hang/danh-sach' },
  { icon: faStar, label: 'Quản lý đánh giá', path: '/danh-gia/danh-sach' },
  { icon: faMobileScreen, label: 'Quản lý sản phẩm', path: '/san-pham/danh-sach' },
  { icon: faSliders, label: 'Quản lý biến thể', path: '/bien-the/danh-sach' },
  { icon: faPercent, label: 'Quản lý khuyến mãi', path: '/khuyen-mai/danh-sach' },
  { icon: faCartShopping, label: 'Quản lý đơn hàng', path: '/don-hang/danh-sach' },
  { icon: faChartLine, label: 'Thống kê', path: '/thong-ke' }
];

const PATH_TO_PAGE = Object.fromEntries(MENU.map((m) => [m.path, m.label]));
const PAGE_TO_PATH = Object.fromEntries(MENU.map((m) => [m.label, m.path]));

const pageFromHash = () => {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return PATH_TO_PAGE[path] || 'Tổng quan';
};

const ACTIONS = [
  { icon: faUsers, label: 'Quản lý người dùng', page: 'Quản lý người dùng', desc: 'Thêm, sửa, xóa người dùng', color: '#3a0ca3' },
  { icon: faList, label: 'Danh mục', page: 'Quản lý danh mục', desc: 'Quản lý danh mục', color: '#8b5cf6' },
  { icon: faCopyright, label: 'Thương hiệu', page: 'Quản lý thương hiệu', desc: 'Quản lý thương hiệu', color: '#06b6d4' },
  { icon: faTruck, label: 'Nhà cung cấp', page: 'Quản lý nhà cung cấp', desc: 'Quản lý nhà cung cấp', color: '#f17d63' },
  { icon: faWarehouse, label: 'Quản lý kho', page: 'Quản lý kho hàng', desc: 'Thêm, sửa, xóa thông tin kho hàng', color: '#4361ee' },
  { icon: faBoxOpen, label: 'Sản phẩm', page: 'Quản lý sản phẩm', desc: 'Quản lý sản phẩm', color: '#10b981' },
  { icon: faSliders, label: 'Biến thể', page: 'Quản lý biến thể', desc: 'Quản lý biến thể sản phẩm', color: '#f59e0b' },
  { icon: faPercent, label: 'Khuyến mãi', page: 'Quản lý khuyến mãi', desc: 'Chương trình ưu đãi', color: '#ec4899' },
  { icon: faCartShopping, label: 'Đơn hàng', page: 'Quản lý đơn hàng', desc: 'Quản lý đơn hàng', color: '#f59e0b' },
  { icon: faChartLine, label: 'Thống kê', page: 'Thống kê', desc: 'Báo cáo doanh thu', color: '#1e4e48' }
];

export default function AdminLayout({ notify, toasts = [] }) {
  const { user, logout } = useAuth();
  const [activePage, setActivePage] = useState(pageFromHash);
  const go = (page) => {
    window.location.hash = PAGE_TO_PATH[page] || '/';
  };

  useEffect(() => {
    const syncRoute = () => setActivePage(pageFromHash());
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);
  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'A') + '&background=4361ee&color=fff';

  return (
    <div className="ad-wrap">
      <AppToast toasts={toasts} />
      <aside className="ad-side">
        <div className="ad-brand" onClick={() => go('Tổng quan')} title="Về trang chủ" style={{ cursor: 'pointer' }}><FontAwesomeIcon icon={faMobileScreen} /> Phone Store</div>
        <nav className="ad-menu">
          {MENU.map((m, index) => (
            <button
              key={`${m.label}-${index}`}
              type="button"
              className={activePage === m.label ? 'active' : ''}
              onClick={() => go(m.label)}
            >
              <FontAwesomeIcon icon={m.icon} className="fa-fw" /> {m.label}
            </button>
          ))}
        </nav>
        <AccountMenu
          avatar={avatar}
          name={user?.fullName || user?.username}
          role="Quản trị viên"
          onLogout={logout}
        />
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <div className="ad-title">{activePage === 'Tổng quan' ? 'Dashboard' : activePage}</div>
        </header>
        <div className="ad-content">
          {activePage === 'Quản lý kho hàng' ? <WarehouseDashboard notify={notify} />
            : activePage === 'Quản lý danh mục' ? <CategoryManagement />
            : activePage === 'Quản lý thương hiệu' ? <BrandManagement />
            : activePage === 'Quản lý khuyến mãi' ? <PromotionManagement />
            : activePage === 'Quản lý nhà cung cấp' ? <SupplierManagement />
            : activePage === 'Quản lý người dùng' ? <UserManagement />
            : activePage === 'Quản lý đánh giá' ? <ReviewManagement />
            : activePage === 'Quản lý sản phẩm' ? <ProductManagement />
            : activePage === 'Quản lý biến thể' ? <VariantManagement />
            : activePage === 'Quản lý đơn hàng' ? <OrderManagement /> : <>
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
              <button key={a.label} type="button" className="ad-card" onClick={() => go(a.page)}>
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