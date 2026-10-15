# Quickstart (hồi tố): Auth cơ bản

**Tính năng**: `008-auth-co-ban` | Contract: [auth-core](./contracts/auth-core-api.md)

```bash
curl -s -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"khach_test","email":"kt@mail.com","password":"123456"}'; echo
# Kỳ vọng: 201; sai trường/trùng -> 400 tiếng Việt
curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"123456"}'; echo
# Kỳ vọng: token + refreshToken + roles
REF=$(curl -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"customer","password":"123456"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['refreshToken'])")
curl -s -X POST http://localhost:8080/api/auth/logout -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REF\"}"; echo
curl -s -X POST http://localhost:8080/api/auth/refresh -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REF\"}"; echo
# Kỳ vọng: 401 (đã revoke)
```

UI: đăng ký (thử sai khớp password) → login → F5 còn phiên → logout → vào Lịch sử → mời login lại. Test: `mvn -Dtest='AuthServiceTests' test`.
