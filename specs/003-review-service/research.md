# Nghiên cứu: Review Service Layer

## Quyết định 1: Mẫu tách service theo chuẩn dự án

- **Quyết định**: Tạo `ReviewService` interface + `ReviewServiceImpl` theo đúng mẫu `BrandService`/`CategoryService` (list/create/update/delete), controller chỉ gọi service.
- **Lý do**: 20/22 module đã theo mẫu này; controller hiện tại gọi thẳng repository vi phạm constitution I.
- **Phương án đã cân nhắc**: Giữ nguyên controller + repository — loại vì vi phạm layered architecture, khó viết test service.

## Quyết định 2: Vị trí DTO

- **Quyết định**: Chuyển 2 record nội bộ `ReviewRequest`/`ReviewResponse` từ controller sang `dto/request/ReviewRequest.java` và `dto/response/ReviewResponse.java`, giữ nguyên tên trường và validation (`@NotBlank`, `@Size`, `@Min(1) @Max(5)`).
- **Lý do**: Mọi module khác đều để DTO ngoài; giữ nguyên trường nên frontend `ReviewManagement.jsx` không phải sửa.
- **Phương án đã cân nhắc**: Dùng record nội bộ tiếp — loại vì không đồng nhất, khó tái dùng cho storefront.

## Quyết định 3: Xử lý lỗi và mã hiển thị

- **Quyết định**: Service ném `ResponseStatusException(404, "Không tìm thấy đánh giá")` khi thiếu bản ghi; logic `trim()`, reply rỗng → null, mã `DG + %02d` giữ nguyên trong service (hàm map).
- **Lý do**: Giữ hành vi byte-for-byte so với controller cũ, test so sánh được.
- **Phương án đã cân nhắc**: Dùng exception handler riêng — để sau, ngoài phạm vi để tránh đổi hợp đồng lỗi.

## Quyết định 4: Kiểm thử

- **Quyết định**: JUnit 5 + Mockito cho `ReviewServiceImpl` (CRUD, not-found, chuẩn hóa trim/reply, thứ tự mới nhất trước); kiểm tay qua Swagger/UI trang Quản lý đánh giá.
- **Lý do**: Đúng constitution III (Test Làm Bằng Chứng), `mvn test` phải xanh.
