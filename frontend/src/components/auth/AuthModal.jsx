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
  const { login, forgotPassword, resetPassword } = useAuth();
  const [view, setView] = useState('login'); // login | forgot-step1 | forgot-step2
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [forgot, setForgot] = useState({ username: '', token: '', newPassword: '', confirm: '' });
  const [demoToken, setDemoToken] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const setF = (e) => setForgot({ ...forgot, [e.target.name]: e.target.value });

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

  const toForgot = () => { setError(''); setInfo(''); setView('forgot-step1'); };

  const submitForgotStep1 = async (e) => {
    e.preventDefault();
    setError(''); setInfo(''); setBusy(true);
    try {
      const data = await forgotPassword(forgot.username.trim());
      setInfo(data?.message || 'Nếu tài khoản tồn tại, mã đã được gửi');
      if (data?.resetToken) {
        setDemoToken(data.resetToken);
        setForgot((f) => ({ ...f, token: data.resetToken }));
      }
      setView('forgot-step2');
    } catch (err) {
      setError(err?.response?.data?.message || 'Không gửi được mã, thử lại sau');
    } finally {
      setBusy(false);
    }
  };

  const submitForgotStep2 = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!forgot.token.trim()) { setError('Vui lòng nhập mã đặt lại'); return; }
    if (forgot.newPassword.length < 6) { setError('Mật khẩu mới phải từ 6 ký tự trở lên'); return; }
    if (forgot.newPassword !== forgot.confirm) { setError('Nhập lại mật khẩu chưa khớp'); return; }
    setBusy(true);
    try {
      await resetPassword(forgot.token.trim(), forgot.newPassword);
      setInfo('Đặt lại mật khẩu thành công, mời đăng nhập lại');
      setView('login');
      setForm((f) => ({ ...f, password: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.newPassword || 'Mã không hợp lệ hoặc đã hết hạn');
    } finally {
      setBusy(false);
    }
  };

  if (view !== 'login') {
    return (
      <div className="tz-overlay" onClick={onClose}>
        <div className="tz-modal" onClick={(e) => e.stopPropagation()}>
          <span className="tz-close" onClick={onClose}><FontAwesomeIcon icon={faXmark} /></span>
          <div className="tz-title">QUÊN MẬT KHẨU</div>
          {error && <div className="tz-alert">{error}</div>}
          {info && <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{info}</div>}
          {view === 'forgot-step1' && (
            <form onSubmit={submitForgotStep1}>
              <div className="tz-field">
                <label>Tài khoản hoặc email</label>
                <input name="username" placeholder="Nhập tài khoản hoặc email" value={forgot.username} onChange={setF} required />
              </div>
              <button className="tz-submit" type="submit" disabled={busy}>{busy ? 'ĐANG GỬI...' : 'GỬI MÃ ĐẶT LẠI'}</button>
            </form>
          )}
          {view === 'forgot-step2' && (
            <form onSubmit={submitForgotStep2}>
              {demoToken && (
                <div style={{ background: '#fff8e1', color: '#7a5c00', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                  Mã demo (chưa có SMTP): <b style={{ userSelect: 'all' }}>{demoToken}</b>
                </div>
              )}
              <div className="tz-field">
                <label>Mã đặt lại</label>
                <input name="token" placeholder="Nhập mã vừa nhận" value={forgot.token} onChange={setF} required />
              </div>
              <PwField label="MẬT KHẨU MỚI (≥ 6 KÝ TỰ)" name="newPassword" id="forgotPw" value={forgot.newPassword} onChange={setF} placeholder="Nhập mật khẩu mới" />
              <PwField label="NHẬP LẠI MẬT KHẨU MỚI" name="confirm" id="forgotPw2" value={forgot.confirm} onChange={setF} placeholder="Nhập lại mật khẩu mới" />
              <button className="tz-submit" type="submit" disabled={busy}>{busy ? 'ĐANG XỬ LÝ...' : 'ĐẶT LẠI MẬT KHẨU'}</button>
            </form>
          )}
          <div className="tz-mfoot"><a onClick={() => { setView('login'); setError(''); setInfo(''); }}>← Quay lại đăng nhập</a></div>
          <div className="tz-back" onClick={onClose}>← Tiếp tục mua sắm</div>
        </div>
      </div>
    );
  }

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
        <div className="tz-mfoot" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <a onClick={toForgot}>Quên mật khẩu?</a>
          <span>Chưa có tài khoản? <a onClick={onSwitch}>Đăng ký ngay</a></span>
        </div>
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
