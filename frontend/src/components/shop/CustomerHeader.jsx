import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faRotateLeft, faPhoneVolume, faTruckFast,
  faMagnifyingGlass, faCartShopping, faUserGear, faBoxOpen, faRightFromBracket, faChevronDown
} from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useAuth } from '../../store/auth.jsx';
import api from '../../services/api.js';

const apiOrigin = (api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

export function TopBanner() {
  return (
    <div className="kh-topbanner">
      <div className="tz-container">
        <div className="tb-group">
          <span><FontAwesomeIcon icon={faCircleCheck} /> SẢN PHẨM CHÍNH HÃNG</span>
          <span><FontAwesomeIcon icon={faRotateLeft} /> CAM KẾT LỖI ĐỔI LIỀN</span>
          <span><FontAwesomeIcon icon={faPhoneVolume} /> HOTLINE 1900.2091</span>
        </div>
        <span><FontAwesomeIcon icon={faTruckFast} /> MIỄN PHÍ VẬN CHUYỂN TOÀN QUỐC</span>
      </div>
    </div>
  );
}

export function CustomerHeader({ cartCount, onCart, onSearch, onAccount }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const avatar = user?.avatarUrl
    ? `${apiOrigin}/uploads/avatars/${encodeURIComponent(user.avatarUrl)}`
    : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'K') + '&background=006a5b&color=fff';
  const toggleAccountMenu = () => setOpen((current) => !current);
  const openProfile = () => {
    setOpen(false);
    onAccount?.();
  };

  return (
    <header className="kh-header">
      <div className="tz-container">
        <a className="kh-logo">TECHZONE</a>
        <form className="kh-search" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Tìm kiếm sản phẩm..." onChange={(e) => onSearch?.(e.target.value)} />
          <button type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /><span>Tìm kiếm ngay</span></button>
        </form>
        <div className="kh-actions">
          <div className="kh-action kh-account">
            <button type="button" className="kh-account-trigger" onClick={toggleAccountMenu} aria-label="Mở menu tài khoản" aria-expanded={open}>
              <img src={avatar} alt="" />
              <span>{user?.fullName || user?.username}</span>
            </button>
            <button type="button" className="kh-account-toggle" onClick={() => setOpen((o) => !o)} aria-label="Mở menu tài khoản" aria-expanded={open}>
              <FontAwesomeIcon icon={faChevronDown} />
            </button>
            <div className={`kh-account-menu ${open ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
              <a onClick={openProfile}><FontAwesomeIcon icon={faUserGear} /> Quản lý tài khoản</a>
              <a><FontAwesomeIcon icon={faBoxOpen} /> Đơn hàng của tôi</a>
              <div className="divider" />
              <a className="logout" onClick={logout}><FontAwesomeIcon icon={faRightFromBracket} /> Đăng xuất</a>
            </div>
          </div>
          <div className="kh-action" onClick={onCart}>
            <FontAwesomeIcon icon={faCartShopping} size="lg" />
            <span>Giỏ hàng</span>
            <span className="kh-badge">{cartCount}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
