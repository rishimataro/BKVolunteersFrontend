import * as React from 'react';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

function Dialog({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
    return (
        <DialogPrimitive.Root
            data-slot="dialog"
            disablePointerDismissal={false}
            {...props}
        />
    );
}

function DialogPortal({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogBackdrop({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="dialog-backdrop"
            className={cn(
                'fixed inset-0 z-[80] bg-[#0B1324]/55 backdrop-blur-[3px]',
                className,
            )}
            {...props}
        />
    );
}

function DialogContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Popup
                data-slot="dialog-content"
                className={cn(
                    'fixed left-1/2 top-1/2 z-[81] flex max-h-[calc(100vh-2rem)] w-[calc(100vw-1.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/5 sm:w-[calc(100vw-3rem)]',
                    className,
                )}
                {...props}
            >
                <DialogPrimitive.Close
                    data-slot="dialog-close"
                    aria-label="Đóng hộp thoại"
                    className="absolute right-5 top-5 z-[82] inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E4686]/30"
                >
                    <X className="size-4" strokeWidth={1.75} />
                </DialogPrimitive.Close>
                {children}
            </DialogPrimitive.Popup>
        </DialogPortal>
    );
}

function DialogClose({
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogTitle({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn(
                'pr-12 text-[1.375rem] font-semibold leading-8 tracking-tight text-slate-950',
                className,
            )}
            {...props}
        />
    );
}

function DialogDescription({
    className,
    ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn('mt-1 text-sm leading-6 text-slate-600', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogBackdrop,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogPortal,
    DialogTitle,
};
