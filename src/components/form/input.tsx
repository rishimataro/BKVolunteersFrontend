import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <div className="w-full">
                <input
                    type={type}
                    className={cn(
                        'broadsheet-input flex w-full file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                        error &&
                            'border-2 border-destructive bg-[#FEF2F2] text-[#991B1B] focus-visible:border-destructive',
                        className,
                    )}
                    ref={ref}
                    {...props}
                />
                {error ? (
                    <p className="mt-1 text-[10px] leading-3 text-destructive">
                        {error}
                    </p>
                ) : null}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
