package com.salemanagement.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /** Lưu ảnh biến thể, trả về filename. Giữ nguyên logic PHP: làm sạch tên + chống trùng. */
    String storeVariantImage(MultipartFile file);

    void deleteVariantImage(String filename);
}
