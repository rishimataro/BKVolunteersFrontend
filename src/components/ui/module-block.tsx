import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    Layers3Icon,
    GiftIcon,
    CalendarIcon,
    HandHeartIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ModuleType = 'fundraising' | 'item_donation' | 'event';

const moduleConfig: Record<
    ModuleType,
    { label: string; icon: LucideIcon; color: string }
> = {
    fundraising: {
        label: 'Gây quỹ',
        icon: HandHeartIcon,
        color: 'text-bk-blue',
    },
    item_donation: {
        label: 'Hiện vật',
        icon: GiftIcon,
        color: 'text-amber-600',
    },
    event: {
        label: 'Tình nguyện',
        icon: CalendarIcon,
        color: 'text-emerald-600',
    },
};

export interface ModuleBlockData {
    id: string;
    type: ModuleType;
    title: string;
    description?: string | null;
    progress?: {
        current: number;
        target: number;
    } | null;
}

export interface ModuleBlockProps {
    module: ModuleBlockData;
    badge?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

function ModuleBlock({ module, badge, children, className }: ModuleBlockProps) {
    const config = moduleConfig[module.type];
    const Icon = config?.icon ?? Layers3Icon;

    const percent =
        module.progress && module.progress.target > 0
            ? Math.min(
                  Math.round(
                      (module.progress.current / module.progress.target) * 100,
                  ),
                  100,
              )
            : 0;

    return (
        <div
            className={cn(
                'rounded-lg border border-slate-200 bg-white p-5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p
                        className={cn(
                            'inline-flex items-center gap-2 text-sm font-semibold',
                            config?.color ?? 'text-bk-blue',
                        )}
                    >
                        <Icon className="size-4" />
                        {config?.label ?? module.type}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                        {module.title}
                    </h3>
                </div>
                {badge}
            </div>

            {module.description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {module.description}
                </p>
            )}

            {module.progress && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>
                            {module.progress.current.toLocaleString('vi-VN')} /{' '}
                            {module.progress.target.toLocaleString('vi-VN')}
                        </span>
                        <span>{percent}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-bk-blue transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}

export { ModuleBlock };
