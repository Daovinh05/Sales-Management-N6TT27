erDiagram

    %% ==========================================
    %% USER & AUTHENTICATION
    %% ==========================================

    USER {
        bigint id PK
        string username UK
        string password
        string full_name
        string email UK
        string phone
        string address
        string status
        datetime created_at
        datetime updated_at
    }

    ROLE {
        bigint id PK
        string name UK
        string description
    }

    USER_ROLE {
        bigint user_id PK, FK
        bigint role_id PK, FK
    }


    %% ==========================================
    %% PRODUCT
    %% ==========================================

    CATEGORY {
        bigint id PK
        string name UK
        string description
        string status
        datetime created_at
    }

    BRAND {
        bigint id PK
        string name UK
        string description
        string status
    }

    PRODUCT {
        bigint id PK
        bigint category_id FK
        bigint brand_id FK
        string name
        string sku UK
        text description
        decimal price
        decimal sale_price
        string image_url
        string status
        datetime created_at
        datetime updated_at
    }


    %% ==========================================
    %% SUPPLIER
    %% ==========================================

    SUPPLIER {
        bigint id PK
        string name
        string phone
        string email
        string address
        string tax_code
        string status
        datetime created_at
    }


    %% ==========================================
    %% WAREHOUSE
    %% ==========================================

    WAREHOUSE {
        bigint id PK
        string name
        string address
        string phone
        string status
        datetime created_at
    }

    INVENTORY {
        bigint id PK
        bigint warehouse_id FK
        bigint product_id FK
        int quantity
        int reserved_quantity
        int min_quantity
        datetime updated_at
    }


    %% ==========================================
    %% IMPORT
    %% ==========================================

    IMPORT_RECEIPT {
        bigint id PK
        bigint warehouse_id FK
        bigint supplier_id FK
        bigint created_by FK
        decimal total_amount
        string status
        datetime import_date
        datetime created_at
    }

    IMPORT_DETAIL {
        bigint id PK
        bigint import_receipt_id FK
        bigint product_id FK
        int quantity
        decimal import_price
        decimal total_price
    }


    %% ==========================================
    %% CUSTOMER ORDER
    %% ==========================================

    CART {
        bigint id PK
        bigint user_id FK
        datetime created_at
        datetime updated_at
    }

    CART_ITEM {
        bigint id PK
        bigint cart_id FK
        bigint product_id FK
        int quantity
        decimal price
    }

    ORDERS {
        bigint id PK
        bigint user_id FK
        string order_code UK
        decimal total_amount
        string status
        string shipping_address
        string phone
        string note
        datetime order_date
        datetime updated_at
    }

    ORDER_DETAIL {
        bigint id PK
        bigint order_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
        decimal total_price
    }


    %% ==========================================
    %% PAYMENT
    %% ==========================================

    PAYMENT {
        bigint id PK
        bigint order_id FK
        string payment_method
        string payment_code
        decimal amount
        string status
        datetime paid_at
        datetime created_at
    }


    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================

    %% User & Role
    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned

    %% Category & Product
    CATEGORY ||--o{ PRODUCT : contains
    BRAND ||--o{ PRODUCT : owns

    %% Warehouse & Inventory
    WAREHOUSE ||--o{ INVENTORY : stores
    PRODUCT ||--o{ INVENTORY : stocked

    %% Supplier & Import
    SUPPLIER ||--o{ IMPORT_RECEIPT : supplies
    WAREHOUSE ||--o{ IMPORT_RECEIPT : receives
    USER ||--o{ IMPORT_RECEIPT : creates

    IMPORT_RECEIPT ||--|{ IMPORT_DETAIL : contains
    PRODUCT ||--o{ IMPORT_DETAIL : imported

    %% Customer & Cart
    USER ||--o| CART : owns
    CART ||--|{ CART_ITEM : contains
    PRODUCT ||--o{ CART_ITEM : added

    %% Customer & Order
    USER ||--o{ ORDERS : places
    ORDERS ||--|{ ORDER_DETAIL : contains
    PRODUCT ||--o{ ORDER_DETAIL : ordered

    %% Order & Payment
    ORDERS ||--o{ PAYMENT : has




    Nhìn tổng thể database
                    ┌──────────┐
                    │   USER   │
                    └────┬─────┘
                         │
                 ┌───────┴────────┐
                 │                │
              USER_ROLE          CART
                 │                │
                ROLE          CART_ITEM
                                  │
                               PRODUCT
                                  │
             ┌────────────────────┼─────────────────┐
             │                    │                 │
          CATEGORY              BRAND           INVENTORY
                                                   │
                                               WAREHOUSE
             │
             │
          PRODUCT
             │
             ├──────────── ORDER_DETAIL ──── ORDERS ──── PAYMENT
             │                                  │
             │                                  │
        IMPORT_DETAIL                    CUSTOMER/USER
             │
        IMPORT_RECEIPT
             │
          SUPPLIER
Một số quan hệ quan trọng

1. User – Role

USER N : N ROLE

Thông qua bảng trung gian USER_ROLE.

Ví dụ:

vinh → ADMIN
nam  → CUSTOMER
huy  → WAREHOUSE_STAFF

2. Category – Product

CATEGORY 1 ─── N PRODUCT

Ví dụ:

Điện thoại
   ├── iPhone 17
   ├── Samsung S26
   └── Xiaomi 15

3. Product – Warehouse

Đây là phần quản lý kho quan trọng:

PRODUCT N ─── N WAREHOUSE

Thông qua:

INVENTORY

Ví dụ:

Kho Hà Nội
    iPhone 17 → 20
    Samsung S26 → 15

Kho Hải Phòng
    iPhone 17 → 10

4. Order

Một khách hàng có nhiều đơn:

USER 1 ─── N ORDERS

Một đơn có nhiều sản phẩm:

ORDERS 1 ─── N ORDER_DETAIL

và:

PRODUCT 1 ─── N ORDER_DETAIL

Do đó:

ORDERS N ─── N PRODUCT

được giải quyết thông qua ORDER_DETAIL.

Luồng nghiệp vụ chính

Database này hỗ trợ được luồng:

Nhà cung cấp
     │
     ▼
IMPORT_RECEIPT
     │
     ▼
IMPORT_DETAIL
     │
     ▼
INVENTORY
     │
     │ tồn kho
     ▼
PRODUCT
     │
     ▼
CUSTOMER
     │
     ▼
CART
     │
     ▼
ORDERS
     │
     ├──────────────► ORDER_DETAIL
     │
     ▼
PAYMENT
     │
     ▼
Hoàn thành đơn hàng