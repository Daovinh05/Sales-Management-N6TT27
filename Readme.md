Bạn tạo project như này:

sales-management/
│
├── backend/
│   └── Spring Boot Project
│
├── frontend/
│   └── React Project
│
├── docs/
│   ├── 01-use-case.mmd
│   ├── 02-erd.mmd
│   ├── 03-system-architecture.mmd
│   └── 04-sequence-order.mmd
│
├── docker-compose.yml
└── README.md
Thứ tự mình khuyên bạn triển khai
01-use-case
      ↓
02-erd
      ↓
03-system-architecture
      ↓
04-sequence-order
      ↓
Spring Boot Entity
      ↓
Repository
      ↓
Service
      ↓
Controller
      ↓
React

Một điểm mình muốn giữ nhất quán: ORDERS là tên bảng đơn hàng để tránh đụng từ khóa ORDER trong một số hệ quản trị CSDL; còn trong Java thì entity vẫn có thể đặt là Order.

Bộ 4 file trên đã đủ để làm bộ thiết kế kiến trúc ban đầu. Sau khi chốt ERD, bước hợp lý tiếp theo là mình thiết kế tiếp cấu trúc package Spring Boot (controller/service/repository/entity/dto/security/config/exception) + toàn bộ Entity JPA tương ứng với 16 bảng này.

## Chạy Docker chế độ phát triển (tự reload)

Để sửa frontend/backend mà không phải build lại image sau mỗi lần thay đổi mã nguồn, chạy ở thư mục gốc dự án:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Frontend dùng Vite HMR; thay đổi giao diện được cập nhật ngay trên trình duyệt tại `http://localhost:5173`.
- Backend tự biên dịch lại mã Java khi lưu file và Spring Boot DevTools khởi động lại ứng dụng.
- MySQL và các dịch vụ khác tiếp tục sử dụng cấu hình trong `docker-compose.yml`.

Lệnh `--build` chỉ cần khi chạy lần đầu hoặc khi thay đổi dependency/Dockerfile. Những lần tiếp theo có thể chạy:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

Dừng các container bằng `Ctrl+C`; muốn chạy ngầm thì thêm `-d` vào lệnh `up`.