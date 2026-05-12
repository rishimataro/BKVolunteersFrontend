import { type VariantProps, cva } from 'class-variance-authority';

export const badgeVariants = cva(
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-bk-blue/10 text-bk-blue',
                secondary: 'bg-slate-100 text-slate-600',
                outline: 'border border-slate-200 text-slate-600',
                destructive: 'bg-red-50 text-red-600',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof badgeVariants>;
