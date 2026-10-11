import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileExcel, faMagnifyingGlass, faPen, faPlus, faTrash, faUpload, faUsers, faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';
import readXlsxFile from 'read-excel-file/browser';
import { useAuth } from '../../store/auth.jsx';

const apiOrigin = (api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

const avatarFor = (user) => user.avatarUrl
  ? `${apiOrigin}/uploads/avatars/${encodeURIComponent(user.avatarUrl)}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=e8eef9&color=334155&size=64`;

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value))
  : '—';

const getUserRole = (user) => {
  if (user.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
  if (user.roles.includes('ROLE_WAREHOUSE_STAFF')) return 'ROLE_WAREHOUSE_STAFF';
  return 'ROLE_CUSTOMER';
};

const getRoleLabel = (role) => ({
  ROLE_ADMIN: 'Quản trị viên',
  ROLE_WAREHOUSE_STAFF: 'Nhân viên kho',
  ROLE_CUSTOMER: 'Người dùng'
}[role] || 'Người dùng');

function downloadCsv(users) {
  const rows = [['Mã tài khoản', 'Tài khoản', 'Họ và tên', 'Email', 'Số điện thoại', 'Vai trò', 'Trạng thái', 'Ngày tạo'],
    ...users.map((user) => [user.id, user.username, user.fullName, user.email, user.phone,
      getRoleLabel(getUserRole(user)), user.status, formatDate(user.createdAt)])];
  const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
  link.download = 'danh-sach-tai-khoan.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function UserManagement({ notify }) {
  const { user: currentUser, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [idQuery, setIdQuery] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [filters, setFilters] = useState({ id: '', name: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [addingUser, setAddingUser] = useState(false);
  const [role, setRole] = useState('ROLE_CUSTOMER');
  const [editForm, setEditForm] = useState({ username: '', email: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', email: '', phone: '', role: 'ROLE_CUSTOMER' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef(null);
  const avatarInput = useRef(null);

  useEffect(() => () => {
    if (avatarPreview.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch {
      setError('Không tải được danh sách tài khoản. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filteredUsers = useMemo(() => {
    const name = filters.name.toLocaleLowerCase('vi');
    return users.filter((user) => String(user.id).includes(filters.id)
      && `${user.username} ${user.fullName || ''}`.toLocaleLowerCase('vi').includes(name));
  }, [users, filters]);

  const userPageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const userSafePage = Math.min(Math.max(1, page), userPageCount);
  const pageUsers = filteredUsers.slice((userSafePage - 1) * pageSize, userSafePage * pageSize);

  const openCreate = () => {
    setForm({ username: '', password: '', fullName: '', email: '', phone: '', role: 'ROLE_CUSTOMER' });
    setAddingUser(true);
    setError('');
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setRole(getUserRole(user));
    setEditForm({ username: user.username, email: user.email || '' });
    setAvatarFile(null);
    setAvatarPreview(avatarFor(user));
    setRemoveAvatar(false);
    setError('');
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('data', new Blob([JSON.stringify({
        username: editForm.username.trim(),
        email: editForm.email.trim() || null,
        role,
        removeAvatar
      })], { type: 'application/json' }));
      if (avatarFile) data.append('avatar', avatarFile);
      await api.put(`/users/${editingUser.id}`, data);
      const usernameChangedForCurrentUser = Number(currentUser?.id) === editingUser.id
        && currentUser.username !== editForm.username.trim();
      setEditingUser(null);
      if (usernameChangedForCurrentUser) {
        window.alert('Tên đăng nhập đã thay đổi. Vui lòng đăng nhập lại bằng tên mới.');
        logout();
        return;
      }
      await loadUsers();
      notify?.('success', 'Đã cập nhật tài khoản.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể cập nhật tài khoản. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const saveNewUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/users', { ...form, username: form.username.trim(), email: form.email.trim() || null });
      setAddingUser(false);
      await loadUsers();
      notify?.('success', 'Đã tạo tài khoản.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể tạo tài khoản. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user) => {
    setError('');
    try {
      await api.delete(`/users/${user.id}`);
      notify?.('success', `Đã xóa tài khoản ${user.username}.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa tài khoản.');
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setSaving(true);
    try {
      const rows = await readXlsxFile(file, { sheet: 1 });
      if (rows.length < 2) {
        setError('Tệp Excel cần có dòng tiêu đề và ít nhất một tài khoản.');
        return;
      }
      const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const headers = rows[0].map(normalize);
      const column = (row, names) => {
        const index = headers.findIndex((header) => names.includes(header));
        return index >= 0 ? String(row[index] ?? '').trim() : '';
      };
      let imported = 0;
      let failed = 0;
      for (const row of rows.slice(1)) {
        const username = column(row, ['username', 'account', 'taikhoan', 'tendangnhap']);
        const password = column(row, ['password', 'matkhau']);
        if (!username || password.length < 6) { failed += 1; continue; }
        const rawRole = normalize(column(row, ['role', 'quyen', 'vaitro']));
        const importedRole = rawRole.includes('admin') || rawRole.includes('quantri')
          ? 'ROLE_ADMIN'
          : rawRole.includes('warehouse') || rawRole.includes('staff') || rawRole.includes('nhanvienkho')
            ? 'ROLE_WAREHOUSE_STAFF'
            : 'ROLE_CUSTOMER';
        try {
          await api.post('/users', {
            username,
            password,
            fullName: column(row, ['fullname', 'hoten', 'name', 'ten']),
            email: column(row, ['email']) || null,
            phone: column(row, ['phone', 'sodienthoai']),
            role: importedRole
          });
          imported += 1;
        } catch {
          failed += 1;
        }
      }
      await loadUsers();
      notify?.('success', `Đã nhập ${imported} tài khoản${failed ? `, ${failed} dòng bị bỏ qua hoặc lỗi` : ''}.`);
    } catch {
      setError('Không đọc được tệp Excel. Vui lòng chọn tệp .xlsx hợp lệ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ad-brand-page ad-user-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faUsers} /> Quản lý tài khoản</h2>
            <p>Quản lý tài khoản người dùng và quản trị viên đã đăng ký.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm người dùng
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => fileInput.current?.click()} disabled={saving}>
              <FontAwesomeIcon icon={faFileExcel} /> Nhập Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx" hidden onChange={importExcel} />
            <button className="ad-button ad-button-quiet" type="button" onClick={() => downloadCsv(filteredUsers)}>
              <FontAwesomeIcon icon={faDownload} /> Xuất CSV
            </button>
          </div>
        </div>

        <form className="ad-user-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ id: idQuery.trim(), name: nameQuery.trim() });
        }}>
          <label>MÃ USER
            <input value={idQuery} onChange={(event) => setIdQuery(event.target.value)} placeholder="Nhập mã user..." inputMode="numeric" />
          </label>
          <label>TÊN USER
            <input value={nameQuery} onChange={(event) => setNameQuery(event.target.value)} placeholder="Nhập tên user..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setIdQuery(''); setNameQuery(''); setFilters({ id: '', name: '' }); setPage(1);
            }}>Làm mới</button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faFileExcel} /> Danh sách tài khoản</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredUsers.length} tài khoản`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-user-table">
            <thead><tr><th>STT</th><th>AVATAR</th><th>MÃ USER</th><th>HỌ TÊN</th><th>ACCOUNT</th><th>EMAIL</th><th>QUYỀN</th><th>NGÀY TẠO</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="9" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageUsers.length ? pageUsers.map((user, index) => {
                  const isAdmin = user.roles.includes('ROLE_ADMIN');
                  return <tr key={user.id}>
                    <td className="ad-brand-index">{(userSafePage - 1) * pageSize + index + 1}</td>
                    <td><img className="ad-user-avatar" src={avatarFor(user)} alt="" onError={(event) => {
                      event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || user.username)}&background=e8eef9&color=334155&size=64`;
                    }} /></td>
                    <td>{user.id}</td><td>{user.fullName || '—'}</td><td className="ad-user-name">{user.username}</td>
                    <td>{user.email || '—'}</td>
                    <td><span className={`ad-role-badge ${isAdmin ? 'admin' : ''}`}>{getRoleLabel(getUserRole(user))}</span></td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" type="button" title="Sửa vai trò" onClick={() => openEdit(user)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" type="button" title="Xóa tài khoản" onClick={() => setDeleteTarget(user)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>;
                }) : <tr><td colSpan="9" className="ad-table-empty">Không tìm thấy tài khoản phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !filteredUsers.length && (
            <EmptyState
              title="Chưa có tài khoản nào"
              hint="Bấm Thêm mới để tạo tài khoản đầu tiên"
              actionLabel="Thêm mới"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={userSafePage} pageSize={pageSize} total={filteredUsers.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={loadUsers}
        />
        {deleteTarget && (
          <ConfirmModal
            message={<>Bạn có chắc muốn xóa tài khoản <strong>{deleteTarget.username}</strong>?</>}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => deleteUser(deleteTarget)}
          />
        )}
      </section>

      {(editingUser || addingUser) && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) { setEditingUser(null); setAddingUser(false); }
      }}>
        <form className="ad-brand-dialog" onSubmit={addingUser ? saveNewUser : saveUser}>
          <div className="ad-dialog-heading">
            <h2>{addingUser ? 'Thêm người dùng' : 'Sửa tài khoản'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => { setEditingUser(null); setAddingUser(false); }}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          {addingUser ? <>
            <div className="ad-user-form-grid">
              <label>Tài khoản<input required minLength="3" maxLength="50" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></label>
              <label>Mật khẩu<input required type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
              <label>Họ và tên<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>
              <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Số điện thoại<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
              <label>Quyền<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="ROLE_CUSTOMER">Người dùng</option>
                <option value="ROLE_ADMIN">Quản trị viên</option>
                <option value="ROLE_WAREHOUSE_STAFF">Nhân viên kho</option>
              </select></label>
            </div>
          </> : <>
            <div className="ad-user-avatar-editor">
              <img className="ad-user-avatar-preview" src={avatarPreview} alt="Ảnh đại diện xem trước" />
              <div className="ad-user-avatar-controls">
                <span>Ảnh đại diện</span>
                <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  setAvatarFile(file);
                  setAvatarPreview(URL.createObjectURL(file));
                  setRemoveAvatar(false);
                }} />
                <button className="ad-button ad-button-quiet" type="button" onClick={() => avatarInput.current?.click()}>Chọn ảnh</button>
                {editingUser.avatarUrl && <button className="ad-button ad-button-quiet" type="button" onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(`https://ui-avatars.com/api/?name=${encodeURIComponent(editingUser.fullName || editForm.username)}&background=e8eef9&color=334155&size=64`);
                  setRemoveAvatar(true);
                }}>Dùng mặc định</button>}
              </div>
            </div>
            <label>Tên đăng nhập<input required minLength="3" maxLength="50" value={editForm.username} onChange={(event) => setEditForm({ ...editForm, username: event.target.value })} /></label>
            <label>Email<input type="email" maxLength="100" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} /></label>
            <label>Vai trò<select value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="ROLE_CUSTOMER">Người dùng</option>
              <option value="ROLE_ADMIN">Quản trị viên</option>
              <option value="ROLE_WAREHOUSE_STAFF">Nhân viên kho</option>
            </select></label>
          </>}
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => { setEditingUser(null); setAddingUser(false); }}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : addingUser ? 'Tạo tài khoản' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}