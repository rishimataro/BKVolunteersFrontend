import * as React from 'react';

type CountdownStatus = 'before_start' | 'running' | 'ended' | 'ended_early';

export type CountdownState = {
    status: CountdownStatus;
    label: string;
    remainingMs: number;
    isUrgent: boolean;
    targetAt: string | null;
};

const SECOND_MS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toTime = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
};

export const getCountdownState = (input: {
    now: number;
    startAt?: string | null;
    endAt?: string | null;
    endedAt?: string | null;
}) : CountdownState => {
    const startTime = toTime(input.startAt);
    const endTime = toTime(input.endAt);
    const endedTime = toTime(input.endedAt);

    if (endedTime && endedTime <= input.now) {
        return {
            status: 'ended_early',
            label: 'Đã kết thúc sớm',
            remainingMs: 0,
            isUrgent: false,
            targetAt: input.endedAt ?? null,
        };
    }

    if (startTime && input.now < startTime) {
        const remainingMs = Math.max(0, startTime - input.now);
        return {
            status: 'before_start',
            label: 'Còn lại đến khi bắt đầu',
            remainingMs,
            isUrgent: remainingMs <= DAY_MS,
            targetAt: input.startAt ?? null,
        };
    }

    if (endTime && input.now < endTime) {
        const remainingMs = Math.max(0, endTime - input.now);
        return {
            status: 'running',
            label: 'Còn lại đến khi kết thúc',
            remainingMs,
            isUrgent: remainingMs <= DAY_MS,
            targetAt: input.endAt ?? null,
        };
    }

    return {
        status: 'ended',
        label: 'Đã kết thúc',
        remainingMs: 0,
        isUrgent: false,
        targetAt: input.endAt ?? null,
    };
};

export const formatCountdown = (remainingMs: number) => {
    const safeMs = Math.max(0, remainingMs);
    const totalSeconds = Math.floor(safeMs / SECOND_MS);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (value: number) => String(value).padStart(2, '0');

    return `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

export const useCountdownTicker = () => {
    const [now, setNow] = React.useState(() => Date.now());

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setNow(Date.now());
        }, SECOND_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, []);

    return now;
};
