import * as React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, CalendarDays, FileText, HandCoins, UserPlus } from 'lucide-react';

import { Head } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { getPublicCampaignDetail } from '@/features/campaign/api/public';
import { ApprovalCampaignDetailView } from '@/features/campaign/components/approval-campaign-detail-view';
import {
    StudentEventRegistrationDialog,
    StudentFundraisingDialog,
    StudentItemDonationDialog,
} from '@/features/campaign/components/student-module-cta-dialogs';
import { ModuleBlock } from '@/components/ui/module-block';
import { StatusBadge } from '@/features/campaign/components/status-badge';
import {
    EmptyState,
    ErrorState,
    LoadingState,
} from '@/features/campaign/components/state-blocks';
import type { PublicCampaignDetail } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';

export const PublicCampaignDetailRoute = () => (
    <CampaignDetailView
        backHref={paths.campaigns.getHref()}
        backLabel="Danh sách chiến dịch"
        headTitle="Chi tiết chiến dịch"
    />
);

const AppCampaignDetailRoutePublic = () => (
    <CampaignDetailView
        backHref={paths.app.campaigns.getHref()}
        backLabel="Chiến dịch công khai"
        headTitle="Chi tiết chiến dịch"
    />
);

export const AppCampaignDetailRoute = () => {
    const user = useUser();
    const [searchParams] = useSearchParams();
    const role = user.data?.role;

    if (role === ROLES.DOANTRUONG) {
        return (
            <ApprovalCampaignDetailView
                approvalId={searchParams.get('approvalId')}
                role={role}
                backHref={paths.app.dashboard.getHref()}
                backLabel="Quay lại tổng quan"
            />
        );
    }

    return <AppCampaignDetailRoutePublic />;
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

type CampaignDetailViewProps = {
    backHref: string;
    backLabel: string;
    headTitle: string;
};

const getStudentFullName = (
    user: ReturnType<typeof useUser>['data'] | null | undefined,
) => {
    const fullName = String(user?.fullName ?? '').trim();
    if (fullName) {
        return fullName;
    }

    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
};

const getStudentCode = (
    user: ReturnType<typeof useUser>['data'] | null | undefined,
) => String(user?.studentCode ?? user?.mssv ?? '').trim();

const CampaignDetailView = ({
    backHref,
    backLabel,
    headTitle,
}: CampaignDetailViewProps) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const user = useUser();
    const [campaign, setCampaign] = React.useState<PublicCampaignDetail | null>(
        null,
    );
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [eventDialogModule, setEventDialogModule] = React.useState<
        PublicCampaignDetail['modules'][number] | null
    >(null);
    const [fundraisingDialogModule, setFundraisingDialogModule] =
        React.useState<PublicCampaignDetail['modules'][number] | null>(null);
    const [itemDonationDialogModule, setItemDonationDialogModule] =
        React.useState<PublicCampaignDetail['modules'][number] | null>(null);
    const isStudent = user.data?.role === 'SINHVIEN';
    const studentFullName = getStudentFullName(user.data);
    const studentCode = getStudentCode(user.data);
    const studentPhone = String(user.data?.phone ?? '').trim();

    React.useEffect(() => {
        if (!slug) {
            setIsLoading(false);
            setError('Đường dẫn chiến dịch không hợp lệ.');
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        getPublicCampaignDetail(slug)
            .then((result) => {
                if (!isMounted) return;
                setCampaign(result);
            })
            .catch(() => {
                if (!isMounted) return;
                setError('Không thể tải chi tiết chiến dịch.');
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [slug]);

    return (
        <>
            <Head
                title={
                    campaign?.title ? toDisplayTitle(campaign.title) : headTitle
                }
            />
            <main className="min-h-screen bg-slate-50">
                <section className="border-b border-slate-200 bg-white">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <Link
                            to={backHref}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-bk-blue hover:text-blue-900"
                        >
                            <ArrowLeft className="size-4" />
                            {backLabel}
                        </Link>
                    </div>
                </section>

                <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {isLoading ? <LoadingState /> : null}
                    {error ? <ErrorState message={error} /> : null}
                    {!isLoading && !error && !campaign ? (
                        <EmptyState title="Không tìm thấy chiến dịch" />
                    ) : null}

                    {!isLoading && !error && campaign ? (
                        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                            <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="aspect-[16/7] bg-slate-100">
                                    {campaign.cover_image_url ? (
                                        <img
                                            src={campaign.cover_image_url}
                                            alt={toDisplayTitle(campaign.title)}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-base font-semibold text-slate-600">
                                            BK Volunteers
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6 p-6">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-bk-blue">
                                                {toDisplayTitle(
                                                    campaign.organization.name,
                                                )}
                                            </p>
                                            <h1 className="mt-2 break-words text-3xl font-bold text-slate-950">
                                                {toDisplayTitle(campaign.title)}
                                            </h1>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {backHref.startsWith('/app') &&
                                            (user.data?.accountType ===
                                                'OPERATOR' ||
                                                user.data?.role ===
                                                    'DOANTRUONG') ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(
                                                            paths.app.certificates.campaigns.getHref(
                                                                campaign.id,
                                                            ),
                                                        )
                                                    }
                                                >
                                                    <FileText className="mr-1 size-4" />
                                                    Chứng nhận
                                                </Button>
                                            ) : null}
                                            <StatusBadge
                                                status={campaign.status}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-base leading-7 text-slate-600">
                                        {toDisplayText(
                                            campaign.description ??
                                                campaign.summary,
                                        )}
                                    </p>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                                            <span>Tiến độ tổng</span>
                                            <span>
                                                {campaign.progress.percent}%
                                            </span>
                                        </div>
                                        <div className="h-3 rounded-full bg-slate-100">
                                            <div
                                                className="h-3 rounded-full bg-bk-blue"
                                                style={{
                                                    width: `${campaign.progress.percent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {formatDate(
                                                campaign.start_at,
                                            )} - {formatDate(campaign.end_at)}
                                        </span>
                                        <span>
                                            Đối tượng:{' '}
                                            {toDisplayText(
                                                campaign.beneficiary,
                                            ) || 'Cộng đồng'}
                                        </span>
                                    </div>
                                </div>
                            </article>

                            <aside className="space-y-4">
                                <div className="rounded-lg border border-slate-200 bg-white p-5">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        Đơn vị tổ chức
                                    </h2>
                                    <p className="mt-2 text-sm font-medium text-slate-700">
                                        {toDisplayTitle(
                                            campaign.organization.name,
                                        )}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {campaign.organization.code}
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
                                                ? toDisplayText(
                                                      module.description,
                                                  )
                                                : null,
                                            progress: module.progress
                                                ? {
                                                      current:
                                                          module.progress
                                                              .current,
                                                      target: module.progress
                                                          .target,
                                                  }
                                                : null,
                                        }}
                                        badge={
                                            <StatusBadge
                                                status={module.status}
                                            />
                                        }
                                    >
                                        {module.cta.enabled &&
                                        isStudent &&
                                        module.type === 'fundraising' ? (
                                            <Button
                                                type="button"
                                                className="mt-4 w-full gap-2"
                                                onClick={() =>
                                                    setFundraisingDialogModule(
                                                        module,
                                                    )
                                                }
                                            >
                                                <HandCoins
                                                    className="size-4"
                                                    strokeWidth={1.75}
                                                />
                                                Ủng hộ tài chính
                                            </Button>
                                        ) : module.cta.enabled &&
                                          isStudent &&
                                          (module.type === 'event' ||
                                              module.type ===
                                                  'item_donation') ? null : (
                                            <Button
                                                type="button"
                                                className="mt-4 w-full"
                                                disabled={!module.cta.enabled}
                                            >
                                                {toDisplayText(
                                                    module.cta.label,
                                                )}
                                            </Button>
                                        )}

                                        {module.cta.enabled &&
                                        isStudent &&
                                        module.type === 'item_donation' ? (
                                            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Đăng ký quyên góp hiện vật
                                                </p>
                                                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                                                    Mở biểu mẫu để chọn nhu cầu,
                                                    số lượng và thời điểm bàn
                                                    giao hiện vật phù hợp.
                                                </p>
                                                <Button
                                                    type="button"
                                                    className="mt-4 w-full"
                                                    onClick={() =>
                                                        setItemDonationDialogModule(
                                                            module,
                                                        )
                                                    }
                                                >
                                                    Gửi đăng ký hiện vật
                                                </Button>
                                            </div>
                                        ) : null}

                                        {module.cta.enabled &&
                                        isStudent &&
                                        module.type === 'event' ? (
                                            <div className="mt-4 border border-input bg-muted p-4">
                                                <p className="broadsheet-kicker">
                                                    Phiếu tham gia tình nguyện
                                                </p>
                                                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                                                    Cập nhật số điện thoại, kỹ
                                                    năng và xác nhận cam kết
                                                    tham gia hoạt động tình
                                                    nguyện.
                                                </p>
                                                <Button
                                                    type="button"
                                                    className="mt-4 w-full gap-2"
                                                    onClick={() =>
                                                        setEventDialogModule(
                                                            module,
                                                        )
                                                    }
                                                >
                                                    <UserPlus
                                                        className="size-4"
                                                        strokeWidth={1.75}
                                                    />
                                                    Đăng ký tham gia
                                                </Button>
                                            </div>
                                        ) : null}

                                        {module.cta.enabled && !isStudent ? (
                                            <p className="mt-3 text-xs text-slate-600">
                                                Đăng nhập tài khoản sinh viên để
                                                tham gia hạng mục này.
                                            </p>
                                        ) : null}
                                    </ModuleBlock>
                                ))}
                            </aside>
                        </div>
                    ) : null}
                </section>
            </main>

            {campaign ? (
                <>
                    <StudentEventRegistrationDialog
                        campaign={campaign}
                        module={eventDialogModule}
                        open={Boolean(eventDialogModule)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setEventDialogModule(null);
                            }
                        }}
                        student={{
                            fullName: studentFullName,
                            studentCode: studentCode,
                            phone: studentPhone,
                        }}
                    />

                    <StudentFundraisingDialog
                        campaign={campaign}
                        module={fundraisingDialogModule}
                        open={Boolean(fundraisingDialogModule)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setFundraisingDialogModule(null);
                            }
                        }}
                        student={{
                            fullName: studentFullName,
                            studentCode: studentCode,
                            phone: studentPhone,
                        }}
                    />

                    <StudentItemDonationDialog
                        campaign={campaign}
                        module={itemDonationDialogModule}
                        open={Boolean(itemDonationDialogModule)}
                        onOpenChange={(open) => {
                            if (!open) {
                                setItemDonationDialogModule(null);
                            }
                        }}
                        student={{
                            fullName: studentFullName,
                            studentCode: studentCode,
                            phone: studentPhone,
                        }}
                    />
                </>
            ) : null}
        </>
    );
};
