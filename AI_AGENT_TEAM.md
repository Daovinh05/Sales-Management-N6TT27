# AI Agent Team — 4 agent phối hợp phát triển phần mềm

Repo này có một **orchestrator TypeScript** điều phối 4 AI agent để biến yêu cầu tiếng Việt thành thay đổi code có kiểm thử và báo cáo:

LLM có thể đổi provider/model tương thích OpenAI qua `.env`; cấu hình thêm `LLM_FALLBACK_*` để tự chuyển endpoint khi dịch vụ chính quá tải hoặc mất kết nối.

| Agent | Vai trò |
|---|---|
| **Backend** | Spring Boot: Controller → Service → Repository → Entity, validation, phân quyền, JUnit |
| **Frontend** | React + Vite: component, service gọi API, trạng thái loading/empty/error |
| **Testing** | Chạy test/build, đối chiếu acceptance, tìm regression, báo issue có bằng chứng |
| **Debug** | Tái hiện lỗi, tìm root cause, sửa tối thiểu, chạy lại test |

Orchestrator lập DAG task backend/frontend, mặc định chạy tuần tự để tránh xung đột trên working tree dùng chung (có thể bật song song bằng `maxParallel`), tự sinh vòng **Testing → Debug → Testing** (tối đa 3 vòng), có **approval gate** cho hành động rủi ro, dashboard realtime SSE và báo cáo Markdown/JSON + báo cáo riêng từng agent. Tin nhắn riêng giữa role được lưu theo run và chỉ đưa vào inbox của người gửi/người nhận; agent nhận đọc được trong task kế tiếp. Hệ thống **không tự commit/push**; mọi thay đổi nằm trong working tree để review.

---

## Chạy nhanh

```powershell
cd orchestrator
npm install
Copy-Item .env.example .env
# Mở .env, điền LLM_API_KEY (mặc định DeepSeek/OpenAI-compatible)

npm run agent -- doctor
npm run agent -- plan "Thêm API và màn hình quản lý nhà cung cấp"
npm run agent -- run "Thêm API và màn hình quản lý nhà cung cấp" --yes
```

Không có API key vẫn smoke-test được toàn bộ pipeline:

```powershell
npm run agent -- run "Thêm API nhà cung cấp" --mock --no-interactive
npm run agent -- status latest
npm run agent -- report latest --print
npm run agent -- serve latest --port 4317
```

Để xem đủ bốn vai trò thực sự tạo/sửa file, gửi tin riêng, chạy test lỗi rồi Debug sửa và chạy lại mà không gọi LLM bên ngoài:

```powershell
cd orchestrator
npm run demo
```

Artifact demo nằm trong `orchestrator/runs/demo-*` và `orchestrator/runs/demo-*-workspace`.

Khi run dừng chờ duyệt:

```powershell
npm run agent -- approvals latest
npm run agent -- approve <runId> <approvalId>
npm run agent -- resume <runId>
```

### Nhận báo cáo trên Telegram

Trong `orchestrator/.env`, bật `TELEGRAM_NOTIFY=true` và đặt `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Orchestrator gửi tóm tắt khi run hoàn tất hoặc tạm dừng chờ duyệt; nếu Telegram lỗi, kết quả run và báo cáo local vẫn được giữ. Token không được đưa vào log hay môi trường shell con.

Để nhận lệnh từ Telegram, chạy `node dist/cli.js telegram` trong một cửa sổ terminal riêng và để tiến trình hoạt động. Trong chat riêng đã cấu hình, dùng `/run`, `/status`, `/approvals`, `/approve`, `/reject`, `/resume` hoặc `/help`. Đặt `AGENT_APPROVAL_MODE=gate` nếu muốn duyệt thao tác qua bot; `auto` cho phép run tự duyệt.

---

## Tài liệu

| Tài liệu | Nội dung |
|---|---|
| [`orchestrator/README.md`](orchestrator/README.md) | Cài đặt, CLI, cấu hình, quy trình, troubleshooting |
| [`orchestrator/docs/ARCHITECTURE.md`](orchestrator/docs/ARCHITECTURE.md) | Thành phần, state, DAG scheduler, agent loop, quality/approval state machine |
| [`orchestrator/docs/SPEC.md`](orchestrator/docs/SPEC.md) | Yêu cầu chức năng/phi chức năng, acceptance, truy vết code/test |
| [`orchestrator/docs/SECURITY.md`](orchestrator/docs/SECURITY.md) | Threat model, sandbox, secret hygiene, prompt injection, checklist |
| [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Quy ước kiến trúc/test/ngôn ngữ của dự án |

---

## An toàn & giới hạn

- Sandbox đường dẫn trong workspace; chặn `.env`, `*.pem`, `*.key`, `.git`, `docs/Token.md`, `node_modules`, `runs`.
- Chặn `git push`, `reset --hard`, `clean -f`, `rm -rf`, deploy, publish; hành động như `git commit`, `npm install`, `npx`, `docker` cần phê duyệt.
- Approval mode: `gate` (mặc định), `auto`, `deny`.
- Không tự commit/push; review `git diff` và chạy test thủ công trước khi merge.
- Đây là sandbox **mức ứng dụng**, không phải container. Chỉ chạy trên repo tin cậy.
- Chưa có worktree/merge; vì vậy mặc định `maxParallel=1`. Bật song song chỉ khi task backend/frontend tách file rõ ràng.
- Chưa kiểm thử live với API key thật trong repo này (đã test mock + scripted LLM).

Chi tiết threat model và khuyến nghị: [`orchestrator/docs/SECURITY.md`](orchestrator/docs/SECURITY.md).

---

## Kiểm tra chất lượng orchestrator

```powershell
cd orchestrator
npm run typecheck
npm test        # 34 test: plan, policy, state, tools, LLM, engine, server
npm run build
```
