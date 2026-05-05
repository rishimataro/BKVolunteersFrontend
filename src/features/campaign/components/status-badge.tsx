import { cn } from '@/lib/utils';

const statusClassName: Record<string, string> = {
    DRAFT: 'bg-amber-50 text-amber-800 ring-amber-200',
    SUBMITTED: 'bg-blue-50 text-blue-800 ring-blue-200',
    PRE_APPROVED: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
    APPROVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    REVISION_REQUIRED: 'bg-orange-50 text-orange-800 ring-orange-200',
    REJECTED: 'bg-red-50 text-red-800 ring-red-200',
    PUBLISHED: 'bg-blue-50 text-blue-800 ring-blue-200',
    ONGOING: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    ENDED: 'bg-slate-100 text-slate-800 ring-slate-300',
    ARCHIVED: 'bg-slate-100 text-slate-700 ring-slate-300',
    READY_FOR_REVIEW: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
    OPEN: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-800 ring-slate-300',
    CANCELLED: 'bg-red-50 text-red-800 ring-red-200',
    PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
    PLEDGED: 'bg-amber-50 text-amber-800 ring-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-800 ring-blue-200',
    RECEIVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    CHECKED_IN: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    MATCHED: 'bg-cyan-50 text-cyan-800 ring-cyan-200',
    UNMATCHED: 'bg-slate-100 text-slate-800 ring-slate-300',
    VERIFIED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    REFUNDED: 'bg-slate-100 text-slate-800 ring-slate-300',
};

const statusLabel: Record<string, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi duyệt',
    PRE_APPROVED: 'Tiền duyệt',
    APPROVED: 'Đã duyệt',
    REVISION_REQUIRED: 'Yêu cầu chỉnh sửa',
    REJECTED: 'Từ chối',
    PUBLISHED: 'Công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
    ARCHIVED: 'Lưu trữ',
    READY_FOR_REVIEW: 'Sẵn sàng duyệt',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    CANCELLED: 'Đã hủy',
    PENDING: 'Chờ xử lý',
    PLEDGED: 'Đã đăng ký',
    CONFIRMED: 'Đã xác nhận',
    RECEIVED: 'Đã tiếp nhận',
    CHECKED_IN: 'Đã check-in',
    COMPLETED: 'Hoàn thành',
    MATCHED: 'Đã khớp giao dịch',
    UNMATCHED: 'Chưa khớp giao dịch',
    VERIFIED: 'Đã xác minh',
    REFUNDED: 'Hoàn tiền',
};

export const StatusBadge = ({ status }: { status: string }) => {
    return (
        <span
            className={cn(
                'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1',
                statusClassName[status] ??
                    'bg-slate-100 text-slate-800 ring-slate-300',
            )}
        >
            {statusLabel[status] ?? 'Không xác định'}
        </span>
    );
};
