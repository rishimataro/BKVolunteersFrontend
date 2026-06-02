import { Loader2 } from 'lucide-react';

export const LoadingState = ({ label = 'Đang tải dữ liệu' }: { label?: string }) => (
    <div className="flex min-h-48 items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white text-slate-600">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm font-medium">{label}</span>
    </div>
);

export const EmptyState = ({
    title = 'Không có dữ liệu',
    description,
}: {
    title?: string;
    description?: string;
}) => (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        {description ? (
            <p className="mt-2 text-sm text-slate-600">{description}</p>
        ) : null}
    </div>
);

export const ErrorState = ({
    message = 'Không thể tải dữ liệu',
}: {
    message?: string;
}) => (
    <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
        {message}
    </div>
);
