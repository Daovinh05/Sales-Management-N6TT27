package com.salemanagement.service.impl;

import com.salemanagement.exception.BusinessException;
import com.salemanagement.service.FileStorageService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path variantDir() throws IOException {
        Path dir = Paths.get(uploadDir, "variants").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        return dir;
    }

    private Path avatarDir() throws IOException {
        Path dir = Paths.get(uploadDir, "avatars").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        return dir;
    }

    @Override
    public String storeVariantImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                : "";
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException("Định dạng hình ảnh không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        String baseName = original.contains(".") ? original.substring(0, original.lastIndexOf('.')) : original;
        baseName = baseName.replaceAll("[^a-zA-Z0-9_-]", "_").replace('-', '_');
        if (baseName.isBlank()) {
            baseName = "variant";
        }
        try {
            Path dir = variantDir();
            String filename = baseName + "." + extension;
            int counter = 1;
            while (Files.exists(dir.resolve(filename))) {
                filename = baseName + "_" + counter + "." + extension;
                counter++;
            }
            Files.copy(file.getInputStream(), dir.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException ex) {
            throw new BusinessException("Upload hình ảnh thất bại", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void deleteVariantImage(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(variantDir().resolve(filename));
        } catch (IOException ignored) {
            // Không chặn nghiệp vụ xóa khi dọn file thất bại.
        }
    }

    @Override
    public String storeUserAvatar(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = original.contains(".")
                ? original.substring(original.lastIndexOf('.') + 1).toLowerCase()
                : "";
        String contentType = file.getContentType();
        if (!ALLOWED_EXTENSIONS.contains(extension)
                || (contentType != null && !contentType.toLowerCase().startsWith("image/"))) {
            throw new BusinessException("Định dạng hình ảnh không hợp lệ", HttpStatus.BAD_REQUEST);
        }
        String filename = UUID.randomUUID() + "." + extension;
        try {
            Files.copy(file.getInputStream(), avatarDir().resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException ex) {
            throw new BusinessException("Upload ảnh đại diện thất bại", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void deleteUserAvatar(String filename) {
        if (filename == null || filename.isBlank()) {
            return;
        }
        try {
            Path dir = avatarDir();
            Path avatar = dir.resolve(filename).normalize();
            if (avatar.getParent().equals(dir)) {
                Files.deleteIfExists(avatar);
            }
        } catch (IOException ignored) {
        }
    }
}
