import { cn } from '@/lib/utils';
import { badgeVariants } from './badge-variants';
import type { BadgeProps } from './badge-variants';

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge };
