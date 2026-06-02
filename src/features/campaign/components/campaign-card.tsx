import { Link } from 'react-router';
import { CalendarDays, Layers3 } from 'lucide-react';

import { paths } from '@/config/paths';
import type { PublicCampaignCard } from '@/types/api';
import { toDisplayText, toDisplayTitle } from '@/utils/display-text';
import { StatusBadge } from './status-badge';

const moduleLabel: Record<string, string> = {
    fundraising: 'Gây quỹ',
    item_donation: 'Hiện vật',
    event: 'Tình nguyện',
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(new Date(value));

type CampaignCardProps = {
    campaign: PublicCampaignCard;
    detailHref?: string;
};

export const CampaignCard = ({ campaign, detailHref }: CampaignCardProps) => {
    return (
        <Link
            to={detailHref ?? paths.campaigns.detail.getHref(campaign.slug)}
            className="group block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-bk-blue/35 hover:shadow-md"
        >
            <div className="aspect-[16/9] bg-slate-100">
                {campaign.cover_image_url ? (
                    <img
                        src={campaign.cover_image_url}
                        alt={toDisplayTitle(campaign.title)}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-sm font-semibold text-slate-600">
                        BK Volunteers
                    </div>
                )}
            </div>
            <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-sm font-semibold text-bk-blue">
                            {toDisplayTitle(campaign.organization.name)}
                        </p>
                        <h2 className="mt-1 line-clamp-2 break-words text-lg font-semibold text-slate-900 group-hover:text-bk-blue">
                            {toDisplayTitle(campaign.title)}
                        </h2>
                    </div>
                    <div className="shrink-0">
                        <StatusBadge status={campaign.status} />
                    </div>
                </div>

                <p className="line-clamp-3 min-h-16 break-words text-sm leading-6 text-slate-600">
                    {toDisplayText(campaign.summary)}
                </p>

                <div>
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
                        <span>Tiến độ</span>
                        <span>{campaign.progress.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                        <div
                            className="h-2 rounded-full bg-bk-blue"
                            style={{ width: `${campaign.progress.percent}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {campaign.module_types.map((type) => (
                        <span
                            key={type}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                        >
                            <Layers3 className="size-3" />
                            {moduleLabel[type] ?? type}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
                    <CalendarDays className="size-4" />
                    {formatDate(campaign.start_at)} -{' '}
                    {formatDate(campaign.end_at)}
                </div>
            </div>
        </Link>
    );
};
