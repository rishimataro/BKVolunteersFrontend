import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    RefreshCw,
    RotateCcw,
    X,
    XCircle,
    Zap,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useUser } from '@/features/auth';
import {
    generateCertificates,
    listCampaignCertificates,
    renderCertificate,
    revokeCertificate,
    reissueCertificate,
    type CampaignCertificate,
    type GenerateResult,
} from '@/features/certificates/api/management';
import { getTemplates } from '@/features/certificates/api/templates';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

type StatusAppearance = {
    label: string;
    className: string;
    icon: typeof FileText;
};

const statusConfig: Record<string, StatusAppearance> = {
    PENDING: {
        label: 'Chờ xử lý',
        className: 'border-yellow-200 bg-yellow-50 text-yellow-700',
        icon: Clock,
    },
    RENDERING: {
        label: 'Đang tạo file',
        className: 'border-blue-200 bg-blue-50 text-blue-700',
        icon: Clock,
    },
    READY: {
        label: 'Sẵn sàng tải',
        className: 'border-green-200 bg-green-50 text-green-700',
        icon: CheckCircle2,
    },
    SIGNED: {
        label: 'Đã cấp',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        icon: CheckCircle2,
    },
    REVOKED: {
        label: 'Đã thu hồi',
        className: 'border-red-200 bg-red-50 text-red-700',
        icon: XCircle,
    },
    FAILED: {
        label: 'Lỗi tạo file',
        className: 'border-rose-200 bg-rose-50 text-rose-700',
        icon: XCircle,
    },
};

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const formatDate = (value: string | null) => {
    if (!value) {
        return 'Chưa có';
    }

    return dateFormatter.format(new Date(value));
};

const formatDateTime = (value: string | null) => {
    if (!value) {
        return 'Chưa có';
    }

    return dateTimeFormatter.format(new Date(value));
};

const getStatusBadge = (status: string) => {
    const config = statusConfig[status] ?? statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
        >
            <Icon className="size-3.5" />
            {config.label}
        </span>
    );
};

const getSummaryStats = (items: CampaignCertificate[]) => ({
    total: items.length,
    pending: items.filter((item) => item.status === 'PENDING').length,
    ready: items.filter((item) => item.status === 'READY').length,
    signed: items.filter((item) => item.status === 'SIGNED').length,
    revoked: items.filter((item) => item.status === 'REVOKED').length,
    failed: items.filter((item) => item.status === 'FAILED').length,
});

const summaryCardClassName =
    'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

const panelClassName =
    'rounded-xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)]';

const inputClassName =
    'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#0E4686] focus:ring-4 focus:ring-[#A9C7FF]/30';

const closeGenerateState = (
    setShowGenerateDialog: (value: boolean) => void,
    setSelectedModule: (value: string) => void,
    setGenerateDryRun: (value: boolean) => void,
    setTemplateError: (value: string | null) => void,
    setPreviewResult: (value: GenerateResult | null) => void,
) => {
    setShowGenerateDialog(false);
    setSelectedModule('');
    setGenerateDryRun(false);
    setTemplateError(null);
    setPreviewResult(null);
};

export const CampaignCertificatesRoute = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const { addNotification } = useNotifications();

    const [certificates, setCertificates] = useState<CampaignCertificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [templates, setTemplates] = useState<
        Array<{ id: string; name: string }>
    >([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [generateDryRun, setGenerateDryRun] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [templateError, setTemplateError] = useState<string | null>(null);
    const [previewResult, setPreviewResult] = useState<GenerateResult | null>(
        null,
    );

    const [revokeDialog, setRevokeDialog] = useState<{
        id: string;
        certificateNo: string;
        studentName: string;
    } | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    const [actionId, setActionId] = useState<string | null>(null);

    const canGenerateCertificates =
        user.data?.role === 'DOANTRUONG' ||
        user.data?.accountType === 'OPERATOR';

    const loadCertificates = async () => {
        if (!campaignId) {
            setCertificates([]);
            setError('Không tìm thấy mã chiến dịch để tải chứng nhận.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await listCampaignCertificates(campaignId);
            setCertificates(data);
        } catch {
            setError('Không thể tải danh sách chứng nhận của chiến dịch này.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadCertificates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const summary = useMemo(
        () => getSummaryStats(certificates),
        [certificates],
    );

    const filteredCertificates = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return certificates.filter((certificate) => {
            const matchesStatus =
                statusFilter === 'ALL' || certificate.status === statusFilter;
            const matchesQuery =
                !normalizedQuery ||
                [
                    certificate.certificate_no,
                    certificate.student_name,
                    certificate.student_code,
                    certificate.template_name,
                    certificate.module_title ?? '',
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedQuery);

            return matchesStatus && matchesQuery;
        });
    }, [certificates, searchQuery, statusFilter]);

    const closeGenerateDialog = () =>
        closeGenerateState(
            setShowGenerateDialog,
            setSelectedModule,
            setGenerateDryRun,
            setTemplateError,
            setPreviewResult,
        );

    const handleGenerateOpen = async () => {
        setShowGenerateDialog(true);
        setLoadingTemplates(true);
        setTemplateError(null);
        setPreviewResult(null);

        try {
            const data = await getTemplates();
            const activeTemplates = data
                .filter((template) => template.status === 'ACTIVE')
                .map((template) => ({
                    id: String(template.id),
                    name: template.name,
                }));

            setTemplates(activeTemplates);
            setSelectedTemplate(activeTemplates[0]?.id ?? '');
        } catch {
            setTemplates([]);
            setSelectedTemplate('');
            setTemplateError(
                'Không thể tải danh sách mẫu chứng nhận. Hãy thử lại sau.',
            );
            addNotification({
                type: 'error',
                title: 'Không tải được mẫu chứng nhận',
                message:
                    'Danh sách template đang tạm thời không phản hồi từ máy chủ.',
            });
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleGenerate = async () => {
        if (!campaignId || !selectedTemplate) {
            return;
        }

        setGenerating(true);

        try {
            const result = await generateCertificates(campaignId, {
                template_id: selectedTemplate,
                module_id: selectedModule.trim() || undefined,
                dry_run: generateDryRun,
            });

            addNotification({
                type: 'success',
                title: generateDryRun
                    ? 'Đã kiểm tra điều kiện cấp chứng nhận'
                    : 'Đã tạo chứng nhận',
                message: generateDryRun
                    ? `Có ${result.candidate_count ?? result.items.length} ứng viên đủ điều kiện cấp chứng nhận.`
                    : `Đã tạo ${result.created_count} chứng nhận cho chiến dịch.`,
            });

            if (generateDryRun) {
                setPreviewResult(result);
                return;
            }

            closeGenerateDialog();
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Tạo chứng nhận thất bại',
                message: 'Không thể gửi yêu cầu tạo chứng nhận lúc này.',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleRender = async (id: string) => {
        setActionId(id);

        try {
            await renderCertificate(id);
            addNotification({
                type: 'success',
                title: 'Đã xếp hàng render',
                message:
                    'Chứng nhận đã được đưa vào hàng đợi để tạo file tải xuống.',
            });
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể tạo file chứng nhận',
                message: 'Máy chủ chưa thể render chứng nhận lúc này.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleDownload = (certificate: CampaignCertificate) => {
        if (!certificate.file_url) {
            addNotification({
                type: 'error',
                title: 'Chưa có file tải xuống',
                message: 'Chứng nhận này chưa có file sẵn sàng để tải.',
            });
            return;
        }

        window.open(certificate.file_url, '_blank', 'noopener,noreferrer');
    };

    const handleRevoke = async () => {
        if (!revokeDialog) {
            return;
        }

        setRevoking(true);

        try {
            await revokeCertificate(revokeDialog.id, {
                revoke_reason: revokeReason.trim() || undefined,
            });
            addNotification({
                type: 'success',
                title: 'Đã thu hồi chứng nhận',
                message: `Chứng nhận ${revokeDialog.certificateNo} đã được thu hồi khỏi hệ thống.`,
            });
            setRevokeDialog(null);
            setRevokeReason('');
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Thu hồi chứng nhận thất bại',
                message: 'Không thể cập nhật trạng thái chứng nhận lúc này.',
            });
        } finally {
            setRevoking(false);
        }
    };

    const handleReissue = async (id: string) => {
        setActionId(id);

        try {
            await reissueCertificate(id);
            addNotification({
                type: 'success',
                title: 'Đã cấp lại chứng nhận',
                message: 'Một bản chứng nhận thay thế đã được tạo thành công.',
            });
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể cấp lại chứng nhận',
                message: 'Hệ thống chưa thể tạo bản thay thế ở thời điểm này.',
            });
        } finally {
            setActionId(null);
        }
    };

    return (
        <ContentLayout title="Quản lý chứng nhận chiến dịch">
            <div className="space-y-6">
                <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(paths.app.campaigns.getHref())
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                            aria-label="Quay lại danh sách chiến dịch"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                        <div className="flex size-12 items-center justify-center rounded-xl bg-[#EEF3FB] text-[#002A58]">
                            <FileText className="size-6" />
                        </div>
                        <div className="space-y-2">
                            <p className="broadsheet-kicker">
                                Chứng nhận chiến dịch
                            </p>
                            <h2 className="font-heading text-[32px] leading-[1.2] font-bold text-primary">
                                Quản lý chứng nhận
                            </h2>
                            <p className="max-w-3xl text-sm leading-6 text-slate-600">
                                Theo dõi tiến độ cấp chứng nhận, kiểm tra file
                                đã render và xử lý các trường hợp cần thu hồi
                                hoặc cấp lại.
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Chiến dịch #{campaignId ?? 'N/A'} ·{' '}
                                {summary.total} chứng nhận
                            </p>
                        </div>
                    </div>

                    {canGenerateCertificates ? (
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => void handleGenerateOpen()}>
                                <Zap className="size-4" />
                                Tạo chứng nhận
                            </Button>
                        </div>
                    ) : null}
                </section>

                <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        label="Tổng số"
                        value={summary.total}
                        tone="slate"
                    />
                    <StatCard
                        label="Chờ xử lý"
                        value={summary.pending}
                        tone="yellow"
                    />
                    <StatCard
                        label="Sẵn sàng"
                        value={summary.ready}
                        tone="green"
                    />
                    <StatCard
                        label="Đã cấp"
                        value={summary.signed}
                        tone="emerald"
                    />
                    <StatCard
                        label="Đã thu hồi"
                        value={summary.revoked}
                        tone="red"
                    />
                    <StatCard label="Lỗi" value={summary.failed} tone="rose" />
                </section>

                {isLoading ? (
                    <LoadingState label="Đang tải danh sách chứng nhận" />
                ) : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && certificates.length === 0 ? (
                    <EmptyState
                        title="Chưa có chứng nhận nào cho chiến dịch này"
                        description="Hãy dùng chức năng tạo chứng nhận để khởi tạo danh sách đủ điều kiện từ dữ liệu chiến dịch."
                    />
                ) : null}

                {!isLoading && !error && certificates.length > 0 ? (
                    <div className="space-y-4">
                        <section className={`${panelClassName} p-4`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        Bộ lọc chứng nhận
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Hiển thị {filteredCertificates.length}{' '}
                                        trên {summary.total} chứng nhận hiện có.
                                    </p>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2 lg:w-[540px]">
                                    <label className="grid gap-1">
                                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                            Tìm kiếm
                                        </span>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(event) =>
                                                setSearchQuery(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Số hiệu, MSSV, sinh viên, mẫu"
                                            className={inputClassName}
                                        />
                                    </label>
                                    <label className="grid gap-1">
                                        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                            Trạng thái
                                        </span>
                                        <select
                                            value={statusFilter}
                                            onChange={(event) =>
                                                setStatusFilter(
                                                    event.target.value,
                                                )
                                            }
                                            className={inputClassName}
                                        >
                                            <option value="ALL">
                                                Tất cả trạng thái
                                            </option>
                                            {Object.entries(statusConfig).map(
                                                ([status, config]) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {config.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {filteredCertificates.length === 0 ? (
                            <EmptyState
                                title="Không có chứng nhận phù hợp bộ lọc"
                                description="Hãy thay đổi từ khóa hoặc trạng thái để xem thêm bản ghi."
                            />
                        ) : (
                            <section
                                className={`${panelClassName} overflow-hidden`}
                            >
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Số hiệu
                                                </th>
                                                <th className="px-4 py-3">
                                                    Sinh viên
                                                </th>
                                                <th className="px-4 py-3">
                                                    Mẫu
                                                </th>
                                                <th className="px-4 py-3">
                                                    Trạng thái
                                                </th>
                                                <th className="px-4 py-3">
                                                    Ngày cấp
                                                </th>
                                                <th className="px-4 py-3">
                                                    Tệp
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Thao tác
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            {filteredCertificates.map(
                                                (certificate) => (
                                                    <tr
                                                        key={certificate.id}
                                                        className="bg-white"
                                                    >
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="space-y-1">
                                                                <p className="font-semibold text-slate-900">
                                                                    {
                                                                        certificate.certificate_no
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Tạo lúc{' '}
                                                                    {formatDateTime(
                                                                        certificate.created_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        certificate.student_name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    {
                                                                        certificate.student_code
                                                                    }
                                                                </p>
                                                                {certificate.module_title ? (
                                                                    <p className="text-xs text-slate-500">
                                                                        {
                                                                            certificate.module_title
                                                                        }
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-slate-900">
                                                                    {
                                                                        certificate.template_name
                                                                    }
                                                                </p>
                                                                <p className="text-xs text-slate-500">
                                                                    Cập nhật{' '}
                                                                    {formatDate(
                                                                        certificate.updated_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            {getStatusBadge(
                                                                certificate.status,
                                                            )}
                                                            {certificate.revoke_reason ? (
                                                                <p className="mt-2 max-w-[220px] text-xs leading-5 text-red-600">
                                                                    Lý do:{' '}
                                                                    {
                                                                        certificate.revoke_reason
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </td>
                                                        <td className="px-4 py-4 align-top text-slate-600">
                                                            {formatDate(
                                                                certificate.issued_at,
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            {certificate.file_url ? (
                                                                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                                    Có file tải
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                                                    Chưa có file
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="flex justify-end gap-1">
                                                                {certificate.status ===
                                                                'READY' ? (
                                                                    <ActionButton
                                                                        label={`Render ${certificate.certificate_no}`}
                                                                        title="Render"
                                                                        disabled={
                                                                            actionId ===
                                                                            certificate.id
                                                                        }
                                                                        onClick={() =>
                                                                            void handleRender(
                                                                                certificate.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RefreshCw className="size-4" />
                                                                    </ActionButton>
                                                                ) : null}

                                                                {certificate.file_url ? (
                                                                    <ActionButton
                                                                        label={`Tải xuống ${certificate.certificate_no}`}
                                                                        title="Tải xuống"
                                                                        onClick={() =>
                                                                            handleDownload(
                                                                                certificate,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Download className="size-4" />
                                                                    </ActionButton>
                                                                ) : null}

                                                                {certificate.status ===
                                                                'FAILED' ? (
                                                                    <ActionButton
                                                                        label={`Tạo lại ${certificate.certificate_no}`}
                                                                        title="Tạo lại"
                                                                        disabled={
                                                                            actionId ===
                                                                            certificate.id
                                                                        }
                                                                        onClick={() =>
                                                                            void handleRender(
                                                                                certificate.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RefreshCw className="size-4" />
                                                                    </ActionButton>
                                                                ) : null}

                                                                {(certificate.status ===
                                                                    'READY' ||
                                                                    certificate.status ===
                                                                        'SIGNED') && (
                                                                    <ActionButton
                                                                        label={`Thu hồi ${certificate.certificate_no}`}
                                                                        title="Thu hồi"
                                                                        onClick={() =>
                                                                            setRevokeDialog(
                                                                                {
                                                                                    id: certificate.id,
                                                                                    certificateNo:
                                                                                        certificate.certificate_no,
                                                                                    studentName:
                                                                                        certificate.student_name,
                                                                                },
                                                                            )
                                                                        }
                                                                    >
                                                                        <XCircle className="size-4" />
                                                                    </ActionButton>
                                                                )}

                                                                {certificate.status ===
                                                                'REVOKED' ? (
                                                                    <ActionButton
                                                                        label={`Cấp lại ${certificate.certificate_no}`}
                                                                        title="Cấp lại"
                                                                        disabled={
                                                                            actionId ===
                                                                            certificate.id
                                                                        }
                                                                        onClick={() =>
                                                                            void handleReissue(
                                                                                certificate.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <RotateCcw className="size-4" />
                                                                    </ActionButton>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </div>
                ) : null}

                <Dialog
                    open={showGenerateDialog}
                    onOpenChange={(open) => {
                        if (!open) {
                            closeGenerateDialog();
                        }
                    }}
                >
                    <DialogContent className="max-w-4xl">
                        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-5 sm:px-6">
                            <div>
                                <p className="broadsheet-kicker">
                                    Tạo chứng nhận ngay trên màn hình quản lý
                                </p>
                                <DialogTitle className="mt-2 text-[26px] font-semibold leading-8 text-[#002A58]">
                                    Tạo chứng nhận cho chiến dịch
                                </DialogTitle>
                                <DialogDescription className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                    Chọn template, giới hạn theo hạng mục nếu
                                    cần và chạy dry-run trước khi cấp chứng nhận
                                    thật.
                                </DialogDescription>
                            </div>
                            <DialogClose
                                render={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-10 w-10 rounded-lg p-0"
                                    />
                                }
                            >
                                <X className="size-4" />
                            </DialogClose>
                        </div>

                        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label className="grid gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                        Mẫu chứng nhận
                                    </span>
                                    {templateError ? (
                                        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                                            {templateError}
                                        </p>
                                    ) : null}
                                    {templates.length === 0 &&
                                    !loadingTemplates ? (
                                        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                            Chưa có template ACTIVE để tạo chứng
                                            nhận.
                                        </p>
                                    ) : null}
                                    <select
                                        data-testid="certificate-template-select"
                                        value={selectedTemplate}
                                        onChange={(event) =>
                                            setSelectedTemplate(
                                                event.target.value,
                                            )
                                        }
                                        disabled={loadingTemplates}
                                        className={inputClassName}
                                    >
                                        {loadingTemplates ? (
                                            <option value="">
                                                Đang tải template...
                                            </option>
                                        ) : templates.length === 0 ? (
                                            <option value="">
                                                Không có template ACTIVE
                                            </option>
                                        ) : null}
                                        {templates.map((template) => (
                                            <option
                                                key={template.id}
                                                value={template.id}
                                            >
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label className="grid gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                        Hạng mục áp dụng
                                    </span>
                                    <input
                                        type="text"
                                        value={selectedModule}
                                        onChange={(event) =>
                                            setSelectedModule(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Nhập module id nếu chỉ muốn cấp cho một hạng mục"
                                        className={inputClassName}
                                    />
                                </label>
                            </div>

                            <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={generateDryRun}
                                    onChange={(event) =>
                                        setGenerateDryRun(event.target.checked)
                                    }
                                />
                                Chỉ kiểm tra danh sách đủ điều kiện, chưa tạo
                                chứng nhận thật
                            </label>

                            {previewResult ? (
                                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                Kết quả kiểm tra trước
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Có{' '}
                                                {previewResult.candidate_count ??
                                                    previewResult.items
                                                        .length}{' '}
                                                ứng viên đủ điều kiện cấp chứng
                                                nhận.
                                            </p>
                                        </div>
                                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                            Dry-run
                                        </span>
                                    </div>

                                    {previewResult.items.length > 0 ? (
                                        <div className="mt-4 space-y-2">
                                            {previewResult.items
                                                .slice(0, 5)
                                                .map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-slate-900">
                                                                {
                                                                    item.student_name
                                                                }
                                                            </p>
                                                            <p className="text-xs text-slate-500">
                                                                {
                                                                    item.student_code
                                                                }{' '}
                                                                ·{' '}
                                                                {
                                                                    item.template_name
                                                                }
                                                            </p>
                                                        </div>
                                                        {getStatusBadge(
                                                            item.status,
                                                        )}
                                                    </div>
                                                ))}
                                            {previewResult.items.length > 5 ? (
                                                <p className="text-xs text-slate-500">
                                                    Và còn{' '}
                                                    {previewResult.items
                                                        .length - 5}{' '}
                                                    hồ sơ khác trong danh sách
                                                    đủ điều kiện.
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="mt-4 text-sm text-slate-500">
                                            Không có hồ sơ nào đạt điều kiện
                                            trong lần kiểm tra này.
                                        </p>
                                    )}
                                </div>
                            ) : null}

                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPreviewResult(null)}
                                    disabled={!previewResult}
                                >
                                    Xóa preview
                                </Button>
                                <Button
                                    type="button"
                                    data-testid="certificate-generate-submit"
                                    disabled={
                                        generating ||
                                        loadingTemplates ||
                                        !selectedTemplate
                                    }
                                    onClick={() => void handleGenerate()}
                                >
                                    {generating
                                        ? 'Đang xử lý...'
                                        : generateDryRun
                                          ? 'Kiểm tra điều kiện'
                                          : 'Tạo chứng nhận'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={Boolean(revokeDialog)}
                    onOpenChange={(open) => {
                        if (!open) {
                            setRevokeDialog(null);
                            setRevokeReason('');
                        }
                    }}
                >
                    <DialogContent className="max-w-xl">
                        <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                            <p className="broadsheet-kicker">
                                Xác nhận thao tác nguy hiểm
                            </p>
                            <DialogTitle className="mt-2 text-[24px] font-semibold leading-8 text-[#002A58]">
                                Thu hồi chứng nhận
                            </DialogTitle>
                            <DialogDescription className="mt-2 text-sm leading-6 text-slate-600">
                                {revokeDialog?.certificateNo} ·{' '}
                                {revokeDialog?.studentName}
                            </DialogDescription>
                        </div>

                        <div className="px-5 py-5 sm:px-6">
                            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                                Sau khi thu hồi, chứng nhận sẽ không còn hợp lệ
                                để sử dụng. Nếu cần cấp lại, bạn phải tạo bản
                                thay thế sau bước này.
                            </p>

                            <label className="mt-4 grid gap-2">
                                <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Lý do thu hồi
                                </span>
                                <textarea
                                    value={revokeReason}
                                    onChange={(event) =>
                                        setRevokeReason(event.target.value)
                                    }
                                    rows={4}
                                    placeholder="Nhập lý do thu hồi để tiện tra soát"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#0E4686] focus:ring-4 focus:ring-[#A9C7FF]/30"
                                />
                            </label>

                            <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setRevokeDialog(null);
                                        setRevokeReason('');
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="button"
                                    disabled={revoking}
                                    onClick={() => void handleRevoke()}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                >
                                    {revoking
                                        ? 'Đang thu hồi...'
                                        : 'Xác nhận thu hồi'}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </ContentLayout>
    );
};

const StatCard = ({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: 'slate' | 'yellow' | 'green' | 'emerald' | 'red' | 'rose';
}) => {
    const toneMap: Record<typeof tone, string> = {
        slate: 'bg-slate-50 text-slate-700',
        yellow: 'bg-yellow-50 text-yellow-700',
        green: 'bg-green-50 text-green-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-red-700',
        rose: 'bg-rose-50 text-rose-700',
    };

    return (
        <section className={`${summaryCardClassName} ${toneMap[tone]}`}>
            <p className="text-[28px] font-bold leading-8">{value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.08em]">
                {label}
            </p>
        </section>
    );
};

const ActionButton = ({
    children,
    label,
    title,
    disabled,
    onClick,
}: {
    children: React.ReactNode;
    label: string;
    title: string;
    disabled?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        aria-label={label}
        title={title}
        disabled={disabled}
        onClick={onClick}
        className="rounded-md border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
        {children}
    </button>
);
