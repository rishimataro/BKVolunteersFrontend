import { BadgeCheck, MoveRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { PublicHomeData } from '@/types/api';

type LandingInsightsSectionProps = {
    data: PublicHomeData | null;
    isLoading: boolean;
    hasError: boolean;
    onLogin: () => void;
};

const formatCompactNumber = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: value >= 1000 ? 1 : 0,
        notation: value >= 1000 ? 'compact' : 'standard',
    }).format(value);

export const LandingInsightsSection = ({
    data,
    isLoading,
    hasError,
    onLogin,
}: LandingInsightsSectionProps) => {
    const leaderboard = data?.organization_leaderboard ?? [];
    const spotlightOrganizations = data?.spotlight_organizations ?? [];

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
                            <div className="border-b border-[#E1E3E4] bg-[#F8F9FA] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                Xếp hạng theo giờ công đã xác nhận
                            </div>

                            {isLoading ? (
                                <div className="space-y-3 p-4">
                                    {Array.from({ length: 4 }, (_, index) => (
                                        <div
                                            key={index}
                                            className="h-16 animate-pulse border border-[#E1E3E4] bg-[#F8F9FA]"
                                        />
                                    ))}
                                </div>
                            ) : leaderboard.length > 0 ? (
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
                                                    Chiến dịch
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leaderboard.map((entry) => (
                                                <tr
                                                    key={entry.organization_id}
                                                    className="border-b border-[#E1E3E4] transition-colors hover:bg-[#F1F5F9] last:border-b-0"
                                                >
                                                    <td className="px-4 py-4 text-[24px] font-semibold leading-8 text-[#002A58]/40">
                                                        {String(
                                                            entry.rank,
                                                        ).padStart(2, '0')}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="inline-flex size-10 items-center justify-center bg-[#D6E3FF] text-[12px] font-bold uppercase tracking-[0.08em] text-[#0E4686]">
                                                                {entry.organization_code.slice(
                                                                    0,
                                                                    3,
                                                                )}
                                                            </span>
                                                            <span className="text-[16px] font-semibold leading-6 text-[#191C1D]">
                                                                {
                                                                    entry.organization_name
                                                                }
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-[16px] font-semibold text-[#191C1D]">
                                                        {formatCompactNumber(
                                                            entry.completed_event_hours,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right text-[14px] font-semibold text-[#006D37]">
                                                        {entry.campaign_count}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="px-6 py-8 text-[15px] leading-7 text-[#424750]">
                                    {hasError
                                        ? 'Không thể tải bảng theo dõi đơn vị từ backend.'
                                        : 'Chưa có dữ liệu giờ công để xếp hạng đơn vị.'}
                                </div>
                            )}
                        </div>
                    </div>

                    <aside className="space-y-4 lg:col-span-5">
                        <div className="border border-[#C3C6D2] bg-[#002A58] p-6 text-white">
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#D6E3FF]">
                                Sidebar điều phối
                            </p>
                            <h3 className="text-[32px] font-semibold leading-10 text-white">
                                Khởi tạo chiến dịch mới mà không phá vỡ luồng quản trị hiện tại
                            </h3>
                            <p className="mt-4 text-[16px] leading-6 text-[#F0F1F2]">
                                Trang chủ chỉ hiển thị số liệu công khai. Các thao
                                tác tạo chiến dịch, duyệt và quản trị vẫn đi qua
                                đăng nhập và phân quyền thật từ backend.
                            </p>

                            <ul className="mt-6 space-y-3 border-t border-white/20 pt-5">
                                <li className="flex items-start gap-3">
                                    <BadgeCheck
                                        className="mt-1 size-4 text-[#6BFE9C]"
                                        strokeWidth={1.5}
                                    />
                                    <span className="text-[15px] leading-6 text-white">
                                        Theo dõi ca trực, giờ công và trạng thái
                                        chiến dịch trên cùng một hệ thống.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <BadgeCheck
                                        className="mt-1 size-4 text-[#6BFE9C]"
                                        strokeWidth={1.5}
                                    />
                                    <span className="text-[15px] leading-6 text-white">
                                        Đồng bộ gây quỹ, hiện vật, chứng nhận và
                                        báo cáo từ dữ liệu thật của backend.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <BadgeCheck
                                        className="mt-1 size-4 text-[#6BFE9C]"
                                        strokeWidth={1.5}
                                    />
                                    <span className="text-[15px] leading-6 text-white">
                                        Giữ lịch sử minh bạch để nhà trường và đơn
                                        vị tổ chức tra soát nhanh.
                                    </span>
                                </li>
                            </ul>

                            <Button
                                size="lg"
                                className="mt-6 w-full rounded-none border border-white bg-white normal-case tracking-normal text-[#002A58] hover:bg-[#F3F4F5]"
                                onClick={onLogin}
                            >
                                Đăng nhập để khởi tạo chiến dịch
                                <MoveRight
                                    className="size-4"
                                    strokeWidth={1.5}
                                />
                            </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="border border-[#C3C6D2] bg-white p-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                    Chứng nhận đã cấp
                                </p>
                                <p className="mt-3 text-[32px] font-semibold leading-10 text-[#002A58]">
                                    {isLoading
                                        ? '...'
                                        : formatCompactNumber(
                                              data?.metrics
                                                  .total_certificates ?? 0,
                                          )}
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Dữ liệu phát hành chứng nhận lấy từ backend.
                                </p>
                            </div>
                            <div className="border border-[#C3C6D2] bg-white p-5">
                                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                    Chiến dịch đã ghi nhận
                                </p>
                                <p className="mt-3 text-[32px] font-semibold leading-10 text-[#002A58]">
                                    {isLoading
                                        ? '...'
                                        : formatCompactNumber(
                                              data?.metrics.total_campaigns ??
                                                  0,
                                          )}
                                </p>
                                <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                    Số chiến dịch tổng hợp từ cơ sở dữ liệu hiện tại.
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
                        Đơn vị đang hoạt động nổi bật
                    </p>
                    {isLoading ? (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {Array.from({ length: 5 }, (_, index) => (
                                <div
                                    key={index}
                                    className="h-24 animate-pulse border border-[#E1E3E4] bg-[#F8F9FA]"
                                />
                            ))}
                        </div>
                    ) : spotlightOrganizations.length > 0 ? (
                        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                            {spotlightOrganizations.map((organization) => (
                                <div
                                    key={organization.id}
                                    className="border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-5"
                                >
                                    <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                                        {organization.code}
                                    </p>
                                    <p className="mt-2 text-[16px] font-semibold leading-6 text-[#191C1D]">
                                        {organization.name}
                                    </p>
                                    <p className="mt-2 text-[14px] leading-5 text-[#424750]">
                                        {formatCompactNumber(
                                            organization.completed_event_hours,
                                        )}{' '}
                                        giờ công · {organization.campaign_count}{' '}
                                        chiến dịch
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-6 border border-[#E1E3E4] bg-[#F8F9FA] px-4 py-5 text-center text-[14px] text-[#424750]">
                            {hasError
                                ? 'Không thể tải danh sách đơn vị nổi bật từ backend.'
                                : 'Chưa có đơn vị nào đủ dữ liệu để hiển thị.'}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};
