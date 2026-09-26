erDiagram

    USER ||--o{ USER_ROLE : has
    ROLE ||--o{ USER_ROLE : assigned

    USER ||--o{ REFRESH_TOKEN : owns

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

    REFRESH_TOKEN {
        bigint id PK
        bigint user_id FK
        string token UK
        datetime expires_at
        boolean revoked
        datetime created_at
    }