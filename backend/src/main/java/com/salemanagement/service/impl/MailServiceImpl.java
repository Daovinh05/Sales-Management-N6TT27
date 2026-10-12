package com.salemanagement.service.impl;

import com.salemanagement.service.MailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailServiceImpl implements MailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(mailUsername);
    }

    @Override
    public void sendPasswordResetEmail(String to, String username, String token) {
        if (!isConfigured()) {
            throw new IllegalStateException("Chưa cấu hình MAIL_USERNAME nên không gửi được mail");
        }
        String from = StringUtils.hasText(mailFrom) ? mailFrom : mailUsername;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("[Cửa hàng] Mã đặt lại mật khẩu");
        message.setText("""
                Xin chào %s,

                Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản của bạn.

                Mã đặt lại của bạn là:
                %s

                Mã có hiệu lực trong 15 phút và chỉ dùng được 1 lần.
                Hãy nhập mã này cùng mật khẩu mới (từ 6 ký tự trở lên) tại màn hình "Quên mật khẩu".

                Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu của bạn vẫn an toàn.

                Trân trọng,
                Cửa hàng
                """.formatted(username, token));
        mailSender.send(message);
        log.info("Đã gửi mail đặt lại mật khẩu tới '{}'", to);
    }
}
