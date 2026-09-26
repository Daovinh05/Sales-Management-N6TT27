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