import { cn } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';

const spinnerVariants = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
};

function Spinner({
    className,
    size = 'md',
    ...props
}: React.ComponentProps<'svg'> & { size?: keyof typeof spinnerVariants }) {
    return (
        <Loader2Icon
            role="status"
            aria-label="Loading"
            className={cn('animate-spin', spinnerVariants[size], className)}
            {...props}
        />
    );
}

export { Spinner };
