import { type VariantProps, cva } from 'class-variance-authority';

export const badgeVariants = cva(
    'inline-flex items-center border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
    {
        variants: {
            variant: {
                default: 'border-[#0A0A0A] bg-[#0A0A0A] text-white',
                secondary: 'border-[#E5E7EB] bg-[#F3F4F6] text-[#4B5563]',
                outline: 'border-[#0A0A0A] bg-white text-[#0A0A0A]',
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
