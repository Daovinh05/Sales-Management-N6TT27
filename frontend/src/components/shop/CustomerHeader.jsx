import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCircleCheck, faRotateLeft, faPhoneVolume, faTruckFast,
  faMagnifyingGlass, faCartShopping, faUserGear, faBoxOpen, faRightFromBracket, faChevronDown,
  faClock, faTrash, faXmark
} from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef, useState } from 'react';
import { clearHistory, fetchSuggestions, getHistory, removeKeyword, saveKeyword } from '../../services/search.js';
import { useAuth } from '../../store/auth.jsx';

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

export function CustomerHeader({ cartCount, onCart, onSearch, onAccount, onSubmitSearch, onView }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [suggests, setSuggests] = useState([]);
  const [history, setHistory] = useState([]);
  const [drop, setDrop] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const timer = useRef(null);
  const termRef = useRef('');
  const username = user?.username;

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setDrop(false);
    };
    document.addEventListener('mousedown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      clearTimeout(timer.current);
    };
  }, []);

  const handleChange = (v) => {
    setTerm(v);
    termRef.current = v;
    onSearch?.(v);
    setDrop(true);
    clearTimeout(timer.current);
    if (!v.trim()) {
      setSuggests([]);
      setBusy(false);
      setHistory(getHistory(username));
      return;
    }
    setBusy(true);
    timer.current = setTimeout(async () => {
      const q = termRef.current.trim();
      if (!q) { setSuggests([]); setBusy(false); return; }
      try {
        const list = await fetchSuggestions(q);
        if (termRef.current.trim() === q) setSuggests(list);
      } catch {
        setSuggests([]);
      } finally {
        setBusy(false);
      }
    }, 300);
  };

  const submit = (keyword) => {
    const word = (keyword ?? term).trim();
    if (word) {
      setTerm(word);
      termRef.current = word;
      setHistory(saveKeyword(username, word));
    }
    setDrop(false);
    onSubmitSearch?.(word);
  };

  const pickSuggestion = (s) => {
    setTerm(s.name);
    termRef.current = s.name;
    onSearch?.(s.name);
    setHistory(saveKeyword(username, s.name));
    setDrop(false);
    onView?.(s.code);
  };
  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.username || 'K') + '&background=006a5b&color=fff';
  const toggleAccountMenu = () => setOpen((current) => !current);
  const openProfile = () => {
    setOpen(false);
    onAccount?.();
  };

  return (
    <header className="kh-header">
      <div className="tz-container">
        <a className="kh-logo">TECHZONE</a>
        <form
          className="kh-search kh-search-wrap" ref={boxRef}
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <input
            placeholder="Tìm kiếm sản phẩm..." value={term}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { setHistory(getHistory(username)); setDrop(true); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setDrop(false); }}
          />
          <button type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /><span>Tìm kiếm ngay</span></button>
          {drop && (
            <div className="kh-sdrop">
              {term.trim() ? (
                busy ? <div className="kh-sempty">Đang tìm...</div>
                  : suggests.length === 0 ? <div className="kh-sempty">Không có gợi ý phù hợp.</div>
                    : suggests.map((s) => (
                      <div key={s.code} className="kh-sitem" onClick={() => pickSuggestion(s)}>
                        {s.img ? <img src={s.img} alt="" /> : <div className="kh-snoimg">?</div>}
                        <span>{s.name}</span>
                      </div>
                    ))
              ) : (
                <>
                  <div className="kh-sdrop-h">
                    <span>Tìm kiếm gần đây</span>
                    {history.length > 0 && (
                      <button type="button" onClick={() => setHistory(clearHistory(username))}>
                        <FontAwesomeIcon icon={faTrash} /> Xóa tất cả
                      </button>
                    )}
                  </div>
                  {history.length === 0 ? <div className="kh-sempty">Chưa có lịch sử tìm kiếm.</div>
                    : history.map((k) => (
                      <div key={k} className="kh-sitem" onClick={() => submit(k)}>
                        <FontAwesomeIcon icon={faClock} className="kh-sclock" />
                        <span>{k}</span>
                        <button
                          type="button" aria-label="Xóa từ khóa" className="kh-sx"
                          onClick={(e) => { e.stopPropagation(); setHistory(removeKeyword(username, k)); }}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    ))}
                </>
              )}
            </div>
          )}
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
