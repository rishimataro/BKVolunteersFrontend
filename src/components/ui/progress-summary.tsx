import { cn } from '@/lib/utils';

const progressSizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
} as const;

export interface ProgressSummaryProps {
    current: number;
    target: number;
    label?: string;
    showPercent?: boolean;
    size?: keyof typeof progressSizes;
    barClassName?: string;
    className?: string;
}

function ProgressSummary({
    current,
    target,
    label,
    showPercent = true,
    size = 'md',
    barClassName,
    className,
}: ProgressSummaryProps) {
    const percent =
        target > 0 ? Math.min(Math.round((current / target) * 100), 100) : 0;

    return (
        <div className={cn('space-y-1.5', className)}>
            {(label || showPercent) && (
                <div className="flex items-center justify-between text-xs text-slate-600">
                    {label && <span>{label}</span>}
                    {showPercent && <span>{percent}%</span>}
                </div>
            )}
            <div
                className={cn(
                    'w-full overflow-hidden rounded-full bg-slate-100',
                    progressSizes[size],
                )}
            >
                <div
                    className={cn(
                        'rounded-full bg-bk-blue transition-all duration-300',
                        progressSizes[size],
                        barClassName,
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-xs text-slate-500">
                {current.toLocaleString('vi-VN')} /{' '}
                {target.toLocaleString('vi-VN')}
            </p>
        </div>
    );
}

export { ProgressSummary };
