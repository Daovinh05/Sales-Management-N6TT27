package com.salemanagement.controller;

import com.salemanagement.service.PaymentService;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Webhook nhận kết quả thanh toán từ PayOS. Endpoint public (xác thực bằng
 * chữ ký HMAC trong PaymentService) và LUÔN trả HTTP 200 để PayOS không
 * retry dồn dập; kết quả thật nằm trong body.
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/payos-webhook")
    public ResponseEntity<?> payosWebhook(@RequestBody(required = false) Map<String, Object> body) {
        PaymentService.WebhookOutcome outcome = paymentService.handlePayosWebhook(body);
        return ResponseEntity.ok(Map.of(
                "success", outcome.accepted(),
                "message", outcome.message()));
    }
}
