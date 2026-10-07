import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight, faRotateRight
} from '@fortawesome/free-solid-svg-icons';

const PAGE_SIZES = [10, 20, 50];

export default function Pagination({ page, pageSize, total, onPage, onPageSize, onRefresh }) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const [jump, setJump] = useState('');

  const go = (next) => onPage?.(Math.min(Math.max(1, next), totalPages));

  const submitJump = (event) => {
    event.preventDefault();
    const next = Number(jump);
    if (Number.isFinite(next)) go(next);
    setJump('');
  };

  return (
    <div className="ad-pagination">
      <div className="ad-pagination-left">
        <select
          value={pageSize} aria-label="Số bản ghi mỗi trang"
          onChange={(event) => onPageSize?.(Number(event.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>bản ghi/trang</span>
      </div>
      <div className="ad-pagination-right">
        <span>{total} bản ghi</span>
        <button type="button" aria-label="Về trang đầu" disabled={safePage <= 1} onClick={() => go(1)}>
          <FontAwesomeIcon icon={faAngleDoubleLeft} />
        </button>
        <button type="button" aria-label="Trang trước" disabled={safePage <= 1} onClick={() => go(safePage - 1)}>
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <span className="ad-pagination-page">{safePage}</span>
        <button type="button" aria-label="Trang sau" disabled={safePage >= totalPages} onClick={() => go(safePage + 1)}>
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
        <button type="button" aria-label="Tới trang cuối" disabled={safePage >= totalPages} onClick={() => go(totalPages)}>
          <FontAwesomeIcon icon={faAngleDoubleRight} />
        </button>
        <form onSubmit={submitJump}>
          <span>Đến trang</span>
          <input value={jump} onChange={(event) => setJump(event.target.value)} inputMode="numeric" aria-label="Nhập số trang" />
        </form>
        {onRefresh && (
          <button type="button" aria-label="Tải lại" onClick={onRefresh}>
            <FontAwesomeIcon icon={faRotateRight} />
          </button>
        )}
      </div>
    </div>
  );
}
