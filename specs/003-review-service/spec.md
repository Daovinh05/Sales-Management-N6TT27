# Feature Specification: Review Service Layer

**Feature Branch**: `003-review-service`

**Created**: 2026-10-14

**Status**: Draft

**Input**: User description: "Hoàn thiện module Review cho hệ thống: tách Service + DTO ngoài theo chuẩn layered architecture, giữ nguyên hành vi API và UI hiện tại"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quản trị đánh giá (Priority: P1)

Quản trị viên xem danh sách đánh giá, tạo mới, sửa và xóa đánh giá sản phẩm từ trang Quản lý đánh giá.

**Why this priority**: Đây là luồng duy nhất đang dùng của module Review, phải giữ hoạt động liên tục sau tái cấu trúc.

**Independent Test**: Mở trang Quản lý đánh giá, thực hiện tạo/sửa/xóa một đánh giá và thấy danh sách cập nhật, thông báo tiếng Việt.

**Acceptance Scenarios**:

1. **Given** đã đăng nhập quyền quản trị, **When** mở trang Quản lý đánh giá, **Then** thấy danh sách sắp theo mới nhất trước, gồm mã, tên khách, tên sản phẩm, số sao, nội dung, phản hồi.
2. **Given** đang ở dialog thêm, **When** nhập đủ tên khách (≤100), tên sản phẩm (≤150), số sao 1-5, nội dung (≤2000) và lưu, **Then** đánh giá mới xuất hiện trong danh sách và có thông báo thành công.
3. **Given** một đánh giá tồn tại, **When** sửa nội dung/phản hồi và lưu, **Then** danh sách hiển thị giá trị mới.
4. **Given** một đánh giá tồn tại, **When** xác nhận xóa, **Then** bản ghi biến mất khỏi danh sách.

---

### User Story 2 - Xem đánh giá ngoài cửa hàng (Priority: P2)

Khách xem chi tiết sản phẩm thấy danh sách đánh giá và gửi đánh giá của mình.

**Why this priority**: Luồng đọc/ghi phía cửa hàng dùng chung dữ liệu đánh giá, không được rào cản sau tái cấu trúc.

**Independent Test**: Mở trang chi tiết sản phẩm, xem được đánh giá và gửi một đánh giá mới thành công.

**Acceptance Scenarios**:

1. **Given** trang chi tiết sản phẩm có đánh giá, **When** tải trang, **Then** thấy danh sách đánh giá của sản phẩm đó.
2. **Given** đã đăng nhập khách hàng, **When** gửi đánh giá hợp lệ, **Then** đánh giá hiện trong danh sách.

### Edge Cases

- Nhập thiếu tên khách/tên sản phẩm/nội dung hoặc số sao ngoài 1-5 thì bị từ chối với thông báo tiếng Việt, không lưu.
- Sửa/xóa mã đánh giá không tồn tại thì báo không tìm thấy.
- Người không có quyền quản trị gọi API quản trị thì bị từ chối truy cập.
- Nội dung chỉ khoảng trắng được coi như rỗng và bị từ chối.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cho phép quản trị viên liệt kê mọi đánh giá theo thứ tự mới nhất trước.
- **FR-002**: Hệ thống PHẢI cho phép quản trị viên tạo đánh giá với tên khách, tên sản phẩm, số sao 1-5, nội dung, phản hồi tùy chọn.
- **FR-003**: Hệ thống PHẢI cho phép quản trị viên sửa mọi trường của đánh giá đã tồn tại.
- **FR-004**: Hệ thống PHẢI cho phép quản trị viên xóa đánh giá đã tồn tại sau xác nhận.
- **FR-005**: Hệ thống PHẢI chuẩn hóa dữ liệu vào (xén khoảng trắng đầu/cuối, phản hồi rỗng lưu thành trống) và từ chối giá trị chỉ toàn khoảng trắng.
- **FR-006**: Hệ thống PHẢI giữ nguyên hợp đồng dữ liệu hiện tại với giao diện (mã dạng DG + số, các trường tên khách/sản phẩm/sao/nội dung/phản hồi/ngày tạo) để không phải sửa frontend.
- **FR-007**: Hệ thống PHẢI giới hạn API quản trị đánh giá cho vai trò quản trị, mọi thông báo lỗi trả về tiếng Việt.
- **FR-008**: Nghiệp vụ đánh giá PHẢI nằm ở tầng service (controller chỉ nhận request và ủy quyền), tuân thủ nguyên tắc Layered Architecture của constitution.

### Key Entities *(include if feature involves data)*

- **Đánh giá**: gồm tên khách hàng, tên sản phẩm, số sao 1-5, nội dung, phản hồi của shop, ngày tạo; mã hiển thị suy ra từ định danh.
- **Tài khoản quản trị**: người duy nhất được tạo/sửa/xóa đánh giá qua kênh quản trị.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quản trị viên tạo/sửa/xóa một đánh giá trong dưới 2 phút thao tác trên giao diện hiện tại.
- **SC-002**: 100% thao tác tạo/sửa/xóa hợp lệ trên giao diện hiện tại thành công mà không phải sửa frontend.
- **SC-003**: 100% dữ liệu không hợp lệ (thiếu trường, sao ngoài 1-5, quá dài) bị từ chối kèm thông báo tiếng Việt.
- **SC-004**: Bộ kiểm thử tự động của module đánh giá chạy xanh hoàn toàn.

## Assumptions

- Giữ nguyên đường dẫn và hành vi API `/api/reviews` hiện tại để frontend `ReviewManagement.jsx` và `ProductDetail.jsx` không đổi.
- Mã hiển thị DG + số hiện do controller sinh lúc trả về, giữ nguyên quy tắc đó sau tái cấu trúc.
- Không thêm phân trang server hay lọc server trong phạm vi này; lọc/tìm kiếm và xuất Excel vẫn làm phía client như hiện tại.
- Phạm vi chỉ tái cấu trúc backend module Review; không đổi ERD hay giao diện.
