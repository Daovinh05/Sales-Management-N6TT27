import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';

export default function OrderSuccess({ code, onHome, onHistory }) {
  return (
    <div className="kh-body">
      <div className="tz-container">
        <div className="kh-crumb">Trang chủ / Thanh toán thành công</div>
        <div className="co-success">
          <FontAwesomeIcon icon={faCircleCheck} className="co-success-icon" />
          <h2>Đặt hàng thành công!</h2>
          <p>Cảm ơn bạn đã đặt hàng tại cửa hàng chúng tôi.</p>
          <p>Mã đơn hàng của bạn là: <strong>{code}</strong></p>
          <p>Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng.</p>
          <div className="co-success-actions">
            <button className="co-outline-btn" type="button" onClick={onHome}>Tiếp tục mua sắm</button>
            <button className="co-outline-btn" type="button" onClick={onHistory}>Xem lịch sử đơn hàng</button>
          </div>
        </div>
      </div>
    </div>
  );
}
