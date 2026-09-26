import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleExclamation, faTriangleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const ICONS = { success: faCircleCheck, error: faCircleExclamation, warning: faTriangleExclamation, info: faCircleInfo };

export default function AppToast({ toasts }) {
  return (
    <div className="tz-toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`tz-toast ${t.type}`}>
          <FontAwesomeIcon icon={ICONS[t.type] || faCircleInfo} />
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
