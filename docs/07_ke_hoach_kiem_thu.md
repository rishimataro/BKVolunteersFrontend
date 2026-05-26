# Kế hoạch kiểm thử

## 1. Mục tiêu

Đảm bảo hệ thống campaign thiện nguyện vận hành đúng theo nghiệp vụ: tạo campaign, duyệt, công khai, sinh viên tham gia, tổ chức xác minh, cấp chứng nhận và báo cáo.

## 2. Kiểm thử contract API chung

Áp dụng cho mọi endpoint:

- Response success phải có `success=true`, `message` là string, `data` khác `undefined`.
- Response error phải có `success=false`, `message` là string, `errors` có thể là `null`, object hoặc array theo ngữ cảnh.
- Chỉ môi trường debug/dev mới được trả thêm `stack`; production không expose `stack`.
- API dạng list phải trả `data.items` và `data.pagination`.
- API dạng detail phải trả object trực tiếp trong `data`.
- API dạng action phải trả object kết quả trong `data`, ví dụ `status`, `changed_by`, `reason`, `matched`, `verified`.
- Không endpoint nào trả envelope cũ kiểu `meta` ở root hoặc `error.code`.

Checklist assert cho integration test:

- HTTP status đúng với nghiệp vụ: `200/201/400/401/403/404/409/422/500`.
- `message` đúng semantic của action, ví dụ `Campaign created successfully`, `Validation failed`, `Forbidden`.
- `errors.details` có mặt với lỗi validation field-level.
- `errors.current_status`, `errors.allowed_statuses` có mặt với lỗi conflict theo state machine nếu áp dụng.
- Webhook/idempotent API trả cùng envelope chuẩn, không phát sinh duplicate record.

## 3. Kiểm thử nghiệp vụ

| Nhóm       | Test case                                 | Kỳ vọng                                                                 |
| ---------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| Campaign   | Tạo campaign draft với dữ liệu hợp lệ.    | Campaign ở trạng thái `DRAFT`.                                          |
| Campaign   | Gửi duyệt khi chưa có module.             | Bị chặn với `422 Validation failed`, `success=false`, `errors.details`. |
| Campaign   | Module có thời gian ngoài campaign.       | Bị chặn với `422 Validation failed`, `success=false`, `errors.details`. |
| Campaign   | Đoàn trường yêu cầu sửa.                  | Campaign chuyển `REVISION_REQUIRED`, org nhận thông báo.                |
| Campaign   | Duyệt chính thức và công khai.            | Campaign public hiển thị ở trang khám phá.                              |
| Gây quỹ    | Sinh viên tạo donation.                   | Donation `PENDING`, hiển thị trong lịch sử.                             |
| Gây quỹ    | SePay gửi webhook trùng transaction id.   | Không tạo bản ghi trùng.                                                |
| Gây quỹ    | Match transaction với donation.           | Donation `MATCHED`, chưa cộng vào verified amount.                      |
| Gây quỹ    | Org admin xác minh donation.              | Donation `VERIFIED`, progress tăng.                                     |
| Hiện vật   | Sinh viên pledge item còn nhu cầu.        | Pledge `PLEDGED`.                                                       |
| Hiện vật   | Org xác nhận bàn giao.                    | Handover record được tạo, item progress tăng.                           |
| Event      | Sinh viên đăng ký vào module mở.          | Registration `PENDING` hoặc `APPROVED` theo cấu hình.                   |
| Event      | Org duyệt đăng ký khi quota còn.          | Registration `APPROVED`.                                                |
| Event      | Check-in đăng ký chưa duyệt.              | Bị chặn với `409 State conflict`, `errors.current_status`.              |
| Chứng nhận | Generate certificate cho event completed. | Certificate `PENDING`, snapshot được tạo.                               |
| Chứng nhận | Render thành công.                        | Certificate `READY`, có file PDF.                                       |
| Chứng nhận | Revoke certificate.                       | Verify public trả về invalid/revoked.                                   |

## 4. Kiểm thử API

### Auth

- Login đúng email/password trả về access token.
- Login sai trả về `401 Unauthenticated`, `success=false`.
- Token hết hạn không gọi được endpoint private và trả `401 Unauthenticated`.
- User không có role bị chặn ở endpoint quản trị với `403 Forbidden`.
- Login success phải trả `success=true`, `message`, `data.access_token`, `data.refresh_token`, `data.user`.

### Public

- `/public/campaigns` chỉ trả campaign public.
- Search/filter theo module type, organization, status hoạt động đúng; response list phải dùng `data.items`, `data.pagination`.
- `/public/certificates/verify/{certificateNo}` không lộ dữ liệu nhạy cảm.

### Organization

- Org admin chỉ thấy campaign của tổ chức mình.
- LCĐ xác định sinh viên thuộc khoa qua `faculty_code`.

### Approval

- School reviewer thấy campaign `SUBMITTED`.
- Comment duyệt được gắn đúng campaign/module/document.
- Không thể approve campaign đã `REJECTED` nếu chưa được resubmit và phải trả `409 State conflict`.

### Fundraising

- Donation tạo mới phải trả `201`, `success=true`, `data.status=PENDING`.
- Verify donation thành công phải trả `200`, `success=true`, `data.status=VERIFIED`.
- Verify donation đã `VERIFIED/REJECTED` phải trả `409 State conflict`.
- Webhook SePay hợp lệ phải trả envelope chuẩn; webhook trùng không tạo duplicate transaction.

### Certificate

- Generate certificate phải trả `success=true`, `data.created_count`, `data.skipped_count`.
- Download certificate `READY` phải trả `success=true`, `data.file_url`.
- Verify public certificate revoked vẫn trả `success=true`, nhưng `data.valid=false`.

## 5. Kiểm thử DB và constraint

| Constraint                           | Cách kiểm                                               |
| ------------------------------------ | ------------------------------------------------------- |
| `students.student_code` unique       | Tạo 2 sinh viên cùng MSSV phải lỗi.                     |
| `campaigns.slug` unique              | Tạo campaign trùng slug phải lỗi hoặc tự sinh slug mới. |
| `certificates.certificate_no` unique | Không thể phát hành trùng số chứng nhận.                |
| Snapshot certificate bất biến        | Sau `READY`, API không cho sửa snapshot.                |
| Donation verified cần actor          | Không cho update `VERIFIED` nếu thiếu `verified_by`.    |
| SePay transaction idempotent         | Webhook trùng không sinh transaction mới.               |

## 6. Kiểm thử UI flow

### Public/sinh viên

- Người chưa đăng nhập xem được danh sách và chi tiết campaign.
- Người chưa đăng nhập bấm đăng ký/đóng góp được điều hướng đăng nhập hoặc form public nếu cấu hình cho phép.
- Sinh viên đăng ký sự kiện thành công và thấy trạng thái trong trang cá nhân.
- Sinh viên xem lịch sử đóng góp tiền và hiện vật.
- Sinh viên tải chứng nhận khi trạng thái `READY`.

### LCĐ/CLB

- Tạo campaign theo wizard: container, modules, preview, submit.
- Workspace campaign hiển thị đúng tabs theo module đã thêm.
- Bảng donation filter theo trạng thái và xác minh được từng dòng.
- Bảng hiện vật cập nhật handover không làm mất pledge gốc.
- Bảng sự kiện duyệt, từ chối, check-in, complete đúng trạng thái.
- Trang cài đặt tổ chức cập nhật logo, giới thiệu, thành viên, vai trò.

### Đoàn trường

- Hàng chờ duyệt hiển thị campaign mới submit.
- Chi tiết duyệt hiển thị preview, tài liệu, module, comment.
- Approve/request revision/reject tạo status history và notification.
- Dashboard tổng hiển thị số liệu theo toàn trường.

## 7. Kiểm thử bảo mật

- Student không gọi được API org/admin và phải nhận `403 Forbidden`.
- Org admin không truy cập campaign của tổ chức khác và phải nhận `403 Forbidden`.
- School reviewer không sửa nội dung campaign thay tổ chức, chỉ duyệt/comment.
- File upload chặn định dạng không cho phép.
- Webhook SePay kiểm signature hoặc secret.
- Verify chứng nhận không trả về thông tin nội bộ như `user_id`, `audit`, `raw_payload`.
- Lỗi hệ thống không expose `stack` ở production response.

## 8. Acceptance criteria

- Có đủ tài liệu nghiệp vụ, DB, API, UI, phân quyền, tích hợp và test plan.
- Tất cả module chính có luồng tạo, tham gia, vận hành và báo cáo.
- API có endpoint, quyền truy cập, payload mẫu cho chức năng trọng tâm.
- API thống nhất envelope `ApiResponseSuccess<T>` và `ApiResponseError` cho toàn bộ endpoint.
- DB mô tả đủ bảng và quan hệ để bắt đầu migration.
- UI mapping rõ với các file tham khảo trong `Sinh Viên` và `LCĐ-CLB`.
- Các quy tắc đặc biệt được phản ánh: LCĐ theo khoa, tài khoản vận hành được cấp sẵn, SePay không auto verify, hiện vật là module bổ sung, chứng nhận bất biến.

## 9. Checklist trước khi triển khai code

- Chọn framework NodeJS cụ thể.
- Chọn thư viện ORM/query builder.
- Chốt storage local/S3-compatible.
- Chốt cơ chế queue: DB table, BullMQ hoặc worker riêng.
- Chốt giao diện đăng nhập theo tài khoản trường hay tài khoản nội bộ.
- Chuẩn hóa enum trạng thái trong code và DB migration.
