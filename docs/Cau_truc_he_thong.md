HỆ THỐNG QUẢN LÝ BÁN HÀNG
│
├── Admin
│   ├── Quản lý người dùng
│   ├── Quản lý sản phẩm
│   ├── Quản lý danh mục
│   ├── Quản lý đơn hàng
│   ├── Quản lý kho
│   ├── Quản lý khuyến mãi
│   └── Dashboard & Báo cáo
│
├── Khách hàng
│   ├── Đăng ký / Đăng nhập
│   ├── Xem sản phẩm
│   ├── Tìm kiếm sản phẩm
│   ├── Giỏ hàng
│   ├── Đặt hàng
│   ├── Thanh toán
│   └── Lịch sử đơn hàng
│
└── Nhân viên kho
    ├── Nhập kho
    ├── Xuất kho
    ├── Kiểm tra tồn kho
    ├── Quản lý nhà cung cấp
    └── Phiếu nhập / xuất kho


Use Case Diagram – hệ thống có những chức năng gì, ai sử dụng.
ERD Database – thiết kế các bảng và quan hệ.
System Architecture – kiến trúc Backend/Frontend/Database/Redis...
Sequence Diagram – mô tả luồng xử lý các chức năng quan trọng.

Mình đề xuất scope như sau:

1. Phân quyền
Actor	Chức năng
👑 Admin	Quản lý toàn hệ thống
👤 Customer	Mua hàng, thanh toán, theo dõi đơn
📦 Warehouse Staff	Nhập/xuất và kiểm kê kho
2. Module chính
Sales Management System
│
├── Authentication & Authorization
│   ├── Register
│   ├── Login
│   ├── JWT
│   └── Role / Permission
│
├── Product Management
│   ├── Product
│   ├── Category
│   ├── Brand
│   └── Promotion
│
├── Customer
│   ├── Profile
│   ├── Cart
│   ├── Order
│   ├── Payment
│   └── Order History
│
├── Warehouse
│   ├── Inventory
│   ├── Import
│   ├── Export
│   ├── Stock Check
│   └── Supplier
│
├── Order Management
│   ├── Pending
│   ├── Confirmed
│   ├── Shipping
│   ├── Completed
│   └── Cancelled
│
└── Admin
    ├── User Management
    ├── Dashboard
    ├── Revenue
    └── Statistics


3. Công nghệ đề xuất
Frontend
    ↓
React / Next.js
    ↓ REST API
Spring Boot
    ├── Spring Security + JWT
    ├── Spring Data JPA
    ├── Hibernate
    └── Validation
    ↓
PostgreSQL / MySQL

Optional:
Redis       → Cache / Session
Docker      → Container
Swagger     → API Documentation