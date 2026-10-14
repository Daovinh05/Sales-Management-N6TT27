package com.salemanagement.service;

import java.util.Map;

public interface PayosApiClient {
    /** Đã cấu hình đủ 3 key PayOS (client-id, api-key, checksum-key) hay chưa. */
    boolean isConfigured();

    /**
     * Tạo link thanh toán PayOS.
     *
     * @param orderCode   mã số nguyên duy nhất (PayOS chỉ nhận số)
     * @param amount      số tiền VND (số nguyên)
     * @param description nội dung chuyển khoản hiện cho khách (ngắn gọn)
     */
    CreateLinkResult createPaymentLink(long orderCode, long amount, String description,
            String returnUrl, String cancelUrl);

    /** Kiểm tra chữ ký webhook PayOS gửi về (thuật toán HMAC-SHA256 theo docs PayOS). */
    boolean verifyWebhookSignature(Map<String, ?> data, String signature);

    record CreateLinkResult(String checkoutUrl, String qrCode, String paymentLinkId,
            long orderCode, long amount, String accountNumber, String accountName,
            String description) {
    }
}
