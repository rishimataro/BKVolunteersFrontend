# Frontend API Integration Report

## 1. Mục tiêu thực hiện

- Loại bỏ mock data chạy runtime ở frontend.
- Chuẩn hóa tầng gọi API cho trang chủ public.
- Nối landing page vào backend thật.
- Giữ nguyên layout và logic nghiệp vụ hiện có ở các màn đã dùng API thật.
- Ghi rõ các điểm còn blocked vì backend chưa có endpoint hoặc chưa có model Prisma.

## 2. Các file mock/runtime giả đã loại bỏ hoặc thay thế

| File | Trạng thái | Ghi chú |
|---|---|---|
| `src/features/landing/data/home-content.ts` | Đã xóa | Toàn bộ số liệu landing, chiến dịch nổi bật, leaderboard và danh sách đối tác giả đã bị loại bỏ. |
| `src/testing/mocks.ts` | Đã xóa | Bỏ bootstrap runtime MSW ở frontend. |
| `src/pages/guest/auth/microsoft-mock-login.tsx` | Đã xóa | Xóa hẳn mock login page. |
| `src/app/routes/auth/microsoft-mock-login.tsx` | Đã xóa | Xóa shim route cho mock login. |
| `src/main.tsx` | Đã sửa | Không còn `enableMocking()` khi khởi động app. |
| `src/routes/guest-routes.tsx` | Đã sửa | Bỏ branch route phụ thuộc `ENABLE_API_MOCKING`. |
| `src/constants/paths.ts` | Đã sửa | Bỏ path `/auth/microsoft/mock-login`. |
| `.env.example` | Đã sửa | Bỏ biến runtime mock, chuyển sang `VITE_API_BASE_URL`. |
| `.env.production.example` | Đã sửa | Bỏ biến runtime mock, chuyển sang `VITE_API_BASE_URL`. |

## 3. API service đã tạo hoặc cập nhật

| File service | Mục đích |
|---|---|
| `src/services/public/home.ts` | Lấy dữ liệu thật cho landing từ `GET /public/home`. |
| `src/config/env.ts` | Hỗ trợ `VITE_API_BASE_URL` và vẫn tương thích `VITE_APP_API_URL`. |
| `src/types/api.ts` | Bổ sung type `PublicHomeData` cho payload trang chủ public. |

## 4. Checklist route/page/component hiện có

| Màn hình / component | Trước khi sửa | Service API đang dùng | Endpoint backend | Trạng thái sau sửa | Ghi chú |
|---|---|---|---|---|---|
| `src/pages/guest/landing.tsx` + `LandingHomePage` | Mock runtime | `getPublicHomeData` | `GET /public/home` | `done` | Đã bỏ toàn bộ dữ liệu giả của landing. |
| `src/pages/guest/campaigns.tsx` | API thật | `getPublicCampaigns` | `GET /public/campaigns` | `done` | Không dùng mock runtime. |
| `src/pages/guest/auth/login.tsx` | API thật | `login`, `getMe` | `POST /auth/login`, `GET /auth/me` | `done` | Token thật qua auth store. |
| `src/pages/guest/auth/forgot-password.tsx` | API thật | `forgotPassword` | `POST /password/forgot-password` | `done` | Không dùng setTimeout giả lập. |
| `src/pages/guest/auth/verify-code.tsx` | API thật | `verifyCode` | `POST /password/verify-code` | `done` | Hoạt động qua backend thật. |
| `src/pages/guest/auth/reset-password.tsx` | API thật | `resetPassword` | `POST /password/reset-password` hoặc `POST /password/reset-password/:token` | `done` | Giữ flow hiện có. |
| `src/pages/guest/auth/microsoft-callback.tsx` | API thật | `getUser` | `GET /auth/me` | `done` | Mock login đã bị xóa. |
| `src/pages/guest/certificates/verify.tsx` | API thật | `verifyCertificate` | `GET /public/certificates/verify/:code` | `done` | Public verify thật. |
| `src/pages/guest/organizations/index.tsx` | API thật | `listOrganizations` | `GET /organizations` | `done` | Dữ liệu public thật. |
| `src/pages/guest/organizations/slug.tsx` | API thật | `getOrganizationBySlug` | `GET /organizations/:slug` | `done` | Không còn list giả. |
| `src/pages/shared/dashboard.tsx` | API thật | `getStudentDashboard`, `getStudentActivities`, `getStudentDonations`, `getSchoolOverview`, `getApprovalQueue` | `GET /students/me/dashboard`, `GET /students/me/activities`, `GET /students/me/donations`, `GET /reports/school/overview`, `GET /approvals/campaigns` | `done` | Role-based dashboard dùng dữ liệu thật. |
| `src/pages/shared/profile.tsx` | API thật một phần | `getMe`, `updateCurrentUserProfile` | `GET /auth/me`, `PATCH /auth/me` | `blocked` | Trường liên kết hồ sơ công khai vẫn read-only vì backend chưa có field/endpoint riêng. |
| `src/pages/shared/settings.tsx` | API thật một phần | `changePassword`, `logout`, `getMe` | `PATCH /auth/change-password`, `POST /auth/logout`, `GET /auth/me` | `blocked` | Chưa có endpoint session audit nhiều thiết bị, logout all, 2FA. |
| `src/pages/shared/change-password.tsx` | API thật | `changePassword` | `PATCH /auth/change-password` | `done` | Form ghi dữ liệu thật. |
| `src/pages/shared/notifications.tsx` | API thật | `getNotificationsPage`, `markNotificationRead`, `markAllNotificationsRead` | `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all` | `done` | Loading, error, empty state giữ nguyên. |
| `src/pages/shared/reports.tsx` | API thật | `getSchoolOverview`, `getCampaignReport`, `getCampaignReconciliationReport`, `getManagedCampaigns` | `GET /reports/school/overview`, `GET /reports/campaigns/:id`, `GET /reports/campaigns/:id/reconciliation`, `GET /campaigns` | `done` | Không render dữ liệu giả. |
| `src/pages/shared/campaigns.tsx` | API thật | `campaign`, `approval`, `events`, `fundraising`, `item-donations`, `organizations`, `locations` | Nhiều endpoint `/campaigns`, `/approvals`, `/events`, `/fundraising`, `/item-donations`, `/organizations`, `/locations` | `done` | Chú ý `/locations` vẫn là API thật nhưng backend chưa Prisma hóa. |
| `src/pages/shared/campaign-detail.tsx` | API thật | `getPublicCampaignDetail`, `getApprovalCampaignDetail`, `item-donations` | `GET /public/campaigns/:slug`, `GET /approvals/campaigns/:id`, các endpoint item donation | `done` | Không dùng mock runtime. |
| `src/pages/shared/storage-test.tsx` | API thật | `storage` service | `/storage/*` | `done` | Màn test utility dùng backend thật. |
| `src/pages/student/my-impact.tsx` | API thật | `getStudentDashboard`, `getStudentActivities`, `getPublicCampaigns` | `GET /students/me/dashboard`, `GET /students/me/activities`, `GET /public/campaigns` | `done` | Không có mock list. |
| `src/pages/student/my-donations.tsx` | API thật | `getStudentDonations` | `GET /students/me/donations` | `done` | Dữ liệu donation thật. |
| `src/pages/student/donate.tsx` | API thật | `getFundraisingModule`, `getFundraisingDonations`, `createMoneyDonation` | `/fundraising/modules/:moduleId`, `/fundraising/modules/:moduleId/donations`, `POST /fundraising/modules/:moduleId/donations` | `done` | Quick amount là UI option, không phải dữ liệu backend giả. |
| `src/pages/student/donation-payment.tsx` + `PaymentPanel` | API thật | `getDonationById` | `GET /fundraising/donations/:donationId` | `done` | Có polling thật để kiểm tra trạng thái thanh toán. |
| `src/pages/student/campaign-registration.tsx` | API thật | `getPublicCampaignDetail`, `createEventRegistration` | `GET /public/campaigns/:slug`, `POST /events/modules/:moduleId/registrations` | `done` | Form submit ghi dữ liệu thật. |
| `src/pages/student/certificates.tsx` + `CertificateList` | API thật | `getMyCertificates`, `getStudentDashboard` | `GET /students/me/certificates`, `GET /students/me/dashboard` | `done` | Không còn sample certificate list. |
| `src/pages/organization/campaign-preview.tsx` | API thật | `getManagedCampaignPreview` | `GET /campaigns/:id/preview` | `done` | Preview từ backend. |
| `src/pages/organization/event-management.tsx` | API thật | `events` service | `/events/modules/:moduleId`, `/events/modules/:moduleId/registrations`, `/events/registrations/*` | `done` | Duyệt, check-in, complete đều gọi thật. |
| `src/pages/organization/fundraising-management.tsx` | API thật | `fundraising` service | `/fundraising/modules/:moduleId/*`, `/fundraising/transactions/*` | `done` | Đối soát giao dịch thật. |
| `src/pages/organization/campaign-certificates.tsx` | API thật | `management`, `templates` service | `/certificates/campaigns/:campaignId`, `/certificates/templates`, `/certificates/:id/*` | `done` | Cấp, render, revoke, reissue dùng API thật. |
| `src/pages/organization/org-settings.tsx` | API thật một phần | `getMe` | `GET /auth/me` | `blocked` | Hiện chỉ đọc dữ liệu đơn vị từ phiên đăng nhập; chưa có endpoint update settings đơn vị riêng cho UI này. |
| `src/pages/doantruong/users.tsx` | API thật | `getUsers`, `getUserOptions`, `createUser`, `updateUser`, `updateUserStatus`, `deleteUser` | `/users`, `/users/options`, `PATCH /users/:id`, `PATCH /users/:id/status`, `DELETE /users/:id` | `done` | Quản lý user thật. |
| `src/pages/doantruong/users-data-transfer.tsx` + `UserImportExportPage` | API thật | users service | `/users`, `/users/options` | `done` | Import/export dùng backend thật cho tra cứu và ghi dữ liệu. |
| `src/pages/doantruong/admin-organizations.tsx` | API thật | `admin organizations`, `organizations`, `reports` | `/admin/organizations`, `/organizations`, `/reports/school/overview` | `done` | Không dùng mảng giả. |
| `src/pages/doantruong/audit-logs.tsx` | API thật | `getAuditLogs` | `GET /admin/audit-logs` | `done` | Dữ liệu audit thật. |
| `src/pages/doantruong/background-jobs.tsx` | API thật | `getBackgroundJobs`, `retry*` | `/admin/background-jobs`, `/admin/background-jobs/:id/retry` | `done` | Dữ liệu backend thật. |
| `src/pages/doantruong/certificate-templates.tsx` | API thật | `getTemplates`, `createTemplate`, `updateTemplate`, `deleteTemplate` | `/certificates/templates*` | `done` | Có lỗi lint hook cũ của file, nhưng runtime vẫn build/test pass. |
| `src/features/locations/components/LocationPickerDialog` + `MapView` | API thật nhưng backend còn static | `getLocations` | `GET /locations` | `blocked` | Frontend không còn mock, nhưng backend `/locations` vẫn trả catalog tĩnh từ `locations.data.ts`. |

## 5. Endpoint backend đang dùng trực tiếp sau khi nối

- Auth: `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/me`, `/auth/change-password`
- Password recovery: `/password/forgot-password`, `/password/verify-code`, `/password/reset-password`
- Public: `/public/home`, `/public/campaigns`, `/public/campaigns/:slug`, `/public/certificates/verify/:code`
- Organizations: `/organizations`, `/organizations/:slug`, `/admin/organizations`
- Students: `/students/me/dashboard`, `/students/me/activities`, `/students/me/donations`, `/students/me/certificates`
- Campaigns: `/campaigns`, `/campaigns/:id`, `/campaigns/:id/preview`, `/campaigns/:id/modules`, `/campaigns/:id/submit-review`, `/campaigns/:id/publish`
- Approvals: `/approvals/campaigns`, `/approvals/campaigns/:id`, `/approvals/campaigns/:id/submit`, `/approvals/campaigns/:id/:action`
- Events: `/events/modules/:moduleId`, `/events/modules/:moduleId/registrations`, `/events/registrations/:id/*`
- Fundraising: `/fundraising/modules/:moduleId/*`, `/fundraising/donations/:id`, `/fundraising/transactions/*`
- Item donations: `/item-donations/modules/:moduleId/*`, `/item-donations/targets/:id`, `/item-donations/pledges/:id/*`
- Certificates: `/certificates/templates*`, `/certificates/campaigns/:campaignId`, `/certificates/:id/*`
- Notifications: `/notifications`, `/notifications/:id/read`, `/notifications/read-all`
- Reports: `/reports/school/overview`, `/reports/campaigns/:id`, `/reports/campaigns/:id/reconciliation`
- Users: `/users`, `/users/options`, `/users/:id`, `/users/:id/status`
- Storage: `/storage/*`
- Locations: `/locations`

## 6. Endpoint backend còn thiếu hoặc blocked

| Nhu cầu UI / nghiệp vụ | Trạng thái | Ghi chú |
|---|---|---|
| Session audit nhiều thiết bị | `missing backend endpoint` | `src/pages/shared/settings.tsx` đang chỉ hiển thị phiên hiện tại từ browser local. |
| Logout tất cả phiên | `missing backend endpoint` | UI đang thông báo chờ backend. |
| 2FA / xác thực bổ sung | `missing backend endpoint` | Chưa có endpoint hoặc model cấu hình. |
| Liên kết hồ sơ công khai trong Profile | `missing backend field/endpoint` | `src/pages/shared/profile.tsx` giữ read-only để tránh ghi giả lập. |
| Cập nhật thiết lập đơn vị riêng cho `org-settings` | `missing backend endpoint` | UI hiện chỉ đọc từ `/auth/me`. |
| `/locations` dùng Prisma/MySQL thay vì file tĩnh | `blocked by schema` | Backend chưa có model Prisma cho locations, hiện vẫn đọc `locations.data.ts`. |
| `GET /users/:id` cho màn hình chi tiết user riêng | `missing backend endpoint` | Chưa có page detail riêng ở frontend hiện tại. |
| CRUD/admin cho students hoặc faculties riêng | `missing backend endpoint` | Frontend hiện chưa có route quản trị riêng cho 2 module này. |

## 7. Biến môi trường cần cấu hình

| Biến | Mục đích |
|---|---|
| `VITE_API_BASE_URL` | Base URL chính cho frontend, ví dụ `http://localhost:4000` |
| `VITE_APP_API_URL` | Alias cũ vẫn được hỗ trợ để tương thích |
| `VITE_APP_APP_URL` | URL app frontend |

## 8. Kết quả chạy command

| Command | Kết quả |
|---|---|
| `pnpm lint` | `fail` do lỗi tồn tại sẵn ngoài phạm vi task: thư mục `ECC/`, nhiều shim `export *`, `PaymentPanel.tsx`, `certificate-templates.tsx` |
| `pnpm exec tsc -b --pretty false` | `pass` |
| `pnpm build` | `pass` |
| `pnpm test` | `pass` (`30 files`, `104 tests`) |
| `pnpm dev -- --host 127.0.0.1` | `pass` khởi động Vite; cổng `3000` bận nên app lên ở `http://localhost:3001/` |
| `backend: pnpm typecheck` | `pass` |
| `backend: pnpm build` | `pass` |
| `backend: pnpm test` | `pass` (`28 suites`, `161 tests`) |
| `backend: pnpm dev` | `pass` khởi động ở `http://localhost:4000` |

## 9. Lỗi còn tồn tại / technical debt

- `pnpm lint` của frontend đang fail bởi lỗi tồn tại sẵn trong repo, không phải do integration mới:
  - `src/app/routes/campaign-detail.tsx` và nhiều file shim `export *`
  - `src/features/campaign/components/payment-panel/PaymentPanel.tsx`
  - `src/pages/doantruong/certificate-templates.tsx`
  - một số file trong thư mục `ECC/`
- Backend `locations` vẫn là static catalog, chưa phải dữ liệu MySQL/Prisma.
- Một số màn read-only chủ động giữ nguyên để tránh ghi dữ liệu giả khi backend chưa hỗ trợ: `profile`, `settings`, `org-settings`.

## 10. Tóm tắt kết quả

- Frontend không còn mock runtime cho landing, MSW runtime và mock login.
- Landing page đã nối backend thật qua `GET /public/home`.
- Hầu hết các màn chính trước đó đã dùng API thật, nay được kiểm kê và ghi rõ endpoint tương ứng.
- Phần còn blocked đã được ghi rõ thay vì dùng dữ liệu giả để lấp chỗ trống.
