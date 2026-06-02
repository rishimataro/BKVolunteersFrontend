# Đánh giá tiến độ triển khai so với tài liệu mới

Ngày kiểm tra: 2026-05-05  
Phạm vi kiểm tra: `BKVolunteersBackend`, `BKVolunteersFrontend`, remote `origin`.

## 1. Trạng thái remote và nhánh

### Backend

- Remote: `https://github.com/Mintori09/BKVolunteersBackend`
- Local branch hiện tại: `main`, đang behind `origin/main` 146 commit sau khi fetch.
- Remote `origin/main`: `64f9c05` - `feat: remove coverage`, ngày 2026-04-23.
- Remote mới hơn theo ngày commit:
    - `origin/feature/aiskills`: `e0c994c`, ngày 2026-04-28.
    - `origin/refactor/databasever2`: `dd041d1`, ngày 2026-04-24.
- Nhận xét: `origin/feature/aiskills` có nhiều thay đổi artifact/tài liệu như coverage report, spreadsheet backlog và còn xóa nhiều source module trong diff so với `origin/main`; không nên xem đây là baseline code ổn định nếu chưa review kỹ.

### Frontend

- Remote: `https://github.com/rishimataro/BKVolunteersFrontend`
- Working tree hiện tại đang ở trạng thái `origin/feature/forgot-password`, không phải branch local bình thường.
- Có thay đổi local chưa commit: `pnpm-lock.yaml`.
- Remote `origin/main`: `0ddda23`, ngày 2026-03-27.
- Remote mới hơn theo ngày commit:
    - `origin/feature/aiskills`: `5235f71`, ngày 2026-04-28.
    - `origin/style/home`: `ecccc94`, ngày 2026-04-23.
- Nhận xét: các branch frontend mới chủ yếu thay landing page/assets; chưa thấy triển khai đầy đủ luồng nghiệp vụ campaign/module theo tài liệu mới.

## 2. Kết quả kiểm tra kỹ thuật

| Repo     | Kết quả                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend  | Không chạy test được vì local chưa có `node_modules`. Đã đánh giá tĩnh theo remote `origin/main`.                                                            |
| Frontend | Có `node_modules` nhưng `pnpm test --run` lỗi vì thiếu `node_modules/vitest/vitest.mjs`. Cần cài lại dependency trước khi dùng test làm tín hiệu chất lượng. |

## 3. Đánh giá tổng quan tiến độ

| Nhóm                     | Backend  | Frontend          | Nhận định                                                                                                   |
| ------------------------ | -------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| Nền tảng project         | Khá tốt  | Khá tốt           | Có Express/Prisma/Jest phía backend, React/Vite/React Query phía frontend.                                  |
| Auth                     | Khá      | Một phần          | Backend có login/logout/refresh/me; frontend có auth provider nhưng form login hiện mới mô phỏng UI.        |
| Phân quyền               | Một phần | Một phần          | Backend có `restrictTo`, `isStudent`; frontend có protected route/menu nhưng role type chưa khớp backend.   |
| Campaign                 | Một phần | Rất ít            | Backend có CRUD/status campaign; frontend chỉ có page `Campaigns (Demo)`.                                   |
| Approval                 | Một phần | Chưa có           | Backend có submit/approve/reject nhưng chưa có queue/comment/revision như tài liệu mới.                     |
| Gây quỹ tiền             | Một phần | Chưa có           | Backend có money phase, donation, verify/reject thủ công; chưa có SePay webhook.                            |
| Quyên góp hiện vật       | Một phần | Chưa có           | Backend có item phase và donation hiện vật đơn giản; chưa có item target/pledge/handover theo tài liệu mới. |
| Tình nguyện viên/sự kiện | Một phần | Chưa có           | Backend có event/participant/check-in/certificate URL; chưa tách volunteer module như tài liệu.             |
| Sinh viên dashboard      | Rất ít   | Chưa có           | Backend có `/students/me`, points, titles; chưa có dashboard/history tổng hợp.                              |
| Chứng nhận               | Rất ít   | Chưa có           | Backend chỉ lưu/send `certificateUrl` cho participant; chưa có certificate snapshot/render/verify/revoke.   |
| Notification             | Rất ít   | Một phần UI local | Frontend có notification store/toast; backend chưa có notification table/service.                           |
| Audit/report             | Chưa có  | Chưa có           | Chưa thấy audit log, campaign report, school report theo tài liệu.                                          |

Ước lượng tiến độ so với tài liệu/backlog mới:

- Backend: khoảng 35-45% phần nền và nghiệp vụ lõi cũ.
- Frontend: khoảng 10-15% vì chủ yếu mới có auth shell/landing/placeholder.
- End-to-end theo tài liệu mới: khoảng 20-30%, do chưa có luồng đầy đủ từ public discovery -> campaign detail -> tham gia module -> xác minh -> chứng nhận -> báo cáo.

## 4. Các điểm lệch lớn so với tài liệu mới

### 4.1. Mô hình dữ liệu campaign chưa khớp

Tài liệu mới dùng mô hình `Campaign` container + `campaign_modules` có `type`, `status`, `settings_json`.

Code hiện tại dùng mô hình gần STI/phase:

- `Campaign`
- `MoneyDonationCampaign`
- `ItemDonationCampaign`
- `EventCampaign`
- `Donation`
- `Participant`

Điểm cần quyết định:

- Hoặc refactor theo tài liệu mới với `campaign_modules`.
- Hoặc cập nhật tài liệu/API để chấp nhận mô hình phase hiện tại.

Khuyến nghị: refactor dần theo `campaign_modules`, vì tài liệu mới cần campaign có nhiều module cùng loại/khác loại, preview, review theo module, báo cáo và chứng nhận thống nhất.

### 4.2. Trạng thái campaign chưa khớp

Tài liệu mới:

- `DRAFT`
- `SUBMITTED`
- `PRE_APPROVED`
- `APPROVED`
- `REVISION_REQUIRED`
- `REJECTED`
- `PUBLISHED`
- `ONGOING`
- `ENDED`
- `ARCHIVED`

Code hiện tại:

- `DRAFT`
- `PENDING`
- `ACTIVE`
- `REJECTED`
- `COMPLETED`
- `CANCELLED`

Cần điều chỉnh state machine để hỗ trợ:

- Gửi duyệt riêng với `SUBMITTED`.
- Yêu cầu chỉnh sửa `REVISION_REQUIRED`.
- Duyệt nhưng chưa public `APPROVED`.
- Public/đang chạy/kết thúc tách rõ `PUBLISHED`, `ONGOING`, `ENDED`.

### 4.3. Role và user model chưa khớp tài liệu

Tài liệu mới yêu cầu:

- Public.
- Student.
- Org member.
- Org admin.
- School reviewer.
- School admin.
- System.

Code hiện tại:

- `UserRole`: `CLB`, `LCD`, `DOANTRUONG`.
- Student là bảng/tài khoản riêng và role runtime là `SINHVIEN`.
- Frontend type lại đang là `ADMIN | USER`.

Cần chuẩn hóa:

- Một permission matrix chung.
- Mapping role backend/frontend thống nhất.
- Organization scope rõ cho LCĐ/CLB.
- Tách school reviewer và school admin nếu cần theo tài liệu.

### 4.4. API namespace chưa khớp

Tài liệu mới chia namespace:

- `/public`
- `/students`
- `/organizations`
- `/campaigns`
- `/fundraising`
- `/item-donations`
- `/volunteers`
- `/approvals`
- `/certificates`
- `/reports`
- `/admin`

Code hiện tại dùng:

- `/campaigns`
- `/clubs`
- `/events`
- `/donations`
- `/campaigns/:campaignId/money-phases`
- `/campaigns/:campaignId/item-phases`
- `/money-phases`
- `/item-phases`

Cần bổ sung adapter hoặc refactor route để frontend bám được tài liệu mới.

### 4.5. SePay chưa triển khai

Backend hiện có donation tiền và verify thủ công, nhưng chưa thấy:

- `payment_transactions`.
- SePay webhook.
- Match transaction.
- Idempotency theo provider transaction id.

Đây là gap lớn so với tài liệu mới.

### 4.6. Hiện vật còn đơn giản

Code hiện tại cho hiện vật đang dùng `acceptedItems` dạng text/JSON và `Donation.itemDescription`.

Tài liệu mới yêu cầu:

- `item_targets`.
- `item_pledges`.
- `item_handover_records`.
- Progress theo từng item.
- Confirm/reject pledge.
- Chỉ `RECEIVED` mới vào báo cáo.

### 4.7. Volunteer chưa tách khỏi event

Code hiện tại có `EventCampaign` và `Participant`.

Tài liệu mới yêu cầu module tuyển tình nguyện viên riêng:

- `volunteer_configs`.
- `volunteer_applications`.
- `volunteer_attendance`.
- Requirements/benefits/form schema.
- Approve/reject/check-in/complete.

Có thể tái sử dụng một phần participant/check-in, nhưng cần đổi tên/mô hình để đúng nghiệp vụ tuyển TNV.

### 4.8. Certificate mới ở mức URL

Code hiện tại chỉ có `Participant.certificateUrl` và API gửi certificate URL/email.

Tài liệu mới yêu cầu:

- Template/version.
- Policy.
- Certificate record.
- Snapshot bất biến.
- Render PDF job.
- Public verify.
- Revoke/reissue.

Đây gần như chưa triển khai.

### 4.9. Frontend chưa kết nối nghiệp vụ

Frontend hiện có:

- Landing page.
- Login/forgot/reset UI.
- Protected dashboard shell.
- Placeholder dashboard/campaigns/users/profile/settings.
- Notification store phía client.

Các phần còn thiếu:

- Login form chưa gọi backend thật, đang hiển thị thông báo mô phỏng.
- Type user role chưa khớp backend.
- Chưa có public campaign listing/detail.
- Chưa có org workspace.
- Chưa có approval queue.
- Chưa có donation/item/volunteer forms.
- Chưa có dashboard sinh viên theo tài liệu.
- Chưa có certificate/report UI.

## 5. Đối chiếu theo sprint backlog mới

| Sprint   | Nội dung theo tài liệu                               | Trạng thái hiện tại                                                                                               | Cần làm tiếp                                                                              |
| -------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sprint 1 | Nền tảng, DB lõi, auth, role, public campaign cơ bản | Backend có nền/auth/campaign một phần; frontend có shell/auth UI nhưng chưa login thật; public campaign chưa đúng | Chuẩn hóa schema, role, login FE, public list/detail.                                     |
| Sprint 2 | Campaign management, approval, fundraising, SePay    | Backend có campaign approval đơn giản và donation tiền thủ công; chưa SePay/queue/comment/revision                | Refactor trạng thái, thêm approval namespace/comment, SePay transaction.                  |
| Sprint 3 | Hiện vật, TNV, dashboard sinh viên, notification     | Backend có hiện vật/event ở mức sơ bộ; frontend chưa có UI; backend chưa notification service                     | Tách item target/pledge/handover, volunteer module, dashboard API/UI, notification table. |
| Sprint 4 | Certificate, verify, report, audit, hardening        | Certificate/report/audit hầu như chưa có                                                                          | Triển khai certificate snapshot/render/verify, reports, audit, E2E tests.                 |

## 6. Ưu tiên điều chỉnh đề xuất

### Ưu tiên 1 - Đồng bộ contract trước khi code tiếp

1. Chốt chọn mô hình `campaign_modules` theo tài liệu mới.
2. Cập nhật Prisma schema/migration theo tài liệu DB.
3. Chuẩn hóa role giữa backend/frontend.
4. Chuẩn hóa API response và frontend types.
5. Quyết định route namespace mới và giữ route cũ nếu cần compatibility.

### Ưu tiên 2 - Làm lại end-to-end mỏng

1. Public campaign list/detail.
2. Org tạo campaign + thêm module.
3. Đoàn trường duyệt.
4. Publish campaign.
5. Sinh viên đăng ký/đóng góp một module.
6. Org xác minh.

### Ưu tiên 3 - Bổ sung module theo tài liệu mới

1. Fundraising + SePay transaction.
2. Item donation target/pledge/handover.
3. Volunteer application/check-in/complete.
4. Student dashboard/history.

### Ưu tiên 4 - Hậu chiến dịch

1. Certificate snapshot/render/verify/revoke.
2. Report campaign/school.
3. Audit log.
4. Hardening và E2E.

## 7. Rủi ro cần xử lý

- Backend local đang behind remote `origin/main` 146 commit; cần pull sau khi đảm bảo không có thay đổi local quan trọng.
- Frontend đang ở detached/remote branch state và có `pnpm-lock.yaml` modified; cần stash/commit/khôi phục có chủ đích trước khi chuyển branch/pull.
- Dependency frontend đang hỏng hoặc chưa cài đúng; `pnpm test --run` không chạy được vì thiếu Vitest.
- Branch backend `feature/aiskills` chứa nhiều artifact coverage và xóa source module trong diff; không nên merge thẳng.
- Frontend branch `style/home` có asset `public/landing/5.png` rất lớn, cần kiểm tra dung lượng repo trước khi merge.

## 8. Kết luận

Dự án đã có nền backend ban đầu khá nhiều hơn frontend, nhưng đang lệch đáng kể so với tài liệu mới. Trọng tâm cần làm ngay không phải thêm nhiều UI rời rạc, mà là đồng bộ lại domain model, role, API namespace và state machine. Sau khi contract ổn định, nhóm nên triển khai một luồng end-to-end mỏng trước, rồi mới mở rộng sang hiện vật, tình nguyện viên, chứng nhận và báo cáo.
