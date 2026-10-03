# Sales Management N6TT27

Hệ thống quản lý bán hàng: backend Spring Boot (REST API + JWT), frontend React (Vite), MySQL + phpMyAdmin, đóng gói bằng Docker Compose.

## Description

Project phục vụ đồ án môn học: quản lý người dùng, sản phẩm / biến thể, danh mục, giỏ hàng, đơn hàng, thanh toán, kho và nhà cung cấp, kèm dashboard báo cáo cho admin.

- Backend: Java 21, Spring Boot 4.1.1, Spring Security + JWT (jjwt 0.11.5), Spring Data JPA / Hibernate, Validation, springdoc-openapi 3.1.1, Apache POI (Excel), Lombok, DevTools.
- Frontend: React 18.3.1, Vite 5, Axios, FontAwesome, đọc/ghi Excel (`read-excel-file`, `write-excel-file`).
- Data: MySQL 8.0 (`banhang`), phpMyAdmin.
- Thiết kế: `mermaid/01-use-case.mmd`, `02-erd.mmd`, `03-system-architecture.mmd`, `04-sequence-order.mmd`. Chi tiết vai trò/module xem `docs/Cau_truc_he_thong.md`.
- Quy ước bảng đơn hàng là `ORDERS` để tránh đụng từ khóa `ORDER` của SQL; entity Java vẫn có thể đặt là `Order`.

## Badges

![Java 21](https://img.shields.io/badge/Java-21-orange)
![Spring Boot 4.1.1](https://img.shields.io/badge/Spring_Boot-4.1.1-green)
![React 18](https://img.shields.io/badge/React-18-blue)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)

## Visuals

Kiến trúc tổng thể (xem file `mermaid/03-system-architecture.mmd` để render đầy đủ màu):

```text
Browser -> React UI (Vite, :5173)
React API Services -> Spring Boot API (:8080)
Spring Boot -> Spring Data JPA -> MySQL (:3306)
```

Luồng đặt hàng chính: `Customer -> React -> Spring Boot API -> Order Service -> Inventory -> Database -> Payment Gateway` (chi tiết trong `mermaid/04-sequence-order.mmd`).

## Installation

### Requirements

- JDK 21, Maven (hoặc dùng `./mvnw` sẵn trong `backend/`), Node 22+ + npm, Docker + Docker Compose.
- Tạo secret JWT riêng cho từng môi trường: `openssl rand -base64 96`.

### Steps

```bash
git clone https://github.com/Daovinh05/Sales-Management-N6TT27.git
cd Sales-Management-N6TT27
cp .env.example .env
# Mở .env và thay JWT_SECRET bằng chuỗi vừa tạo (file .env đã ignore, không commit)
```

Chạy production:

```bash
docker compose up -d --build
```

Chạy development (khuyên dùng khi code — hot-reload, không cần build lại image mỗi lần sửa):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
# Lần sau chỉ cần:
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
# Chạy ngầm: thêm -d ; dừng: Ctrl+C hoặc docker compose down
```

Lần đầu backend tải Maven dependencies nên mất vài phút mới lên.

## Usage

| Service    | URL                                            |
| ---------- | ---------------------------------------------- |
| Frontend   | http://localhost:5173                          |
| Backend    | http://localhost:8080 (`/api/...`)             |
| Swagger UI | http://localhost:8080/swagger-ui.html          |
| phpMyAdmin | http://localhost:8081 (server `mysql`, db `banhang`) |
| MySQL      | `localhost:3306`, db `banhang`, user `root`     |

Chạy lẻ không qua Docker:

```bash
# Backend
cd backend && ./mvnw spring-boot:run
# Frontend
cd frontend && npm install && npm run dev
```

Test backend:

```bash
cd backend && ./mvnw test
```

## Support

Gặp lỗi khi chạy thì kiểm tra `docker ps`, `docker logs sales-backend`, `docker logs sales-frontend` trước. Mở issue tại https://github.com/Daovinh05/Sales-Management-N6TT27/issues kèm log và các bước tái hiện.

## Roadmap

- [x] Use-case, ERD, kiến trúc, sequence (thư mục `mermaid/`)
- [x] Entity / Repository / Service / Controller + JWT + upload ảnh biến thể
- [x] Giao diện quản trị sản phẩm / biến thể + Docker dev hot-reload
- [ ] Hoàn thiện thanh toán, tồn kho, dashboard doanh thu
- [ ] Bổ sung test tự động và CI

## Contributing

Nhận contribution. Quy ước commit theo Conventional Commits, mô tả tiếng Việt, ví dụ `feat(variant): thêm upload ảnh biến thể`, `fix(auth): sửa lỗi hết hạn token`, `chore(docker): dọn volume thừa`, `docs(mermaid): làm sáng màu sơ đồ`. Mở PR từ nhánh tính năng về `main` với mô tả rõ thay đổi và cách kiểm tra.

## Authors and acknowledgment

Nhóm N6TT27 — contributors theo lịch sử git: Congvinh2005, Dao Phuc Dan, Đỗ Quang Anh, hoangthanhh, phucnad9121, Quanh2le5 (chi tiết xem `git log` và các file `README_4_*.md`).

## License

Chưa công bố license (chưa có file `LICENSE`).

## Project status

Đang phát triển (active). Backend/frontend chạy được bằng Docker; một số module thanh toán / báo cáo vẫn đang hoàn thiện.
