import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';

export const LoadingState = ({
    label = 'Đang tải dữ liệu',
}: {
    label?: string;
}) => (
    <div className="flex min-h-52 flex-col items-center justify-center gap-4 border border-border bg-white px-6 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center border border-primary bg-muted text-primary">
            <Loader2 className="size-5 animate-spin" />
        </div>
        <div className="space-y-2">
            <p className="broadsheet-kicker">Trạng thái tải</p>
            <p className="font-heading text-[22px] leading-[1.3] font-bold text-primary">
                {label}
            </p>
            <p className="mx-auto max-w-xl text-[16px] leading-[1.7] text-muted-foreground">
                Hệ thống đang cập nhật dữ liệu mới nhất từ máy chủ.
            </p>
        </div>
    </div>
);

export const EmptyState = ({
    title = 'Không có dữ liệu',
    description,
}: {
    title?: string;
    description?: string;
}) => (
    <div className="border border-dashed border-border bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-muted text-muted-foreground">
            <Inbox className="size-5" />
        </div>
        <p className="mt-4 broadsheet-kicker">Kho dữ liệu</p>
        <h2 className="mt-2 font-heading text-[28px] leading-[1.25] font-bold text-primary">
            {title}
        </h2>
        {description ? (
            <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-[1.7] text-muted-foreground">
                {description}
            </p>
        ) : null}
    </div>
);

export const ErrorState = ({
    message = 'Không thể tải dữ liệu',
}: {
    message?: string;
}) => (
    <div className="flex items-start gap-4 border border-destructive bg-[#FEF2F2] px-5 py-4 text-[#991B1B]">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-destructive bg-white text-destructive">
            <AlertTriangle className="size-4" />
        </div>
        <div className="grid gap-1">
            <p className="broadsheet-kicker text-[#991B1B]">Thông báo lỗi</p>
            <p className="font-heading text-[22px] leading-[1.3] font-bold text-primary">
                Đã xảy ra lỗi tải dữ liệu
            </p>
            <p className="text-[16px] leading-[1.7] text-[#991B1B]">
                {message}
            </p>
        </div>
    </div>
);
