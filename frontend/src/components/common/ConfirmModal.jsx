import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

export default function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cf-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel?.();
    }}>
      <div className="cf-box">
        <div className="cf-head">
          <span>{title || 'Xác nhận xoá'}</span>
          <button type="button" aria-label="Đóng" disabled={busy} onClick={onCancel}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="cf-body">
          <span className="cf-icon"><FontAwesomeIcon icon={faXmark} /></span>
          <p>{message}</p>
        </div>
        <div className="cf-actions">
          <button type="button" className="cf-cancel" disabled={busy} onClick={onCancel}>
            Huỷ
          </button>
          <button type="button" className="cf-confirm" disabled={busy} onClick={handleConfirm}>
            {busy ? 'Đang xoá...' : (confirmLabel || 'Xoá')}
          </button>
        </div>
      </div>
    </div>
  );
}
