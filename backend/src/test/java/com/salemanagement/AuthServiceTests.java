package com.salemanagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import com.salemanagement.dto.request.LoginRequest;
import com.salemanagement.dto.request.RegisterRequest;
import com.salemanagement.dto.response.JwtResponse;
import com.salemanagement.entity.PasswordResetToken;
import com.salemanagement.entity.Role;
import com.salemanagement.entity.User;
import com.salemanagement.enums.ERole;
import com.salemanagement.repository.RoleRepository;
import com.salemanagement.repository.UserRepository;
import com.salemanagement.security.CustomUserDetails;
import com.salemanagement.security.JwtProvider;
import com.salemanagement.service.AuthService;
import com.salemanagement.service.MailService;
import com.salemanagement.service.MailService;
import com.salemanagement.service.PasswordResetService;
import com.salemanagement.service.RefreshTokenService;
import com.salemanagement.service.impl.AuthServiceImpl;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtProvider jwtProvider;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private PasswordResetService passwordResetService;
    @Mock
    private MailService mailService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(authenticationManager, jwtProvider, refreshTokenService,
                passwordResetService, mailService, userRepository, roleRepository, passwordEncoder);
        lenient().when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private User user() {
        return User.builder().id(1L).username("kho1").email("kho1@shop.com")
                .roles(Set.of(Role.builder().name(ERole.ROLE_CUSTOMER).build()))
                .build();
    }

    @Test
    void dangNhapThanhCong_traTokenVaVaiTro() {
        Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
        CustomUserDetails principal = org.mockito.Mockito.mock(CustomUserDetails.class);
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(principal.getUser()).thenReturn(user());
        when(jwtProvider.generateToken(authentication)).thenReturn("jwt-moi");
        com.salemanagement.entity.RefreshToken refreshToken =
                org.mockito.Mockito.mock(com.salemanagement.entity.RefreshToken.class);
        when(refreshToken.getToken()).thenReturn("rt-moi");
        when(refreshTokenService.create(any(User.class))).thenReturn(refreshToken);

        LoginRequest request = new LoginRequest();
        request.setUsername("kho1");
        request.setPassword("123456");

        JwtResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("jwt-moi");
        assertThat(response.getUsername()).isEqualTo("kho1");
        assertThat(response.getRoles()).contains("ROLE_CUSTOMER");
    }

    @Test
    void dangKyTrungUsername_biChan() {
        when(userRepository.existsByNormalizedUsername("kho1")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("kho1");
        request.setPassword("123456");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tên đăng nhập đã được sử dụng");
    }

    @Test
    void dangKyUsernameCoKhoangTrangDauCuoi_vanNhanDienTrung() {
        when(userRepository.existsByNormalizedUsername("kho1")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("  kho1  ");
        request.setPassword("123456");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tên đăng nhập đã được sử dụng");
        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).save(any(User.class));
    }

    @Test
    void dangKyTrungUsernameVaEmail_baoRoCaHaiTruong() {
        when(userRepository.existsByNormalizedUsername("kho1")).thenReturn(true);
        when(userRepository.existsByEmail("kho1@shop.com")).thenReturn(true);

        RegisterRequest request = new RegisterRequest();
        request.setUsername("kho1");
        request.setEmail("kho1@shop.com");
        request.setPassword("123456");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Tên đăng nhập đã được sử dụng")
                .hasMessageContaining("Email đã được sử dụng");
    }

    @Test
    void dangKyMoi_ganRoleKhachHang() {
        when(userRepository.existsByNormalizedUsername("moi")).thenReturn(false);
        when(roleRepository.findByName(ERole.ROLE_CUSTOMER))
                .thenReturn(Optional.of(Role.builder().name(ERole.ROLE_CUSTOMER).build()));
        when(passwordEncoder.encode("123456")).thenReturn("ma-hoa");

        RegisterRequest request = new RegisterRequest();
        request.setUsername("moi");
        request.setPassword("123456");

        User saved = authService.register(request);

        assertThat(saved.getUsername()).isEqualTo("moi");
        assertThat(saved.getPassword()).isEqualTo("ma-hoa");
        assertThat(saved.getStatus()).isEqualTo("ACTIVE");
        assertThat(saved.getRoles()).extracting(role -> role.getName())
                .contains(ERole.ROLE_CUSTOMER);
    }

    @Test
    void dangKyUsernameMoi_loaiBoKhoangTrangDauCuoiTruocKhiLuu() {
        when(userRepository.existsByNormalizedUsername("moi")).thenReturn(false);
        when(roleRepository.findByName(ERole.ROLE_CUSTOMER))
                .thenReturn(Optional.of(Role.builder().name(ERole.ROLE_CUSTOMER).build()));
        when(passwordEncoder.encode("123456")).thenReturn("ma-hoa");

        RegisterRequest request = new RegisterRequest();
        request.setUsername("  moi  ");
        request.setPassword("123456");

        User saved = authService.register(request);

        assertThat(saved.getUsername()).isEqualTo("moi");
        org.mockito.Mockito.verify(userRepository).existsByNormalizedUsername("moi");
        org.mockito.Mockito.verify(userRepository).save(any(User.class));
    }

    @Test
    void quenMatKhau_userKhongTonTai_khongLoThongTin() {
        when(userRepository.findByUsername("la")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("la")).thenReturn(Optional.empty());

        AuthService.ForgotPasswordResult result = authService.forgotPassword("la");

        assertThat(result.resetToken()).isNull();
        assertThat(result.mailSent()).isFalse();
    }

    @Test
    void quenMatKhau_chuaCauHinhMail_traMaDemo() {
        User u = user();
        u.setEmail("khach1@shop.com");
        when(userRepository.findByUsername("kho1")).thenReturn(Optional.of(u));
        when(passwordResetService.create(u)).thenReturn(PasswordResetToken.builder()
                .user(u).token("ma-demo")
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(15)).build());
        when(mailService.isConfigured()).thenReturn(false);

        AuthService.ForgotPasswordResult result = authService.forgotPassword("kho1");

        assertThat(result.resetToken()).isEqualTo("ma-demo");
        assertThat(result.mailSent()).isFalse();
    }

    @Test
    void quenMatKhau_daCauHinhMail_guiMailVaAnMa() {
        User u = user();
        u.setEmail("khach1@shop.com");
        when(userRepository.findByUsername("kho1")).thenReturn(Optional.of(u));
        when(passwordResetService.create(u)).thenReturn(PasswordResetToken.builder()
                .user(u).token("ma-that")
                .expiresAt(java.time.LocalDateTime.now().plusMinutes(15)).build());
        when(mailService.isConfigured()).thenReturn(true);

        AuthService.ForgotPasswordResult result = authService.forgotPassword("kho1");

        assertThat(result.resetToken()).isEqualTo("ma-that");
        assertThat(result.mailSent()).isTrue();
        org.mockito.Mockito.verify(mailService)
                .sendPasswordResetEmail("khach1@shop.com", "kho1", "ma-that");
    }
}
