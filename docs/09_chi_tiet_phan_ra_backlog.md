# Phân rã chi tiết backlog

## 1. Quy ước phân rã

- Tài liệu này phân rã từ `08_product_va_sprint_backlog.md`.
- Mỗi product backlog `PB-xxx` được chia thành các task nhỏ dạng `PB-xxx-Tn`.
- Mức task đủ để giao cho thành viên nhóm thực hiện trong sprint.
- Effort task dùng đơn vị giờ ước lượng để hỗ trợ chia việc nội bộ; story point vẫn giữ ở product backlog.
- Role thực hiện:
    - `BE`: Backend.
    - `FE`: Frontend.
    - `DB`: Database.
    - `QA`: Kiểm thử.
    - `UX`: Thiết kế giao diện/luồng.
    - `PM`: Quản lý yêu cầu, nghiệm thu.

## 2. Sprint 1 - Nền tảng và public campaign cơ bản

### PB-001 - Khởi tạo cấu trúc dự án

| Task ID   | Việc cần làm                                                      | Role  | Effort | Phụ thuộc | Output                                     |
| --------- | ----------------------------------------------------------------- | ----- | -----: | --------- | ------------------------------------------ |
| PB-001-T1 | Chọn cấu trúc thư mục backend/frontend và quy ước đặt tên module. | BE/FE |     3h | Không     | Cây thư mục dự án và README chạy local.    |
| PB-001-T2 | Cấu hình env mẫu cho database, JWT, storage, app port.            | BE    |     2h | T1        | `.env.example`, config loader.             |
| PB-001-T3 | Tạo health check API và trang frontend kiểm tra app chạy.         | BE/FE |     3h | T1        | `/health`, màn hình app shell cơ bản.      |
| PB-001-T4 | Cấu hình lint/test script tối thiểu.                              | BE/FE |     3h | T1        | Script `test`, `lint`, tài liệu cách chạy. |
| PB-001-T5 | Seed dữ liệu demo tối thiểu cho local.                            | BE/DB |     4h | PB-002    | Tài khoản demo và campaign mẫu.            |

**Acceptance chi tiết:**

- Thành viên mới clone project có thể chạy backend/frontend local.
- Health check trả trạng thái ổn định.
- Env thiếu biến bắt buộc phải báo lỗi rõ.

### PB-002 - Migration MySQL lõi

| Task ID   | Việc cần làm                                                       | Role  | Effort | Phụ thuộc | Output                                       |
| --------- | ------------------------------------------------------------------ | ----- | -----: | --------- | -------------------------------------------- |
| PB-002-T1 | Tạo migration `users`, `roles`, `user_roles`.                      | DB/BE |     4h | Không     | Bảng auth và role.                           |
| PB-002-T2 | Tạo migration `students`, `organizations`, `organization_members`. | DB/BE |     5h | T1        | Bảng sinh viên/tổ chức.                      |
| PB-002-T3 | Tạo migration `campaigns`, `campaign_modules`.                     | DB/BE |     5h | T2        | Bảng campaign lõi.                           |
| PB-002-T4 | Thêm index, unique constraint, foreign key chính.                  | DB/BE |     3h | T1-T3     | Constraint chạy được.                        |
| PB-002-T5 | Seed role và tài khoản demo.                                       | DB/BE |     3h | T1-T4     | Role `STUDENT`, `ORG_ADMIN`, `SCHOOL_ADMIN`. |
| PB-002-T6 | Kiểm thử migration rollback/re-run trên database rỗng.             | QA/BE |     3h | T1-T5     | Checklist migration.                         |

**Acceptance chi tiết:**

- `student_code`, `organization.code`, `campaign.slug` có unique constraint.
- Foreign key không cho dữ liệu mồ côi.
- Seed không tạo trùng khi chạy nhiều lần nếu framework hỗ trợ idempotent seed.

### PB-003 - Auth API

| Task ID   | Việc cần làm                                                          | Role | Effort | Phụ thuộc | Output             |
| --------- | --------------------------------------------------------------------- | ---- | -----: | --------- | ------------------ |
| PB-003-T1 | Thiết kế DTO login/refresh/me/logout.                                 | BE   |     2h | PB-002    | DTO và validation. |
| PB-003-T2 | Implement password hash và login token.                               | BE   |     5h | T1        | `/auth/login`.     |
| PB-003-T3 | Implement middleware đọc token và gắn current user.                   | BE   |     4h | T2        | Auth guard.        |
| PB-003-T4 | Implement `/auth/me`, `/auth/logout`, refresh nếu dùng refresh token. | BE   |     4h | T3        | Auth endpoints.    |
| PB-003-T5 | Tạo UI login và lưu token phía frontend.                              | FE   |     5h | T2        | Trang đăng nhập.   |
| PB-003-T6 | Test login đúng/sai, token hết hạn, logout.                           | QA   |     3h | T2-T5     | Test cases auth.   |

**Acceptance chi tiết:**

- Login sai không tiết lộ tài khoản tồn tại hay không.
- API private thiếu token trả `401`.
- `/auth/me` trả role và organization scope của user.

### PB-004 - Phân quyền theo role và organization

| Task ID   | Việc cần làm                                                           | Role | Effort | Phụ thuộc  | Output                      |
| --------- | ---------------------------------------------------------------------- | ---- | -----: | ---------- | --------------------------- |
| PB-004-T1 | Định nghĩa permission matrix trong code.                               | BE   |     3h | PB-003     | Permission constants.       |
| PB-004-T2 | Implement role guard cho endpoint private.                             | BE   |     4h | T1         | Guard/middleware.           |
| PB-004-T3 | Implement organization scope guard cho org admin.                      | BE   |     5h | T2, PB-002 | Chặn truy cập tổ chức khác. |
| PB-004-T4 | Ẩn/hiện menu frontend theo role.                                       | FE   |     3h | T1         | Role-based navigation.      |
| PB-004-T5 | Test student gọi API org/admin, org admin gọi tài nguyên tổ chức khác. | QA   |     4h | T2-T4      | Permission test.            |

**Acceptance chi tiết:**

- Student bị chặn khi gọi API quản trị.
- Org admin chỉ thao tác campaign thuộc organization mình.
- School admin xem được dữ liệu toàn trường.

### PB-007 - Danh sách campaign public

| Task ID   | Việc cần làm                                                | Role  | Effort | Phụ thuộc | Output                                   |
| --------- | ----------------------------------------------------------- | ----- | -----: | --------- | ---------------------------------------- |
| PB-007-T1 | Thiết kế query list campaign public.                        | BE/DB |     3h | PB-002    | Query có filter.                         |
| PB-007-T2 | Implement `/public/campaigns` với search/filter/pagination. | BE    |     5h | T1        | API list.                                |
| PB-007-T3 | Tạo component `CampaignCard`.                               | FE    |     4h | PB-040    | Card hiển thị cover, title, org, badges. |
| PB-007-T4 | Tạo trang khám phá với search/filter UI.                    | FE    |     6h | T2,T3     | Trang public listing.                    |
| PB-007-T5 | Test campaign draft/submitted không xuất hiện public.       | QA    |     3h | T2-T4     | Test list public.                        |

**Acceptance chi tiết:**

- Chỉ campaign `PUBLISHED`/`ONGOING` xuất hiện.
- Filter theo module type và organization hoạt động đúng.
- Pagination có `page`, `limit`, `total`.

### PB-008 - Chi tiết campaign public

| Task ID   | Việc cần làm                                                           | Role  | Effort | Phụ thuộc | Output                        |
| --------- | ---------------------------------------------------------------------- | ----- | -----: | --------- | ----------------------------- |
| PB-008-T1 | Thiết kế response campaign detail gồm organization, modules, progress. | BE    |     3h | PB-007    | API contract.                 |
| PB-008-T2 | Implement `/public/campaigns/{slug}`.                                  | BE    |     5h | T1        | API detail.                   |
| PB-008-T3 | Tạo layout chi tiết campaign.                                          | FE/UX |     6h | T1        | Header, mô tả, module blocks. |
| PB-008-T4 | Implement CTA theo module type/trạng thái/đăng nhập.                   | FE    |     5h | T2,T3     | CTA state logic.              |
| PB-008-T5 | Test campaign không public trả 404 ở public API.                       | QA    |     2h | T2        | Test visibility.              |

**Acceptance chi tiết:**

- Module đóng hiển thị lý do không thể thao tác.
- Progress hiển thị theo loại module.
- User chưa login vẫn xem được nội dung công khai.

### PB-040 - UI foundation

| Task ID   | Việc cần làm                                                   | Role  | Effort | Phụ thuộc | Output                  |
| --------- | -------------------------------------------------------------- | ----- | -----: | --------- | ----------------------- |
| PB-040-T1 | Tạo app shell, header, sidebar/menu theo role.                 | FE/UX |     5h | PB-003    | Layout nền.             |
| PB-040-T2 | Tạo `StatusBadge`, `EmptyState`, `LoadingState`, `ErrorState`. | FE    |     4h | Không     | Component trạng thái.   |
| PB-040-T3 | Tạo `DataTable` cơ bản với search/filter/action column.        | FE    |     6h | Không     | Bảng dùng cho quản trị. |
| PB-040-T4 | Tạo form field chuẩn: input, select, date, upload placeholder. | FE    |     5h | Không     | Form components.        |
| PB-040-T5 | Kiểm tra responsive cho public pages.                          | QA/FE |     3h | T1-T4     | Checklist UI.           |

**Acceptance chi tiết:**

- UI không vỡ layout trên desktop và mobile phổ biến.
- Component dùng lại được trong các sprint sau.
- Menu không hiện mục sai vai trò.

## 3. Sprint 2 - Quản lý campaign, duyệt và gây quỹ hiện kim

### PB-010 - Tạo và cập nhật campaign

| Task ID   | Việc cần làm                                               | Role | Effort | Phụ thuộc | Output                          |
| --------- | ---------------------------------------------------------- | ---- | -----: | --------- | ------------------------------- |
| PB-010-T1 | Implement API create campaign `DRAFT`.                     | BE   |     5h | PB-004    | `POST /campaigns`.              |
| PB-010-T2 | Implement API update/delete soft campaign draft.           | BE   |     5h | T1        | `PATCH/DELETE /campaigns/{id}`. |
| PB-010-T3 | Validate title, slug, time range, organization ownership.  | BE   |     4h | T1        | Validation service.             |
| PB-010-T4 | Tạo UI campaign form.                                      | FE   |     6h | T1        | Form tạo/sửa campaign.          |
| PB-010-T5 | Tạo UI campaign list cho org admin.                        | FE   |     5h | T1        | Danh sách quản trị.             |
| PB-010-T6 | Test không sửa campaign khi đã submit nếu không được phép. | QA   |     3h | T2-T5     | Test state guard.               |

**Acceptance chi tiết:**

- Campaign mới luôn bắt đầu ở `DRAFT`.
- Org admin không tạo campaign cho tổ chức khác.
- Draft có thể xóa mềm, dữ liệu không bị xóa vật lý.

### PB-011 - Thêm module vào campaign

| Task ID   | Việc cần làm                                          | Role | Effort | Phụ thuộc | Output                     |
| --------- | ----------------------------------------------------- | ---- | -----: | --------- | -------------------------- |
| PB-011-T1 | Implement create/update campaign module generic.      | BE   |     5h | PB-010    | `/campaigns/{id}/modules`. |
| PB-011-T2 | Validate module type và thời gian nằm trong campaign. | BE   |     4h | T1        | Module validator.          |
| PB-011-T3 | Tạo UI chọn module type và form thông tin chung.      | FE   |     5h | T1        | Module wizard.             |
| PB-011-T4 | Tạo cấu trúc tab workspace campaign.                  | FE   |     5h | PB-040    | Tabs tổng quan/modules.    |
| PB-011-T5 | Test thêm nhiều module cùng campaign.                 | QA   |     3h | T1-T4     | Test module CRUD.          |

**Acceptance chi tiết:**

- Hỗ trợ `fundraising`, `item_donation`, `volunteer`.
- Module sai thời gian bị chặn.
- Module draft chưa mở public CTA nếu campaign chưa publish.

### PB-012 - Preview campaign draft

| Task ID   | Việc cần làm                                            | Role | Effort | Phụ thuộc     | Output                   |
| --------- | ------------------------------------------------------- | ---- | -----: | ------------- | ------------------------ |
| PB-012-T1 | Tạo API preview campaign draft theo quyền org.          | BE   |     3h | PB-010,PB-011 | Preview endpoint.        |
| PB-012-T2 | Reuse layout campaign public để hiển thị draft preview. | FE   |     4h | PB-008        | Preview page.            |
| PB-012-T3 | Thêm nhãn preview/draft và tắt CTA thật.                | FE   |     2h | T2            | Preview state.           |
| PB-012-T4 | Test preview không xuất hiện trong `/public/campaigns`. | QA   |     2h | T1-T3         | Test preview visibility. |

### PB-013 - Gửi duyệt campaign

| Task ID   | Việc cần làm                                                        | Role | Effort | Phụ thuộc     | Output                           |
| --------- | ------------------------------------------------------------------- | ---- | -----: | ------------- | -------------------------------- |
| PB-013-T1 | Implement submit review endpoint.                                   | BE   |     4h | PB-010,PB-011 | `/campaigns/{id}/submit-review`. |
| PB-013-T2 | Implement validation có ít nhất 1 module và module config bắt buộc. | BE   |     5h | T1,PB-017     | Review validator.                |
| PB-013-T3 | Ghi status history khi submit.                                      | BE   |     3h | T1            | History record.                  |
| PB-013-T4 | Thêm nút gửi duyệt và hiển thị lỗi validation ở UI.                 | FE   |     4h | T1,T2         | Submit UI.                       |
| PB-013-T5 | Test các case thiếu module/config/thời gian.                        | QA   |     4h | T1-T4         | Review validation test.          |

### PB-014 - Hàng chờ duyệt campaign

| Task ID   | Việc cần làm                                                                          | Role | Effort | Phụ thuộc | Output                  |
| --------- | ------------------------------------------------------------------------------------- | ---- | -----: | --------- | ----------------------- |
| PB-014-T1 | Implement API list approval queue.                                                    | BE   |     4h | PB-013    | `/approvals/campaigns`. |
| PB-014-T2 | Thêm filter theo tổ chức, trạng thái, module type.                                    | BE   |     3h | T1        | Query filter.           |
| PB-014-T3 | Tạo UI hàng chờ duyệt cho Đoàn trường.                                                | FE   |     5h | T1        | Approval list.          |
| PB-014-T4 | Test school reviewer thấy campaign submitted, org admin không thấy queue toàn trường. | QA   |     3h | T1-T3     | Permission test.        |

### PB-015 - Comment và yêu cầu chỉnh sửa

| Task ID   | Việc cần làm                                                  | Role  | Effort | Phụ thuộc | Output                      |
| --------- | ------------------------------------------------------------- | ----- | -----: | --------- | --------------------------- |
| PB-015-T1 | Tạo migration review comments nếu chưa có.                    | DB/BE |     3h | PB-002    | `campaign_review_comments`. |
| PB-015-T2 | Implement API tạo/list comment theo campaign/module/document. | BE    |     5h | T1        | Comment API.                |
| PB-015-T3 | Implement request revision state transition.                  | BE    |     4h | PB-014    | `/request-revision`.        |
| PB-015-T4 | Tạo UI comment panel và revision action.                      | FE    |     5h | T2,T3     | Approval detail UI.         |
| PB-015-T5 | Test request revision mở lại quyền chỉnh sửa phù hợp.         | QA    |     3h | T3,T4     | State test.                 |

### PB-016 - Duyệt, từ chối và publish

| Task ID   | Việc cần làm                                             | Role | Effort | Phụ thuộc | Output                     |
| --------- | -------------------------------------------------------- | ---- | -----: | --------- | -------------------------- |
| PB-016-T1 | Implement pre-approve/approve/reject endpoints.          | BE   |     5h | PB-014    | Approval actions.          |
| PB-016-T2 | Implement publish endpoint cho campaign approved.        | BE   |     4h | T1        | `/campaigns/{id}/publish`. |
| PB-016-T3 | Ghi status history đầy đủ cho mọi transition.            | BE   |     3h | T1,T2     | History service.           |
| PB-016-T4 | Tạo UI action approve/reject/publish với confirm dialog. | FE   |     4h | T1,T2     | Action UI.                 |
| PB-016-T5 | Test state transition sai bị chặn.                       | QA   |     4h | T1-T4     | State machine tests.       |

### PB-017 đến PB-020 - Gây quỹ hiện kim và SePay

| Task ID   | Việc cần làm                                                    | Role  | Effort | Phụ thuộc | Output                  |
| --------- | --------------------------------------------------------------- | ----- | -----: | --------- | ----------------------- |
| PB-017-T1 | Tạo migration/config gây quỹ nếu chưa có.                       | DB/BE |     3h | PB-011    | `fundraising_configs`.  |
| PB-017-T2 | API/UI cấu hình target amount và tài khoản thụ hưởng.           | BE/FE |     7h | T1        | Fundraising settings.   |
| PB-018-T1 | Tạo migration `money_donations`.                                | DB/BE |     3h | PB-017    | Donation table.         |
| PB-018-T2 | API tạo donation public/student.                                | BE    |     5h | T1        | Donation create API.    |
| PB-018-T3 | UI form đóng góp tiền và upload minh chứng.                     | FE    |     6h | T2        | Donation form.          |
| PB-019-T1 | API list/filter donation cho org admin.                         | BE    |     4h | PB-018    | Donation list API.      |
| PB-019-T2 | API verify/reject donation và tính progress.                    | BE    |     6h | T1        | Verify service.         |
| PB-019-T3 | UI bảng donation, action verify/reject.                         | FE    |     6h | T1,T2     | Donation management UI. |
| PB-020-T1 | Tạo migration `payment_transactions`, match table.              | DB/BE |     3h | PB-018    | Transaction tables.     |
| PB-020-T2 | Implement SePay webhook idempotent.                             | BE    |     5h | T1        | Webhook endpoint.       |
| PB-020-T3 | Implement match logic cơ bản theo nội dung định danh/số tiền.   | BE    |     5h | T2        | Match service.          |
| PB-020-T4 | Test webhook trùng, webhook thiếu field, transaction unmatched. | QA    |     4h | T2,T3     | Webhook test.           |

**Acceptance chi tiết:**

- Donation public/student tạo được khi module mở.
- SePay transaction không tự động chuyển donation sang `VERIFIED`.
- Verify/reject đều ghi actor và thời gian.

## 4. Sprint 3 - Hiện vật, tình nguyện viên, dashboard sinh viên và notification

### PB-022 đến PB-024 - Quyên góp hiện vật

| Task ID   | Việc cần làm                                           | Role  | Effort | Phụ thuộc | Output              |
| --------- | ------------------------------------------------------ | ----- | -----: | --------- | ------------------- |
| PB-022-T1 | Tạo migration `item_donation_configs`, `item_targets`. | DB/BE |     4h | PB-011    | Bảng hiện vật.      |
| PB-022-T2 | API cấu hình module hiện vật và CRUD item target.      | BE    |     6h | T1        | Item target API.    |
| PB-022-T3 | UI cấu hình nhu cầu hiện vật.                          | FE    |     6h | T2        | Item settings UI.   |
| PB-022-T4 | Tính progress theo từng item target.                   | BE    |     4h | T2        | Progress service.   |
| PB-023-T1 | Tạo migration `item_pledges`.                          | DB/BE |     3h | PB-022    | Pledge table.       |
| PB-023-T2 | API tạo pledge và validate target/quota/module status. | BE    |     5h | T1        | Pledge API.         |
| PB-023-T3 | UI form pledge hiện vật phía sinh viên.                | FE    |     5h | T2        | Pledge form.        |
| PB-024-T1 | Tạo migration `item_handover_records`.                 | DB/BE |     3h | PB-023    | Handover table.     |
| PB-024-T2 | API confirm/reject pledge.                             | BE    |     4h | T1        | Pledge actions.     |
| PB-024-T3 | API ghi nhận handover và cập nhật received quantity.   | BE    |     5h | T2        | Handover service.   |
| PB-024-T4 | UI hàng chờ pledge và form bàn giao.                   | FE    |     7h | T2,T3     | Item management UI. |
| PB-024-T5 | Test không cộng báo cáo khi chưa `RECEIVED`.           | QA    |     3h | T3,T4     | Item tests.         |

### PB-025 đến PB-028 - Tuyển tình nguyện viên

| Task ID   | Việc cần làm                                                                         | Role  | Effort | Phụ thuộc | Output                 |
| --------- | ------------------------------------------------------------------------------------ | ----- | -----: | --------- | ---------------------- |
| PB-025-T1 | Tạo migration `volunteer_configs`, `volunteer_applications`, `volunteer_attendance`. | DB/BE |     5h | PB-011    | Bảng TNV.              |
| PB-025-T2 | API cấu hình quota, yêu cầu, quyền lợi, form schema.                                 | BE    |     5h | T1        | Volunteer config API.  |
| PB-025-T3 | UI cấu hình tuyển TNV.                                                               | FE    |     5h | T2        | Volunteer settings UI. |
| PB-026-T1 | API nộp đơn TNV và validate trùng/quota/module status.                               | BE    |     5h | PB-025    | Application API.       |
| PB-026-T2 | UI form đăng ký TNV phía sinh viên.                                                  | FE    |     5h | T1        | Volunteer apply form.  |
| PB-027-T1 | API list/filter application.                                                         | BE    |     3h | PB-026    | Application list API.  |
| PB-027-T2 | API approve/reject application, kiểm quota.                                          | BE    |     5h | T1        | Review actions.        |
| PB-027-T3 | UI bảng duyệt TNV.                                                                   | FE    |     5h | T1,T2     | Volunteer review UI.   |
| PB-028-T1 | API check-in/check-out/complete.                                                     | BE    |     5h | PB-027    | Attendance API.        |
| PB-028-T2 | UI check-in và complete trong workspace.                                             | FE    |     4h | T1        | Attendance UI.         |
| PB-028-T3 | Test check-in đơn chưa approve bị chặn.                                              | QA    |     3h | T1,T2     | Volunteer tests.       |

### PB-029, PB-030, PB-036, PB-006 - Dashboard, notification, membership

| Task ID   | Việc cần làm                                          | Role  | Effort | Phụ thuộc            | Output                                   |
| --------- | ----------------------------------------------------- | ----- | -----: | -------------------- | ---------------------------------------- |
| PB-029-T1 | API tổng hợp dashboard sinh viên.                     | BE    |     6h | PB-018,PB-023,PB-026 | `/students/me/dashboard`.                |
| PB-029-T2 | UI dashboard cá nhân.                                 | FE    |     6h | T1                   | Student dashboard.                       |
| PB-030-T1 | API lịch sử hoạt động, tiền, hiện vật.                | BE    |     5h | PB-029               | `/students/me/activities`, `/donations`. |
| PB-030-T2 | UI tab lịch sử và filter trạng thái.                  | FE    |     5h | T1                   | Student history UI.                      |
| PB-036-T1 | Tạo migration `notifications`.                        | DB/BE |     2h | PB-002               | Notification table.                      |
| PB-036-T2 | Notification service và API list/mark read.           | BE    |     5h | T1                   | Notification API.                        |
| PB-036-T3 | Gắn notification vào approval, donation, pledge, TNV. | BE    |     5h | T2                   | Event hooks.                             |
| PB-036-T4 | UI notification list/dropdown.                        | FE    |     4h | T2                   | Notification UI.                         |
| PB-006-T1 | API thêm/list/update thành viên CLB.                  | BE    |     5h | PB-004               | Member API.                              |
| PB-006-T2 | API tạo/duyệt/từ chối join request.                   | BE    |     5h | T1                   | Join request API.                        |
| PB-006-T3 | UI quản lý thành viên CLB.                            | FE    |     5h | T1,T2                | Member management UI.                    |

**Acceptance chi tiết:**

- Dashboard chỉ trả dữ liệu của sinh viên hiện tại.
- Notification đúng người nhận và có trạng thái read/unread.
- CLB membership `APPROVED` mới được dùng để kiểm quyền/phạm vi nội bộ.

## 5. Sprint 4 - Chứng nhận, báo cáo, audit và nghiệm thu

### PB-031 đến PB-035 - Chứng nhận

| Task ID   | Việc cần làm                                                 | Role  | Effort | Phụ thuộc | Output                    |
| --------- | ------------------------------------------------------------ | ----- | -----: | --------- | ------------------------- |
| PB-031-T1 | Tạo migration template, template version, policy.            | DB/BE |     4h | PB-002    | Certificate setup tables. |
| PB-031-T2 | API CRUD template/policy cơ bản.                             | BE    |     5h | T1        | Template/policy API.      |
| PB-031-T3 | UI thiết lập policy cấp chứng nhận.                          | FE    |     5h | T2        | Certificate policy UI.    |
| PB-032-T1 | Tạo migration certificates và snapshots.                     | DB/BE |     4h | PB-031    | Certificate tables.       |
| PB-032-T2 | Implement generate candidates theo rule completed/verified.  | BE    |     6h | T1,PB-028 | Candidate service.        |
| PB-032-T3 | Implement snapshot checksum bất biến.                        | BE    |     5h | T2        | Snapshot service.         |
| PB-033-T1 | Tạo job render certificate và retry.                         | BE    |     6h | PB-032    | Render job.               |
| PB-033-T2 | Tạo PDF đơn giản từ template version và QR verify.           | BE    |     7h | T1        | Certificate PDF.          |
| PB-033-T3 | UI danh sách certificate và trạng thái render.               | FE    |     5h | T1        | Certificate list UI.      |
| PB-034-T1 | API public verify certificate.                               | BE    |     4h | PB-033    | Verify API.               |
| PB-034-T2 | UI verify public.                                            | FE    |     4h | T1        | Verify page.              |
| PB-035-T1 | API revoke certificate.                                      | BE    |     4h | PB-034    | Revoke API.               |
| PB-035-T2 | API reissue certificate tạo bản mới.                         | BE    |     5h | T1        | Reissue API.              |
| PB-035-T3 | Test snapshot không sửa sau `READY`, revoked verify invalid. | QA    |     4h | T1,T2     | Certificate tests.        |

### PB-038, PB-039, PB-037 - Báo cáo và audit

| Task ID   | Việc cần làm                                                                    | Role  | Effort | Phụ thuộc                   | Output                |
| --------- | ------------------------------------------------------------------------------- | ----- | -----: | --------------------------- | --------------------- |
| PB-038-T1 | API báo cáo campaign tổng hợp tiền, hiện vật, TNV, chứng nhận.                  | BE    |     6h | PB-019,PB-024,PB-028,PB-033 | Campaign report API.  |
| PB-038-T2 | UI báo cáo campaign cho org admin.                                              | FE    |     6h | T1                          | Campaign report page. |
| PB-038-T3 | Export báo cáo dạng CSV cơ bản.                                                 | BE/FE |     4h | T1,T2                       | Export action.        |
| PB-039-T1 | API dashboard toàn trường aggregate theo tổ chức/trạng thái.                    | BE    |     6h | PB-038                      | School report API.    |
| PB-039-T2 | UI dashboard toàn trường.                                                       | FE    |     6h | T1                          | School dashboard.     |
| PB-037-T1 | Tạo migration `audit_logs`.                                                     | DB/BE |     2h | PB-002                      | Audit table.          |
| PB-037-T2 | Audit service và middleware/helper ghi log.                                     | BE    |     5h | T1                          | Audit service.        |
| PB-037-T3 | Gắn audit vào approval, donation verify, certificate revoke, permission update. | BE    |     5h | T2                          | Audit hooks.          |
| PB-037-T4 | API/UI tra cứu audit cho school admin.                                          | BE/FE |     6h | T2                          | Audit screen.         |

### PB-041, PB-042, PB-005 - Hardening và nghiệm thu

| Task ID   | Việc cần làm                                                 | Role     | Effort | Phụ thuộc      | Output                  |
| --------- | ------------------------------------------------------------ | -------- | -----: | -------------- | ----------------------- |
| PB-041-T1 | Lập checklist bảo mật auth/permission/upload/webhook.        | QA/PM    |     3h | Tất cả module  | Security checklist.     |
| PB-041-T2 | Test phân quyền student/org/school trên endpoint chính.      | QA       |     5h | PB-004         | Permission report.      |
| PB-041-T3 | Test upload file sai định dạng/kích thước.                   | QA       |     3h | Upload feature | Upload test report.     |
| PB-041-T4 | Test webhook SePay idempotent và signature/secret nếu có.    | QA       |     3h | PB-020         | Webhook test report.    |
| PB-042-T1 | Chuẩn bị dữ liệu demo end-to-end.                            | QA/PM    |     4h | Tất cả module  | Demo dataset.           |
| PB-042-T2 | Chạy flow tạo campaign - duyệt - publish - tham gia.         | QA       |     5h | Sprint 1-3     | E2E result.             |
| PB-042-T3 | Chạy flow xác minh - chứng nhận - verify - báo cáo.          | QA       |     5h | PB-033,PB-038  | E2E result.             |
| PB-042-T4 | Gom lỗi nghiệm thu, phân loại severity và sửa lỗi chặn demo. | BE/FE/QA |     8h | T1-T3          | Bugfix list.            |
| PB-005-T1 | API CRUD tổ chức cho school admin.                           | BE       |     5h | PB-004         | Organization admin API. |
| PB-005-T2 | UI quản lý tổ chức.                                          | FE       |     5h | T1             | Organization admin UI.  |
| PB-005-T3 | Test phân biệt LCĐ/CLB/SCHOOL_UNION và active/inactive.      | QA       |     3h | T1,T2          | Organization tests.     |

**Acceptance chi tiết:**

- Báo cáo chỉ tính donation `VERIFIED`, item `RECEIVED`, TNV `COMPLETED`.
- Audit truy vết được thao tác quan trọng.
- End-to-end MVP chạy được bằng dữ liệu demo từ đầu đến cuối.

## 6. Ma trận phụ thuộc chính

| Nhóm việc           | Phụ thuộc trước                        | Lý do                                         |
| ------------------- | -------------------------------------- | --------------------------------------------- |
| Auth và role        | Migration user/role                    | Cần dữ liệu tài khoản và vai trò.             |
| Public campaign     | Campaign/module tables                 | Cần dữ liệu chiến dịch đã publish.            |
| Campaign management | Auth, role, organization               | Cần xác định org admin sở hữu campaign.       |
| Approval            | Campaign management                    | Chỉ duyệt được campaign đã submit.            |
| Fundraising         | Campaign module                        | Donation phải gắn module gây quỹ.             |
| Item donation       | Campaign module                        | Pledge phải gắn module hiện vật.              |
| Volunteer           | Campaign module                        | Application phải gắn module TNV.              |
| Student dashboard   | Donation, item pledge, application     | Dashboard tổng hợp từ hoạt động đã phát sinh. |
| Certificate         | Volunteer completed hoặc rule verified | Cần dữ liệu đủ điều kiện.                     |
| Report              | Donation/item/TNV/certificate          | Báo cáo cần số liệu từ module vận hành.       |
| Audit               | Các action nghiệp vụ                   | Audit gắn vào thao tác quan trọng.            |

## 7. Gợi ý chia việc theo vai trò nhóm

| Vai trò | Việc nên phụ trách                                               |
| ------- | ---------------------------------------------------------------- |
| BE 1    | Auth, permission, campaign, approval.                            |
| BE 2    | Fundraising, SePay, item donation, volunteer.                    |
| BE 3    | Certificate, report, notification, audit.                        |
| FE 1    | Public pages, student dashboard, auth UI.                        |
| FE 2    | Org workspace, campaign wizard, module management.               |
| FE 3    | School admin, approval queue, report, certificate UI.            |
| QA      | Test plan, permission tests, E2E, regression checklist.          |
| PM/BA   | Nghiệm thu user story, chuẩn bị dữ liệu demo, kiểm scope sprint. |

## 8. Checklist task sẵn sàng nhận việc

- Task có ID rõ và liên kết với `PB-xxx`.
- Có output cụ thể để review.
- Có phụ thuộc rõ ràng.
- Có acceptance hoặc test case tương ứng.
- Effort không quá lớn; task trên 8h nên tách tiếp.
- Không cần quyết định nghiệp vụ mới khi đang làm task.
