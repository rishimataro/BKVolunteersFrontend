import * as React from 'react';
import { Link } from 'react-router';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardPen,
    Download,
    FileImage,
    FileSpreadsheet,
    FileText,
    Paperclip,
    Printer,
    Send,
    Share2,
    XCircle,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { useNotifications } from '@/components/ui/notifications';
import {
    addApprovalComment,
    approvalTransition,
    getApprovalCampaignDetail,
    type ManagedCampaignDetail,
} from '@/features/campaign/api/approval';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { CampaignStatus, ModuleType } from '@/types/api';
import { cn } from '@/lib/utils';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

type ReviewerRole = 'DOANTRUONG' | 'LCD';

type ApprovalCampaignDetailViewProps = {
    approvalId: string | null;
    role: ReviewerRole;
    backHref: string;
    backLabel: string;
};

type AuditAction = 'pre-approve' | 'approve' | 'request-revision' | 'reject';

type AttachmentItem = {
    id: string;
    name: string;
    href: string;
    meta: string;
    icon: 'pdf' | 'sheet' | 'image' | 'text';
};

const moduleTypeLabel: Record<ModuleType, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Quyên góp hiện vật',
    event: 'Tình nguyện',
    volunteer: 'Tuyển tình nguyện viên',
};

const statusAccentClassName: Record<string, string> = {
    SUBMITTED: 'bg-[#F59E0B] text-white',
    PRE_APPROVED: 'bg-[#1D4ED8] text-white',
    APPROVED: 'bg-[#15803D] text-white',
    REVISION_REQUIRED: 'bg-[#D97706] text-white',
    REJECTED: 'bg-[#B91C1C] text-white',
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));

const getPrimaryAction = (role: ReviewerRole, status: CampaignStatus) => {
    if (status === 'SUBMITTED') {
        return {
            action: 'pre-approve' as const,
            label:
                role === 'LCD' ? 'Sơ duyệt chiến dịch' : 'Sơ duyệt chiến dịch',
        };
    }

    if (role === 'DOANTRUONG' && status === 'PRE_APPROVED') {
        return {
            action: 'approve' as const,
            label: 'Phê duyệt chiến dịch',
        };
    }

    return null;
};

const getAttachmentIcon = (type: AttachmentItem['icon']) => {
    if (type === 'pdf') {
        return FileText;
    }

    if (type === 'sheet') {
        return FileSpreadsheet;
    }

    if (type === 'image') {
        return FileImage;
    }

    return FileText;
};

const getAttachmentItems = (
    detail: ManagedCampaignDetail,
): AttachmentItem[] => {
    const attachmentItems: AttachmentItem[] = [];

    if (detail.cover_image_url) {
        attachmentItems.push({
            id: 'cover-image',
            name: 'Ảnh bìa chiến dịch',
            href: detail.cover_image_url,
            meta: 'Tài nguyên media',
            icon: 'image',
        });
    }

    (detail.reviews ?? []).forEach((review, index) => {
        if (!review.attachment_url) return;

        attachmentItems.push({
            id: `${review.id}-attachment`,
            name: `Tệp phản hồi ${index + 1}`,
            href: review.attachment_url,
            meta: `Nhật ký thẩm định · ${formatDateTime(review.created_at)}` ,
            icon: review.attachment_url.endsWith('.xlsx')
                ? 'sheet'
                : review.attachment_url.match(/\.(png|jpg|jpeg|webp)$/i)
                  ? 'image'
                  : 'pdf',
        });
    });

    return attachmentItems;
};

const getVolunteerTarget = (detail: ManagedCampaignDetail) =>
    detail.modules
        .filter((module) => module.type === 'event')
        .reduce((total, module) => {
            const quota = Number(
                (module.settings as Record<string, unknown>).quota ?? 0,
            );
            return total + (Number.isFinite(quota) ? quota : 0);
        }, 0);

const getFundraisingTarget = (detail: ManagedCampaignDetail) =>
    detail.modules
        .filter((module) => module.type === 'fundraising')
        .reduce((total, module) => {
            const targetAmount = Number(
                (module.settings as Record<string, unknown>).target_amount ?? 0,
            );
            return total + (Number.isFinite(targetAmount) ? targetAmount : 0);
        }, 0);

const getReviewVisibilityLabel = (value: string) =>
    value === 'PUBLIC' ? 'Công khai cho đơn vị' : 'Nội bộ';

export const ApprovalCampaignDetailView = ({
    approvalId,
    role,
    backHref,
    backLabel,
}: ApprovalCampaignDetailViewProps) => {
    const { addNotification } = useNotifications();
    const [detail, setDetail] = React.useState<ManagedCampaignDetail | null>(
        null,
    );
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [commentBody, setCommentBody] = React.useState('');
    const [isPublicComment, setIsPublicComment] = React.useState(true);
    const [savingComment, setSavingComment] = React.useState(false);
    const [submittingAction, setSubmittingAction] =
        React.useState<AuditAction | null>(null);

    const loadDetail = React.useCallback(async () => {
        if (!approvalId) {
            setError(
                'Không xác định được mã hồ sơ thẩm định. Hãy mở lại từ danh sách hoặc thẻ theo dõi trên tổng quan.',
            );
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getApprovalCampaignDetail(approvalId);
            setDetail(data);
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Không thể tải chi tiết hồ sơ kiểm duyệt.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [approvalId]);

    React.useEffect(() => {
        void loadDetail();
    }, [loadDetail]);

    const volunteerTarget = React.useMemo(
        () => (detail ? getVolunteerTarget(detail) : 0),
        [detail],
    );
    const fundraisingTarget = React.useMemo(
        () => (detail ? getFundraisingTarget(detail) : 0),
        [detail],
    );
    const attachmentItems = React.useMemo(
        () => (detail ? getAttachmentItems(detail) : []),
        [detail],
    );
    const primaryAction = detail ? getPrimaryAction(role, detail.status) : null;

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            addNotification({
                type: 'success',
                title: 'Đã sao chép liên kết hồ sơ',
                message: 'Liên kết kiểm duyệt đã được sao chép.',
            });
        } catch {
            addNotification({
                type: 'error',
                title: 'Không thể sao chép liên kết',
                message:
                    'Trình duyệt hiện tại không cho phép sao chép tự động.',
            });
        }
    };

    const handleSaveComment = async () => {
        if (!detail) return;
        const trimmedBody = commentBody.trim();

        if (!trimmedBody) {
            addNotification({
                type: 'error',
                title: 'Thiếu nhận xét thẩm định',
                message: 'Vui lòng nhập nội dung nhận xét trước khi lưu.',
            });
            return;
        }

        setSavingComment(true);

        try {
            await addApprovalComment(detail.id, {
                body: trimmedBody,
                visibility: isPublicComment ? 'PUBLIC' : 'INTERNAL',
            });
            addNotification({
                type: 'success',
                title: 'Đã lưu nhận xét',
                message: 'Nhận xét của bạn đã được thêm vào lịch sử thẩm định.',
            });
            setCommentBody('');
            await loadDetail();
        } catch (saveError) {
            addNotification({
                type: 'error',
                title: 'Không thể lưu nhận xét',
                message:
                    saveError instanceof Error
                        ? saveError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setSavingComment(false);
        }
    };

    const handleAction = async (action: AuditAction) => {
        if (!detail) return;

        const trimmedBody = commentBody.trim();
        if (
            (action === 'request-revision' || action === 'reject') &&
            !trimmedBody
        ) {
            addNotification({
                type: 'error',
                title: 'Thiếu lý do phản hồi',
                message:
                    'Vui lòng nhập nhận xét trước khi yêu cầu chỉnh sửa hoặc từ chối hồ sơ.',
            });
            return;
        }

        setSubmittingAction(action);

        try {
            await approvalTransition(
                detail.id,
                action,
                trimmedBody || undefined,
            );

            addNotification({
                type: 'success',
                title:
                    action === 'approve'
                        ? 'Đã phê duyệt chiến dịch'
                        : action === 'pre-approve'
                          ? 'Đã sơ duyệt chiến dịch'
                          : action === 'request-revision'
                            ? 'Đã yêu cầu chỉnh sửa'
                            : 'Đã từ chối hồ sơ',
                message:
                    action === 'approve'
                        ? 'Chiến dịch đã hoàn tất bước kiểm duyệt.'
                        : action === 'pre-approve'
                          ? 'Hồ sơ đã được chuyển sang bước duyệt tiếp theo.'
                          : action === 'request-revision'
                            ? 'Đơn vị tổ chức đã nhận yêu cầu cập nhật hồ sơ.'
                            : 'Hồ sơ đã được loại khỏi hàng đợi kiểm duyệt.',
            });

            if (
                trimmedBody &&
                (action === 'approve' || action === 'pre-approve')
            ) {
                await addApprovalComment(detail.id, {
                    body: trimmedBody,
                    visibility: isPublicComment ? 'PUBLIC' : 'INTERNAL',
                });
            }

            setCommentBody('');
            await loadDetail();
        } catch (actionError) {
            addNotification({
                type: 'error',
                title: 'Không thể cập nhật trạng thái kiểm duyệt',
                message:
                    actionError instanceof Error
                        ? actionError.message
                        : 'Lỗi hệ thống',
            });
        } finally {
            setSubmittingAction(null);
        }
    };

    return (
        <>
            <Head
                title={
                    detail?.title
                        ? `Kiểm duyệt: ${toDisplayTitle(detail.title)}`
                        : 'Chi tiết kiểm duyệt'
                }
            />

            <div className="space-y-6">
                <section className="border-b border-border bg-white px-4 py-5 sm:px-6">
                    <div className="mx-auto max-w-7xl">
                        <Link
                            to={backHref}
                            className="inline-flex items-center gap-2 text-[14px] font-semibold text-primary transition hover:text-destructive"
                        >
                            <ArrowLeft className="size-4" />
                            {backLabel}
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !detail ? (
                        <EmptyState title="Không tìm thấy hồ sơ kiểm duyệt" />
                    ) : null}

                    {!isLoading && !error && detail ? (
                        <div className="space-y-6">
                            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className={cn(
                                                'inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                                                statusAccentClassName[
                                                    detail.status
                                                ] ?? 'bg-primary text-white',
                                            )}
                                        >
                                            {toDisplayText(detail.status)}
                                        </span>
                                        <span className="text-[14px] leading-6 text-muted-foreground">
                                            ID: {detail.id}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <h1 className="max-w-5xl font-heading text-[48px] leading-[1.1] font-bold tracking-[-0.03em] text-primary text-balance">
                                            {toDisplayTitle(detail.title)}
                                        </h1>
                                        <p className="text-[20px] leading-8 text-muted-foreground">
                                            Đơn vị đề xuất:{' '}
                                            {toDisplayTitle(
                                                detail.organization?.name ??
                                                    'Chưa xác định',
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.print()}
                                    >
                                        <Printer className="size-4" />
                                        In hồ sơ
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void handleShare()}
                                    >
                                        <Share2 className="size-4" />
                                        Chia sẻ
                                    </Button>
                                </div>
                            </section>

                            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                                <div className="space-y-6">
                                    <article className="border border-border bg-white p-6 sm:p-8">
                                        <div className="flex items-center gap-3 border-b border-border pb-4">
                                            <ClipboardPen className="size-7 text-primary" />
                                            <h2 className="font-heading text-[36px] leading-[1.2] font-bold tracking-[-0.02em] text-primary">
                                                Kế hoạch chi tiết
                                            </h2>
                                        </div>

                                        <div className="mt-6 grid gap-6">
                                            <section className="space-y-3">
                                                <p className="broadsheet-kicker">
                                                    Mục tiêu chiến dịch
                                                </p>
                                                <p className="max-w-[65ch] text-[18px] leading-9 text-primary">
                                                    {toDisplayText(
                                                        detail.description ??
                                                            detail.summary,
                                                    )}
                                                </p>
                                            </section>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <section className="border border-border bg-muted p-5">
                                                    <p className="broadsheet-kicker">
                                                        Chỉ tiêu tuyển quân
                                                    </p>
                                                    <div className="mt-4 flex items-end gap-3">
                                                        <span className="font-heading text-[56px] leading-none font-bold text-primary">
                                                            {volunteerTarget.toLocaleString(
                                                                'vi-VN',
                                                            )}
                                                        </span>
                                                        <span className="pb-1 text-[20px] leading-8 text-muted-foreground">
                                                            tình nguyện viên
                                                        </span>
                                                    </div>
                                                    <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
                                                        Tổng quota lấy từ các
                                                        hạng mục sự kiện đang có
                                                        trong hồ sơ.
                                                    </p>
                                                </section>

                                                <section className="border border-border bg-muted p-5">
                                                    <p className="broadsheet-kicker">
                                                        Ngân sách dự kiến
                                                    </p>
                                                    <div className="mt-4 flex items-end gap-3">
                                                        <span className="font-heading text-[56px] leading-none font-bold text-primary">
                                                            {(
                                                                fundraisingTarget /
                                                                1_000_000
                                                            ).toFixed(1)}
                                                            M
                                                        </span>
                                                        <span className="pb-1 text-[20px] leading-8 text-muted-foreground">
                                                            VNĐ
                                                        </span>
                                                    </div>
                                                    <p className="mt-4 text-[15px] leading-7 text-muted-foreground">
                                                        Tổng mục tiêu gây quỹ từ
                                                        các hạng mục đã khai báo
                                                        trong chiến dịch.
                                                    </p>
                                                </section>
                                            </div>

                                            <section className="space-y-4">
                                                <p className="broadsheet-kicker">
                                                    Lộ trình thực hiện
                                                </p>
                                                <div className="space-y-5">
                                                    <div className="grid gap-1 pl-5 relative before:absolute before:left-[7px] before:top-3 before:bottom-0 before:w-px before:bg-[#D1D5DB]">
                                                        <div className="absolute left-0 top-2.5 h-3.5 w-3.5 bg-[#16A34A]" />
                                                        <p className="text-[20px] font-semibold leading-8 text-primary">
                                                            Toàn chiến dịch
                                                        </p>
                                                        <p className="text-[16px] leading-7 text-muted-foreground">
                                                            {formatDate(
                                                                detail.start_at,
                                                            )}{' '}
                                                            -{' '}
                                                            {formatDate(
                                                                detail.end_at,
                                                            )}
                                                        </p>
                                                    </div>

                                                    {detail.modules.map(
                                                        (module, index) => (
                                                            <div
                                                                key={module.id}
                                                                className="grid gap-1 pl-5 relative before:absolute before:left-[7px] before:top-3 before:bottom-0 before:w-px before:bg-[#D1D5DB] last:before:hidden"
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        'absolute left-0 top-2.5 h-3.5 w-3.5',
                                                                        index ===
                                                                            detail
                                                                                .modules
                                                                                .length -
                                                                                1
                                                                            ? 'bg-[#9CA3AF]'
                                                                            : 'bg-[#16A34A]',
                                                                    )}
                                                                />
                                                                <p className="text-[20px] font-semibold leading-8 text-primary">
                                                                    {toDisplayTitle(
                                                                        module.title,
                                                                    )}
                                                                </p>
                                                                <p className="text-[16px] leading-7 text-muted-foreground">
                                                                    {
                                                                        moduleTypeLabel[
                                                                            module
                                                                                .type
                                                                        ]
                                                                    }{' '}
                                                                    ·{' '}
                                                                    {formatDate(
                                                                        module.start_at,
                                                                    )}{' '}
                                                                    -{' '}
                                                                    {formatDate(
                                                                        module.end_at,
                                                                    )}
                                                                </p>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </section>
                                        </div>
                                    </article>

                                    <article className="border border-border bg-white p-6 sm:p-8">
                                        <div className="flex items-center gap-3 border-b border-border pb-4">
                                            <Paperclip className="size-7 text-primary" />
                                            <h2 className="font-heading text-[36px] leading-[1.2] font-bold tracking-[-0.02em] text-primary">
                                                Hồ sơ đính kèm
                                            </h2>
                                        </div>

                                        {attachmentItems.length > 0 ? (
                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                {attachmentItems.map(
                                                    (attachment) => {
                                                        const Icon =
                                                            getAttachmentIcon(
                                                                attachment.icon,
                                                            );

                                                        return (
                                                            <a
                                                                key={
                                                                    attachment.id
                                                                }
                                                                href={
                                                                    attachment.href
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center justify-between gap-4 border border-border bg-muted p-4 transition hover:border-primary"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <Icon className="size-5 text-primary" />
                                                                    <div>
                                                                        <p className="text-[18px] font-semibold leading-7 text-primary">
                                                                            {
                                                                                attachment.name
                                                                            }
                                                                        </p>
                                                                        <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">
                                                                            {
                                                                                attachment.meta
                                                                            }
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <Download className="size-5 text-muted-foreground" />
                                                            </a>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        ) : (
                                            <div className="mt-6 border border-dashed border-input bg-[#FAFAFA] p-6 text-[16px] leading-7 text-muted-foreground">
                                                Gói dữ liệu hiện tại chưa trả về
                                                tệp đính kèm riêng cho hồ sơ
                                                này.
                                            </div>
                                        )}
                                    </article>
                                </div>

                                <aside className="space-y-6">
                                    <section className="border border-border bg-white">
                                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                            <h2 className="font-heading text-[30px] leading-[1.2] font-bold tracking-[-0.02em] text-primary">
                                                Lịch sử thẩm định
                                            </h2>
                                            <span className="broadsheet-kicker">
                                                {(detail.reviews ?? []).length}{' '}
                                                bản ghi
                                            </span>
                                        </div>

                                        <div className="max-h-[560px] overflow-y-auto px-5 py-5">
                                            {detail.reviews?.length ? (
                                                <div className="space-y-6">
                                                    {detail.reviews.map(
                                                        (review) => (
                                                            <article
                                                                key={review.id}
                                                                className="grid gap-3"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
                                                                        <FileText className="size-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                                            <p className="text-[18px] font-semibold leading-7 text-primary">
                                                                                {getReviewVisibilityLabel(
                                                                                    review.visibility,
                                                                                )}
                                                                            </p>
                                                                            <span className="text-[13px] leading-6 text-muted-foreground">
                                                                                {formatDateTime(
                                                                                    review.created_at,
                                                                                )}
                                                                            </span>
                                                                        </div>
                                                                        <div className="mt-3 border border-border bg-muted p-4">
                                                                            <p className="text-[17px] leading-8 text-primary italic">
                                                                                “
                                                                                {toDisplayText(
                                                                                    review.body,
                                                                                )}

                                                                                ”
                                                                            </p>
                                                                            {review.attachment_url ? (
                                                                                <a
                                                                                    href={
                                                                                        review.attachment_url
                                                                                    }
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="mt-4 inline-flex items-center gap-2 text-[14px] font-semibold text-primary underline"
                                                                                >
                                                                                    <Paperclip className="size-4" />
                                                                                    Mở
                                                                                    tệp
                                                                                    đính
                                                                                    kèm
                                                                                </a>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </article>
                                                        ),
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="border border-dashed border-input bg-[#FAFAFA] p-5 text-[15px] leading-7 text-muted-foreground">
                                                    Chưa có bản ghi thẩm định
                                                    nào cho hồ sơ này.
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    <section className="border-2 border-primary bg-white p-5">
                                        <h2 className="font-heading text-[30px] leading-[1.2] font-bold tracking-[-0.02em] text-primary">
                                            Thực hiện phê duyệt
                                        </h2>
                                        <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                                            Vai trò hiện tại:{' '}
                                            <strong>
                                                {role === 'DOANTRUONG'
                                                    ? 'Đoàn trường'
                                                    : 'Liên chi đoàn'}
                                            </strong>
                                            .
                                        </p>

                                        <div className="mt-5 space-y-4">
                                            <label className="grid gap-2">
                                                <span className="broadsheet-kicker">
                                                    Nhận xét của bạn
                                                </span>
                                                <textarea
                                                    value={commentBody}
                                                    onChange={(event) =>
                                                        setCommentBody(
                                                            event.target.value,
                                                        )
                                                    }
                                                    placeholder="Nhập ý kiến thẩm định tại đây..."
                                                    className="min-h-[168px] border border-input bg-white px-4 py-3 text-[17px] leading-8 text-primary outline-none transition focus:border-2 focus:border-primary"
                                                />
                                            </label>

                                            <label className="flex items-start gap-3 text-[14px] leading-6 text-muted-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={isPublicComment}
                                                    onChange={(event) =>
                                                        setIsPublicComment(
                                                            event.target
                                                                .checked,
                                                        )
                                                    }
                                                    className="mt-1 h-4 w-4 border-input text-primary focus:ring-0"
                                                />
                                                <span>
                                                    Hiển thị nhận xét này cho
                                                    đơn vị tổ chức khi họ xem
                                                    phản hồi.
                                                </span>
                                            </label>

                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full"
                                                disabled={
                                                    savingComment ||
                                                    !commentBody.trim()
                                                }
                                                onClick={() =>
                                                    void handleSaveComment()
                                                }
                                            >
                                                {savingComment
                                                    ? 'Đang lưu nhận xét'
                                                    : 'Lưu nhận xét'}
                                            </Button>

                                            {primaryAction ? (
                                                <Button
                                                    type="button"
                                                    className="w-full bg-[#15803D] text-white hover:bg-[#166534]"
                                                    disabled={
                                                        submittingAction !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        void handleAction(
                                                            primaryAction.action,
                                                        )
                                                    }
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                    {submittingAction ===
                                                    primaryAction.action
                                                        ? 'Đang xử lý'
                                                        : primaryAction.label}
                                                </Button>
                                            ) : (
                                                <div className="border border-border bg-muted px-4 py-3 text-[14px] leading-6 text-muted-foreground">
                                                    Hồ sơ hiện không có bước
                                                    hành động chính nào cho vai
                                                    trò này.
                                                </div>
                                            )}

                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <Button
                                                    type="button"
                                                    className="w-full bg-[#D97706] text-white hover:bg-[#B45309]"
                                                    disabled={
                                                        submittingAction !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        void handleAction(
                                                            'request-revision',
                                                        )
                                                    }
                                                >
                                                    <Send className="size-4" />
                                                    {submittingAction ===
                                                    'request-revision'
                                                        ? 'Đang gửi'
                                                        : 'Yêu cầu sửa'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    className="w-full"
                                                    disabled={
                                                        submittingAction !==
                                                        null
                                                    }
                                                    onClick={() =>
                                                        void handleAction(
                                                            'reject',
                                                        )
                                                    }
                                                >
                                                    <XCircle className="size-4" />
                                                    {submittingAction ===
                                                    'reject'
                                                        ? 'Đang từ chối'
                                                        : 'Từ chối hồ sơ'}
                                                </Button>
                                            </div>

                                            {detail.status ? (
                                                <div className="border-t border-border pt-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="broadsheet-kicker">
                                                            Trạng thái hiện tại
                                                        </span>
                                                        <StatusBadge
                                                            status={
                                                                detail.status
                                                            }
                                                        />
                                                    </div>
                                                    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                                                        Giai đoạn diễn ra:{' '}
                                                        <strong>
                                                            {formatDate(
                                                                detail.start_at,
                                                            )}{' '}
                                                            -{' '}
                                                            {formatDate(
                                                                detail.end_at,
                                                            )}
                                                        </strong>
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </section>
                                </aside>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    to={backHref}
                                    className={buttonVariants({
                                        variant: 'outline',
                                    })}
                                >
                                    <ArrowLeft className="size-4" />
                                    {backLabel}
                                </Link>
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
        </>
    );
};

