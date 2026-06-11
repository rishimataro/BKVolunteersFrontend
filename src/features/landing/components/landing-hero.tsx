import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicHomeData } from '@/types/api';

type LandingHeroProps = {
    metrics: PublicHomeData['metrics'] | null;
    isLoading: boolean;
    hasError: boolean;
    onLogin: () => void;
    onViewCampaigns: () => void;
};

const formatCompactNumber = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: value >= 1000 ? 1 : 0,
        notation: value >= 1000 ? 'compact' : 'standard',
    }).format(value);

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 1,
        notation: value >= 1000000 ? 'compact' : 'standard',
    }).format(value);

const buildMetricCards = (metrics: PublicHomeData['metrics']) => [
    {
        label: 'Giờ tình nguyện',
        note: 'Đã được xác nhận từ các hoạt động hoàn thành',
        value: formatCompactNumber(metrics.total_completed_event_hours),
    },
    {
        label: 'Nguồn lực xác nhận',
        note: 'Tổng tiền đóng góp đã được đối soát',
        value: `${formatCurrency(metrics.total_money_donations)} đ`,
    },
    {
        label: 'Đơn vị hoạt động',
        note: 'Khoa, liên chi đoàn và câu lạc bộ đang có dữ liệu thật',
        value: formatCompactNumber(metrics.total_organizations),
    },
    {
        label: 'Sinh viên trong hệ thống',
        note: 'Tài khoản có thể tham gia và theo dõi chiến dịch',
        value: formatCompactNumber(metrics.total_students),
    },
];

export const LandingHero = ({
    metrics,
    isLoading,
    hasError,
    onLogin,
    onViewCampaigns,
}: LandingHeroProps) => {
    const metricCards = metrics ? buildMetricCards(metrics) : [];

    return (
        <>
            <section className="border-b border-[#C3C6D2] bg-[#002A58] text-white">
                <div className="relative overflow-hidden isolate">
                    <img
                        src="/landing/1.jpg"
                        alt="Sinh viên BK Volunteers đang tham gia hoạt động hỗ trợ cộng đồng."
                        className="absolute inset-0 object-cover size-full opacity-30"
                    />
                    <div className="absolute inset-0 bg-[#002A58]/75" />
                    <div className="relative mx-auto flex min-h-[32rem] w-full max-w-[1280px] items-center px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
                        <div className="max-w-3xl">
                            <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]">
                                Home / điều phối cộng đồng
                            </p>
                            <h1 className="text-white max-w-[12ch] text-[40px] font-bold leading-[1.2] md:text-[56px]">
                                Số hóa điều phối tình nguyện trong nhà trường
                            </h1>
                            <p className="mt-6 max-w-[62ch] text-[18px] leading-7 text-[#F0F1F2]">
                                Một mặt tiền số rõ ràng cho chiến dịch, đội nhóm
                                và tác động cộng đồng. Dữ liệu trên trang này
                                được đồng bộ trực tiếp từ backend thay vì dùng
                                dữ liệu giả.
                            </p>

                            <div className="flex flex-col gap-3 mt-8 sm:flex-row">
                                <Button
                                    size="lg"
                                    className="rounded-none border border-[#6BFE9C] bg-[#6BFE9C] normal-case tracking-normal text-[#00743A] hover:bg-[#4AE183]"
                                    onClick={onLogin}
                                >
                                    Đăng nhập để vận hành
                                    <ArrowRight
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="tracking-normal text-white normal-case bg-transparent border-white rounded-none hover:bg-white/10"
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
                    {isLoading ? (
                        <div className="grid border border-[#C3C6D2] bg-white md:grid-cols-4">
                            {Array.from({ length: 4 }, (_, index) => (
                                <div
                                    key={index}
                                    className={`space-y-3 p-6 ${index < 3 ? 'border-b border-[#E1E3E4] md:border-b-0 md:border-r' : ''}`}
                                >
                                    <div className="h-3 w-28 animate-pulse bg-[#E1E3E4]" />
                                    <div className="h-10 w-24 animate-pulse bg-[#E1E3E4]" />
                                    <div className="h-4 w-full animate-pulse bg-[#F1F3F5]" />
                                </div>
                            ))}
                        </div>
                    ) : metrics ? (
                        <div className="grid border border-[#C3C6D2] bg-white md:grid-cols-4">
                            {metricCards.map((metric, index) => (
                                <article
                                    key={metric.label}
                                    className={`space-y-2 p-6 ${index < metricCards.length - 1 ? 'border-b border-[#E1E3E4] md:border-b-0 md:border-r' : ''}`}
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
                    ) : (
                        <div className="border border-[#C3C6D2] bg-white px-6 py-5 text-[15px] leading-7 text-[#424750]">
                            {hasError
                                ? 'Không thể đồng bộ số liệu tổng quan từ backend ở thời điểm hiện tại.'
                                : 'Chưa có số liệu tổng quan để hiển thị.'}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};
