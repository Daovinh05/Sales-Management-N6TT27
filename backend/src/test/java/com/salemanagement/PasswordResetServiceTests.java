package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.User;
import com.salemanagement.repository.PasswordResetTokenRepository;
import com.salemanagement.service.impl.PasswordResetServiceImpl;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTests {

    @Mock
    private PasswordResetTokenRepository repository;

    private PasswordResetServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PasswordResetServiceImpl(repository);
        org.mockito.Mockito.lenient().when(repository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private User user() {
        return User.builder().id(1L).username("khach1").build();
    }

    @Test
    void sinhToken_moi_thuHoiTokenCu() {
        User u = user();
        PasswordResetToken created = service.create(u);

        verify(repository).revokeAllByUser(any(User.class));
        verify(repository).save(any(PasswordResetToken.class));
        assertThat(created.getToken()).isNotBlank();
        assertThat(created.getExpiresAt()).isAfter(LocalDateTime.now());
        assertThat(created.isUsed()).isFalse();
    }

    @Test
    void maSai_baoLoi() {
        when(repository.findByToken("sai")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verify("sai"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("không hợp lệ");
    }

    @Test
    void maHetHan_baoLoi() {
        PasswordResetToken expired = PasswordResetToken.builder()
                .user(user()).token("het-han")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false).build();
        when(repository.findByToken("het-han")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> service.verify("het-han"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    void maDaDung_baoLoi() {
        PasswordResetToken used = PasswordResetToken.builder()
                .user(user()).token("da-dung")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(true).usedAt(LocalDateTime.now()).build();
        when(repository.findByToken("da-dung")).thenReturn(Optional.of(used));

        assertThatThrownBy(() -> service.verify("da-dung"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("đã được sử dụng");
    }
}
