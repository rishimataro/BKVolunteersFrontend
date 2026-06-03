import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { featuredCampaigns } from '../data/home-content';

type LandingCampaignsSectionProps = {
    onViewCampaigns: () => void;
};

export const LandingCampaignsSection = ({
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {featuredCampaigns.map((campaign) => (
                        <article
                            key={campaign.title}
                            className="flex h-full flex-col border border-[#C3C6D2] bg-white transition-colors hover:border-[#737781]"
                        >
                            <div className="relative border-b border-[#E1E3E4]">
                                <img
                                    src={campaign.imageSrc}
                                    alt={campaign.imageAlt}
                                    className="aspect-[4/3] w-full object-cover"
                                />
                                <span
                                    className={`absolute right-4 top-4 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${
                                        campaign.statusTone === 'secondary'
                                            ? 'bg-[#006D37] text-white'
                                            : 'bg-[#002A58] text-white'
                                    }`}
                                >
                                    {campaign.status}
                                </span>
                            </div>

                            <div className="flex flex-1 flex-col p-5">
                                <h3 className="text-[24px] font-semibold leading-8 text-[#191C1D]">
                                    {campaign.title}
                                </h3>
                                <p className="mt-3 flex-1 text-[14px] leading-5 text-[#424750]">
                                    {campaign.description}
                                </p>

                                <div className="mt-6 border-t border-[#E1E3E4] pt-4">
                                    <div className="mb-3 flex items-center justify-between gap-4 text-[12px] font-bold uppercase tracking-[0.08em]">
                                        <span className="text-[#4B5563]">
                                            Tiến độ gây quỹ
                                        </span>
                                        <span className="text-[#006D37]">
                                            {campaign.raised} /{' '}
                                            {campaign.target}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-[#D6F6E2]">
                                        <div
                                            className="h-full bg-[#006D37]"
                                            style={{
                                                width: `${campaign.progress}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
};
