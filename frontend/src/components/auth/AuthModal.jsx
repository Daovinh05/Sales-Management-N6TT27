import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../store/auth.jsx';

function PwField({ label, name, value, onChange, id, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="tz-field">
      <label>{label}</label>
      <div className="tz-pw">
        <input id={id} type={show ? 'text' : 'password'} name={name} value={value} onChange={onChange} placeholder={placeholder} required />
        <span className="tz-eye" onClick={() => setShow((s) => !s)}>
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} />
        </span>
      </div>
    </div>
  );
}

export function LoginModal({ onClose, onSwitch, onCart }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [error, setError] = useState('');
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.username, form.password);
      onClose();
    } catch {
      setError('Sai username hoặc password');
    }
  };

  return (
    <div className="tz-overlay" onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <span className="tz-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></span>
        <div className="tz-title">ĐĂNG NHẬP</div>
        {error && <div className="tz-alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="tz-field">
            <label>Tài khoản</label>
            <input name="username" placeholder="Nhập tài khoản" value={form.username} onChange={set} required />
          </div>
          <PwField label="MẬT KHẨU" name="password" id="loginPw" value={form.password} onChange={set} placeholder="Nhập mật khẩu" />
          <div style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 20, color: '#666' }}>
            <input type="checkbox" name="remember" checked={form.remember} onChange={set} />
            <label>Ghi nhớ đăng nhập</label>
          </div>
          <button className="tz-submit" type="submit">ĐĂNG NHẬP</button>
        </form>
        <div className="tz-mfoot">Chưa có tài khoản? <a onClick={onSwitch}>Đăng ký ngay</a></div>
        <div className="tz-back" onClick={onClose}>← Tiếp tục mua sắm</div>
      </div>
    </div>
  );
}

export function RegisterModal({ onClose, onSwitch, notify }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', username: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Nhập lại mật khẩu chưa khớp'); return; }
    try {
      await register({ username: form.username, password: form.password, email: form.email || undefined, fullName: form.fullName, phone: form.phone });
      onSwitch();
    } catch (err) {
      setError(err?.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="tz-overlay" onClick={onClose}>
      <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
        <span className="tz-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></span>
        <div className="tz-title">ĐĂNG KÝ</div>
        {error && <div className="tz-alert">{error}</div>}
        <form onSubmit={submit}>
          <div className="tz-field"><label>Họ và tên</label><input name="fullName" value={form.fullName} onChange={set} /></div>
          <div className="tz-field"><label>Email</label><input name="email" value={form.email} onChange={set} /></div>
          <div className="tz-field"><label>Số điện thoại</label><input name="phone" value={form.phone} onChange={set} /></div>
          <div className="tz-field"><label>Tài khoản</label><input name="username" value={form.username} onChange={set} required /></div>
          <PwField label="MẬT KHẨU" name="password" id="regPw" value={form.password} onChange={set} />
          <PwField label="NHẬP LẠI MẬT KHẨU" name="confirm" id="regPw2" value={form.confirm} onChange={set} />
          <button className="tz-submit" type="submit">ĐĂNG KÝ</button>
        </form>
        <div className="tz-mfoot">Đã có tài khoản? <a onClick={onSwitch}>Đăng nhập ngay</a></div>
        <div className="tz-back" onClick={onClose}>← Tiếp tục mua sắm</div>
      </div>
    </div>
  );
}
