import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox, faPlus } from '@fortawesome/free-solid-svg-icons';

export default function EmptyState({ title, hint, actionLabel, onAction, icon }) {
  return (
    <div className="ad-empty">
      <div className="ad-empty-icon">
        <FontAwesomeIcon icon={icon || faInbox} />
      </div>
      <div className="ad-empty-title">{title}</div>
      {hint && <div className="ad-empty-hint">{hint}</div>}
      {actionLabel && (
        <button type="button" className="ad-empty-btn" onClick={onAction}>
          <FontAwesomeIcon icon={faPlus} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
