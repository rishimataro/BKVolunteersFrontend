import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, Eye, FileText } from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import { ModuleBlock } from '@/components/ui/module-block';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { paths } from '@/config/paths';
import { getManagedCampaignPreview } from '@/features/campaign/api/campaign';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { ManagedCampaignDetail } from '@/features/campaign/types';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

type CampaignPreviewContentProps = {
    previewId: string | null;
};

const CampaignPreviewContent = ({ previewId }: CampaignPreviewContentProps) => {
    const [campaign, setCampaign] = useState<ManagedCampaignDetail | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(Boolean(previewId));
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!previewId) {
            return;
        }

        let mounted = true;

        getManagedCampaignPreview(previewId)
            .then((result) => {
                if (!mounted) return;
                setCampaign(result);
                setError(null);
            })
            .catch(() => {
                if (!mounted) return;
                setCampaign(null);
                setError('Không thể tải preview chiến dịch.');
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [previewId]);

    const invalidPreviewPath = !previewId;
    const visibleError = invalidPreviewPath
        ? 'Đường dẫn preview không hợp lệ.'
        : error;
    const visibleLoading = invalidPreviewPath ? false : isLoading;

    return (
        <ContentLayout title="Preview chiến dịch">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Eye className="h-6 w-6 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Preview chiến dịch
                        </h2>
                        <p className="text-sm text-slate-500">
                            Xem trước dữ liệu draft/revision dưới dạng public
                            trước khi gửi duyệt.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Link
                        to={paths.app.campaigns.getHref()}
                        className={buttonVariants({ variant: 'outline' })}
                    >
                        <ArrowLeft className="mr-1 size-4" />
                        Quay lại quản trị chiến dịch
                    </Link>
                    {campaign?.slug ? (
                        <Link
                            to={paths.app.campaigns.detail.getHref(
                                campaign.slug,
                            )}
                            className={buttonVariants({ variant: 'outline' })}
                        >
                            <FileText className="mr-1 size-4" />
                            Mở chi tiết public hiện tại
                        </Link>
                    ) : null}
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Đây là chế độ preview nội bộ. CTA tham gia thật được tắt, và
                    campaign draft sẽ không xuất hiện trong public listing.
                </div>

                {visibleLoading ? <LoadingState /> : null}
                {visibleError ? <ErrorState message={visibleError} /> : null}
                {!visibleLoading && !visibleError && !campaign ? (
                    <EmptyState title="Không tìm thấy chiến dịch preview" />
                ) : null}

                {!visibleLoading && !visibleError && campaign ? (
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="aspect-[16/7] bg-slate-100">
                                {campaign.cover_image_url ? (
                                    <img
                                        src={campaign.cover_image_url}
                                        alt={toDisplayTitle(campaign.title)}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-base font-semibold text-slate-600">
                                        BK Volunteers Preview
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-bk-blue">
                                            {toDisplayTitle(
                                                campaign.organization?.name ??
                                                    'Đơn vị tổ chức',
                                            )}
                                        </p>
                                        <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                                            {toDisplayTitle(campaign.title)}
                                        </h1>
                                    </div>
                                    <StatusBadge status={campaign.status} />
                                </div>

                                <p className="text-base leading-7 text-slate-600">
                                    {toDisplayText(
                                        campaign.description ??
                                            campaign.summary,
                                    )}
                                </p>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Tiến độ preview
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Preview nội bộ không phản ánh progress
                                        public runtime. Chỉ dùng để kiểm tra bố
                                        cục, module, CTA và comment.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDays className="size-4" />
                                        {formatDate(campaign.start_at)} -{' '}
                                        {formatDate(campaign.end_at)}
                                    </span>
                                    <span>
                                        Đối tượng:{' '}
                                        {toDisplayText(campaign.beneficiary) ||
                                            'Cộng đồng'}
                                    </span>
                                </div>
                            </div>
                        </article>

                        <aside className="space-y-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                <h3 className="text-base font-semibold text-slate-900">
                                    Đơn vị tổ chức
                                </h3>
                                <p className="mt-2 text-sm font-medium text-slate-700">
                                    {toDisplayTitle(
                                        campaign.organization?.name ??
                                            'Chưa có dữ liệu',
                                    )}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    {campaign.organization?.code ?? '—'}
                                </p>
                            </div>

                            {campaign.modules.map((module) => (
                                <ModuleBlock
                                    key={module.id}
                                    module={{
                                        id: module.id,
                                        type: module.type,
                                        title: toDisplayTitle(module.title),
                                        description: module.description
                                            ? toDisplayText(module.description)
                                            : null,
                                        progress: null,
                                    }}
                                    badge={
                                        <StatusBadge status={module.status} />
                                    }
                                >
                                    <Button
                                        type="button"
                                        className="mt-4 w-full"
                                        disabled
                                    >
                                        CTA preview
                                    </Button>
                                </ModuleBlock>
                            ))}
                        </aside>
                    </div>
                ) : null}

                {!isLoading && !error && campaign?.reviews?.length ? (
                    <section className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="text-base font-semibold text-slate-900">
                            Bình luận và yêu cầu chỉnh sửa
                        </h3>
                        <div className="mt-4 space-y-3">
                            {campaign.reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <span>{review.visibility}</span>
                                        <span>
                                            {new Intl.DateTimeFormat('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }).format(
                                                new Date(review.created_at),
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-slate-700">
                                        {toDisplayText(review.body)}
                                    </p>
                                    {review.attachment_url ? (
                                        <a
                                            href={review.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-flex text-sm font-medium text-bk-blue hover:text-blue-900"
                                        >
                                            Mở tệp đính kèm
                                        </a>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </ContentLayout>
    );
};

export const CampaignPreviewRoute = () => {
    const { id } = useParams();

    return (
        <CampaignPreviewContent
            key={id ?? 'invalid-preview'}
            previewId={id ?? null}
        />
    );
};
