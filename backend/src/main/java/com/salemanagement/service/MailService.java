package com.salemanagement.service;

public interface MailService {
    /** Mail đã được cấu hình (có MAIL_USERNAME) hay chưa. */
    boolean isConfigured();

    /**
     * Gửi mail chứa mã đặt lại mật khẩu cho user.
     *
     * @param to       email người nhận
     * @param username tên tài khoản để xưng hô
     * @param token    mã đặt lại (hiệu lực 15 phút, dùng 1 lần)
     */
    void sendPasswordResetEmail(String to, String username, String token);
}
