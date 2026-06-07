import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

import { Button } from '@/components/common/button';
import { Spinner } from '@/components/common/spinner';
import { cn } from '@/lib/utils';

export interface Column<T> {
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
    sortKey?: string;
}

export interface PaginationState {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    isLoading?: boolean;
    emptyMessage?: string;
    pagination?: PaginationState;
    sortKey?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    className?: string;
}

function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading,
    emptyMessage = 'Không có dữ liệu phù hợp',
    pagination,
    sortKey,
    sortOrder,
    onSort,
    className,
}: DataTableProps<T>) {
    return (
        <div
            className={cn(
                'overflow-hidden border border-border bg-white',
                className,
            )}
        >
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-[16px] leading-[1.7] text-primary">
                    <thead>
                        <tr className="border-b border-primary bg-muted text-left text-[12px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3.5 align-middle first:pl-5 last:pr-5',
                                        col.sortable &&
                                            'cursor-pointer select-none hover:text-primary',
                                        col.headerClassName,
                                    )}
                                    onClick={() => {
                                        if (col.sortable && onSort) {
                                            onSort(col.sortKey ?? col.key);
                                        }
                                    }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {col.header}
                                        {col.sortable &&
                                        sortKey === (col.sortKey ?? col.key) ? (
                                            <span className="text-primary">
                                                {sortOrder === 'asc'
                                                    ? '↑'
                                                    : '↓'}
                                            </span>
                                        ) : null}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-16 text-center text-[16px] text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center gap-3">
                                        <Spinner size="md" />
                                        <span>Đang tải bảng dữ liệu...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-16 text-center text-[16px] text-muted-foreground"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIndex) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className={cn(
                                        'align-top transition-colors hover:bg-muted',
                                        rowIndex % 2 === 1 && 'bg-[#FCFCFC]',
                                    )}
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-4 py-4 first:pl-5 last:pr-5',
                                                col.className,
                                            )}
                                        >
                                            {col.render(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {pagination && pagination.totalPages > 1 ? (
                <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[14px] leading-[1.5] text-muted-foreground">
                        Trang {pagination.page} / {pagination.totalPages}. Tổng
                        cộng{' '}
                        <span className="font-semibold text-primary">
                            {pagination.total.toLocaleString('vi-VN')}
                        </span>{' '}
                        bản ghi.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page <= 1}
                            onClick={() =>
                                pagination.onPageChange(pagination.page - 1)
                            }
                        >
                            <ChevronLeftIcon className="size-4" />
                            Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() =>
                                pagination.onPageChange(pagination.page + 1)
                            }
                        >
                            Sau
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export { DataTable };
