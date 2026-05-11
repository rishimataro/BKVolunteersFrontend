import * as React from 'react';
import {
    CheckCheck,
    MessageSquareText,
    RefreshCw,
    XCircle,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/components/ui/notifications';
import { ROLES, useUser } from '@/features/auth';
import {
    addApprovalComment,
    approvalTransition,
    getApprovalCampaignDetail,
    getApprovalQueue,
    type ApprovalQueueItem,
    type ManagedCampaignDetail,
} from '@/features/campaign/api/sprint2';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import type { CampaignStatus, ModuleType } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const moduleTypeLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ hiện kim',
    item_donation: 'Quyên góp hiện vật',
    event: 'Tuyển tình nguyện viên',
};

const roleLabel: Record<string, string> = {
    STUDENT: 'Sinh viên',
    ORG_ADMIN: 'Quản trị đơn vị',
    ORG_MEMBER: 'Thành viên đơn vị',
    SCHOOL_REVIEWER: 'Người duyệt cấp trường',
    SCHOOL_ADMIN: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

const campaignStatusLabel: Record<CampaignStatus, string> = {
    DRAFT: 'Nháp',
    SUBMITTED: 'Đã gửi duyệt',
    PRE_APPROVED: 'Tiền duyệt',
    APPROVED: 'Đã duyệt',
    REVISION_REQUIRED: 'Yêu cầu chỉnh sửa',
    REJECTED: 'Từ chối',
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
    ARCHIVED: 'Lưu trữ',
};

export const UsersRoute = () => {
    const user = useUser();
    const { addNotification } = useNotifications();

    const [queue, setQueue] = React.useState<ApprovalQueueItem[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = React.useState<
        string | null
    >(null);
    const [detail, setDetail] = React.useState<ManagedCampaignDetail | null>(
        null,
    );
    const [commentBody, setCommentBody] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<CampaignStatus | ''>(
        'SUBMITTED',
    );

    const canReview =
        user.data?.role === ROLES.SCHOOL_ADMIN ||
        user.data?.role === ROLES.SCHOOL_REVIEWER;

    const loadQueue = React.useCallback(async () => {
        if (!canReview) return;
        try {
            const data = await getApprovalQueue({
                status: statusFilter || undefined,
                page: 1,
                limit: 50,
            });
            setQueue(data);
            if (!selectedCampaignId && data.length > 0) {
                setSelectedCampaignId(data[0].id);
            }
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Không tải được hàng chờ duyệt',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    }, [addNotification, canReview, selectedCampaignId, statusFilter]);

    const loadDetail = React.useCallback(
        async (campaignId: string) => {
            try {
                const data = await getApprovalCampaignDetail(campaignId);
                setDetail(data);
            } catch (error) {
                addNotification({
                    type: 'error',
                    title: 'Không tải được chi tiết chiến dịch',
                    message:
                        error instanceof Error ? error.message : 'Lỗi hệ thống',
                });
            }
        },
        [addNotification],
    );

    React.useEffect(() => {
        void loadQueue();
    }, [loadQueue]);

    React.useEffect(() => {
        if (!selectedCampaignId) return;
        void loadDetail(selectedCampaignId);
    }, [loadDetail, selectedCampaignId]);

    const onAddComment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!detail || !commentBody.trim()) return;

        try {
            await addApprovalComment(detail.id, {
                body: commentBody.trim(),
                visibility: 'INTERNAL',
            });
            setCommentBody('');
            addNotification({
                type: 'success',
                title: 'Đã thêm nhận xét',
                message: 'Nhận xét đã được lưu',
            });
            await loadDetail(detail.id);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Gửi nhận xét thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    const onTransition = async (
        action: 'request-revision' | 'pre-approve' | 'approve' | 'reject',
    ) => {
        if (!detail) return;
        const reason =
            window.prompt('Nhập lý do xử lý (có thể để trống):') ?? undefined;
        try {
            await approvalTransition(detail.id, action, reason);
            addNotification({
                type: 'success',
                title: 'Đã cập nhật trạng thái',
                message: 'Thao tác duyệt đã được ghi nhận',
            });
            await Promise.all([loadQueue(), loadDetail(detail.id)]);
        } catch (error) {
            addNotification({
                type: 'error',
                title: 'Cập nhật trạng thái thất bại',
                message:
                    error instanceof Error ? error.message : 'Lỗi hệ thống',
            });
        }
    };

    if (!user.data) return null;

    if (!canReview) {
        return (
            <ContentLayout title="Hàng Chờ Duyệt Chiến Dịch">
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền duyệt chiến dịch.
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Hàng Chờ Duyệt Chiến Dịch">
            <div className="space-y-6">
                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Chiến dịch chờ duyệt
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {queue.length}
                        </p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Bộ lọc hiện tại
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {statusFilter
                                ? campaignStatusLabel[statusFilter]
                                : 'Tất cả'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Vai trò duyệt
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">
                            {roleLabel[user.data.role] ?? user.data.role}
                        </p>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <select
                                className="h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900"
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value as
                                            | CampaignStatus
                                            | '',
                                    )
                                }
                            >
                                <option value="SUBMITTED">Đã gửi duyệt</option>
                                <option value="PRE_APPROVED">Tiền duyệt</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="REVISION_REQUIRED">
                                    Yêu cầu chỉnh sửa
                                </option>
                                <option value="REJECTED">Từ chối</option>
                            </select>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => void loadQueue()}
                            >
                                <RefreshCw className="mr-1 size-4" />
                                Làm mới
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {queue.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCampaignId(campaign.id)
                                    }
                                    className={`w-full rounded-lg border p-3 text-left transition ${
                                        selectedCampaignId === campaign.id
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <p className="line-clamp-2 text-sm font-semibold text-slate-900">
                                        {toDisplayTitle(campaign.title)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-600">
                                        {toDisplayText(
                                            campaign.organization.name,
                                        )}
                                    </p>
                                    <div className="mt-2">
                                        <StatusBadge status={campaign.status} />
                                    </div>
                                </button>
                            ))}
                            {queue.length === 0 ? (
                                <p className="text-sm text-slate-600">
                                    Không có chiến dịch trong hàng chờ.
                                </p>
                            ) : null}
                        </div>
                    </section>

                    <section className="rounded-xl border border-slate-200 bg-white p-4">
                        {detail ? (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">
                                            {toDisplayTitle(detail.title)}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-600">
                                            {toDisplayText(detail.summary)}
                                        </p>
                                    </div>
                                    <StatusBadge status={detail.status} />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            void onTransition(
                                                'request-revision',
                                            )
                                        }
                                    >
                                        <MessageSquareText className="mr-1 size-4" />
                                        Yêu cầu chỉnh sửa
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            void onTransition('pre-approve')
                                        }
                                    >
                                        Tiền duyệt
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            void onTransition('approve')
                                        }
                                    >
                                        <CheckCheck className="mr-1 size-4" />
                                        Duyệt
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            void onTransition('reject')
                                        }
                                    >
                                        <XCircle className="mr-1 size-4" />
                                        Từ chối
                                    </Button>
                                </div>

                                <form
                                    onSubmit={onAddComment}
                                    className="space-y-2"
                                >
                                    <Input
                                        value={commentBody}
                                        placeholder="Nhập nhận xét nội bộ cho chiến dịch"
                                        onChange={(event) =>
                                            setCommentBody(event.target.value)
                                        }
                                    />
                                    <Button type="submit">Gửi nhận xét</Button>
                                </form>

                                <div className="space-y-2 border-t border-slate-200 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900">
                                        Danh sách hạng mục
                                    </h4>
                                    {detail.modules.map((module) => (
                                        <div
                                            key={module.id}
                                            className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {toDisplayTitle(
                                                        module.title,
                                                    )}
                                                </p>
                                                <StatusBadge
                                                    status={module.status}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-600">
                                                {moduleTypeLabel[module.type]}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600">
                                Chọn chiến dịch để xem và duyệt.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </ContentLayout>
    );
};
