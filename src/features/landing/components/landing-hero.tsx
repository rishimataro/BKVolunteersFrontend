import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { landingMetrics } from '../data/home-content';

type LandingHeroProps = {
    onLogin: () => void;
    onViewCampaigns: () => void;
};

export const LandingHero = ({ onLogin, onViewCampaigns }: LandingHeroProps) => {
    return (
        <>
            <section className="border-b border-[#C3C6D2] bg-[#002A58] text-white">
                <div className="relative isolate overflow-hidden">
                    <img
                        src="/landing/1.jpg"
                        alt="Sinh viên BK Volunteers đang tham gia hoạt động hỗ trợ cộng đồng."
                        className="absolute inset-0 size-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-[#002A58]/75" />
                    <div className="relative mx-auto flex min-h-[32rem] w-full max-w-[1280px] items-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <div className="max-w-3xl">
                            <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]">
                                Home / điều phối cộng đồng
                            </p>
                            <h1 className="max-w-[12ch] text-[40px] font-bold leading-[1.2] md:text-[56px]">
                                Số hóa điều phối thiện nguyện trong nhà trường
                            </h1>
                            <p className="mt-6 max-w-[62ch] text-[18px] leading-7 text-[#F0F1F2]">
                                Một mặt tiền số rõ ràng cho chiến dịch, đội nhóm
                                và tác động cộng đồng. Giữ luồng điều phối gọn,
                                minh bạch và đủ chiều sâu để nhà trường, đơn vị
                                tổ chức và sinh viên cùng theo dõi.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button
                                    size="lg"
                                    className="rounded-none border border-[#6BFE9C] bg-[#6BFE9C] normal-case tracking-normal text-[#00743A] hover:bg-[#4AE183]"
                                    onClick={onLogin}
                                >
                                    Bắt đầu ngay
                                    <ArrowRight
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="rounded-none border-white bg-transparent normal-case tracking-normal text-white hover:bg-white/10"
                                    onClick={onViewCampaigns}
                                >
                                    Xem chiến dịch
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="relative z-10 -mt-8 bg-[#F8F9FA] pb-16">
                <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                    <div className="grid border border-[#C3C6D2] bg-white md:grid-cols-4">
                        {landingMetrics.map((metric, index) => (
                            <article
                                key={metric.label}
                                className={`space-y-2 p-6 ${index < landingMetrics.length - 1 ? 'border-b border-[#E1E3E4] md:border-b-0 md:border-r' : ''}`}
                            >
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                    {metric.label}
                                </p>
                                <p className="text-[40px] font-bold leading-[48px] text-[#002A58]">
                                    {metric.value}
                                </p>
                                <p className="text-[14px] leading-5 text-[#424750]">
                                    {metric.note}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};
