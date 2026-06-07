import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export const editorialSelectClassName =
    'broadsheet-select text-left disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:opacity-50';

export const editorialInsetNoteClassName =
    'broadsheet-note border-l-2 border-l-[#0A0A0A]';

type ManagementHeaderProps = {
    badge?: string;
    title: string;
    description: string;
    icon: LucideIcon;
    actions?: React.ReactNode;
};

export const ManagementHeader = ({
    badge,
    title,
    description,
    icon: Icon,
    actions,
}: ManagementHeaderProps) => {
    return (
        <section className="border-y border-y-[#0A0A0A] bg-white">
            <div className="grid gap-6 px-6 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div className="grid gap-4">
                    {badge ? (
                        <p className="broadsheet-kicker">{badge}</p>
                    ) : null}
                    <div className="grid gap-4 lg:grid-cols-[72px_minmax(0,1fr)] lg:items-start">
                        <div className="flex h-[72px] w-[72px] items-center justify-center border border-primary bg-muted text-primary">
                            <Icon className="h-7 w-7" />
                        </div>
                        <div className="grid gap-3">
                            <h2 className="font-heading text-[36px] leading-[1.2] font-bold text-primary">
                                {title}
                            </h2>
                            <p className="max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
                {actions ? (
                    <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                        {actions}
                    </div>
                ) : null}
            </div>
        </section>
    );
};

type ManagementStatCardProps = {
    label: string;
    value: string;
    note?: string;
    icon: LucideIcon;
    tone?: 'default' | 'success' | 'warning' | 'danger';
};

const toneClassMap: Record<
    NonNullable<ManagementStatCardProps['tone']>,
    string
> = {
    default: 'border-t-[#0A0A0A]',
    success: 'border-t-[#16A34A]',
    warning: 'border-t-[#D97706]',
    danger: 'border-t-[#DC2626]',
};

export const ManagementStatCard = ({
    label,
    value,
    note,
    icon: Icon,
    tone = 'default',
}: ManagementStatCardProps) => {
    return (
        <section
            className={cn(
                'border border-border border-t-2 bg-white p-4',
                toneClassMap[tone],
            )}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="grid gap-2">
                    <p className="broadsheet-kicker text-muted-foreground">{label}</p>
                    <p className="font-heading text-[28px] leading-[1.25] font-bold text-primary">
                        {value}
                    </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center border border-border bg-muted text-muted-foreground">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            {note ? (
                <p className="mt-3 text-[14px] leading-[1.5] text-muted-foreground">
                    {note}
                </p>
            ) : null}
        </section>
    );
};

export const ManagementGrid = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
                className,
            )}
        >
            {children}
        </div>
    );
};

export const ManagementPanel = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <section
            className={cn(
                'border border-border bg-white p-5 sm:p-6',
                className,
            )}
        >
            {children}
        </section>
    );
};

export const ManagementPanelHeader = ({
    title,
    description,
    actions,
}: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
}) => {
    return (
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <h3 className="font-heading text-[28px] leading-[1.25] font-bold text-primary">
                    {title}
                </h3>
                {description ? (
                    <p className="mt-2 max-w-2xl text-[16px] leading-[1.7] text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {actions ? (
                <div className="flex flex-wrap gap-2">{actions}</div>
            ) : null}
        </div>
    );
};

export const FilterToolbar = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <section
            className={cn(
                'border-y border-y-[#E5E7EB] bg-muted px-5 py-5',
                className,
            )}
        >
            <div className="grid gap-4">{children}</div>
        </section>
    );
};

export const FilterField = ({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) => {
    return (
        <label className="grid gap-1.5 text-left">
            <span className="broadsheet-kicker">{label}</span>
            {children}
            {hint ? (
                <span className="text-[10px] leading-3 text-muted-foreground">
                    {hint}
                </span>
            ) : null}
        </label>
    );
};
