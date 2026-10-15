# Quickstart (hồi tố): Kiểm chứng đăng ký, đăng nhập, đăng xuất

**Tính năng**: `007-auth-dang-nhap` | Contract: [auth-api](./contracts/auth-api.md)

## Điều kiện tiên quyết

Docker dev chạy (backend :8080); seed `customer/123456`.

## Kịch bản 1: Đăng ký + validation (curl)

```bash
# Hợp lệ -> 201
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"khach_test","email":"khach_test@mail.com","password":"123456"}'; echo
# Sai từng trường -> 400 message tiếng Việt
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"ab","password":"123","email":"sai","phone":"12a"}'; echo
# Trùng -> 400 "Tên đăng nhập đã được sử dụng"
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"customer","email":"c@c.com","password":"123456"}'; echo
```

## Kịch bản 2: Đăng nhập + đăng xuất thu hồi (curl)

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"123456"}' | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['token'])")
REF=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])")
curl -s http://localhost:8080/api/orders/mine -H "Authorization: Bearer $TOKEN" | head -c 100; echo
# Kỳ vọng: 200 (đơn của customer)
curl -s http://localhost:8080/api/orders/mine; echo
# Kỳ vọng: 401 "Chưa đăng nhập hoặc token hết hạn"
curl -s -X POST http://localhost:8080/api/auth/logout -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REF\"}"; echo
curl -s -X POST http://localhost:8080/api/auth/refresh -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REF\"}"; echo
# Kỳ vọng: 401 (refresh đã revoke)
```

## Kịch bản 3: UI sống

Đăng ký user mới (thử nhập lại password sai → bị chặn ngay) → đăng nhập → F5 (còn phiên) → đăng xuất → vào Lịch sử đơn → bị mời đăng nhập lại.

## Kịch bản 4: Test tự động

```bash
cd backend
mvn -Dtest='AuthServiceTests,PasswordResetServiceTests' test
# Kỳ vọng: BUILD SUCCESS
```
