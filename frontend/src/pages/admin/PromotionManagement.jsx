import { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faGift, faMagnifyingGlass, faPen, faPlus, faTrash, faFileExcel, faXmark
} from '@fortawesome/free-solid-svg-icons';
import readXlsxFile from 'read-excel-file/browser';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';
import ConfirmModal from '../../components/common/ConfirmModal.jsx';

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '—';

const formatAmount = (value) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0
}).format(Number(value));

const toInputDateTime = (value) => value ? value.slice(0, 16) : '';

const toApiDateTime = (value) => value ? `${value}:00` : '';

const normalizeHeader = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

function parseExcelDateTime(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const pad = (number) => String(number).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:00`;
  }
  const text = String(value ?? '').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}T${iso[4] || '00'}:${iso[5] || '00'}:${iso[6] || '00'}`;
  const vietnamese = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!vietnamese) return '';
  const [, day, month, year, hour = '00', minute = '00', second = '00'] = vietnamese;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:${second}`;
}

function getStatus(promotion, now) {
  const startsAt = new Date(promotion.startsAt).getTime();
  const endsAt = new Date(promotion.endsAt).getTime();
  if (now < startsAt) return 'Sắp diễn ra';
  if (now > endsAt) return 'Hết khuyến mãi';
  return 'Còn khuyến mãi';
}

export default function PromotionManagement({ notify }) {
  const [promotions, setPromotions] = useState([]);
  const [queries, setQueries] = useState({ code: '', name: '' });
  const [filters, setFilters] = useState({ code: '', name: '' });
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', discountAmount: '', startsAt: '', endsAt: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const fileInput = useRef(null);

  const loadPromotions = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/promotions');
      setPromotions(data);
    } catch {
      setError('Không tải được danh sách khuyến mãi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPromotions(); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredPromotions = useMemo(() => promotions.filter((promotion) =>
    promotion.code.toLocaleLowerCase('vi').includes(filters.code.toLocaleLowerCase('vi'))
    && promotion.name.toLocaleLowerCase('vi').includes(filters.name.toLocaleLowerCase('vi'))
  ), [promotions, filters]);

  const pageCount = Math.max(1, Math.ceil(filteredPromotions.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pagePromotions = filteredPromotions.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openCreate = () => {
    setForm({ code: '', name: '', discountAmount: '', startsAt: '', endsAt: '' });
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (promotion) => {
    setForm({
      code: promotion.code,
      name: promotion.name,
      discountAmount: String(promotion.discountAmount),
      startsAt: toInputDateTime(promotion.startsAt),
      endsAt: toInputDateTime(promotion.endsAt)
    });
    setDialog({ mode: 'edit', code: promotion.code });
    setError('');
  };

  const savePromotion = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      code: form.code.trim(),
      name: form.name.trim(),
      discountAmount: Number(form.discountAmount),
      startsAt: toApiDateTime(form.startsAt),
      endsAt: toApiDateTime(form.endsAt)
    };
    try {
      if (dialog.mode === 'create') await api.post('/promotions', payload);
      else await api.put(`/promotions/${encodeURIComponent(dialog.code)}`, payload);
      setDialog(null);
      await loadPromotions();
      notify?.('success', 'Đã lưu khuyến mãi.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu khuyến mãi. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removePromotion = async (promotion) => {
    setError('');
    try {
      await api.delete(`/promotions/${encodeURIComponent(promotion.code)}`);
      notify?.('success', `Đã xóa khuyến mãi ${promotion.name}.`);
      setDeleteTarget(null);
      await loadPromotions();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa khuyến mãi.');
    }
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const rows = await readXlsxFile(file, { sheet: 1 });
      if (rows.length < 2) {
        setError('Tệp Excel cần có dòng tiêu đề và ít nhất một khuyến mãi.');
        return;
      }
      const headers = rows[0].map(normalizeHeader);
      const column = (aliases) => headers.findIndex((header) => aliases.includes(header));
      const indexes = {
        code: column(['makhuyenmai', 'code', 'promotioncode']),
        name: column(['tenkhuyenmai', 'name', 'promotionname']),
        amount: column(['tienkhuyenmai', 'sotiengiam', 'discountamount', 'amount']),
        startsAt: column(['ngaybatdau', 'thoigianbatdau', 'startsat', 'startdate']),
        endsAt: column(['ngayketthuc', 'thoigianketthuc', 'endsat', 'enddate'])
      };
      if (Object.values(indexes).some((index) => index < 0)) {
        setError('Tệp cần có các cột mã, tên, tiền khuyến mãi, ngày bắt đầu và ngày kết thúc.');
        return;
      }
      let imported = 0;
      let failed = 0;
      for (const row of rows.slice(1)) {
        const code = String(row[indexes.code] ?? '').trim();
        const name = String(row[indexes.name] ?? '').trim();
        const discountAmount = Number(row[indexes.amount]);
        const startsAt = parseExcelDateTime(row[indexes.startsAt]);
        const endsAt = parseExcelDateTime(row[indexes.endsAt]);
        if (!code || !name || !Number.isFinite(discountAmount) || !startsAt || !endsAt || endsAt < startsAt) {
          failed += 1;
          continue;
        }
        try {
          await api.post('/promotions', { code, name, discountAmount, startsAt, endsAt });
          imported += 1;
        } catch {
          failed += 1;
        }
      }
      await loadPromotions();
      notify?.('success', `Đã nhập ${imported}/${rows.length - 1} khuyến mãi${failed ? `; ${failed} dòng lỗi hoặc bị bỏ qua` : ''}.`);
    } catch {
      setError('Không đọc được tệp Excel. Vui lòng chọn tệp .xlsx hợp lệ.');
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = async () => {
    const rows = [
      ['Mã khuyến mãi', 'Tên khuyến mãi', 'Tiền khuyến mãi', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái'],
      ...filteredPromotions.map((promotion) => [
        promotion.code,
        promotion.name,
        Number(promotion.discountAmount),
        formatDateTime(promotion.startsAt),
        formatDateTime(promotion.endsAt),
        getStatus(promotion, now)
      ])
    ];
    await writeXlsxFile(rows, { sheet: 'Khuyen mai' }).toFile('danh-sach-khuyen-mai.xlsx');
  };

  return (
    <div className="ad-brand-page ad-promotion-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faGift} /> Quản lý Khuyến Mãi</h2>
            <p>Theo dõi và quản lý các chương trình khuyến mãi.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm mới khuyến mãi
            </button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => fileInput.current?.click()} disabled={saving}>
              <FontAwesomeIcon icon={faFileExcel} /> Nhập Excel
            </button>
            <input ref={fileInput} type="file" accept=".xlsx" hidden onChange={importExcel} />
          </div>
        </div>

        <form className="ad-promotion-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ code: queries.code.trim(), name: queries.name.trim() });
        }}>
          <label>MÃ KHUYẾN MÃI
            <input value={queries.code} onChange={(event) => setQueries({ ...queries, code: event.target.value })} placeholder="Nhập mã khuyến mãi..." />
          </label>
          <label>TÊN KHUYẾN MÃI
            <input value={queries.name} onChange={(event) => setQueries({ ...queries, name: event.target.value })} placeholder="Nhập tên khuyến mãi..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setQueries({ code: '', name: '' });
              setFilters({ code: '', name: '' });
              setPage(1);
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!filteredPromotions.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && <p className="ad-brand-message" role="alert">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faGift} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredPromotions.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-promotion-table">
            <thead><tr><th>STT</th><th>MÃ KM</th><th>TÊN KHUYẾN MÃI</th><th>TIỀN KHUYẾN MÃI</th><th>NGÀY BẮT ĐẦU</th><th>NGÀY KẾT THÚC</th><th>TRẠNG THÁI KHUYẾN MÃI</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pagePromotions.length ? pagePromotions.map((promotion, index) => {
                  const status = getStatus(promotion, now);
                  const statusClass = status === 'Còn khuyến mãi' ? 'active' : status === 'Hết khuyến mãi' ? 'expired' : 'upcoming';
                  return <tr key={promotion.code}>
                    <td className="ad-brand-index">{(safePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{promotion.code}</td>
                    <td>{promotion.name}</td>
                    <td>{formatAmount(promotion.discountAmount)}</td>
                    <td>{formatDateTime(promotion.startsAt)}</td>
                    <td>{formatDateTime(promotion.endsAt)}</td>
                    <td><span className={`ad-promotion-status ${statusClass}`}>{status}</span></td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" type="button" title="Sửa khuyến mãi" onClick={() => openEdit(promotion)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" type="button" title="Xóa khuyến mãi" onClick={() => setDeleteTarget(promotion)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>;
                }) : <tr><td colSpan="8" className="ad-table-empty">Chưa có khuyến mãi phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !filteredPromotions.length && (
            <EmptyState
              title="Chưa có khuyến mãi nào"
              hint="Bấm Thêm mới khuyến mãi để tạo chương trình đầu tiên"
              actionLabel="Thêm mới khuyến mãi"
              onAction={openCreate}
            />
          )}
        </div>
        <Pagination
          page={safePage} pageSize={pageSize} total={filteredPromotions.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={loadPromotions}
        />
        {deleteTarget && (
          <ConfirmModal
            message={<>Bạn có chắc muốn xóa khuyến mãi <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?</>}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => removePromotion(deleteTarget)}
          />
        )}
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog ad-promotion-dialog" onSubmit={savePromotion}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm khuyến mãi' : 'Cập nhật khuyến mãi'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Mã khuyến mãi
            <input required maxLength="20" disabled={dialog.mode === 'edit'} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })} placeholder="Ví dụ: KM08" />
          </label>
          <label>Tên khuyến mãi
            <input required maxLength="100" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Nhập tên khuyến mãi" />
          </label>
          <label>Tiền khuyến mãi (đ)
            <input required type="number" min="0" step="1" value={form.discountAmount} onChange={(event) => setForm({ ...form, discountAmount: event.target.value })} />
          </label>
          <label>Ngày bắt đầu
            <input required type="datetime-local" step="60" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
          </label>
          <label>Ngày kết thúc
            <input required type="datetime-local" step="60" min={form.startsAt} value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} />
          </label>
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu khuyến mãi'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}