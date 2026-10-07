import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload, faMagnifyingGlass, faPen, faPlus, faStar, faTrash, faXmark
} from '@fortawesome/free-solid-svg-icons';
import writeXlsxFile from 'write-excel-file/browser';
import api from '../../services/api.js';
import Pagination from '../../components/admin/Pagination.jsx';
import EmptyState from '../../components/admin/EmptyState.jsx';

const formatDate = (value) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
  : '—';

export default function ReviewManagement() {
  const [reviews, setReviews] = useState([]);
  const [queries, setQueries] = useState({ code: '', customer: '', product: '' });
  const [filters, setFilters] = useState({ code: '', customer: '', product: '' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ customerName: '', productName: '', rating: '5', content: '', reply: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/reviews');
      setReviews(data);
    } catch {
      setError('Không tải được danh sách đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const filteredReviews = useMemo(() => reviews.filter((review) =>
    review.code.toLowerCase().includes(filters.code.toLowerCase())
    && review.customerName.toLocaleLowerCase('vi').includes(filters.customer.toLocaleLowerCase('vi'))
    && review.productName.toLocaleLowerCase('vi').includes(filters.product.toLocaleLowerCase('vi'))
  ), [reviews, filters]);

  const reviewPageCount = Math.max(1, Math.ceil(filteredReviews.length / pageSize));
  const reviewSafePage = Math.min(Math.max(1, page), reviewPageCount);
  const pageReviews = filteredReviews.slice((reviewSafePage - 1) * pageSize, reviewSafePage * pageSize);

  const openCreate = () => {
    setForm({ customerName: '', productName: '', rating: '5', content: '', reply: '' });
    setDialog({ mode: 'create' });
    setError('');
  };

  const openEdit = (review) => {
    setForm({
      customerName: review.customerName,
      productName: review.productName,
      rating: String(review.rating),
      content: review.content,
      reply: review.reply || ''
    });
    setDialog({ mode: 'edit', id: review.id });
    setError('');
  };

  const saveReview = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { ...form, rating: Number(form.rating) };
    try {
      if (dialog.mode === 'create') await api.post('/reviews', payload);
      else await api.put(`/reviews/${dialog.id}`, payload);
      setDialog(null);
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể lưu đánh giá. Vui lòng kiểm tra dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const removeReview = async (review) => {
    if (!window.confirm(`Xóa đánh giá ${review.code} của ${review.customerName}?`)) return;
    setError('');
    try {
      await api.delete(`/reviews/${review.id}`);
      await loadReviews();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Không thể xóa đánh giá.');
    }
  };

  const exportExcel = async () => {
    const headings = ['Mã đánh giá', 'Tên khách hàng', 'Tên sản phẩm', 'Số sao', 'Nội dung', 'Phản hồi', 'Ngày tạo'];
    const rows = [headings, ...filteredReviews.map((review) => [
      review.code, review.customerName, review.productName, review.rating,
      review.content, review.reply || '', formatDate(review.createdAt)
    ])];
    await writeXlsxFile(rows, { sheet: 'Danh gia' }).toFile('danh-sach-danh-gia.xlsx');
  };

  return (
    <div className="ad-brand-page ad-review-page">
      <section className="ad-brand-panel">
        <div className="ad-brand-heading">
          <div>
            <h2><FontAwesomeIcon icon={faStar} /> Quản lý đánh giá</h2>
            <p>Tạo, sửa, xóa đánh giá sản phẩm.</p>
          </div>
          <div className="ad-brand-actions">
            <button className="ad-button ad-button-primary" type="button" onClick={openCreate}>
              <FontAwesomeIcon icon={faPlus} /> Thêm đánh giá
            </button>
          </div>
        </div>

        <form className="ad-review-filter" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters(Object.fromEntries(Object.entries(queries).map(([key, value]) => [key, value.trim()])));
        }}>
          <label>MÃ ĐÁNH GIÁ
            <input value={queries.code} onChange={(event) => setQueries({ ...queries, code: event.target.value })} placeholder="Nhập mã đánh giá..." />
          </label>
          <label>TÊN KHÁCH HÀNG
            <input value={queries.customer} onChange={(event) => setQueries({ ...queries, customer: event.target.value })} placeholder="Nhập tên khách hàng..." />
          </label>
          <label>TÊN SẢN PHẨM
            <input value={queries.product} onChange={(event) => setQueries({ ...queries, product: event.target.value })} placeholder="Nhập tên sản phẩm..." />
          </label>
          <div className="ad-filter-actions">
            <button className="ad-button ad-button-blue" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /> Tìm kiếm</button>
            <button className="ad-button ad-button-quiet" type="button" onClick={() => {
              setQueries({ code: '', customer: '', product: '' });
              setFilters({ code: '', customer: '', product: '' });
              setPage(1);
            }}>Làm mới</button>
            <button className="ad-button ad-button-pink" type="button" onClick={exportExcel} disabled={!filteredReviews.length}>
              <FontAwesomeIcon icon={faDownload} /> Xuất Excel
            </button>
          </div>
        </form>
        {error && !dialog && <p className="ad-brand-message" role="alert">{error}</p>}
      </section>

      <section className="ad-brand-panel ad-brand-list">
        <h2><FontAwesomeIcon icon={faStar} /> Danh sách hiện tại</h2>
        <p className="ad-brand-count"><strong>Kết quả:</strong> {loading ? 'Đang tải...' : `${filteredReviews.length} bản ghi`}</p>
        <div className="ad-table-wrap">
          <table className="ad-brand-table ad-review-table">
            <thead><tr><th>STT</th><th>MÃ ĐÁNH GIÁ</th><th>TÊN KHÁCH HÀNG</th><th>TÊN SẢN PHẨM</th><th>SỐ SAO</th><th>NỘI DUNG</th><th>PHẢN HỒI</th><th>THAO TÁC</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="8" className="ad-table-empty">Đang tải dữ liệu...</td></tr>
                : pageReviews.length ? pageReviews.map((review, index) => (
                  <tr key={review.id}>
                    <td className="ad-brand-index">{(reviewSafePage - 1) * pageSize + index + 1}</td>
                    <td className="ad-brand-code">{review.code}</td>
                    <td>{review.customerName}</td><td>{review.productName}</td>
                    <td><span className="ad-review-rating"><FontAwesomeIcon icon={faStar} /> {review.rating}</span></td>
                    <td className="ad-review-text">{review.content}</td><td className="ad-review-text">{review.reply || '—'}</td>
                    <td className="ad-brand-row-actions">
                      <button className="ad-button ad-button-edit" type="button" title="Sửa đánh giá" onClick={() => openEdit(review)}><FontAwesomeIcon icon={faPen} /><span>Sửa</span></button>
                      <button className="ad-button ad-button-delete" type="button" title="Xóa đánh giá" onClick={() => removeReview(review)}><FontAwesomeIcon icon={faTrash} /><span>Xóa</span></button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="8" className="ad-table-empty">Chưa có đánh giá phù hợp.</td></tr>}
            </tbody>
          </table>
          {!loading && !filteredReviews.length && (
            <EmptyState
              title="Chưa có đánh giá nào"
              hint="Đánh giá của khách sẽ hiện ở đây"
            />
          )}
        </div>
        <Pagination
          page={reviewSafePage} pageSize={pageSize} total={filteredReviews.length}
          onPage={setPage}
          onPageSize={(size) => { setPageSize(size); setPage(1); }}
          onRefresh={loadReviews}
        />
      </section>

      {dialog && <div className="ad-dialog-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setDialog(null);
      }}>
        <form className="ad-brand-dialog ad-review-dialog" onSubmit={saveReview}>
          <div className="ad-dialog-heading">
            <h2>{dialog.mode === 'create' ? 'Thêm đánh giá' : 'Sửa đánh giá'}</h2>
            <button className="ad-icon-button" type="button" aria-label="Đóng" onClick={() => setDialog(null)}><FontAwesomeIcon icon={faXmark} /></button>
          </div>
          <label>Tên khách hàng<input required maxLength="100" value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></label>
          <label>Tên sản phẩm<input required maxLength="150" value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} /></label>
          <label>Số sao<select value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
            {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} sao</option>)}
          </select></label>
          <label>Nội dung<textarea required maxLength="2000" rows="3" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
          <label>Phản hồi<textarea maxLength="2000" rows="3" value={form.reply} onChange={(event) => setForm({ ...form, reply: event.target.value })} /></label>
          {error && <p className="ad-brand-message" role="alert">{error}</p>}
          <div className="ad-dialog-actions">
            <button className="ad-button ad-button-quiet" type="button" onClick={() => setDialog(null)}>Hủy</button>
            <button className="ad-button ad-button-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu đánh giá'}</button>
          </div>
        </form>
      </div>}
    </div>
  );
}