import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileInvoice, faPlusCircle, faMobileScreen, faChartPie
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../store/auth.jsx';
import AppToast from '../components/common/AppToast.jsx';
import AccountMenu from '../components/common/AccountMenu.jsx';
import ImportHistory from '../pages/staff/ImportHistory.jsx';
import ImportCreate from '../pages/staff/ImportCreate.jsx';
import StaffDashboard from '../pages/staff/StaffDashboard.jsx';

const MENU = [
  { icon: faChartPie, label: 'Bàn làm việc', path: '/' },
  { icon: faFileInvoice, label: 'Lịch sử nhập kho', path: '/staff/imports' },
  { icon: faPlusCircle, label: 'Lập phiếu nhập mới', path: '/staff/imports/create' }
];

const PATH_TO_PAGE = Object.fromEntries(MENU.map((m) => [m.path, m.label]));
const PAGE_TO_PATH = Object.fromEntries(MENU.map((m) => [m.label, m.path]));

const pageFromHash = () => {
  const path = window.location.hash.replace(/^#/, '') || '/';
  return PATH_TO_PAGE[path] || 'Bàn làm việc';
};

export default function StaffLayout({ notify, toasts = [] }) {
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

  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'S') + '&background=10b981&color=fff';

  return (
    <div className="ad-wrap">
      <AppToast toasts={toasts} />
      <aside className="ad-side">
        <div className="ad-brand" onClick={() => go('Bàn làm việc')} title="Về trang chủ" style={{ cursor: 'pointer' }}><FontAwesomeIcon icon={faMobileScreen} /> Phone Store (Kho)</div>
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
          role="Nhân viên kho"
          onLogout={logout}
        />
      </aside>
      <div className="ad-main">
        <header className="ad-top">
          <div className="ad-title">{activePage}</div>
        </header>
        <div className="ad-content">
          {activePage === 'Bàn làm việc' ? (
            <StaffDashboard notify={notify} />
          ) : activePage === 'Lịch sử nhập kho' ? (
            <ImportHistory notify={notify} />
          ) : activePage === 'Lập phiếu nhập mới' ? (
            <ImportCreate notify={notify} onSuccess={() => go('Lịch sử nhập kho')} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
