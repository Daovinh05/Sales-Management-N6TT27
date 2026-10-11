import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';

export default function AccountMenu({ avatar, name, role, onLogout }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="ad-side-foot" ref={boxRef}>
      {open && (
        <div className="ad-account-pop">
          <button type="button" onClick={onLogout}>
            <FontAwesomeIcon icon={faRightFromBracket} className="fa-fw" /> Đăng xuất
          </button>
        </div>
      )}
      <button type="button" className="ad-account" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <img src={avatar} alt="" />
        <span className="ad-account-info">
          <strong>{name}</strong>
          <small>{role}</small>
        </span>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="ad-account-chevron" />
      </button>
    </div>
  );
}
