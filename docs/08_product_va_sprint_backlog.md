# Product Backlog và Sprint Backlog

## 1. Quy ước backlog

- Mô hình sprint: 4 sprint, mỗi sprint 2 tuần.
- Đơn vị ước lượng: Story Point theo thang Fibonacci `1`, `2`, `3`, `5`, `8`, `13`.
- Priority:
    - `Must`: bắt buộc cho MVP end-to-end.
    - `Should`: nên có để demo/triển khai tốt hơn.
    - `Could`: mở rộng nếu còn thời gian.
- Stack giả định: NodeJS REST API, MySQL 8.x, frontend web.
- Namespace API tham chiếu: `/auth`, `/public`, `/students`, `/organizations`, `/campaigns`, `/fundraising`, `/item-donations`, `/events`, `/approvals`, `/certificates`, `/reports`, `/admin`.

## 2. Phân tích phạm vi triển khai

Backlog hiện tại đã có epic và user story, nhưng để chia việc cho backend/frontend/QA cần thêm ba lớp chi tiết:

- **API contract:** endpoint nào, role nào gọi, input chính gồm query/path/body nào, output thành công gồm field/trạng thái nào.
- **Work package:** mỗi task phải đủ nhỏ để một người nhận việc, có deliverable backend/frontend/test rõ ràng.
- **Nghiệm thu theo trạng thái:** task chỉ xong khi trạng thái nghiệp vụ, permission, response lỗi và dữ liệu báo cáo đúng.

Nguyên tắc chia task:

- Task backend ưu tiên theo thứ tự: migration/seed, service rule, REST controller, validation, test.
- Task frontend ưu tiên theo thứ tự: page route, form/table, state loading/error/empty, permission-based action, manual test.
- Task QA ưu tiên theo thứ tự: happy path, validation error, permission error, state conflict, regression từ sprint trước.
- Một task sprint không nên vượt `8 SP`; nếu vượt phải tách thành API, UI và test riêng.

## 3. Product backlog

| ID     | Epic                | User story                                                                                                         | Priority |  SP | Acceptance criteria                                                                             |
| ------ | ------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | --: | ----------------------------------------------------------------------------------------------- |
| PB-001 | Nền tảng            | Là developer, tôi muốn khởi tạo cấu trúc dự án backend/frontend để nhóm có nền tảng triển khai thống nhất.         | Must     |   5 | Có project chạy local, cấu hình env, health check, cấu trúc module rõ.                          |
| PB-002 | Nền tảng            | Là developer, tôi muốn thiết kế migration MySQL lõi để lưu student account, operator account, tổ chức và campaign. | Must     |   8 | Có bảng lõi, khóa chính/phụ, seed account mẫu, chạy migration không lỗi.                        |
| PB-003 | Auth & phân quyền   | Là người dùng, tôi muốn đăng nhập và xem thông tin tài khoản để sử dụng chức năng theo vai trò.                    | Must     |   5 | `/auth/login`, `/auth/me`, `/auth/logout` hoạt động; token hợp lệ mới vào được API private.     |
| PB-004 | Auth & phân quyền   | Là hệ thống, tôi muốn kiểm tra role/permission theo endpoint để ngăn truy cập sai quyền.                           | Must     |   5 | Student không gọi được API org/admin; org admin chỉ thao tác trong tổ chức của mình.            |
| PB-005 | Tổ chức             | Là Đoàn trường, tôi muốn quản lý danh sách LCĐ/CLB để cấp quyền vận hành chiến dịch.                               | Should   |   5 | CRUD tổ chức cơ bản; phân biệt `LCĐ`, `CLB`, `SCHOOL_UNION`; có trạng thái active/inactive.     |
| PB-007 | Public discovery    | Là khách công khai, tôi muốn xem danh sách chiến dịch công khai để tìm hoạt động phù hợp.                          | Must     |   5 | `/public/campaigns` có search, filter, phân trang; chỉ hiện campaign public.                    |
| PB-008 | Public discovery    | Là người dùng, tôi muốn xem chi tiết campaign để hiểu mục tiêu, tiến độ và cách tham gia.                          | Must     |   8 | Trang chi tiết có thông tin campaign, tổ chức, module, progress, CTA theo trạng thái.           |
| PB-009 | Public discovery    | Là người dùng, tôi muốn xem hồ sơ công khai của tổ chức để đánh giá độ tin cậy.                                    | Should   |   3 | Có logo, mô tả, campaign đang mở/đã hoàn thành, chỉ số hoạt động.                               |
| PB-010 | Campaign management | Là org admin, tôi muốn tạo campaign container để bắt đầu một chiến dịch mới.                                       | Must     |   8 | Tạo/sửa/xóa mềm campaign `DRAFT`; validate thời gian, tiêu đề, tổ chức sở hữu.                  |
| PB-011 | Campaign management | Là org admin, tôi muốn thêm nhiều module vào campaign để campaign có nhiều hình thức tham gia.                     | Must     |   8 | Thêm/sửa module fundraising, item donation, event; module nằm trong thời gian campaign.         |
| PB-012 | Campaign management | Là org admin, tôi muốn preview campaign trước khi gửi duyệt để kiểm tra giao diện public.                          | Should   |   3 | Preview hiển thị dữ liệu draft, không xuất hiện ở public listing.                               |
| PB-013 | Approval            | Là org admin, tôi muốn gửi campaign duyệt để Đoàn trường kiểm tra trước khi công khai.                             | Must     |   5 | Chặn gửi nếu thiếu module hoặc cấu hình bắt buộc; chuyển `SUBMITTED`.                           |
| PB-014 | Approval            | Là Đoàn trường, tôi muốn xem hàng chờ duyệt campaign để xử lý đúng thứ tự.                                         | Must     |   5 | Có list campaign `SUBMITTED`, filter theo tổ chức/trạng thái/loại module.                       |
| PB-015 | Approval            | Là Đoàn trường, tôi muốn bình luận và yêu cầu chỉnh sửa campaign để tổ chức hoàn thiện hồ sơ.                      | Must     |   5 | Comment theo campaign/module/document; `request revision` chuyển trạng thái và gửi thông báo.   |
| PB-016 | Approval            | Là Đoàn trường, tôi muốn sơ duyệt, duyệt chính thức hoặc từ chối campaign.                                         | Must     |   5 | Trạng thái chuyển đúng; có status history; campaign approved có thể publish.                    |
| PB-017 | Fundraising         | Là org admin, tôi muốn cấu hình gây quỹ để nhận tiền đúng tài khoản và mục tiêu.                                   | Must     |   5 | Có target amount, thông tin thụ hưởng, bật/tắt SePay, validate số tiền.                         |
| PB-018 | Fundraising         | Là sinh viên, tôi muốn tạo đóng góp tiền để ủng hộ campaign.                                                       | Must     |   5 | Tạo donation `PENDING`; upload minh chứng nếu có; lưu vào lịch sử sinh viên.                    |
| PB-019 | Fundraising         | Là org admin, tôi muốn xem và xác minh danh sách đóng góp để cập nhật số tiền chính thức.                          | Must     |   8 | List/filter donation; verify/reject; chỉ `VERIFIED` cộng progress.                              |
| PB-020 | Fundraising         | Là hệ thống, tôi muốn nhận webhook SePay để lưu giao dịch realtime.                                                | Should   |   8 | Webhook idempotent; lưu raw payload; match được donation nếu có nội dung định danh.             |
| PB-021 | Fundraising         | Là org admin, tôi muốn import/export danh sách đóng góp để đối soát thủ công.                                      | Could    |   5 | Import file Excel theo template; export CSV/XLSX donation hiện tại.                             |
| PB-022 | Item donation       | Là org admin, tôi muốn cấu hình module hiện vật và danh sách nhu cầu để sinh viên đăng ký.                         | Must     |   8 | Tạo item target, unit, quantity, allow over target; progress theo từng item.                    |
| PB-023 | Item donation       | Là sinh viên, tôi muốn đăng ký quyên góp hiện vật để hỗ trợ campaign.                                              | Must     |   5 | Tạo pledge `PLEDGED`; chặn nếu module đóng hoặc vượt target cứng.                               |
| PB-024 | Item donation       | Là org admin, tôi muốn xác nhận pledge và ghi nhận bàn giao hiện vật.                                              | Must     |   8 | Confirm/reject pledge; tạo handover record; chỉ `RECEIVED` cộng báo cáo.                        |
| PB-025 | Event               | Là org admin, tôi muốn cấu hình module sự kiện để nhận đăng ký đúng yêu cầu.                                       | Must     |   5 | Có địa điểm, quota, quyền lợi, cấu hình đăng ký và check-in.                                    |
| PB-026 | Event               | Là sinh viên, tôi muốn đăng ký sự kiện để tham gia campaign.                                                       | Must     |   5 | Tạo registration `PENDING` hoặc `APPROVED`; chặn đăng ký trùng nếu không cho phép.              |
| PB-027 | Event               | Là org admin, tôi muốn duyệt/từ chối đăng ký sự kiện để quản lý danh sách tham gia.                                | Must     |   5 | Approve/reject có ghi chú; không vượt quota; gửi thông báo.                                     |
| PB-028 | Event               | Là org admin, tôi muốn check-in và đánh dấu hoàn thành sự kiện để làm căn cứ cấp chứng nhận.                       | Must     |   5 | Chỉ check-in đăng ký `APPROVED`; completed có giờ tham gia hoặc trạng thái đủ điều kiện.        |
| PB-029 | Student dashboard   | Là sinh viên, tôi muốn xem dashboard cá nhân để theo dõi hành trình thiện nguyện.                                  | Must     |   8 | Có thống kê campaign, donation, hiện vật, sự kiện, chứng nhận, hoạt động gần đây.               |
| PB-030 | Student dashboard   | Là sinh viên, tôi muốn xem lịch sử tham gia và đóng góp để biết trạng thái từng hoạt động.                         | Must     |   5 | Có tab hoạt động, tiền, hiện vật; filter trạng thái.                                            |
| PB-031 | Certificate         | Là org admin, tôi muốn quản lý template chứng nhận để dùng cho các campaign.                                       | Should   |   5 | Template hoạt động, gắn được vào campaign/module khi generate.                                  |
| PB-032 | Certificate         | Là org admin, tôi muốn tạo chứng nhận cho người đủ điều kiện để phát hành sau chiến dịch.                          | Must     |   8 | Generate certificate candidates; tạo snapshot bất biến trong certificate; trạng thái `PENDING`. |
| PB-033 | Certificate         | Là hệ thống, tôi muốn render file PDF chứng nhận để sinh viên tải xuống.                                           | Must     |   8 | Job render tạo PDF/file record; lỗi chuyển `FAILED`; render lại được.                           |
| PB-034 | Certificate         | Là khách công khai, tôi muốn verify chứng nhận qua mã/QR để kiểm tra tính hợp lệ.                                  | Must     |   5 | Public verify trả thông tin snapshot an toàn; revoked trả invalid/revoked.                      |
| PB-035 | Certificate         | Là org admin/Đoàn trường, tôi muốn revoke và reissue chứng nhận nếu dữ liệu sai.                                   | Should   |   5 | Revoke không sửa bản cũ; reissue tạo certificate mới và audit đầy đủ.                           |
| PB-036 | Notification        | Là người dùng, tôi muốn nhận thông báo khi trạng thái hoạt động thay đổi.                                          | Should   |   5 | Có notification cho duyệt campaign, donation, pledge, event, certificate.                       |
| PB-037 | Audit               | Là Đoàn trường, tôi muốn xem audit log để truy vết thao tác quan trọng.                                            | Should   |   5 | Ghi log các thao tác duyệt, verify, revoke, cập nhật quyền; có API tra cứu.                     |
| PB-038 | Reports             | Là org admin, tôi muốn xem báo cáo campaign để tổng kết kết quả.                                                   | Must     |   8 | Báo cáo tiền verified, hiện vật received, event completed, certificate issued.                  |
| PB-039 | Reports             | Là Đoàn trường, tôi muốn xem dashboard toàn trường để giám sát các đơn vị.                                         | Should   |   8 | Aggregate theo thời gian, tổ chức, loại campaign, trạng thái.                                   |
| PB-040 | UI foundation       | Là người dùng, tôi muốn giao diện có layout, navigation và component trạng thái thống nhất.                        | Must     |   8 | Có shell, menu theo role, status badge, campaign card, data table, form states.                 |
| PB-041 | Hardening           | Là QA, tôi muốn kiểm thử bảo mật và phân quyền để giảm lỗi nghiêm trọng trước demo.                                | Must     |   5 | Có test case auth/permission; endpoint private bị chặn đúng.                                    |
| PB-042 | Hardening           | Là QA, tôi muốn kiểm thử end-to-end các luồng chính để nghiệm thu MVP.                                             | Must     |   8 | Chạy được flow tạo-duyệt-public-tham gia-xác minh-cấp chứng nhận-báo cáo.                       |
| PB-043 | Future scope        | Là hệ thống, tôi muốn auto verify SePay trong tương lai để giảm thao tác thủ công.                                 | Could    |   8 | Chỉ đặc tả future; MVP vẫn yêu cầu xác minh thủ công.                                           |
| PB-044 | Future scope        | Là người dùng, tôi muốn nhận realtime notification để cập nhật trạng thái ngay lập tức.                            | Could    |   5 | Có thiết kế mở rộng WebSocket/SSE; không bắt buộc MVP.                                          |

## 4. Sprint backlog chi tiết theo API contract

### 4.1 Quy ước đọc task sprint

- **API/Input** ghi endpoint, role, path/query/body chính. Mặc định base URL là `/api/v1`.
- **Output nghiệm thu** ghi payload trong `data` hoặc trạng thái nghiệp vụ phải sinh ra; response thực tế luôn bọc bởi `success`, `message`, `data`.
- **Deliverable kỹ thuật** ghi phần việc cụ thể để giao cho backend, frontend hoặc QA.
- **Lỗi bắt buộc** luôn map theo HTTP/API contract chung: `401 Unauthenticated`, `403 Forbidden`, `409 State conflict`, `422 Validation failed` nếu endpoint có auth/state.

### Sprint 1 - Nền tảng, auth và public campaign

**Sprint goal:** Có project chạy local, database lõi, đăng nhập/phân quyền, public campaign list/detail đầu tiên.

| Task ID | PB     |  SP | Công việc cụ thể                                               | API/Input chính                                                                                   | Output nghiệm thu                                                                                                             | Deliverable kỹ thuật                                                                              |
| ------- | ------ | --: | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| S1-T01  | PB-001 |   5 | Khởi tạo backend/frontend, env, health check, cấu trúc module. | `GET /health`; input không auth. `.env` gồm DB, JWT, app port.                                    | `200`, `success=true`, `data.status="ok"`, có `service`, `version`. App backend/frontend chạy local.                          | Backend app shell, frontend shell, config loader, README chạy local, script dev/build.            |
| S1-T02  | PB-002 |   8 | Tạo migration lõi và seed dữ liệu demo.                        | Input: schema từ `02_thiet_ke_database_mysql.md`, seed operator/student/org/campaign mẫu.         | DB có `operator_accounts`, `students`, `organizations`, `campaigns`, `campaign_modules`. Seed login được.                     | Migration, seed account mẫu, seed 3 tài khoản demo, test migration fresh.                         |
| S1-T03  | PB-003 |   5 | Auth API login, refresh, logout, me.                           | `POST /auth/login` body `{ email, password }`; `POST /auth/refresh`; `GET /auth/me` bearer token. | Login trả access token, refresh token, `account_type`, profile hiện tại, organization nếu là operator.                        | Auth controller/service, password hash, JWT/session store, validation, test login sai/đúng.       |
| S1-T04  | PB-004 |   5 | Middleware quyền và phạm vi tổ chức/khoa.                      | Input: bearer token, route policy `{ account_type, role, organization_scope }`.                   | Sai token trả `401`; sai role/sai tổ chức trả `403`; đúng quyền đi tiếp.                                                      | Guard middleware, role resolver, org-scope checker, test student gọi API org bị chặn.             |
| S1-T05  | PB-007 |   5 | Public campaign listing API/UI.                                | `GET /public/campaigns?q=&module_type=&organization_id=&status=&page=&limit=`.                    | Output phân trang: campaign cards gồm `id`, `slug`, `title`, `summary`, `organization`, `module_types`, `progress`, `status`. | Query/filter service, pagination, campaign card UI, empty/loading/error states, API tests filter. |
| S1-T06  | PB-008 |   8 | Public campaign detail API/UI.                                 | `GET /public/campaigns/{slug}`. Input path `slug`.                                                | Output campaign detail gồm mô tả, org, modules, progress, CTA theo trạng thái module.                                         | Detail query, progress presenter, CTA rules, detail page, test campaign chưa public không hiện.   |
| S1-T07  | PB-040 |   8 | UI foundation dùng chung.                                      | Input: role/org từ `/auth/me`, route config.                                                      | Layout có menu theo role, `CampaignCard`, `StatusBadge`, `DataTable`, form states.                                            | Frontend routing, protected route, component base, role-based navigation manual test.             |

**Tổng dự kiến:** 44 SP.

**Demo checklist:**

- Mở public campaign listing, search và filter theo module/status.
- Mở campaign detail, xem progress và CTA đúng trạng thái.
- Login bằng student, org admin, school admin.
- Gọi API private bằng student vào route org và thấy `403`.
- Chạy migration trên database rỗng và seed dữ liệu demo.

### Sprint 2 - Campaign management, approval và fundraising

**Sprint goal:** Org admin tạo campaign/module, gửi duyệt, Đoàn trường xử lý duyệt, fundraising nhận donation và xác minh thủ công.

| Task ID | PB     |  SP | Công việc cụ thể                           | API/Input chính                                                                                                                                                        | Output nghiệm thu                                                                                                              | Deliverable kỹ thuật                                                                                       |
| ------- | ------ | --: | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| S2-T01  | PB-010 |   8 | Campaign draft CRUD cho org admin.         | `POST /campaigns` body `{ title, summary, description, cover_image_url, beneficiary, scope_type, start_at, end_at }`; `PATCH/DELETE /campaigns/{id}`.                  | Tạo campaign `DRAFT`, sinh `slug`, chỉ owner org sửa/xóa khi còn `DRAFT` hoặc `REVISION_REQUIRED`.                             | Campaign service, validation thời gian, slug generator, create/edit form, tests owner scope.               |
| S2-T02  | PB-011 |   8 | Thêm/cập nhật module trong campaign draft. | `POST /campaigns/{id}/modules` body `{ type, title, description, start_at, end_at, settings }`; `PATCH /campaigns/{id}/modules/{moduleId}`.                            | Module `DRAFT`, thời gian nằm trong campaign, settings validate theo `fundraising/item_donation/event`.                        | Module service, settings schema validation, module form UI, tests module out-of-range.                     |
| S2-T03  | PB-012 |   3 | Preview campaign trước khi submit.         | `GET /campaigns/{id}` hoặc `GET /campaigns/{id}/preview` với bearer org admin.                                                                                         | Preview hiển thị dữ liệu draft, module draft, comment/attachment đã có; không xuất hiện ở public listing.                      | Preview presenter dùng chung với public detail, preview page, manual test visibility.                      |
| S2-T04  | PB-013 |   5 | Submit review với validation nghiệp vụ.    | `POST /campaigns/{id}/submit-review` body `{ note }`.                                                                                                                  | Campaign chuyển `SUBMITTED`; thiếu module/config trả `422 Validation failed`; sai trạng thái trả `409 State conflict`.         | Submit service, readiness checker, status history, notification cho reviewer, tests missing config.        |
| S2-T05  | PB-014 |   5 | Approval queue cho Đoàn trường.            | `GET /approvals/campaigns?status=SUBMITTED&organization_id=&module_type=&page=&limit=`.                                                                                | Output list campaign chờ duyệt theo filter, có thời gian submit, org, module summary.                                          | Queue query, reviewer table UI, filter state, tests school role only.                                      |
| S2-T06  | PB-015 |   5 | Comment và request revision.               | `POST /approvals/campaigns/{id}/comments` body `{ module_id, body, visibility, attachment_url }`; `POST /approvals/campaigns/{id}/request-revision` body `{ reason }`. | Comment lưu đúng target; request revision chuyển `REVISION_REQUIRED`, mở quyền org sửa lại.                                    | Comment service, revision transition, notification org, comment panel UI, tests target comment.            |
| S2-T07  | PB-016 |   5 | Pre-approve, approve, reject, publish.     | `POST /approvals/campaigns/{id}/pre-approve                                                                                                                            | approve                                                                                                                        | reject`body`{ reason }`; `POST /campaigns/{id}/publish`.                                                   | State flow đúng: `SUBMITTED -> PRE_APPROVED -> APPROVED -> PUBLISHED`; reject lưu reason. | State machine service, status history, action buttons theo role/state, state transition tests. |
| S2-T08  | PB-017 |   5 | Fundraising config.                        | `PATCH /fundraising/modules/{moduleId}/config` body `{ target_amount, currency, receiver_name, bank_name, bank_account_no, sepay_enabled, sepay_account_id }`.         | Config lưu hợp lệ; target amount > 0; tắt/bật SePay không làm mất bank info.                                                   | Config service, config form, validation tests, masked bank display.                                        |
| S2-T09  | PB-018 |   5 | Tạo donation tiền từ student.              | `POST /fundraising/modules/{moduleId}/donations` body `{ amount, donor_name, message, evidence_url }`; bearer student bắt buộc.                                        | Donation `PENDING`, trả `donation_id`, `status`, `payment_instruction`; student thấy trong lịch sử.                            | Donation service, donation form, evidence field, tests module closed/amount invalid.                       |
| S2-T10  | PB-019 |   8 | List/filter donation và verify/reject.     | `GET /fundraising/modules/{moduleId}/donations?status=&q=&from=&to=`; `PATCH /fundraising/donations/{id}/verify                                                        | reject`body`{ note, transaction_id }`.                                                                                         | Chỉ org owner verify; `VERIFIED` mới cộng progress; reject lưu reason.                                     | Donation admin table, verify modal, progress recalculation, tests verified-only metrics.  |
| S2-T11  | PB-020 |   8 | SePay webhook idempotent và match cơ bản.  | `POST /fundraising/sepay/webhook` provider payload `{ id, amount, content, transaction_time, account_no, signature }`.                                                 | Trùng provider transaction không tạo duplicate; lưu `payment_transactions`; match chuyển donation `MATCHED`, chưa auto verify. | Webhook controller, signature/secret check, idempotency key, raw payload storage, tests duplicate payload. |

**Tổng dự kiến:** 65 SP.

**Demo checklist:**

- Org admin tạo campaign, thêm fundraising module, xem preview.
- Submit review khi thiếu config bị chặn, đủ config thì chuyển `SUBMITTED`.
- School reviewer comment, request revision, pre-approve, approve.
- Org admin publish campaign đã approved.
- Student tạo donation, org admin verify, progress tăng.
- Gửi webhook SePay giả lập hai lần, chỉ một transaction được lưu.

### Sprint 3 - Item donation, event, student dashboard và notification

**Sprint goal:** Sinh viên tham gia hiện vật/sự kiện end-to-end, org admin vận hành xác nhận, sinh viên theo dõi trạng thái trong dashboard.

| Task ID | PB     |  SP | Công việc cụ thể                                | API/Input chính                                                                                                                                                                                                                           | Output nghiệm thu                                                                                                        | Deliverable kỹ thuật                                                                                            |
| ------- | ------ | --: | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| S3-T01  | PB-022 |   8 | Cấu hình module hiện vật và item targets.       | `PATCH /item-donations/modules/{moduleId}/config` body `{ receiver_address, receiver_contact, allow_over_target, handover_note }`; `POST /item-donations/modules/{moduleId}/targets` body `{ name, unit, target_quantity, description }`. | Config lưu; target có `target_quantity`, `received_quantity=0`, `status=ACTIVE`.                                         | Item config service, target CRUD, target form/table, tests target quantity invalid.                             |
| S3-T02  | PB-023 |   5 | Sinh viên pledge hiện vật.                      | `POST /item-donations/modules/{moduleId}/pledges` body `{ item_target_id, quantity, expected_handover_at, note, donor_name }`.                                                                                                            | Pledge `PLEDGED`; chặn module đóng; chặn vượt target nếu `allow_over_target=false`.                                      | Pledge service, student pledge form, duplicate/over-target validation tests.                                    |
| S3-T03  | PB-024 |   8 | Org confirm/reject pledge và ghi nhận handover. | `GET /item-donations/modules/{moduleId}/pledges?status=`; `PATCH /item-donations/pledges/{id}/confirm                                                                                                                                     | reject`; `POST /item-donations/pledges/{id}/handover`body`{ received_quantity, received_at, evidence_url, note }`.       | Confirm chuyển `CONFIRMED`; handover tạo record, pledge `RECEIVED`, item progress tăng theo số lượng thực nhận. | Pledge admin table, handover modal, progress update service, tests received-only report. |
| S3-T04  | PB-025 |   5 | Cấu hình event module.                          | `PATCH /events/modules/{moduleId}/config` body `{ location, quota, registration_required, checkin_required, benefits }`.                                                                                                                  | Config validate địa điểm/quota; public detail hiển thị quyền lợi và thông tin tham gia.                                  | Event config service, config UI, tests invalid quota/location.                                                  |
| S3-T05  | PB-026 |   5 | Sinh viên đăng ký sự kiện.                      | `POST /events/modules/{moduleId}/registrations` body `{ answers }`.                                                                                                                                                                       | Registration `PENDING` hoặc `APPROVED`; chặn trùng nếu module không cho đăng ký nhiều lần; chặn quota/full nếu cấu hình. | Registration service, student registration form, tests duplicate/closed/full.                                   |
| S3-T06  | PB-027 |   5 | Org duyệt/từ chối đăng ký sự kiện.              | `GET /events/modules/{moduleId}/registrations?status=&q=`; `PATCH /events/registrations/{id}/approve                                                                                                                                      | reject`body`{ review_note }`.                                                                                            | Approve chuyển `APPROVED` nếu quota còn; reject lưu note; notification gửi sinh viên.                           | Registration admin table, approve/reject modal, quota guard, notification event tests.   |
| S3-T07  | PB-028 |   5 | Check-in và complete sự kiện.                   | `POST /events/registrations/{id}/check-in` body `{ checked_in_at }`; `POST /events/registrations/{id}/complete` body `{ checked_out_at, hours, note }`.                                                                                   | Chỉ `APPROVED` được check-in; complete tạo registration `COMPLETED`, đủ điều kiện generate certificate.                  | Event attendance service, check-in UI, completion UI, tests invalid state conflict.                             |
| S3-T08  | PB-029 |   8 | Dashboard cá nhân sinh viên.                    | `GET /students/me/dashboard`. Input bearer student.                                                                                                                                                                                       | Output stats `{ campaigns_count, money_amount, item_quantity, event_hours, certificates_count, recent_activities }`.     | Aggregation query, dashboard cards/timeline, tests only current student data.                                   |
| S3-T09  | PB-030 |   5 | Lịch sử tham gia và đóng góp.                   | `GET /students/me/activities?type=&status=`; `GET /students/me/donations?type=&status=`.                                                                                                                                                  | Output tab tiền, hiện vật, sự kiện; mỗi dòng có campaign, module, status, updated_at.                                    | History query, tabs/filter UI, pagination, tests no cross-student leak.                                         |
| S3-T10  | PB-036 |   5 | Notification in-app.                            | `GET /notifications?read=&page=&limit=`; `PATCH /notifications/{id}/read`; system events từ approval/donation/pledge/event/certificate.                                                                                                   | Output list notification, `unread_count`; mark read cập nhật `read_at`.                                                  | Notification table/service, event publisher, notification dropdown/page, tests recipient correctness.           |

**Tổng dự kiến:** 64 SP.

**Demo checklist:**

- Org admin tạo item target, student pledge, org confirm và handover.
- Org admin tạo event config, student register, org approve, check-in, complete.
- Sinh viên mở dashboard thấy donation, item pledge, event, giờ tham gia.
- Notification xuất hiện khi donation/pledge/registration đổi trạng thái.

### Sprint 4 - Certificate, report, audit và nghiệm thu MVP

**Sprint goal:** Hoàn thiện sau chiến dịch: chứng nhận bất biến, verify công khai, báo cáo, audit, security test và E2E nghiệm thu.

| Task ID | PB     |  SP | Công việc cụ thể                                          | API/Input chính                                                                                                       | Output nghiệm thu                                                                                                           | Deliverable kỹ thuật                                                                              |
| ------- | ------ | --: | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| S4-T01  | PB-031 |   5 | Certificate template theo campaign/module.                | `POST /certificates/templates` body `{ name, type, layout_json, file_url }`; `GET /certificates/templates`.           | Template active, dùng được khi generate certificate.                                                                        | Template service, template form, tests layout invalid.                                            |
| S4-T02  | PB-032 |   8 | Generate certificate candidates và snapshot.              | `POST /certificates/campaigns/{campaignId}/generate` body `{ template_id, module_id, dry_run }`.                      | Dry run trả candidates; generate tạo certificate `PENDING` và snapshot bất biến trong bảng `certificates`.                  | Eligibility query, snapshot builder, generate UI, tests no duplicate certificate.                 |
| S4-T03  | PB-033 |   8 | Render PDF certificate và retry lỗi.                      | `POST /certificates/{id}/render`; worker nhận `background_jobs` payload `{ certificate_id, template_id }`.            | Job chuyển `RENDERING -> READY`; lỗi chuyển `FAILED`, retry được; file hash lưu trên `certificates`.                        | Render job worker, storage adapter, retry action, tests failed retry path.                        |
| S4-T04  | PB-034 |   5 | Public verify certificate.                                | `GET /public/certificates/verify/{certificateNo}` hoặc QR URL.                                                        | Output safe snapshot `{ valid, status, student_name, campaign_title, issued_at, organization }`; revoked trả `valid=false`. | Verify presenter, QR data, public verify page, tests không lộ `user_id/raw_payload/audit`.        |
| S4-T05  | PB-035 |   5 | Revoke và reissue certificate.                            | `POST /certificates/{id}/revoke` body `{ reason }`; `POST /certificates/{id}/reissue` body `{ reason, template_id }`. | Bản cũ `REVOKED`, reason lưu ngay trên certificate, bản mới liên kết `replacement_certificate_id`.                          | Revoke service, audit event, reissue flow, tests old verify revoked.                              |
| S4-T06  | PB-038 |   8 | Báo cáo campaign cho org admin.                           | `GET /reports/campaigns/{id}`. Input role org/school, campaign id.                                                    | Output metrics tiền verified, hiện vật received, event completed/hours, certificate issued, timeline.                       | Report aggregation, report page/charts, export-ready DTO, tests verified/received/completed only. |
| S4-T07  | PB-039 |   8 | Dashboard toàn trường.                                    | `GET /reports/school/overview?from=&to=&organization_id=&module_type=&status=`.                                       | Output aggregate theo tổ chức, thời gian, loại module, trạng thái campaign.                                                 | School report query, dashboard charts/tables, filter UI, tests school role only.                  |
| S4-T08  | PB-037 |   5 | Audit log và API tra cứu.                                 | `GET /admin/audit-logs?actor_id=&action=&entity_type=&entity_id=&from=&to=`.                                          | Output audit rows gồm actor, action, entity, before/after, ip, created_at; chỉ school admin xem.                            | Audit middleware/service, audit viewer, tests approve/verify/revoke logged.                       |
| S4-T09  | PB-041 |   5 | Security hardening cho auth, upload, webhook, permission. | Input: permission matrix `05_phan_quyen_va_trang_thai.md`, test cases `07_ke_hoach_kiem_thu.md`.                      | Test chặn student vào org/admin, org khác scope, webhook sai secret, upload sai định dạng.                                  | Security test suite, bug fixes, manual checklist signed off.                                      |
| S4-T10  | PB-042 |   8 | E2E nghiệm thu MVP.                                       | Scenario: create campaign -> approve -> publish -> participate -> verify -> certificate -> report.                    | E2E pass trên dữ liệu demo; bug P0/P1 được sửa; checklist demo ổn định.                                                     | E2E script/manual script, demo seed, regression fixes, release notes MVP.                         |
| S4-T11  | PB-005 |   5 | Quản lý tổ chức cho Đoàn trường.                          | `GET/POST/PATCH /admin/organizations`; body `{ code, name, type, faculty_code, logo_url, description, status }`.      | School admin CRUD org; active/inactive ảnh hưởng quyền tạo campaign.                                                        | Admin org service, organization form/table, tests unique code/status inactive.                    |

**Tổng dự kiến:** 70 SP.

**Demo checklist:**

- Complete một event registration, generate certificate, render PDF và verify public bằng mã/QR.
- Revoke certificate, verify lại thấy `valid=false`.
- Xem report campaign gồm tiền, hiện vật, event, chứng nhận.
- Xem dashboard toàn trường theo tổ chức/trạng thái.
- Mở audit log thấy thao tác approve, verify donation, revoke certificate.
- Chạy luồng E2E từ tạo campaign tới báo cáo trên dữ liệu demo.

## 5. API contract mẫu cho task trọng tâm

### 5.1 Auth login

**Input**

```json
{
    "email": "student@example.edu.vn",
    "password": "secret"
}
```

**Output**

```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "access_token": "jwt-access-token",
        "refresh_token": "refresh-token",
        "user": {
            "id": 1,
            "email": "student@example.edu.vn",
            "full_name": "Nguyen Van A",
            "account_type": "STUDENT",
            "role": "STUDENT",
            "organization": null
        }
    }
}
```

### 5.2 Tạo campaign draft

**Input**

```json
{
    "title": "Xuan tinh nguyen 2026",
    "summary": "Ho tro hoc sinh vung kho khan",
    "description": "Noi dung chi tiet",
    "cover_image_url": "https://storage.example/campaign.jpg",
    "beneficiary": "Hoc sinh xa A",
    "scope_type": "FACULTY",
    "start_at": "2026-06-01T00:00:00+07:00",
    "end_at": "2026-06-30T23:59:59+07:00"
}
```

**Output**

```json
{
    "success": true,
    "message": "Campaign created successfully",
    "data": {
        "id": 101,
        "slug": "xuan-tinh-nguyen-2026",
        "status": "DRAFT",
        "organization_id": 5
    }
}
```

### 5.3 Tạo donation tiền

**Input**

```json
{
    "amount": 200000,
    "donor_name": "Nguyen Van A",
    "message": "Ung ho chien dich",
    "evidence_url": "https://storage.example/evidence.jpg"
}
```

**Output**

```json
{
    "success": true,
    "message": "Donation created successfully",
    "data": {
        "id": 501,
        "status": "PENDING",
        "amount": 200000,
        "payment_instruction": {
            "bank_name": "VCB",
            "bank_account_no": "123456789",
            "transfer_content": "BKVOL 501"
        }
    }
}
```

### 5.4 Pledge hiện vật

**Input**

```json
{
    "item_target_id": 301,
    "quantity": 10,
    "expected_handover_at": "2026-06-15T09:00:00+07:00",
    "note": "Sach giao khoa lop 6"
}
```

**Output**

```json
{
    "success": true,
    "message": "Pledge created successfully",
    "data": {
        "id": 701,
        "status": "PLEDGED",
        "quantity": 10,
        "item_target_id": 301
    }
}
```

### 5.5 Đăng ký sự kiện

**Input**

```json
{
    "answers": {
        "session": "Sang 1",
        "note": "Muon tham gia tron su kien"
    }
}
```

**Output**

```json
{
    "success": true,
    "message": "Event registration submitted successfully",
    "data": {
        "id": 801,
        "status": "PENDING",
        "module_id": 44
    }
}
```

### 5.6 Verify chứng nhận public

**Output**

```json
{
    "success": true,
    "message": "Certificate verified successfully",
    "data": {
        "valid": true,
        "status": "READY",
        "certificate_no": "BKVOL-2026-0001",
        "student_name": "Nguyen Van A",
        "campaign_title": "Xuan tinh nguyen 2026",
        "organization": "LCĐ Khoa CNTT",
        "issued_at": "2026-07-01T09:00:00+07:00"
    }
}
```

## 6. Checklist chia việc cho từng role

| Role       | Việc phải nhận                                                                           | Output bàn giao                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Backend    | Migration, service rule, REST API, validation, permission, unit/API test.                | Endpoint chạy đúng `ApiResponseSuccess<T>`/`ApiResponseError`, lỗi chuẩn, test pass, seed/demo data nếu cần.       |
| Frontend   | Page route, form/table, API integration, loading/error/empty state, permission-based UI. | UI gọi được API, không hiện action sai quyền, demo flow chạy được.                                                 |
| QA         | Test case theo user story, permission matrix, state conflict, E2E checklist.             | Checklist pass/fail rõ, bug có bước tái hiện, regression được kiểm lại, assert đúng `success/message/data/errors`. |
| Product/BA | Chốt acceptance criteria, rule nghiệp vụ, dữ liệu demo, ưu tiên Must/Should/Could.       | Backlog item đủ Definition of Ready trước khi vào sprint.                                                          |

## 7. Backlog future scope

| ID     | Nội dung                                  | Lý do chưa đưa vào MVP                                                  |
| ------ | ----------------------------------------- | ----------------------------------------------------------------------- |
| PB-021 | Import/export donation đầy đủ bằng Excel. | Có thể làm sau khi flow xác minh thủ công ổn định.                      |
| PB-043 | Auto verify SePay.                        | Rủi ro đối soát tiền cao, MVP yêu cầu người vận hành xác minh thủ công. |
| PB-044 | Realtime notification bằng WebSocket/SSE. | In-app notification dạng pull đủ cho MVP.                               |
| FS-001 | Ký số chứng nhận chính thức.              | Cần hạ tầng CA/chính sách chữ ký số riêng.                              |
| FS-002 | Mobile app native.                        | Web responsive đủ cho giai đoạn PBL/MVP.                                |

## 8. Definition of ready

Một backlog item sẵn sàng đưa vào sprint khi:

- User story rõ vai trò, mục tiêu và giá trị.
- Có acceptance criteria kiểm thử được.
- Có API/DB/UI liên quan trong tài liệu thiết kế hoặc đã được thống nhất.
- Không còn phụ thuộc chặn từ sprint trước.
- Ước lượng story point không vượt 13; nếu vượt phải tách nhỏ.

## 9. Definition of done chung

Một item được xem là hoàn thành khi:

- Code/API/UI đáp ứng acceptance criteria.
- Có kiểm tra quyền truy cập phù hợp.
- Có xử lý lỗi cơ bản và response chuẩn `success/message/data/errors`.
- Có migration hoặc seed nếu thay đổi dữ liệu.
- Có test hoặc checklist kiểm thử thủ công tương ứng.
- Không phá vỡ luồng end-to-end đã hoàn thành ở sprint trước.
