import { useEffect, useState } from 'react';
import { FileText, Download, Clock, CheckCircle2, XCircle } from 'lucide-react';

import { useNotifications } from '@/components/ui/notifications';
import { getMyCertificates } from '../api/certificates';
import type { CertificateItem } from '../api/certificates';

const statusConfig: Record<
    string,
    { label: string; color: string; icon: typeof FileText }
> = {
    PENDING: {
        label: 'Chờ xử lý',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: Clock,
    },
    RENDERING: {
        label: 'Đang tạo',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: Clock,
    },
    READY: {
        label: 'Sẵn sàng',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle2,
    },
    SIGNED: {
        label: 'Đã cấp',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: CheckCircle2,
    },
    REVOKED: {
        label: 'Đã thu hồi',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
    },
    FAILED: {
        label: 'Lỗi',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
    },
};

export const CertificateList = () => {
    const { addNotification } = useNotifications();
    const [certificates, setCertificates] = useState<CertificateItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getMyCertificates();
                setCertificates(data);
            } catch {
                addNotification({
                    type: 'error',
                    title: 'Lỗi',
                    message: 'Không thể tải danh sách chứng nhận.',
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, [addNotification]);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (certificates.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#2E5077]" />
                <h2 className="text-xl font-bold text-[#2E5077]">
                    Chứng nhận của tôi
                </h2>
                <span className="ml-auto text-sm text-slate-400">
                    {certificates.length} chứng nhận
                </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {certificates.map((cert) => {
                    const config =
                        statusConfig[cert.status] ?? statusConfig.PENDING;
                    const StatusIcon = config.icon;
                    return (
                        <div
                            key={cert.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-base font-semibold text-slate-800">
                                        {cert.campaignTitle}
                                    </p>
                                    {cert.moduleTitle && (
                                        <p className="mt-0.5 text-sm text-slate-500">
                                            {cert.moduleTitle}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-400">
                                        {cert.certificateNo}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${config.color}`}
                                >
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {config.label}
                                </span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>
                                    {new Date(
                                        cert.createdAt,
                                    ).toLocaleDateString('vi-VN')}
                                </span>
                                {cert.fileUrl && cert.status !== 'REVOKED' && (
                                    <a
                                        href={cert.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-[#4DA1A9] transition-colors hover:text-[#2E5077]"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Tải xuống
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((n) => (
                <div
                    key={n}
                    className="h-32 animate-pulse rounded-xl bg-slate-100"
                />
            ))}
        </div>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="mb-4 h-16 w-16 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-600">
            Chưa có chứng nhận
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
            Bạn sẽ nhận được chứng nhận sau khi tham gia và hoàn thành các chiến
            dịch tình nguyện.
        </p>
    </div>
);
