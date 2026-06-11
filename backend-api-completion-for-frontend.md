# Backend API Completion For Frontend

## 1. Phạm vi kiểm tra

Đối chiếu giữa:

- frontend route/page hiện có trong `src/pages`
- service hiện có trong `src/services`
- backend route/controller/service trong repo `BKVolunteersBackend`
- `prisma/schema.prisma`
- `docs/api/swagger.yaml`

## 2. Trạng thái endpoint theo domain

| Domain | Endpoint / nhóm endpoint | Trạng thái | Ghi chú |
|---|---|---|---|
| Public home | `GET /public/home` | `newly created` | Bổ sung trong lượt này để thay thế landing mock data. |
| Public campaigns | `GET /public/campaigns`, `GET /public/campaigns/:slug` | `existed` | Frontend đã dùng thật. |
| Public certificates | `GET /public/certificates/verify/:code` | `existed` | Dùng cho màn verify public. |
| Auth | `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/auth/change-password` | `existed` | Frontend đang dùng thật. |
| Password recovery | `/password/forgot-password`, `/password/verify-code`, `/password/reset-password` | `existed` | Flow quên mật khẩu dùng thật. |
| Users | `/users`, `/users/options`, `/users/:id`, `/users/:id/status`, `DELETE /users/:id` | `existed` | Đủ cho màn quản lý user hiện tại. |
| Users detail screen riêng | `GET /users/:id` kiểu detail đầy đủ | `blocked` | Chưa có page detail riêng ở frontend hiện tại. |
| Students self-service | `/students/me/dashboard`, `/students/me/activities`, `/students/me/donations`, `/students/me/certificates` | `existed` | Đủ cho dashboard, impact, donations, certificates. |
| Students admin CRUD | Danh sách/chi tiết/cập nhật student cho admin | `blocked` | Backend chưa có nhóm endpoint riêng tương ứng với kỳ vọng mở rộng. |
| Faculties | Endpoint faculty riêng | `blocked` | Hiện faculties được biểu diễn qua organizations/campaign ownership; chưa có route riêng. |
| Organizations public | `/organizations`, `/organizations/:slug` | `existed` | Frontend public organizations dùng thật. |
| Organizations admin | `/admin/organizations` + create/update/delete | `existed` | Dùng cho màn Đoàn trường. |
| Campaigns manage | `/campaigns`, `/campaigns/:id`, `/campaigns/:id/preview`, `/campaigns/:id/modules`, `/campaigns/:id/submit-review`, `/campaigns/:id/publish` | `existed` | Dùng thật. |
| Approvals | `/approvals/campaigns*` | `existed` | Dùng cho duyệt chiến dịch. |
| Event modules / registrations | `/events/modules/:moduleId*`, `/events/registrations/:id/*` | `existed` | Dùng cho đăng ký, duyệt, check-in, complete. |
| Fundraising | `/fundraising/modules/:moduleId*`, `/fundraising/donations/:id`, `/fundraising/transactions*` | `existed` | Dùng thật cho donate và quản lý fundraising. |
| Item donations | `/item-donations/modules/:moduleId*`, `/item-donations/targets/:id`, `/item-donations/pledges/:id/*` | `existed` | Dùng thật trong quản lý chiến dịch. |
| Certificates | `/certificates/templates*`, `/certificates/campaigns/:campaignId`, `/certificates/:id/*` | `existed` | Dùng thật cho template và campaign certificates. |
| Notifications | `/notifications`, `/notifications/:id/read`, `/notifications/read-all` | `existed` | Dùng thật. |
| Reports | `/reports/school/overview`, `/reports/campaigns/:id`, `/reports/campaigns/:id/reconciliation` | `existed` | Dùng thật cho dashboard/report. |
| Storage | `/storage/*` | `existed` | Dùng trong storage test page. |
| Locations | `GET /locations` | `blocked` | Route có thật nhưng backend vẫn trả dữ liệu tĩnh từ `locations.data.ts`, chưa dùng Prisma/MySQL vì schema chưa có model location. |
| Session audit / logout all / 2FA | nhóm auth security nâng cao | `blocked` | Frontend `settings` đang chờ backend hoàn thiện. |
| Profile public links | field/endpoint cập nhật social links | `blocked` | `profile` giữ read-only để tránh ghi giả. |
| Organization settings mutation | endpoint cập nhật riêng cho màn `org-settings` | `blocked` | Chưa có route/service tương ứng. |

## 3. Endpoint mới được bổ sung trong lượt này

| Method | Endpoint | Trách nhiệm |
|---|---|---|
| `GET` | `/api/v1/public/home` | Trả dữ liệu tổng hợp cho landing: metrics, featured campaigns, organization leaderboard, spotlight organizations. |

## 4. File backend đã chỉnh

| File | Nội dung |
|---|---|
| `../BKVolunteersBackend/src/features/public/public.route.ts` | Mount `GET /public/home`. |
| `../BKVolunteersBackend/src/features/public/public.controller.ts` | Thêm controller `getPublicHome`. |
| `../BKVolunteersBackend/src/features/catalog/catalog.service.ts` | Thêm `getPublicHomeData()` tổng hợp dữ liệu thật từ campaign/report/organization hiện có. |

## 5. Model Prisma liên quan

`/public/home` đang lấy dữ liệu từ các truy vấn Prisma đã tồn tại trong `catalog.service.ts`, bao gồm:

- `campaign`
- `campaign.modules`
- `certificate`
- `student`
- `faculty`
- `club`

Không có model Prisma riêng cho `locations`, nên phần này vẫn blocked.

## 6. Dữ liệu seed / dữ liệu kiểm thử

- Backend test suite pass với dữ liệu test/integration hiện có.
- Frontend landing test đã được cập nhật để mock đúng contract mới của `GET /public/home`.
- Chưa tạo seed mới riêng cho `/public/home`; endpoint tái sử dụng dữ liệu campaign/report/organization đang có trong DB hoặc test fixtures.

## 7. Command đã chạy và kết quả

| Command | Kết quả |
|---|---|
| `frontend: pnpm exec tsc -b --pretty false` | `pass` |
| `frontend: pnpm build` | `pass` |
| `frontend: pnpm test` | `pass` |
| `frontend: pnpm dev -- --host 127.0.0.1` | `pass` |
| `backend: pnpm typecheck` | `pass` |
| `backend: pnpm build` | `pass` |
| `backend: pnpm test` | `pass` |
| `backend: pnpm dev` | `pass` |

## 8. Kết luận backend cho nhu cầu frontend hiện tại

- Màn hình hiện có của frontend đã có backend thật cho hầu hết luồng chính.
- Endpoint thiếu trực tiếp làm vướng UI public là `/public/home`; đã được bổ sung trong lượt này.
- Các phần còn blocked chủ yếu là tính năng mở rộng hoặc bảo mật nâng cao, không còn bị che bằng mock data ở frontend.
- Điểm cần ưu tiên tiếp theo ở backend nếu muốn sạch hoàn toàn theo tiêu chí “không mock runtime” là chuyển `/locations` từ static catalog sang model Prisma/MySQL thật.
