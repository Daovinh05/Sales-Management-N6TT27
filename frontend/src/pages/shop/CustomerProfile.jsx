import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faFloppyDisk, faRotateLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../store/auth.jsx';
import api from '../../services/api.js';

const emptyProfile = { username: '', fullName: '', email: '', phone: '', address: '', createdAt: null };

export default function CustomerProfile({ onBack, notify }) {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ ...emptyProfile, username: user?.username || '' });
  const [savedProfile, setSavedProfile] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api.get('/users/me')
      .then(({ data }) => {
        if (!active) return;
        setProfile(data);
        setSavedProfile(data);
      })
      .catch((requestError) => {
        if (active) {
          const status = requestError?.response?.status;
          setLoadError(status
            ? `Không tải được thông tin tài khoản (HTTP ${status}). Vui lòng thử lại.`
            : 'Không kết nối được máy chủ. Kiểm tra backend rồi thử lại.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadAttempt]);

  const setField = (event) => {
    setProfile((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile({
        fullName: profile.fullName,
        email: profile.email.trim() || null,
        phone: profile.phone,
        address: profile.address,
      });
      setProfile(updated);
      setSavedProfile(updated);
      notify('success', 'Đã cập nhật thông tin tài khoản');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setProfile(savedProfile);
    setError('');
  };

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
    : 'Thành viên TechZone';

  return (
    <main className="kh-body kh-profile-page">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Tài khoản</div>
        <button type="button" className="kh-profile-back" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại cửa hàng
        </button>
        <div className="kh-profile-layout">
          <aside className="kh-profile-aside">
            <div className="kh-profile-avatar"><FontAwesomeIcon icon={faUser} /></div>
            <h2>{profile.fullName || profile.username}</h2>
            <p>@{profile.username}</p>
            <span className="kh-profile-role">Khách hàng</span>
            <div className="kh-profile-member">Thành viên từ <strong>{joined}</strong></div>
          </aside>

          <section className="kh-profile-content">
            <div className="kh-profile-heading">
              <div>
                <span className="kh-profile-eyebrow">TÀI KHOẢN CỦA TÔI</span>
                <h1>Thông tin cá nhân</h1>
                <p>Quản lý thông tin dùng cho tài khoản và đơn hàng của bạn.</p>
              </div>
            </div>

            {error && <div className="kh-profile-alert" role="alert">{error}</div>}
            {loading ? (
              <div className="kh-profile-loading">Đang tải thông tin tài khoản...</div>
            ) : loadError ? (
              <div className="kh-profile-load-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                  <FontAwesomeIcon icon={faRotateLeft} /> Thử tải lại
                </button>
              </div>
            ) : (
              <form className="kh-profile-form" onSubmit={save}>
                <label className="kh-profile-field">
                  <span>Tên đăng nhập</span>
                  <input value={profile.username || ''} disabled />
                  <small>Tên đăng nhập không thể thay đổi.</small>
                </label>
                <label className="kh-profile-field">
                  <span>Họ và tên</span>
                  <input name="fullName" value={profile.fullName || ''} onChange={setField} maxLength="100" placeholder="Nhập họ và tên" />
                </label>
                <label className="kh-profile-field">
                  <span>Email</span>
                  <input name="email" type="email" value={profile.email || ''} onChange={setField} maxLength="100" placeholder="you@example.com" />
                </label>
                <label className="kh-profile-field">
                  <span>Số điện thoại</span>
                  <input name="phone" type="tel" value={profile.phone || ''} onChange={setField} maxLength="20" placeholder="Nhập số điện thoại" />
                </label>
                <label className="kh-profile-field kh-profile-address">
                  <span>Địa chỉ</span>
                  <textarea name="address" value={profile.address || ''} onChange={setField} maxLength="255" rows="3" placeholder="Nhập địa chỉ nhận hàng" />
                </label>
                <div className="kh-profile-actions">
                  <button type="button" className="kh-profile-cancel" onClick={reset} disabled={saving}>
                    <FontAwesomeIcon icon={faRotateLeft} /> Hoàn tác
                  </button>
                  <button type="submit" className="kh-profile-save" disabled={saving}>
                    <FontAwesomeIcon icon={faFloppyDisk} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}