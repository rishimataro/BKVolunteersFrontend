# Thiết kế REST API

## 1. Chuẩn chung

- Base URL: `/api/v1`
- Content type: `application/json`
- Auth private API: `Authorization: Bearer <access_token>`
- Date time: ISO 8601, ví dụ `2026-06-01T00:00:00+07:00`.
- ID trong response là number theo `BIGINT UNSIGNED`.
- Phân trang dùng `page`, `limit`; metadata phân trang đặt trong `data.pagination` hoặc `data.meta` của payload nghiệp vụ, không bọc ngoài response envelope.
- Áp dụng cho mọi endpoint trong tài liệu này: response thực tế luôn theo `ApiResponseSuccess<T>` hoặc `ApiResponseError`.
- Trong các bảng endpoint bên dưới, cột `Output` chỉ mô tả payload của `data`, không lặp lại envelope chung.
- API list nên trả `data.items` và `data.pagination`.
- API detail nên trả trực tiếp object trong `data`.
- API action như approve, reject, verify, submit, check-in nên trả object kết quả trong `data` cùng `message` rõ nghĩa theo nghiệp vụ.

Response thành công:

```json
{
    "success": true,
    "message": "Success",
    "data": {}
}
```

Response lỗi:

```json
{
    "success": false,
    "message": "Dữ liệu không hợp lệ",
    "errors": {
        "details": [{ "field": "title", "message": "title is required" }]
    }
}
```

Template runtime:

- Success dùng `ApiResponse.success(res, data, message, statusCode)`.
- Error dùng `ApiResponse.error(res, message, statusCode, errors, stack?)`.
- Chỉ trả `stack` ở môi trường debug/dev, không expose ở production.
- Không endpoint nào tự trả response ngoài envelope này, kể cả webhook, export, verify, hay dashboard/report API.

## 2. Mã lỗi chuẩn

| HTTP | `message` gợi ý                            | `errors` gợi ý                                         |
| ---: | ------------------------------------------ | ------------------------------------------------------ |
|  400 | `Bad request`                              | Lỗi input tổng quát, parse body/query sai.             |
|  401 | `Unauthenticated`                          | Token thiếu, sai, hết hạn, refresh token revoked.      |
|  403 | `Forbidden`                                | Sai quyền hoặc sai phạm vi organization/faculty.       |
|  404 | `Resource not found`                       | Không tìm thấy tài nguyên theo id/slug/certificate_no. |
|  409 | `State conflict` hoặc `Duplicate resource` | Sai trạng thái nghiệp vụ hoặc trùng unique key.        |
|  422 | `Validation failed`                        | `{ details: [{ field, message }] }`.                   |
|  500 | `Internal server error`                    | Lỗi hệ thống không mong muốn.                          |

## 3. ApiError contract

Class backend:

```ts
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly errors: any;

    constructor(
        statusCode: number,
        message: string,
        isOperational = true,
        errors: any = null,
        stack = '',
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errors = errors;
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
```

Quy ước sử dụng:

- Service/controller chủ động `throw new ApiError(statusCode, message, true, errors)`.
- Error middleware map `ApiError` sang `ApiResponse.error(...)`.
- `errors` nên là object có cấu trúc ổn định theo từng nhóm lỗi.
- `isOperational=false` dành cho lỗi không kiểm soát được; response vẫn theo envelope lỗi chuẩn.

Validation error output:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "details": [
            { "field": "email", "message": "email is required" },
            {
                "field": "password",
                "message": "password must be at least 8 characters"
            }
        ]
    }
}
```

Conflict error output:

```json
{
    "success": false,
    "message": "State conflict",
    "errors": {
        "current_status": "APPROVED",
        "allowed_statuses": ["DRAFT", "REVISION_REQUIRED"]
    }
}
```

## 4. Auth API

| Method  | Endpoint            | Quyền         | Input                                     | Output                                                                               |
| ------- | ------------------- | ------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| `POST`  | `/auth/login`       | Public        | Body `{ email, password }`                | Token, account hiện tại, `account_type`, organization/faculty scope nếu là operator. |
| `POST`  | `/auth/refresh`     | Public        | Body `{ refresh_token }`                  | Access token mới và refresh token mới nếu xoay vòng token.                           |
| `POST`  | `/auth/logout`      | Authenticated | Body `{ refresh_token }`                  | Thu hồi refresh token hiện tại.                                                      |
| `GET`   | `/auth/me`          | Authenticated | Bearer token                              | Account hiện tại, student account hoặc operator account, organization nếu có.        |
| `PATCH` | `/auth/me/password` | Authenticated | Body `{ current_password, new_password }` | `changed=true`.                                                                      |

Login input:

```json
{
    "email": "student@example.edu.vn",
    "password": "secret"
}
```

Login output:

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
            "student": {
                "id": 10,
                "student_code": "B21DCCN001",
                "faculty": {
                    "id": 2,
                    "code": "CNTT",
                    "name": "Công nghệ thông tin"
                }
            },
            "account_type": "STUDENT",
            "role": "STUDENT",
            "organization": null
        }
    }
}
```

## 5. Public API

| Method | Endpoint                                      | Input                                                            | Output                                                   |
| ------ | --------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| `GET`  | `/public/campaigns`                           | Query `{ q, module_type, organization_id, status, page, limit }` | Danh sách campaign public phân trang.                    |
| `GET`  | `/public/campaigns/{slug}`                    | Path `slug`                                                      | Chi tiết campaign, organization, modules, progress, CTA. |
| `GET`  | `/public/organizations/{code}`                | Path `code`                                                      | Hồ sơ công khai tổ chức và campaign public liên quan.    |
| `GET`  | `/public/certificates/verify/{certificateNo}` | Path `certificateNo`                                             | Kết quả verify chứng nhận an toàn.                       |

Campaign list output:

```json
{
    "success": true,
    "message": "Campaign list fetched successfully",
    "data": {
        "items": [
            {
                "id": 101,
                "slug": "xuan-tinh-nguyen-2026",
                "title": "Xuân tình nguyện 2026",
                "summary": "Hỗ trợ học sinh vùng khó khăn",
                "cover_image_url": "https://storage.example/campaign.jpg",
                "status": "ONGOING",
                "organization": {
                    "id": 5,
                    "code": "LCD-CNTT",
                    "name": "LCĐ Khoa CNTT"
                },
                "module_types": ["fundraising", "item_donation", "event"],
                "progress": {
                    "money_verified_amount": 12000000,
                    "event_completed_count": 18,
                    "item_received_quantity": 72
                }
            }
        ],
        "pagination": { "page": 1, "limit": 10, "total": 42 }
    }
}
```

Certificate verify output:

```json
{
    "success": true,
    "message": "Certificate verified successfully",
    "data": {
        "valid": true,
        "status": "READY",
        "certificate_no": "BKVOL-2026-0001",
        "student_name": "Nguyen Van A",
        "campaign_title": "Xuân tình nguyện 2026",
        "organization": "LCĐ Khoa CNTT",
        "issued_at": "2026-07-01T09:00:00+07:00"
    }
}
```

## 6. Student API

| Method  | Endpoint                    | Quyền   | Input                                                            | Output                                 |
| ------- | --------------------------- | ------- | ---------------------------------------------------------------- | -------------------------------------- |
| `GET`   | `/students/me/dashboard`    | Student | Bearer token                                                     | Tổng quan cá nhân.                     |
| `GET`   | `/students/me/activities`   | Student | Query `{ type, status, page, limit }`                            | Hoạt động fundraising/item/event.      |
| `GET`   | `/students/me/donations`    | Student | Query `{ type, status, page, limit }`                            | Lịch sử đóng góp tiền và hiện vật.     |
| `GET`   | `/students/me/certificates` | Student | Query `{ status, page, limit }`                                  | Chứng nhận của sinh viên.              |
| `PATCH` | `/students/me/profile`      | Student | Body `{ full_name, phone, avatar_url, class_code, major, year }` | Profile đã cập nhật.                   |
| `GET`   | `/students/me/titles`       | Student | Bearer token                                                     | Điểm tích lũy và danh hiệu đã mở khóa. |

Dashboard output:

```json
{
    "success": true,
    "message": "Dashboard fetched successfully",
    "data": {
        "stats": {
            "campaigns_count": 6,
            "money_amount": 800000,
            "item_quantity": 12,
            "event_hours": 24.5,
            "certificates_count": 2,
            "total_points": 150
        },
        "current_title": {
            "id": 2,
            "name": "Tân binh thiện chiến",
            "min_points": 100
        },
        "recent_activities": [
            {
                "type": "event",
                "campaign_title": "Xuân tình nguyện 2026",
                "status": "COMPLETED",
                "updated_at": "2026-06-20T18:00:00+07:00"
            }
        ]
    }
}
```

## 7. Organization API

| Method  | Endpoint              | Quyền     | Input                                          | Output                                               |
| ------- | --------------------- | --------- | ---------------------------------------------- | ---------------------------------------------------- |
| `GET`   | `/organizations/me`   | Operator  | Bearer token                                   | Organization hiện tại và scope vận hành của account. |
| `PATCH` | `/organizations/{id}` | Org admin | Body `{ name, logo_url, description, status }` | Organization đã cập nhật.                            |

Organization scope output:

```json
{
    "success": true,
    "message": "Organization scope fetched successfully",
    "data": {
        "account_type": "OPERATOR",
        "role": "FACULTY_UNION",
        "organization": {
            "id": 5,
            "code": "LCD-CNTT",
            "name": "LCĐ Khoa CNTT",
            "type": "FACULTY_UNION"
        },
        "faculty": { "id": 2, "code": "CNTT", "name": "Công nghệ thông tin" }
    }
}
```

## 8. Campaign API

| Method   | Endpoint                             | Quyền      | Input                                                            | Output                                 |
| -------- | ------------------------------------ | ---------- | ---------------------------------------------------------------- | -------------------------------------- |
| `GET`    | `/campaigns`                         | Org/School | Query `{ organization_id, status, module_type, q, page, limit }` | Campaign theo quyền.                   |
| `POST`   | `/campaigns`                         | Org admin  | Body campaign draft                                              | Campaign `DRAFT`.                      |
| `GET`    | `/campaigns/{id}`                    | Org/School | Path `id`                                                        | Chi tiết quản trị.                     |
| `PATCH`  | `/campaigns/{id}`                    | Org admin  | Body partial campaign                                            | Campaign đã cập nhật nếu còn sửa được. |
| `DELETE` | `/campaigns/{id}`                    | Org admin  | Path `id`                                                        | Soft delete campaign `DRAFT`.          |
| `POST`   | `/campaigns/{id}/modules`            | Org admin  | Body module                                                      | Module `DRAFT`.                        |
| `PATCH`  | `/campaigns/{id}/modules/{moduleId}` | Org admin  | Body partial module                                              | Module đã cập nhật.                    |
| `POST`   | `/campaigns/{id}/submit-review`      | Org admin  | Body `{ note }`                                                  | Campaign `SUBMITTED`.                  |
| `POST`   | `/campaigns/{id}/publish`            | Org admin  | Body `{}`                                                        | Campaign `PUBLISHED`.                  |
| `POST`   | `/campaigns/{id}/end`                | Org admin  | Body `{ reason }`                                                | Campaign `ENDED`.                      |

Create campaign input:

```json
{
    "title": "Xuân tình nguyện 2026",
    "summary": "Chiến dịch hỗ trợ học sinh vùng khó khăn",
    "description": "Nội dung chi tiết",
    "cover_image_url": "https://storage.example/campaign.jpg",
    "beneficiary": "Học sinh xã A",
    "scope_type": "FACULTY",
    "start_at": "2026-06-01T00:00:00+07:00",
    "end_at": "2026-06-30T23:59:59+07:00"
}
```

Create campaign output:

```json
{
    "success": true,
    "message": "Campaign created successfully",
    "data": {
        "id": 101,
        "organization_id": 5,
        "slug": "xuan-tinh-nguyen-2026",
        "title": "Xuân tình nguyện 2026",
        "status": "DRAFT",
        "start_at": "2026-06-01T00:00:00+07:00",
        "end_at": "2026-06-30T23:59:59+07:00"
    }
}
```

Create module input:

```json
{
    "type": "fundraising",
    "title": "Gây quỹ mua sách",
    "description": "Kêu gọi đóng góp hiện kim",
    "start_at": "2026-06-01T00:00:00+07:00",
    "end_at": "2026-06-20T23:59:59+07:00",
    "settings": {
        "target_amount": 50000000
    }
}
```

Submit review errors:

- `422 Validation failed`: campaign chưa có module hoặc module thiếu config bắt buộc.
- `409 State conflict`: campaign không ở `DRAFT` hoặc `REVISION_REQUIRED`.
- `403 Forbidden`: user không phải org admin của organization sở hữu campaign.

## 9. Approval API

| Method | Endpoint                                     | Quyền                 | Input                                                         | Output                                         |
| ------ | -------------------------------------------- | --------------------- | ------------------------------------------------------------- | ---------------------------------------------- |
| `GET`  | `/approvals/campaigns`                       | School reviewer/admin | Query `{ status, organization_id, module_type, page, limit }` | Hàng chờ duyệt.                                |
| `GET`  | `/approvals/campaigns/{id}`                  | School reviewer/admin | Path `id`                                                     | Chi tiết duyệt, preview, activities, comments. |
| `POST` | `/approvals/campaigns/{id}/comments`         | School reviewer/admin | Body `{ module_id, body, visibility, attachment_url }`        | Comment đã tạo.                                |
| `POST` | `/approvals/campaigns/{id}/request-revision` | School reviewer/admin | Body `{ reason }`                                             | Campaign `REVISION_REQUIRED`.                  |
| `POST` | `/approvals/campaigns/{id}/pre-approve`      | School reviewer/admin | Body `{ reason }`                                             | Campaign `PRE_APPROVED`.                       |
| `POST` | `/approvals/campaigns/{id}/approve`          | School reviewer/admin | Body `{ reason }`                                             | Campaign `APPROVED`.                           |
| `POST` | `/approvals/campaigns/{id}/reject`           | School reviewer/admin | Body `{ reason }`                                             | Campaign `REJECTED`.                           |

Approval action output:

```json
{
    "success": true,
    "message": "Campaign approved successfully",
    "data": {
        "campaign_id": 101,
        "from_status": "SUBMITTED",
        "to_status": "APPROVED",
        "changed_by": 3,
        "reason": "Hồ sơ hợp lệ"
    }
}
```

## 10. Fundraising API

| Method  | Endpoint                                    | Quyền       | Input                                        | Output                                          |
| ------- | ------------------------------------------- | ----------- | -------------------------------------------- | ----------------------------------------------- |
| `GET`   | `/fundraising/modules/{moduleId}`           | Public/Auth | Path `moduleId`                              | Config, progress, payment instruction.          |
| `PATCH` | `/fundraising/modules/{moduleId}/config`    | Org admin   | Body config                                  | Config đã lưu.                                  |
| `POST`  | `/fundraising/modules/{moduleId}/donations` | Student     | Body donation                                | Donation `PENDING`.                             |
| `GET`   | `/fundraising/modules/{moduleId}/donations` | Org admin   | Query `{ status, q, from, to, page, limit }` | Danh sách donation.                             |
| `PATCH` | `/fundraising/donations/{id}/verify`        | Org admin   | Body `{ note, transaction_id }`              | Donation `VERIFIED`.                            |
| `PATCH` | `/fundraising/donations/{id}/reject`        | Org admin   | Body `{ reason }`                            | Donation `REJECTED`.                            |
| `POST`  | `/fundraising/sepay/webhook`                | Provider    | Header signature/secret, provider payload    | Transaction saved, optional donation `MATCHED`. |

Config input:

```json
{
    "target_amount": 50000000,
    "currency": "VND",
    "receiver_name": "LCĐ Khoa CNTT",
    "bank_name": "VCB",
    "bank_account_no": "123456789",
    "sepay_enabled": true,
    "sepay_account_id": "vcb-123456789"
}
```

Donation input:

```json
{
    "amount": 200000,
    "donor_name": "Nguyễn Văn A",
    "message": "Ủng hộ chiến dịch",
    "evidence_url": "https://storage.example/evidence.jpg"
}
```

Donation output:

```json
{
    "success": true,
    "message": "Donation created successfully",
    "data": {
        "id": 501,
        "module_id": 44,
        "campaign_id": 101,
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

SePay webhook input:

```json
{
    "id": "SEPAY-987654",
    "amount": 200000,
    "content": "BKVOL 501",
    "account_no": "123456789",
    "transaction_time": "2026-06-01T10:15:00+07:00"
}
```

SePay webhook output:

```json
{
    "success": true,
    "message": "Webhook processed successfully",
    "data": {
        "transaction_id": 8801,
        "match_status": "MATCHED",
        "donation_id": 501,
        "donation_status": "MATCHED"
    }
}
```

## 11. Item Donation API

| Method  | Endpoint                                     | Quyền     | Input                                                                           | Output                              |
| ------- | -------------------------------------------- | --------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `PATCH` | `/item-donations/modules/{moduleId}/config`  | Org admin | Body `{ receiver_address, receiver_contact, allow_over_target, handover_note }` | Config đã lưu.                      |
| `POST`  | `/item-donations/modules/{moduleId}/targets` | Org admin | Body `{ name, unit, target_quantity, description }`                             | Target `ACTIVE`.                    |
| `PATCH` | `/item-donations/targets/{targetId}`         | Org admin | Body partial target                                                             | Target đã cập nhật.                 |
| `POST`  | `/item-donations/modules/{moduleId}/pledges` | Student   | Body pledge                                                                     | Pledge `PLEDGED`.                   |
| `GET`   | `/item-donations/modules/{moduleId}/pledges` | Org admin | Query `{ status, item_target_id, page, limit }`                                 | Danh sách pledge.                   |
| `PATCH` | `/item-donations/pledges/{id}/confirm`       | Org admin | Body `{ note }`                                                                 | Pledge `CONFIRMED`.                 |
| `PATCH` | `/item-donations/pledges/{id}/reject`        | Org admin | Body `{ reason }`                                                               | Pledge `REJECTED`.                  |
| `POST`  | `/item-donations/pledges/{id}/handover`      | Org admin | Body `{ received_quantity, received_at, evidence_url, note }`                   | Handover record, pledge `RECEIVED`. |

Pledge input:

```json
{
    "item_target_id": 301,
    "quantity": 10,
    "expected_handover_at": "2026-06-15T09:00:00+07:00",
    "note": "Sách giáo khoa lớp 6"
}
```

Handover output:

```json
{
    "success": true,
    "message": "Handover recorded successfully",
    "data": {
        "pledge_id": 701,
        "status": "RECEIVED",
        "received_quantity": 10,
        "item_target": {
            "id": 301,
            "received_quantity": 25,
            "target_quantity": 100
        }
    }
}
```

## 12. Event API

| Method  | Endpoint                                   | Quyền     | Input                                                       | Output                                                    |
| ------- | ------------------------------------------ | --------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `PATCH` | `/events/modules/{moduleId}/config`        | Org admin | Body `{ location, quota, registration_required, settings }` | Event config saved.                                       |
| `POST`  | `/events/modules/{moduleId}/registrations` | Student   | Body `{ answers }`                                          | Event registration `PENDING` hoặc `APPROVED` theo config. |
| `PATCH` | `/events/registrations/{id}/approve`       | Org admin | Body `{ review_note }`                                      | Event registration `APPROVED`.                            |
| `PATCH` | `/events/registrations/{id}/reject`        | Org admin | Body `{ review_note }`                                      | Event registration `REJECTED`.                            |
| `POST`  | `/events/registrations/{id}/check-in`      | Org admin | Body `{ checked_in_at }`                                    | Event registration checked in.                            |
| `POST`  | `/events/registrations/{id}/complete`      | Org admin | Body `{ checked_out_at, hours, note }`                      | Event registration `COMPLETED`.                           |

Event registration input:

```json
{
    "answers": {
        "session": "Sang 1",
        "note": "Co the tham gia ca ngay"
    }
}
```

Event registration output:

```json
{
    "success": true,
    "message": "Event registration submitted successfully",
    "data": {
        "id": 801,
        "module_id": 44,
        "student_id": 10,
        "status": "PENDING"
    }
}
```

## 13. Certificate API

| Method | Endpoint                                        | Quyền        | Input                                        | Output                                  |
| ------ | ----------------------------------------------- | ------------ | -------------------------------------------- | --------------------------------------- |
| `GET`  | `/certificates/templates`                       | Org/School   | Query `{ status, type }`                     | Template active.                        |
| `POST` | `/certificates/templates`                       | School admin | Body `{ name, type, layout_json, file_url }` | Template created.                       |
| `POST` | `/certificates/campaigns/{campaignId}/generate` | Org admin    | Body `{ template_id, module_id, dry_run }`   | Candidates hoặc certificates `PENDING`. |
| `POST` | `/certificates/{id}/render`                     | Org admin    | Body `{}`                                    | Background job queued.                  |
| `GET`  | `/certificates/{id}/download`                   | Owner/Org    | Path `id`                                    | Signed URL hoặc file URL.               |
| `POST` | `/certificates/{id}/revoke`                     | Org/School   | Body `{ reason }`                            | Certificate `REVOKED`.                  |
| `POST` | `/certificates/{id}/reissue`                    | Org/School   | Body `{ reason, template_id }`               | Certificate mới liên kết bản cũ.        |

Generate input:

```json
{
    "template_id": 7001,
    "module_id": 44,
    "dry_run": false
}
```

Generate output:

```json
{
    "success": true,
    "message": "Certificates generated successfully",
    "data": {
        "created_count": 2,
        "skipped_count": 0,
        "certificates": [
            {
                "id": 9001,
                "certificate_no": "BKVOL-2026-0001",
                "student_id": 10,
                "status": "PENDING"
            }
        ]
    }
}
```

Download output:

```json
{
    "success": true,
    "message": "Certificate download URL generated successfully",
    "data": {
        "certificate_id": 9001,
        "status": "READY",
        "file_url": "https://storage.example/certificates/BKVOL-2026-0001.pdf",
        "expires_at": "2026-07-01T10:00:00+07:00"
    }
}
```

## 14. Notification API

| Method  | Endpoint                   | Quyền         | Input                         | Output                                             |
| ------- | -------------------------- | ------------- | ----------------------------- | -------------------------------------------------- |
| `GET`   | `/notifications`           | Authenticated | Query `{ read, page, limit }` | Notification list và `unread_count`.               |
| `PATCH` | `/notifications/{id}/read` | Authenticated | Path `id`                     | Notification có `read_at`.                         |
| `PATCH` | `/notifications/read-all`  | Authenticated | Body `{}`                     | Tất cả notification của user được đánh dấu đã đọc. |

Output:

```json
{
    "success": true,
    "message": "Notifications fetched successfully",
    "data": {
        "items": [
            {
                "id": 3001,
                "type": "DONATION_VERIFIED",
                "title": "Đóng góp đã được xác minh",
                "body": "Đóng góp 200000 VND của bạn đã được xác minh.",
                "data": { "donation_id": 501, "campaign_id": 101 },
                "read_at": null,
                "created_at": "2026-06-02T08:00:00+07:00"
            }
        ],
        "unread_count": 5,
        "pagination": { "page": 1, "limit": 20, "total": 5 }
    }
}
```

## 15. Reports and Admin API

| Method  | Endpoint                      | Quyền        | Input                                                                       | Output                 |
| ------- | ----------------------------- | ------------ | --------------------------------------------------------------------------- | ---------------------- |
| `GET`   | `/reports/campaigns/{id}`     | Org/School   | Path `id`                                                                   | Báo cáo campaign.      |
| `GET`   | `/reports/organizations/{id}` | Org/School   | Query `{ from, to, module_type }`                                           | Báo cáo theo tổ chức.  |
| `GET`   | `/reports/school/overview`    | School admin | Query `{ from, to, organization_id, module_type, status }`                  | Dashboard toàn trường. |
| `GET`   | `/admin/faculties`            | School admin | Query `{ q, page, limit }`                                                  | Danh sách khoa.        |
| `POST`  | `/admin/faculties`            | School admin | Body `{ code, name }`                                                       | Faculty created.       |
| `PATCH` | `/admin/faculties/{id}`       | School admin | Body `{ code, name }`                                                       | Faculty updated.       |
| `GET`   | `/admin/organizations`        | School admin | Query `{ type, status, faculty_id, q, page, limit }`                        | Quản lý đơn vị.        |
| `POST`  | `/admin/organizations`        | School admin | Body `{ code, name, type, faculty_id, logo_url, description, status }`      | Organization created.  |
| `PATCH` | `/admin/organizations/{id}`   | School admin | Body partial organization                                                   | Organization updated.  |
| `GET`   | `/admin/audit-logs`           | School admin | Query `{ actor_id, action, entity_type, entity_id, from, to, page, limit }` | Audit log.             |

Campaign report output:

```json
{
    "success": true,
    "message": "Campaign report fetched successfully",
    "data": {
        "campaign_id": 101,
        "money": {
            "verified_amount": 12500000,
            "pending_amount": 300000,
            "donation_count": 81
        },
        "items": {
            "received_quantity": 72,
            "pledged_quantity": 95
        },
        "events": {
            "completed_count": 18,
            "total_hours": 144
        },
        "certificates": {
            "issued_count": 18,
            "revoked_count": 0
        }
    }
}
```

Audit log output:

```json
{
    "success": true,
    "message": "Audit logs fetched successfully",
    "data": {
        "items": [
            {
                "id": 1,
                "actor": { "id": 3, "full_name": "Cán bộ Đoàn trường" },
                "action": "CAMPAIGN_APPROVED",
                "entity_type": "campaign",
                "entity_id": 101,
                "before": { "status": "PRE_APPROVED" },
                "after": { "status": "APPROVED" },
                "ip_address": "127.0.0.1",
                "created_at": "2026-06-01T09:00:00+07:00"
            }
        ],
        "pagination": { "page": 1, "limit": 20, "total": 1 }
    }
}
```

## 16. State và lỗi bắt buộc theo nhóm

| Nhóm          | Lỗi phải xử lý                                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | Login sai trả `401 Unauthenticated`; refresh token hết hạn hoặc revoked trả `401 Unauthenticated`.                                                                                 |
| Campaign      | Sửa campaign đã `SUBMITTED/APPROVED/PUBLISHED` trả `409 State conflict`; org khác scope trả `403 Forbidden`.                                                                       |
| Approval      | Approve campaign không ở trạng thái hợp lệ trả `409 State conflict`; thiếu reason khi reject/request revision trả `422 Validation failed`.                                         |
| Fundraising   | Donation vào module đóng trả `409 State conflict`; verify donation đã verified/rejected trả `409 State conflict`; webhook trùng phải idempotent, không tạo duplicate.              |
| Item donation | Pledge vượt target khi `allow_over_target=false` trả `422 Validation failed`; handover pledge chưa `CONFIRMED` trả `409 State conflict`.                                           |
| Event         | Đăng ký trùng trả `409 Duplicate resource`; approve vượt quota trả `409 State conflict`; check-in đơn chưa `APPROVED` trả `409 State conflict`.                                    |
| Certificate   | Generate trùng certificate trả skipped trong output; verify revoked trả `success=true` với `data.valid=false`; render certificate không `PENDING/FAILED` trả `409 State conflict`. |
