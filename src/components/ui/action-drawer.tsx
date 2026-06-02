import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ActionDrawerFieldType = 'text' | 'textarea' | 'number';

interface ActionDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    submitLabel: string;
    cancelLabel?: string;
    placeholder?: string;
    fieldType?: ActionDrawerFieldType;
    required?: boolean;
    isSubmitting?: boolean;
    onSubmit: () => void | Promise<void>;
}

export const ActionDrawer = ({
    open,
    onOpenChange,
    title,
    description,
    label,
    value,
    onValueChange,
    submitLabel,
    cancelLabel = 'Hủy',
    placeholder,
    fieldType = 'text',
    required = false,
    isSubmitting = false,
    onSubmit,
}: ActionDrawerProps) => {
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        await onSubmit();
    };

    const sharedFieldClassName =
        'mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg">
                    <DrawerHeader className="text-left">
                        <DrawerTitle>{title}</DrawerTitle>
                        {description ? (
                            <DrawerDescription>{description}</DrawerDescription>
                        ) : null}
                    </DrawerHeader>
                    <div className="px-4 pb-2">
                        <Label className="text-sm font-semibold text-slate-700">
                            {label}
                        </Label>
                        {fieldType === 'textarea' ? (
                            <textarea
                                value={value}
                                onChange={(event) =>
                                    onValueChange(event.target.value)
                                }
                                placeholder={placeholder}
                                required={required}
                                rows={4}
                                className={sharedFieldClassName}
                            />
                        ) : (
                            <Input
                                value={value}
                                onChange={(event) =>
                                    onValueChange(event.target.value)
                                }
                                placeholder={placeholder}
                                required={required}
                                type={fieldType}
                                className="mt-2"
                            />
                        )}
                    </div>
                    <DrawerFooter className="sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {cancelLabel}
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang xử lý...' : submitLabel}
                        </Button>
                    </DrawerFooter>
                </form>
            </DrawerContent>
        </Drawer>
    );
};
