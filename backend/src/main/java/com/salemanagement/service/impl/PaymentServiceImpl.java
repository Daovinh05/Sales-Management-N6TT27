package com.salemanagement.service.impl;

import com.salemanagement.dto.response.VietQrLinkResponse;
import com.salemanagement.entity.Order;
import com.salemanagement.exception.BusinessException;
import com.salemanagement.repository.OrderRepository;
import com.salemanagement.service.PayosApiClient;
import com.salemanagement.service.PaymentService;
import java.time.LocalDateTime;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final OrderRepository orderRepository;
    private final PayosApiClient payosApiClient;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    @Transactional
    public VietQrLinkResponse createVietQrLink(String orderCode, String username) {
        Order order = orderRepository.findById(orderCode)
                .orElseThrow(() -> new BusinessException("Không tìm thấy đơn hàng",
                        HttpStatus.NOT_FOUND));
        checkOwner(order, username);
        if (!Order.STATUS_PENDING.equals(order.getStatus())) {
            throw new BusinessException("Đơn hàng không còn ở trạng thái chờ thanh toán",
                    HttpStatus.BAD_REQUEST);
        }
        if (order.isPaid()) {
            throw new BusinessException("Đơn hàng đã được thanh toán", HttpStatus.BAD_REQUEST);
        }
        if (!payosApiClient.isConfigured()) {
            // Chưa có key PayOS: để frontend dùng luồng demo (tự bấm đã chuyển khoản).
            return VietQrLinkResponse.notConfigured();
        }
        long amount = order.getPaymentAmount().longValue();
        if (amount <= 0) {
            throw new BusinessException("Số tiền đơn hàng không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        long payosOrderCode = generatePayosOrderCode();
        String description = payosDescription(order.getCode());
        String base = frontendUrl + "/?orderCode=" + order.getCode();
        try {
            PayosApiClient.CreateLinkResult link = payosApiClient.createPaymentLink(
                    payosOrderCode, amount, description, base + "&payos=cancel", base + "&payos=success");
            order.setPaymentMethod("VIETQR");
            order.setPayosOrderCode(link.orderCode());
            order.setPaymentLinkId(link.paymentLinkId());
            orderRepository.save(order);
            log.info("Đã tạo link PayOS cho đơn {} (payosOrderCode={})", order.getCode(), link.orderCode());
            return new VietQrLinkResponse(link.checkoutUrl(), link.qrCode(), link.paymentLinkId(),
                    link.orderCode(), link.amount(), link.accountNumber(), link.accountName(),
                    link.description(), true);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Tạo link PayOS thất bại cho đơn {}: {}", order.getCode(), e.getMessage());
            throw new BusinessException("Không tạo được link thanh toán, vui lòng thử lại",
                    HttpStatus.BAD_GATEWAY);
        }
    }

    @Override
    @Transactional
    @SuppressWarnings("unchecked")
    public WebhookOutcome handlePayosWebhook(Map<String, Object> body) {
        try {
            if (body == null || !(body.get("data") instanceof Map)) {
                log.warn("Webhook PayOS thiếu data");
                return new WebhookOutcome(false, "Thiếu data");
            }
            Map<String, Object> data = (Map<String, Object>) body.get("data");
            String signature = body.get("signature") == null
                    ? null : String.valueOf(body.get("signature"));
            if (!payosApiClient.verifyWebhookSignature(data, signature)) {
                log.warn("Webhook PayOS sai chữ ký");
                return new WebhookOutcome(false, "Sai chữ ký");
            }
            if (!"00".equals(String.valueOf(body.get("code")))) {
                log.info("Webhook PayOS báo không thành công: code={}", body.get("code"));
                return new WebhookOutcome(false, "Giao dịch không thành công");
            }
            long payosOrderCode = toLong(data.get("orderCode"));
            long amount = toLong(data.get("amount"));
            // Đọc kèm khóa ghi: webhook tới đồng thời thì luồng sau đợi
            // luồng trước commit rồi mới đọc, không thể cùng lọt qua check paid.
            Order order = orderRepository.findByPayosOrderCodeForUpdate(payosOrderCode).orElse(null);
            if (order == null) {
                // Gồm cả lần PayOS bấm "xác thực webhook" bằng dữ liệu mẫu.
                log.info("Webhook PayOS cho mã lạ {}, bỏ qua", payosOrderCode);
                return new WebhookOutcome(true, "Đã nhận (mã lạ, bỏ qua)");
            }
            if (order.isPaid()) {
                return new WebhookOutcome(true, "Đơn đã thanh toán trước đó");
            }
            if (amount != order.getPaymentAmount().longValue()) {
                log.warn("Webhook PayOS lệch tiền đơn {}: mong đợi {} nhận {}",
                        order.getCode(), order.getPaymentAmount().longValue(), amount);
                return new WebhookOutcome(false, "Số tiền không khớp");
            }
            order.setPaid(true);
            order.setPaidAt(LocalDateTime.now());
            order.setPaymentMethod("VIETQR");
            orderRepository.save(order);
            log.info("Đơn {} đã thanh toán qua PayOS ({}đ)", order.getCode(), amount);
            return new WebhookOutcome(true, "Đã ghi nhận thanh toán");
        } catch (Exception e) {
            log.warn("Xử lý webhook PayOS lỗi: {}", e.getMessage());
            return new WebhookOutcome(false, "Lỗi xử lý");
        }
    }

    /** Mã link PayOS: mili-giây + 3 số ngẫu nhiên để 2 lần bấm cùng lúc không trùng. */
    static long generatePayosOrderCode() {
        return System.currentTimeMillis() * 1000L
                + java.util.concurrent.ThreadLocalRandom.current().nextInt(1000);
    }

    /** Nội dung chuyển khoản: ngắn gọn, chỉ chữ/số để ngân hàng không cắt. */
    private static String payosDescription(String orderCode) {
        String clean = orderCode == null ? "" : orderCode.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
        if (clean.isBlank()) {
            clean = "DONHANG";
        }
        return clean.length() > 25 ? clean.substring(0, 25) : clean;
    }

    private static void checkOwner(Order order, String username) {
        if (order.getUsername() == null && username == null) {
            return;
        }
        if (username == null || !username.equals(order.getUsername())) {
            throw new BusinessException("Bạn không có quyền thao tác đơn hàng này",
                    HttpStatus.FORBIDDEN);
        }
    }

    private static long toLong(Object value) {
        if (value instanceof Number n) {
            return n.longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (Exception e) {
            return 0L;
        }
    }
}
