import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass, faCartShopping, faCircleUser, faUserPlus,
  faRightFromBracket, faCube, faPhone
} from '@fortawesome/free-solid-svg-icons';
import { faFacebookF, faTiktok, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../store/auth.jsx';

export function Header({ cartCount, onCart, onLogin, onRegister, onSearch, onHome }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const goHome = () => {
    onSearch?.('');
    onHome?.();
    if (window.location.hash) window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <header className="tz-header">
      <div className="tz-logo" onClick={goHome} title="Về trang chủ" style={{ cursor: 'pointer' }}>TECH<span>ZONE</span></div>
      <ul className="tz-nav">
        <li className="tz-nav-item">NEW</li>
        <li className="tz-nav-item">BÁN CHẠY</li>
        <li className="tz-nav-item tz-sale">KHUYẾN MÃI <span className="tz-hot">HOT</span></li>
        {isAdmin && <li className="tz-nav-item"><FontAwesomeIcon icon={faCube} /> Dashboard</li>}
      </ul>
      <div className="tz-actions">
        <div className="tz-search">
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          <input placeholder="Tìm kiếm" onChange={(e) => onSearch?.(e.target.value)} />
        </div>
        <button className="tz-btn tz-btn-outline" onClick={onCart}>
          Giỏ hàng
          <span className="tz-iconbox"><FontAwesomeIcon icon={faCartShopping} /><span className="tz-cart-badge">{cartCount}</span></span>
        </button>
        {user ? (
          <button className="tz-btn tz-btn-outline" onClick={logout} title={user.username}>
            <FontAwesomeIcon icon={faCircleUser} /> {user.username}
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        ) : (
          <>
            <button className="tz-btn tz-btn-outline" onClick={onLogin}>
              Đăng nhập <FontAwesomeIcon icon={faCircleUser} />
            </button>
            <button className="tz-btn tz-btn-outline" onClick={onRegister}>
              Đăng ký <FontAwesomeIcon icon={faUserPlus} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export function Footer() {
  const policies = ['Chính sách mua hàng', 'Chính sách đổi trả', 'Chính sách bảo hành', 'Cam kết chất lượng', 'Điều khoản sử dụng', 'Chính sách bảo mật', 'Hệ thống cửa hàng'];
  return (
    <footer className="tz-footer">
      <div className="tz-container tz-fgrid">
        <div className="tz-fcol">
          <div className="tz-flogo"><FontAwesomeIcon icon={faCube} /> TECHZONE</div>
          <ul className="tz-addr">
            <li><strong>Địa chỉ:</strong></li>
            <li><strong>Cơ sở 1:</strong> 221 Vũ Tông Phan - Thanh Xuân - Hà Nội</li>
            <li><strong>Cơ sở 2:</strong> 17 Nguyễn Phong Sắc - Cầu Giấy - Hà Nội</li>
            <li><strong>Cơ sở 3:</strong> 145 Minh Khai - Hai Bà Trưng - Hà Nội</li>
            <li><strong>Cơ sở 4:</strong> 142 Quang Trung - Hà Đông - Hà Nội</li>
            <li><strong>Gọi mua hàng:</strong> 0825.303.888 (8h00 - 22h00)</li>
            <li><strong>Gọi bảo hành:</strong> 0922.702.888 (8h00 - 21h00)</li>
          </ul>
        </div>
        <div className="tz-fcol tz-fcol-policy">
          <h4>Chính sách</h4>
          <ul className="tz-policy">
            {policies.map((x) => (
              <li key={x}><a>{x}</a></li>
            ))}
          </ul>
        </div>
        <div className="tz-fcol">
          <div className="tz-social">
            <a aria-label="Facebook"><FontAwesomeIcon icon={faFacebookF} /></a>
            <a aria-label="TikTok"><FontAwesomeIcon icon={faTiktok} /></a>
            <a aria-label="Youtube"><FontAwesomeIcon icon={faYoutube} /></a>
          </div>
          <p className="tz-feedback">Nhận phản hồi, thắc mắc:<br />anttech.com.vn @gmail.com</p>
          <p className="tz-hotline-row"><FontAwesomeIcon icon={faPhone} /> Tư vấn miễn phí 24/07 :<br /><span className="tz-hotline">0825.303.888</span></p>
          <h4 style={{ marginTop: 16 }}>Fanpage</h4>
          <div className="tz-fpbox">
            <img
              src="https://picsum.photos/seed/techzone-fanpage/200/200"
              alt="TechZone"
            />
            <div>
              <div className="tz-fpname">TechZone - Chính Chủ</div>
              <div className="tz-fpfollow">96.598 người theo dõi</div>
            </div>
          </div>
        </div>
        <div className="tz-fcol">
          <iframe
            title="Bản đồ cửa hàng"
            className="tz-map"
            loading="lazy"
            src="https://www.google.com/maps?q=221+V%C5%A9+T%C3%B4ng+Phan,+Thanh+Xu%C3%A2n,+H%C3%A0+N%E1%BB%99i&output=embed"
          />
        </div>
      </div>
    </footer>
  );
}
