import { type VariantProps, cva } from 'class-variance-authority';

export const badgeVariants = cva(
    'inline-flex items-center border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
    {
        variants: {
            variant: {
                default: 'border-primary bg-primary text-white',
                secondary: 'border-border bg-[#F3F4F6] text-muted-foreground',
                outline: 'border-primary bg-white text-primary',
                destructive: 'border-[#FEE2E2] bg-[#FEE2E2] text-[#991B1B]',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
    VariantProps<typeof badgeVariants>;
