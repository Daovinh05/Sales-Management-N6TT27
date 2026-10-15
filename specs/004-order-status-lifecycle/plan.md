# Implementation Plan: Vòng đời trạng thái đơn hàng (6 trạng thái)

**Branch**: `004-order-status-lifecycle` | **Date**: 2026-10-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-order-status-lifecycle/spec.md`

## Summary

Thêm trạng thái `DANG_CHUAN_BI` (Đang chuẩn bị hàng) vào vòng đời đơn hàng, nâng từ 5 lên 6 trạng thái, đồng thời siết chuyển trạng thái đi từng bước không nhảy cóc. Khách chỉ tự hủy ở `CHO_DUYET`/`DA_XAC_NHAN`; admin đổi trạng thái theo ma trận `NEXT_STATUSES` mở rộng. Không migrate DB (cột `status` VARCHAR), không tách `payment_status`/`shipping_status`, giữ nguyên logic tồn kho và hoàn tiền hiện tại.

## Technical Context

**Language/Version**: Java 21, Spring Boot 4.1.1, React 18 + Vite 5

**Primary Dependencies**: Spring Data JPA, Spring Security (JWT access 30 phút + refresh 7 ngày), MySQL 8, Axios

**Storage**: MySQL 8 (database `banhang`); `orders.status` VARCHAR(30) — thêm giá trị mới không cần migration

**Testing**: JUnit 5 + Mockito + AssertJ (`sh mvnw test` trong `backend/`); kiểm tay bằng curl + UI

**Target Platform**: Docker Compose — `sales-mysql`, `sales-backend` (:8080), `sales-frontend` (:5173 dev / nginx prod)

**Project Type**: Web application (backend + frontend)

**Performance Goals**: Shop quy mô đồ án, lưu lượng thấp — không đặt mục tiêu hiệu năng riêng; chuyển trạng thái là 1 UPDATE đơn + tối đa vài SELECT tồn kho

**Constraints**: Câu chữ UI/message tiếng Việt; commit Conventional Commits tiếng Việt, 1 commit = 1 việc; tuân thủ phân tầng Controller → Service → Repository

**Scale/Scope**: 1 kho trung tâm (`CENTRAL_WAREHOUSE_ID = 1`); ~10 file chạm tới (entity, service, DTO, controller, 3 trang frontend, test)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Đánh giá |
|---|---|
| I. Phân tầng | PASS — logic chuyển trạng thái nằm trong `OrderServiceImpl`; `OrderController` chỉ nhận request + `@PreAuthorize`; frontend gọi qua `services/api.js`, không gọi chéo component |
| II. Spec trước, code sau | PASS — `spec.md` đã viết từ yêu cầu người dùng; plan này là bước 2; `tasks.md` sẽ sinh bằng `/speckit-tasks` (người dùng yêu cầu gộp plan + sửa trong một lượt nên checklist nghiệm thu trong spec đóng vai trò tiêu chí kiểm tra từng bước) |
| III. Test làm bằng chứng | PASS — bổ sung test ma trận chuyển trạng thái (`DA_XAC_NHAN→DANG_GIAO` bị chặn, `DA_XAC_NHAN→DANG_CHUAN_BI→DANG_GIAO` đi được) và quyền hủy (khách hủy `DANG_CHUAN_BI` bị 400); giữ `mvn test` xanh |
| IV. Kho chung một sự thật | PASS — `DANG_CHUAN_BI` không động đến tồn kho; hủy ở trạng thái mới (khách) bị chặn nên không sinh luồng kho mới; hủy admin ở `DANG_CHUAN_BI` dùng nhánh `CANCELLED` có sẵn (nhả `reserved` / cộng trả `quantity` theo cờ `stockDeducted`) |
| V. Tiếng Việt | PASS — nhãn “Đang chuẩn bị hàng”, message lỗi giữ tiếng Việt |
| VI. Spec-kit tiếng Việt | PASS — toàn bộ artifact và trao đổi tiếng Việt |
| Security | PASS — giữ `@PreAuthorize("hasRole('ADMIN')")` cho đổi trạng thái; hủy của khách vẫn qua `checkOwner`; không tin giá client |

## Project Structure

### Documentation (this feature)

```text
specs/004-order-status-lifecycle/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── order-status-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/main/java/com/salemanagement/
│   ├── entity/Order.java                    # thêm STATUS_PREPARING
│   ├── service/impl/OrderServiceImpl.java   # mở rộng NEXT_STATUSES
│   ├── dto/request/OrderStatusRequest.java  # thêm DANG_CHUAN_BI vào regex
│   └── controller/OrderController.java      # không đổi (đã đúng tầng)
└── src/test/java/com/salemanagement/
    └── OrderServiceTests.java               # thêm test ma trận + quyền hủy

frontend/
├── src/pages/shop/OrderHistory.jsx          # nhãn, màu, tab, nút hủy
├── src/pages/admin/OrderManagement.jsx      # nhãn, màu, NEXT_STATUSES mirror
└── src/pages/admin/ThongKe.jsx              # nhãn, màu thống kê
```

**Structure Decision**: Web application (Option 2) — backend Spring Boot + frontend React hiện có; không thêm module/thư viện mới, chỉ mở rộng giá trị trạng thái và ma trận chuyển đổi ở cả hai phía.

## Complexity Tracking

> Không có vi phạm Constitution cần biện minh — bảng trên PASS toàn bộ.
