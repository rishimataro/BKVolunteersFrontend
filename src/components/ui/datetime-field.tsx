type DateTimeFieldProps = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    dateTestId?: string;
    timeTestId?: string;
};

type PickerInput = HTMLInputElement & {
    showPicker?: () => void;
};

const splitDateTimeLocal = (value: string) => {
    if (!value) return { date: '', time: '' };
    const [date, time] = value.split('T');
    return { date: date ?? '', time: (time ?? '').slice(0, 5) };
};

export const DateTimeField = ({
    value,
    onChange,
    className,
    dateTestId,
    timeTestId,
}: DateTimeFieldProps) => {
    const { date, time } = splitDateTimeLocal(value);
    const dateRef = React.useRef<PickerInput | null>(null);
    const timeRef = React.useRef<PickerInput | null>(null);

    const openPicker = (input: PickerInput | null) => {
        if (!input) return;
        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }
        input.focus();
        input.click();
    };

    const update = (nextDate: string, nextTime: string) => {
        if (!nextDate && !nextTime) {
            onChange('');
            return;
        }
        if (!nextDate) {
            onChange('');
            return;
        }
        onChange(`${nextDate}T${nextTime || '00:00'}`);
    };

    return (
        <div className={className ?? 'grid grid-cols-2 gap-2'}>
            <div className="flex gap-1">
                <input
                    ref={(node) => {
                        if (dateRef) dateRef.current = node;
                    }}
                    type="date"
                    value={date}
                    data-testid={dateTestId}
                    onChange={(event) => update(event.target.value, time)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
                <button
                    type="button"
                    onClick={() => openPicker(dateRef.current)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                    aria-label="Mở lịch"
                >
                    📅
                </button>
            </div>
            <div className="flex gap-1">
                <input
                    ref={(node) => {
                        if (timeRef) timeRef.current = node;
                    }}
                    type="time"
                    step={60}
                    value={time}
                    data-testid={timeTestId}
                    onChange={(event) => update(date, event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
                <button
                    type="button"
                    onClick={() => openPicker(timeRef.current)}
                    className="h-10 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700"
                    aria-label="Mở chọn giờ"
                >
                    🕒
                </button>
            </div>
        </div>
    );
};
import * as React from 'react';
