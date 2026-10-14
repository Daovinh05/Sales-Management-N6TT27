# Tasks: Review Service Layer

**Input**: Design documents from `/specs/003-review-service/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/review-api.yaml

## Format: `[ID] [P?] [Story] Description`

- **[P]**: chạy song song được (khác file, không phụ thuộc)
- **[Story]**: task thuộc user story nào (US1, US2)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận baseline, không tạo hạ tầng mới

- [X] T001 Kiểm tra baseline module Review trong backend/src/main/java/com/salemanagement/controller/ReviewController.java và frontend/src/pages/admin/ReviewManagement.jsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DTO ngoài dùng chung cho mọi story — PHẢI xong trước controller/service

- [X] T002 [P] Tạo ReviewRequest DTO trong backend/src/main/java/com/salemanagement/dto/request/ReviewRequest.java (giữ validation NotBlank/Size/Min/Max)
- [X] T003 [P] Tạo ReviewResponse DTO trong backend/src/main/java/com/salemanagement/dto/response/ReviewResponse.java (id, code DG.., customerName, productName, rating, content, reply, createdAt)

**Checkpoint**: 2 DTO biên dịch được — UC quản trị mới bắt đầu được

---

## Phase 3: User Story 1 - Quản trị đánh giá (Priority: P1) 🎯 MVP

**Goal**: Admin CRUD đánh giá qua service layer, giữ nguyên API/UI

**Independent Test**: Trang Quản lý đánh giá tạo/sửa/xóa được, API trả đúng code DG.. và message tiếng Việt

### Tests cho User Story 1

- [X] T004 [P] [US1] Viết ReviewServiceTest trong backend/src/test/java/com/salemanagement/ReviewServiceTest.java (list sắp mới nhất, create/update/delete, 404, trim/reply, rating)

### Implementation cho User Story 1

- [X] T005 [US1] Tạo ReviewService interface trong backend/src/main/java/com/salemanagement/service/ReviewService.java (list/create/update/delete)
- [X] T006 [US1] Tạo ReviewServiceImpl trong backend/src/main/java/com/salemanagement/service/impl/ReviewServiceImpl.java (trim, reply rỗng→null, map code DG.., ném 404 "Không tìm thấy đánh giá")
- [X] T007 [US1] Gọn ReviewController trong backend/src/main/java/com/salemanagement/controller/ReviewController.java (inject ReviewService, giữ @PreAuthorize ADMIN + mapping, xóa record nội bộ và logic repository trực tiếp)
- [X] T008 [US1] Chạy mvn test và kiểm hồi quy API theo specs/003-review-service/quickstart.md

**Checkpoint**: US1 chạy độc lập — CRUD admin xanh, frontend không đổi

---

## Phase 4: User Story 2 - Xem đánh giá ngoài cửa hàng (Priority: P2)

**Goal**: Storefront đọc/ghi đánh giá vẫn chạy sau tái cấu trúc

**Independent Test**: Trang chi tiết sản phẩm xem và gửi đánh giá được

- [X] T009 [US2] Kiểm hồi quy storefront trong frontend/src/pages/shop/ProductDetail.jsx và backend StorefrontService (fetchDetail/fetchReviews/postReview vẫn tương thích ReviewResponse)

**Checkpoint**: US1 + US2 đều chạy độc lập

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Dọn dẹp cuối, chạy toàn bộ quickstart

- [X] T010 Chạy toàn bộ mvn test, rà soát không còn controller gọi ReviewRepository trực tiếp, cập nhật specs/003-review-service/checklists/requirements.md nếu cần

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002, T003 song song) → US1 tests + impl (T004 song song với T005; T006 sau T005; T007 sau T002/T003/T006; T008 sau T007) → US2 (T009 sau T008) → Polish (T010 cuối)
- MVP: T001-T008 (chỉ US1)

## Parallel Example: User Story 1

```bash
# Cùng lúc:
Task: "Tạo ReviewRequest DTO trong dto/request/ReviewRequest.java"
Task: "Tạo ReviewResponse DTO trong dto/response/ReviewResponse.java"
Task: "Viết ReviewServiceTest trong ReviewServiceTest.java"
```

## Implementation Strategy

- MVP trước: xong T001-T008 rồi STOP validate trang Quản lý đánh giá
- Sau đó T009 (storefront) rồi T010 (polish), mỗi bước `mvn test` xanh
