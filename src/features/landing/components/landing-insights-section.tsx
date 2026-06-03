import { BadgeCheck, MoveRight } from 'lucide-react';
import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
    leaderboardFilters,
    leaderboardEntries,
    partnerLogos,
    supportPoints,
} from '../data/home-content';

type LandingInsightsSectionProps = {
    onLogin: () => void;
};

const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
    onLogin: LandingInsightsSectionProps['onLogin'],
) => {
    event.preventDefault();
    onLogin();
};

export const LandingInsightsSection = ({
    onLogin,
}: LandingInsightsSectionProps) => {
    const codeToneClasses: Record<
        (typeof leaderboardEntries)[number]['codeTone'],
        string
    > = {
        primary: 'bg-[#D6E3FF] text-[#0E4686]',
        secondary: 'bg-[#D8FFE3] text-[#005228]',
        tertiary: 'bg-[#FFDBCB] text-[#773305]',
        neutral: 'bg-[#E7E8E9] text-[#424750]',
    };

    return (
        <>
            <section
                id="tac-dong"
                className="border-b border-[#C3C6D2] bg-[#F3F4F5] py-16"
            >
                <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
                    <div className="lg:col-span-7">
                        <div className="mb-6 border-b border-[#E1E3E4] pb-4">
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                Bảng theo dõi đơn vị
                            </p>
                            <h2 className="text-[32px] font-semibold leading-10 text-[#191C1D]">
                                Đơn vị đang tạo tác động
                            </h2>
                        </div>

                        <div className="overflow-hidden border border-[#C3C6D2] bg-white">
                            <div className="flex flex-wrap gap-3 border-b border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3">
                                {leaderboardFilters.map((filter, index) => (
                                    <button
                                        key={filter}
                                        type="button"
                                        className={`px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] ${
                                            index === 0
                                                ? 'bg-[#002A58] text-white'
                                                : 'border border-[#C3C6D2] bg-white text-[#424750]'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-[420px] overflow-auto">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 border-b border-[#C3C6D2] bg-[#EDEEEF]">
                                        <tr>
                                            <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                Hạng
                                            </th>
                                            <th className="px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                Đơn vị
                                            </th>
                                            <th className="px-4 py-3 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                Giờ công
                                            </th>
                                            <th className="px-4 py-3 text-right text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                                Tăng trưởng
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboardEntries.map((entry) => (
                                            <tr
                                                key={entry.rank}
                                                className="border-b border-[#E1E3E4] transition-colors hover:bg-[#F1F5F9] last:border-b-0"
                                            >
                                                <td className="px-4 py-4 text-[24px] font-semibold leading-8 text-[#002A58]/40">
                                                    {entry.rank}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex size-10 items-center justify-center text-[12px] font-bold uppercase tracking-[0.08em] ${codeToneClasses[entry.codeTone]}`}
                                                        >
                                                            {entry.code}
                                                        </span>
                                                        <span className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                            {entry.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right text-[16px] font-semibold text-[#191C1D]">
                                                    {entry.hours}
                                                </td>
                                                <td className="px-4 py-4 text-right text-[14px] font-semibold text-[#006D37]">
                                                    {entry.change}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4 lg:col-span-5">
                        <div className="border border-[#C3C6D2] bg-[#002A58] p-6 text-white">
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]">
                                Sidebar điều phối
                            </p>
                            <h3 className="text-[32px] font-semibold leading-10 text-white">
                                Khởi tạo chiến dịch mới mà không vỡ luồng quản
                                trị hiện tại
                            </h3>
                            <p className="mt-4 text-[16px] leading-6 text-[#F0F1F2]">
                                Phần giao diện này giữ đúng logic hiện tại:
                                người dùng vẫn đi qua màn hình đăng nhập trước
                                khi tạo hoặc quản trị chiến dịch.
                            </p>

                            <ul className="mt-6 space-y-3 border-t border-white/20 pt-5">
                                {supportPoints.map((point) => (
                                    <li
                                        key={point}
                                        className="flex items-start gap-3"
                                    >
                                        <BadgeCheck
                                            className="mt-1 size-4 text-[#6BFE9C]"
                                            strokeWidth={1.5}
                                        />
                                        <span className="text-[15px] leading-6 text-white">
                                            {point}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <form
                                className="mt-6 border-t border-white/20 pt-5"
                                onSubmit={(event) =>
                                    handleSubmit(event, onLogin)
                                }
                            >
                                <label
                                    htmlFor="landing-email"
                                    className="mb-2 block text-[12px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]"
                                >
                                    Email trường hoặc tổ chức
                                </label>
                                <input
                                    id="landing-email"
                                    type="email"
                                    placeholder="nhap@bkvolunteers.vn"
                                    className="w-full border border-[#83AEF5] bg-white px-3 py-3 text-[16px] leading-6 text-[#191C1D] outline-none placeholder:text-[#737781] focus:border-[#A9C7FF] focus:ring-4 focus:ring-[#A9C7FF]/20"
                                />
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="mt-4 w-full rounded-none border border-white bg-white normal-case tracking-normal text-[#002A58] hover:bg-[#F3F4F5]"
                                >
                                    Khởi tạo chiến dịch
                                    <MoveRight
                                        className="size-4"
                                        strokeWidth={1.5}
                                    />
                                </Button>
                            </form>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="border border-[#C3C6D2] bg-white p-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                    Chỉ số vận hành
                                </p>
                                <p className="mt-3 text-[32px] font-semibold leading-10 text-[#002A58]">
                                    5,0/5
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Điểm hài lòng từ cán bộ điều phối.
                                </p>
                            </div>
                            <div className="border border-[#C3C6D2] bg-white p-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                    Dữ liệu xác nhận
                                </p>
                                <p className="mt-3 text-[32px] font-semibold leading-10 text-[#002A58]">
                                    100%
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Báo cáo có thể truy xuất lịch sử.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <section
                id="doi-tac"
                className="border-b border-[#C3C6D2] bg-white py-10"
            >
                <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                        Đơn vị đồng hành chiến lược
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {partnerLogos.map((partner) => (
                            <div
                                key={partner}
                                className="border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-5 text-center text-[14px] font-medium text-[#424750]"
                            >
                                {partner}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};
