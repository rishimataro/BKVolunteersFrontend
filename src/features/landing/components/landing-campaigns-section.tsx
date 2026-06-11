import { ArrowRight, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicHomeData } from '@/types/api';

type LandingCampaignsSectionProps = {
    campaigns: PublicHomeData['featured_campaigns'];
    isLoading: boolean;
    hasError: boolean;
    onViewCampaigns: () => void;
};

const campaignStatusLabel: Record<string, string> = {
    PUBLISHED: 'Đã công khai',
    ONGOING: 'Đang diễn ra',
    ENDED: 'Đã kết thúc',
};

const formatDateRange = (startAt: string, endAt: string) => {
    const formatter = new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });

    return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
};

export const LandingCampaignsSection = ({
    campaigns,
    isLoading,
    hasError,
    onViewCampaigns,
}: LandingCampaignsSectionProps) => {
    return (
        <section
            id="chien-dich"
            className="border-y border-[#C3C6D2] bg-[#F8F9FA] py-16"
        >
            <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                <div className="mb-10 flex flex-col gap-6 border-b border-[#E1E3E4] pb-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                            Nhiệm vụ nổi bật trong học kỳ
                        </p>
                        <h2 className="text-[32px] font-semibold leading-10 text-[#191C1D]">
                            Chiến dịch nổi bật
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit rounded-none border border-transparent px-0 normal-case tracking-normal text-[#002A58] hover:bg-transparent hover:text-[#004080]"
                        onClick={onViewCampaigns}
                    >
                        Xem tất cả
                        <ArrowRight className="size-4" strokeWidth={1.5} />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {Array.from({ length: 3 }, (_, index) => (
                            <div
                                key={index}
                                className="min-h-[420px] animate-pulse border border-[#C3C6D2] bg-white"
                            />
                        ))}
                    </div>
                ) : campaigns.length > 0 ? (
                    <div className="grid gap-6 lg:grid-cols-3">
                        {campaigns.map((campaign) => (
                            <article
                                key={campaign.id}
                                className="flex h-full flex-col border border-[#C3C6D2] bg-white transition-colors hover:border-[#737781]"
                            >
                                <div className="relative border-b border-[#E1E3E4]">
                                    {campaign.cover_image_url ? (
                                        <img
                                            src={campaign.cover_image_url}
                                            alt={campaign.title}
                                            className="aspect-[4/3] w-full object-cover"
                                        />
                                    ) : (
                                        <div className="aspect-[4/3] bg-[#EDEEEF]" />
                                    )}
                                    <span className="absolute right-4 top-4 bg-[#002A58] px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-white">
                                        {campaignStatusLabel[campaign.status] ??
                                            campaign.status}
                                    </span>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                        {campaign.organization.name}
                                    </p>
                                    <h3 className="mt-2 text-[24px] font-semibold leading-8 text-[#191C1D]">
                                        {campaign.title}
                                    </h3>
                                    <p className="mt-3 flex-1 text-[14px] leading-6 text-[#424750]">
                                        {campaign.summary}
                                    </p>

                                    <div className="mt-5 flex items-center gap-2 text-[14px] leading-6 text-[#424750]">
                                        <CalendarDays
                                            className="size-4"
                                            strokeWidth={1.75}
                                        />
                                        {formatDateRange(
                                            campaign.start_at,
                                            campaign.end_at,
                                        )}
                                    </div>

                                    <div className="mt-6 border-t border-[#E1E3E4] pt-4">
                                        <div className="mb-3 flex items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.08em]">
                                            <span className="text-[#424750]">
                                                Tiến độ tổng thể
                                            </span>
                                            <span className="text-[#006D37]">
                                                {campaign.progress.percent}% ·{' '}
                                                {campaign.module_types.length}{' '}
                                                hạng mục
                                            </span>
                                        </div>
                                        <div className="h-2 bg-[#D6F6E2]">
                                            <div
                                                className="h-full bg-[#006D37]"
                                                style={{
                                                    width: `${campaign.progress.percent}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="border border-[#C3C6D2] bg-white px-6 py-8 text-[15px] leading-7 text-[#424750]">
                        {hasError
                            ? 'Không thể tải danh sách chiến dịch nổi bật từ backend.'
                            : 'Backend chưa trả về chiến dịch công khai nào để hiển thị trên trang chủ.'}
                    </div>
                )}
            </div>
        </section>
    );
};
