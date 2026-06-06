import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import MapView from '@/features/locations/components/MapView';
import type { LocationItem } from '@/types/api';

interface LocationPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectLocation: (location: LocationItem) => void;
    currentValue?: string;
}

export const LocationPickerDialog: React.FC<LocationPickerDialogProps> = ({
    open,
    onOpenChange,
    onSelectLocation,
    currentValue,
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl">
            <div className="border-b border-[#E1E3E4] px-6 py-5">
                <DialogTitle className="text-[28px] font-semibold leading-9 text-[#002A58]">
                    Chọn địa điểm trên bản đồ
                </DialogTitle>
                <DialogDescription className="mt-2 text-[15px] leading-6 text-[#424750]">
                    Dùng bộ lọc theo loại và chọn marker phù hợp để điền nhanh
                    địa điểm cho hạng mục sự kiện. Trường hiện tại:{' '}
                    <span className="font-semibold text-[#191C1D]">
                        {currentValue?.trim() || 'Chưa chọn'}
                    </span>
                    .
                </DialogDescription>
            </div>

            <div className="overflow-y-auto px-6 py-5">
                <MapView
                    onSelectLocation={(location: LocationItem) => {
                        onSelectLocation(location);
                        onOpenChange(false);
                    }}
                    className="border-0 p-0 shadow-none"
                    heightClassName="h-[300px] md:h-[420px]"
                />
            </div>

            <div className="flex justify-between border-t border-[#E1E3E4] px-6 py-4">
                <p className="max-w-2xl text-[13px] leading-5 text-[#737781]">
                    Khi chọn một địa điểm, hệ thống sẽ điền giá trị dưới dạng{' '}
                    <span className="font-semibold">
                        Tên địa điểm | Địa chỉ
                    </span>{' '}
                    để tiếp tục dùng ở màn hình quản lý và trang công khai.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg border-[#C3C6D2] normal-case tracking-normal"
                    onClick={() => onOpenChange(false)}
                >
                    Hủy
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);
