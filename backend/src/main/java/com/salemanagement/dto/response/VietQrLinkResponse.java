package com.salemanagement.dto.response;

public record VietQrLinkResponse(String checkoutUrl, String qrCode, String paymentLinkId,
        long payosOrderCode, long amount, String accountNumber, String accountName,
        String description, boolean payosConfigured) {

    /** Fallback demo khi chưa cấu hình PayOS: frontend giữ luồng tự xác nhận cũ. */
    public static VietQrLinkResponse notConfigured() {
        return new VietQrLinkResponse(null, null, null, 0L, 0L, null, null, null, false);
    }
}
