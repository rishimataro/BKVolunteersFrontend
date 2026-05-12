import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon, ClockIcon, XIcon, AlertCircleIcon } from 'lucide-react';

export interface TimelineStep {
    key: string;
    label: string;
    status: 'pending' | 'current' | 'completed' | 'rejected';
    date?: string | null;
    actor?: string | null;
    note?: string | null;
}

export interface ApprovalTimelineProps {
    steps: TimelineStep[];
    className?: string;
}

const statusConfig = {
    completed: {
        icon: CheckIcon,
        dotClass: 'bg-emerald-500',
        lineClass: 'bg-emerald-300',
        iconClass: 'text-white',
    },
    current: {
        icon: ClockIcon,
        dotClass: 'bg-bk-blue',
        lineClass: 'bg-slate-300',
        iconClass: 'text-white',
    },
    pending: {
        icon: AlertCircleIcon,
        dotClass: 'bg-slate-200',
        lineClass: 'bg-slate-200',
        iconClass: 'text-slate-400',
    },
    rejected: {
        icon: XIcon,
        dotClass: 'bg-red-500',
        lineClass: 'bg-slate-200',
        iconClass: 'text-white',
    },
};

function ApprovalTimeline({ steps, className }: ApprovalTimelineProps) {
    return (
        <div className={cn('space-y-0', className)}>
            {steps.map((step, index) => {
                const config = statusConfig[step.status];
                const Icon = config.icon;
                const isLast = index === steps.length - 1;

                return (
                    <div key={step.key} className="relative flex gap-4 pb-2">
                        <div className="flex flex-col items-center">
                            <div
                                className={cn(
                                    'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full',
                                    config.dotClass,
                                )}
                            >
                                <Icon
                                    className={cn('size-3.5', config.iconClass)}
                                />
                            </div>
                            {!isLast && (
                                <div
                                    className={cn(
                                        'mt-1 w-0.5 grow',
                                        config.lineClass,
                                    )}
                                />
                            )}
                        </div>
                        <div className={cn('pb-4', isLast && 'pb-0')}>
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    step.status === 'pending'
                                        ? 'text-slate-400'
                                        : step.status === 'rejected'
                                          ? 'text-red-600'
                                          : 'text-slate-900',
                                )}
                            >
                                {step.label}
                            </p>
                            {(step.date || step.actor) && (
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {step.actor && <span>{step.actor}</span>}
                                    {step.actor && step.date && (
                                        <span> &middot; </span>
                                    )}
                                    {step.date && (
                                        <span>
                                            {new Date(
                                                step.date,
                                            ).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    )}
                                </p>
                            )}
                            {step.note && (
                                <p className="mt-1 text-sm text-slate-600">
                                    {step.note}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export { ApprovalTimeline };
