package com.salemanagement.service;

import com.salemanagement.dto.response.VietQrLinkResponse;
import java.util.Map;

public interface PaymentService {
    /**
     * Tạo link thanh toán PayOS cho đơn đang chờ (CHO_DUYET) của đúng chủ đơn.
     * Mỗi lần gọi sinh một payosOrderCode mới; link cũ không còn khớp sẽ bị webhook bỏ qua.
     */
    VietQrLinkResponse createVietQrLink(String orderCode, String username);

    /**
     * Xử lý webhook PayOS. Không bao giờ ném exception ra ngoài để controller
     * luôn trả HTTP 200 (tránh PayOS retry dồn dập); kết quả thật nằm trong outcome.
     */
    WebhookOutcome handlePayosWebhook(Map<String, Object> body);

    record WebhookOutcome(boolean accepted, String message) {
    }
}
