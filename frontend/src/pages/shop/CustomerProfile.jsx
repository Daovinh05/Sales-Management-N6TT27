import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCamera, faFloppyDisk, faRotateLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../store/auth.jsx';
import api from '../../services/api.js';

const emptyProfile = { username: '', fullName: '', email: '', phone: '', address: '', createdAt: null };
const apiOrigin = (api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

export default function CustomerProfile({ onBack, notify }) {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({ ...emptyProfile, username: user?.username || '' });
  const [savedProfile, setSavedProfile] = useState(profile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const avatarInput = useRef(null);

  useEffect(() => () => {
    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    api.get('/users/me')
      .then(({ data }) => {
        if (!active) return;
        setProfile(data);
        setSavedProfile(data);
        setAvatarFile(null);
        setAvatarPreview('');
        setRemoveAvatar(false);
        setAvatarLoadError(false);
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
        removeAvatar
      }, avatarFile);
      setProfile(updated);
      setSavedProfile(updated);
      setAvatarFile(null);
      setAvatarPreview('');
      setRemoveAvatar(false);
      setAvatarLoadError(false);
      notify('success', 'Đã cập nhật thông tin tài khoản');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setProfile(savedProfile);
    setAvatarFile(null);
    setAvatarPreview('');
    setRemoveAvatar(false);
    setAvatarLoadError(false);
    setError('');
  };

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
    : 'Thành viên TechZone';
  const savedAvatarUrl = profile.avatarUrl && !removeAvatar
    ? `${apiOrigin}/uploads/avatars/${encodeURIComponent(profile.avatarUrl)}`
    : '';
  const displayedAvatarUrl = avatarPreview || savedAvatarUrl;

  return (
    <main className="kh-body kh-profile-page">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Tài khoản</div>
        <button type="button" className="kh-profile-back" onClick={onBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Quay lại cửa hàng
        </button>
        <div className="kh-profile-layout">
          <aside className="kh-profile-aside">
            <div className="kh-profile-avatar">
              {displayedAvatarUrl && !avatarLoadError
                ? <img src={displayedAvatarUrl} alt="Ảnh đại diện" onError={() => setAvatarLoadError(true)} />
                : <FontAwesomeIcon icon={faUser} />}
            </div>
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
                <div className="kh-profile-avatar-edit">
                  <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                    setRemoveAvatar(false);
                    setAvatarLoadError(false);
                  }} />
                  <button type="button" className="kh-profile-avatar-button" onClick={() => avatarInput.current?.click()} disabled={saving}>
                    <FontAwesomeIcon icon={faCamera} /> {avatarPreview ? 'Đổi ảnh đại diện' : 'Chọn ảnh đại diện'}
                  </button>
                  {(profile.avatarUrl || avatarFile) && <button type="button" className="kh-profile-avatar-reset" onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview('');
                    setRemoveAvatar(Boolean(profile.avatarUrl));
                    setAvatarLoadError(false);
                  }} disabled={saving}>Dùng ảnh mặc định</button>}
                </div>
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