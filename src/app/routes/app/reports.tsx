import { useEffect, useState } from 'react';
import {
    BarChart3,
    Users,
    Building2,
    Banknote,
    TrendingUp,
} from 'lucide-react';

import { ContentLayout } from '@/components/layouts';
import type { SchoolOverview } from '@/features/reports/api/reports';
import { getSchoolOverview } from '@/features/reports/api/reports';

const statCards = [
    {
        key: 'total_campaigns' as const,
        label: 'Tổng chiến dịch',
        icon: BarChart3,
        color: 'text-blue-600 bg-blue-50',
        format: (v: number) => v.toLocaleString('vi-VN'),
    },
    {
        key: 'total_students' as const,
        label: 'Tổng sinh viên',
        icon: Users,
        color: 'text-emerald-600 bg-emerald-50',
        format: (v: number) => v.toLocaleString('vi-VN'),
    },
    {
        key: 'total_organizations' as const,
        label: 'Tổng CLB/Đội',
        icon: Building2,
        color: 'text-violet-600 bg-violet-50',
        format: (v: number) => v.toLocaleString('vi-VN'),
    },
    {
        key: 'total_money_donations' as const,
        label: 'Tổng quyên góp',
        icon: Banknote,
        color: 'text-amber-600 bg-amber-50',
        format: (v: number) => `${v.toLocaleString('vi-VN')} ₫`,
    },
];

export const ReportsRoute = () => {
    const [overview, setOverview] = useState<SchoolOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await getSchoolOverview();
                setOverview(data);
            } catch (err) {
                console.error('Failed to load overview', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    return (
        <ContentLayout title="Báo cáo">
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <TrendingUp className="h-7 w-7 text-[#2E5077]" />
                    <div>
                        <h2 className="text-xl font-bold text-[#2E5077]">
                            Tổng quan trường
                        </h2>
                        <p className="mt-0.5 text-sm text-slate-400">
                            Thống kê tổng hợp từ tất cả chiến dịch
                        </p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {isLoading
                        ? statCards.map((card) => (
                              <div
                                  key={card.key}
                                  className="h-28 animate-pulse rounded-xl bg-slate-100"
                              />
                          ))
                        : statCards.map((card) => {
                              const value = overview ? overview[card.key] : 0;
                              const Icon = card.icon;
                              return (
                                  <div
                                      key={card.key}
                                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                                  >
                                      <div className="flex items-center justify-between">
                                          <span className="text-sm text-slate-400">
                                              {card.label}
                                          </span>
                                          <span
                                              className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.color}`}
                                          >
                                              <Icon className="h-5 w-5" />
                                          </span>
                                      </div>
                                      <p className="mt-2 text-2xl font-bold text-slate-800">
                                          {card.format(value)}
                                      </p>
                                  </div>
                              );
                          })}
                </div>

                {/* Placeholder for future per-campaign table */}
                {!isLoading && (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                        <BarChart3 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                        <p>
                            Báo cáo chi tiết theo chiến dịch sẽ được phát triển
                            trong giai đoạn tiếp theo.
                        </p>
                        <p className="mt-1">
                            Vào chiến dịch {'>'} Chi tiết để xem báo cáo từng
                            chiến dịch.
                        </p>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};
