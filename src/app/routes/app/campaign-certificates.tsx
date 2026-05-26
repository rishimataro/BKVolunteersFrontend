import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    FileText,
    RefreshCw,
    RotateCcw,
    XCircle,
    Zap,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { getTemplates } from '@/features/certificates/api/templates';
import { useUser } from '@/features/auth';
import {
    generateCertificates,
    listCampaignCertificates,
    renderCertificate,
    revokeCertificate,
    reissueCertificate,
    type CampaignCertificate,
} from '@/features/certificates/api/management';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';

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
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
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

const getStatusBadge = (status: string) => {
    const config = statusConfig[status] ?? statusConfig.PENDING;
    const Icon = config.icon;
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
        >
            <Icon className="h-3 w-3" />
            {config.label}
        </span>
    );
};

export const CampaignCertificatesRoute = () => {
    const { campaignId } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const { addNotification } = useNotifications();

    const [certificates, setCertificates] = useState<CampaignCertificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showGenerate, setShowGenerate] = useState(false);
    const [templates, setTemplates] = useState<
        Array<{ id: string; name: string; status: string }>
    >([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [generateDryRun, setGenerateDryRun] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [revokeId, setRevokeId] = useState<string | null>(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    const [actionId, setActionId] = useState<string | null>(null);

    const isOperator =
        user.data?.accountType === 'OPERATOR' ||
        user.data?.role === 'DOANTRUONG';

    const loadCertificates = async () => {
        if (!campaignId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await listCampaignCertificates(campaignId);
            setCertificates(data);
        } catch {
            setError('Không thể tải danh sách chứng nhận.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadCertificates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [campaignId]);

    const handleGenerateOpen = async () => {
        setShowGenerate(true);
        try {
            const data = await getTemplates();
            const activeTemplates = data
                .filter((template) => template.status === 'ACTIVE')
                .map((template) => ({
                    id: String(template.id),
                    name: template.name,
                    status: template.status,
                }));
            setTemplates(activeTemplates);
            if (activeTemplates.length > 0) {
                setSelectedTemplate((current) =>
                    activeTemplates.some((template) => template.id === current)
                        ? current
                        : String(activeTemplates[0].id),
                );
            } else {
                setSelectedTemplate('');
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể tải danh sách mẫu chứng nhận.',
            });
        }
    };

    const handleGenerate = async () => {
        if (!campaignId || !selectedTemplate) return;
        setGenerating(true);
        try {
            const result = await generateCertificates(campaignId, {
                template_id: selectedTemplate,
                module_id: selectedModule || undefined,
                dry_run: generateDryRun,
            });
            addNotification({
                type: 'success',
                title: generateDryRun ? 'Đã kiểm tra' : 'Đã tạo',
                message: generateDryRun
                    ? `Có ${result.candidate_count ?? result.items.length} ứng viên đủ điều kiện.`
                    : `Đã tạo ${result.created_count} chứng nhận.`,
            });
            if (!generateDryRun) {
                setShowGenerate(false);
                setSelectedModule('');
                await loadCertificates();
            }
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể tạo chứng nhận.',
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
                title: 'Đã xếp hàng',
                message: 'Chứng nhận đã được xếp hàng để tạo.',
            });
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể tạo chứng nhận.',
            });
        } finally {
            setActionId(null);
        }
    };

    const handleDownload = (cert: CampaignCertificate) => {
        if (cert.file_url) {
            window.open(cert.file_url, '_blank', 'noopener,noreferrer');
        } else {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Chứng nhận chưa có file tải xuống.',
            });
        }
    };

    const handleRevoke = async () => {
        if (!revokeId) return;
        setRevoking(true);
        try {
            await revokeCertificate(revokeId, {
                revoke_reason: revokeReason,
            });
            addNotification({
                type: 'success',
                title: 'Đã thu hồi',
                message: 'Chứng nhận đã được thu hồi.',
            });
            setRevokeId(null);
            setRevokeReason('');
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể thu hồi chứng nhận.',
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
                title: 'Đã cấp lại',
                message: 'Chứng nhận thay thế đã được tạo.',
            });
            await loadCertificates();
        } catch {
            addNotification({
                type: 'error',
                title: 'Lỗi',
                message: 'Không thể cấp lại chứng nhận.',
            });
        } finally {
            setActionId(null);
        }
    };

    const summary = {
        total: certificates.length,
        signed: certificates.filter((c) => c.status === 'SIGNED').length,
        ready: certificates.filter((c) => c.status === 'READY').length,
        pending: certificates.filter((c) => c.status === 'PENDING').length,
        revoked: certificates.filter((c) => c.status === 'REVOKED').length,
        failed: certificates.filter((c) => c.status === 'FAILED').length,
    };

    return (
        <ContentLayout title="Quản lý chứng nhận">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(paths.app.campaigns.getHref())}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <FileText className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Quản lý chứng nhận
                        </h2>
                        <p className="text-sm text-slate-500">
                            Chiến dịch #{campaignId} &middot; {summary.total}{' '}
                            chứng nhận
                        </p>
                    </div>
                    {isOperator ? (
                        <div className="ml-auto flex gap-2">
                            <Button onClick={handleGenerateOpen}>
                                <Zap className="mr-1 size-4" />
                                Tạo chứng nhận
                            </Button>
                        </div>
                    ) : null}
                </div>

                {summary.total > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <StatCard
                            label="Tổng số"
                            value={summary.total}
                            color="text-slate-700 bg-slate-50"
                        />
                        <StatCard
                            label="Đã cấp"
                            value={summary.signed}
                            color="text-emerald-700 bg-emerald-50"
                        />
                        <StatCard
                            label="Sẵn sàng"
                            value={summary.ready}
                            color="text-green-700 bg-green-50"
                        />
                        <StatCard
                            label="Chờ xử lý"
                            value={summary.pending}
                            color="text-yellow-700 bg-yellow-50"
                        />
                        <StatCard
                            label="Đã thu hồi"
                            value={summary.revoked}
                            color="text-red-700 bg-red-50"
                        />
                    </div>
                ) : null}

                {isOperator && showGenerate ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="mb-4 text-sm font-semibold text-slate-900">
                            Tạo chứng nhận cho chiến dịch
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Mẫu chứng nhận
                                </label>
                                {templates.length === 0 ? (
                                    <p className="mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                        Không có template ACTIVE. Hãy kích hoạt
                                        hoặc tạo mới template trước khi generate
                                        chứng nhận.
                                    </p>
                                ) : null}
                                <select
                                    data-testid="certificate-generate-template-select"
                                    value={selectedTemplate}
                                    onChange={(e) =>
                                        setSelectedTemplate(e.target.value)
                                    }
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                >
                                    {templates.length === 0 ? (
                                        <option value="">
                                            Không có template ACTIVE
                                        </option>
                                    ) : null}
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Hạng mục (tùy chọn)
                                </label>
                                <input
                                    type="text"
                                    value={selectedModule}
                                    onChange={(e) =>
                                        setSelectedModule(e.target.value)
                                    }
                                    placeholder="ID hạng mục (để trống = tất cả)"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                                />
                            </div>
                            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={generateDryRun}
                                    onChange={(e) =>
                                        setGenerateDryRun(e.target.checked)
                                    }
                                />
                                Chỉ xem trước danh sách đủ điều kiện
                            </label>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !selectedTemplate}
                            >
                                {generating
                                    ? 'Đang xử lý...'
                                    : generateDryRun
                                      ? 'Kiểm tra'
                                      : 'Tạo ngay'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowGenerate(false)}
                            >
                                Hủy
                            </Button>
                        </div>
                    </div>
                ) : null}

                {isLoading ? <LoadingState /> : null}
                {error ? <ErrorState message={error} /> : null}

                {!isLoading && !error && certificates.length === 0 ? (
                    <EmptyState title="Chưa có chứng nhận nào cho chiến dịch này" />
                ) : null}

                {!isLoading && !error && certificates.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <th className="px-4 py-3">Số hiệu</th>
                                    <th className="px-4 py-3">Sinh viên</th>
                                    <th className="px-4 py-3">MSSV</th>
                                    <th className="px-4 py-3">Mẫu</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                    <th className="px-4 py-3">Ngày tạo</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {certificates.map((cert) => (
                                    <tr
                                        key={cert.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="max-w-[140px] px-4 py-3 font-mono text-xs text-slate-700">
                                            {cert.certificate_no}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {cert.student_name}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {cert.student_code}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {cert.template_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(cert.status)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            }).format(
                                                new Date(cert.created_at),
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isOperator ? (
                                                <div className="flex justify-end gap-1">
                                                    {cert.file_url &&
                                                    cert.status !==
                                                        'REVOKED' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDownload(
                                                                    cert,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600"
                                                            title="Tải xuống"
                                                        >
                                                            <Download className="size-4" />
                                                        </button>
                                                    ) : null}
                                                    {cert.status ===
                                                        'PENDING' ||
                                                    cert.status === 'FAILED' ? (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                actionId ===
                                                                cert.id
                                                            }
                                                            onClick={() =>
                                                                void handleRender(
                                                                    cert.id,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-600 disabled:opacity-40"
                                                            title="Tạo lại"
                                                        >
                                                            <RefreshCw className="size-4" />
                                                        </button>
                                                    ) : null}
                                                    {cert.status === 'READY' ||
                                                    cert.status === 'SIGNED' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setRevokeId(
                                                                    cert.id,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                            title="Thu hồi"
                                                        >
                                                            <XCircle className="size-4" />
                                                        </button>
                                                    ) : null}
                                                    {cert.status ===
                                                    'REVOKED' ? (
                                                        <button
                                                            type="button"
                                                            disabled={
                                                                actionId ===
                                                                cert.id
                                                            }
                                                            onClick={() =>
                                                                void handleReissue(
                                                                    cert.id,
                                                                )
                                                            }
                                                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 disabled:opacity-40"
                                                            title="Cấp lại"
                                                        >
                                                            <RotateCcw className="size-4" />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}

                {revokeId ? (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                            <h3 className="text-lg font-bold text-slate-900">
                                Thu hồi chứng nhận
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="mt-4">
                                <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                                    Lý do thu hồi
                                </label>
                                <textarea
                                    value={revokeReason}
                                    onChange={(e) =>
                                        setRevokeReason(e.target.value)
                                    }
                                    rows={3}
                                    placeholder="Nhập lý do thu hồi (không bắt buộc)"
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button
                                    onClick={handleRevoke}
                                    disabled={revoking}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {revoking
                                        ? 'Đang xử lý...'
                                        : 'Xác nhận thu hồi'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setRevokeId(null);
                                        setRevokeReason('');
                                    }}
                                >
                                    Hủy
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </ContentLayout>
    );
};

const StatCard = ({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) => (
    <div
        className={`rounded-xl border border-slate-200 p-4 text-center ${color}`}
    >
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs font-medium">{label}</p>
    </div>
);
