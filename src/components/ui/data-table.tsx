import * as React from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';
import { Button } from './button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

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
    emptyMessage = 'Không có dữ liệu',
    pagination,
    sortKey,
    sortOrder,
    onSort,
    className,
}: DataTableProps<T>) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-slate-200 bg-white',
                className,
            )}
        >
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(
                                        'px-4 py-3',
                                        col.sortable &&
                                            'cursor-pointer select-none hover:text-slate-700',
                                        col.headerClassName,
                                    )}
                                    onClick={() => {
                                        if (col.sortable && onSort) {
                                            onSort(col.sortKey ?? col.key);
                                        }
                                    }}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.header}
                                        {col.sortable &&
                                            sortKey ===
                                                (col.sortKey ?? col.key) && (
                                                <span>
                                                    {sortOrder === 'asc'
                                                        ? '↑'
                                                        : '↓'}
                                                </span>
                                            )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-sm text-slate-500"
                                >
                                    <Spinner size="md" />
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="px-4 py-12 text-center text-sm text-slate-500"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    className="hover:bg-slate-50"
                                >
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={cn(
                                                'px-4 py-3',
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
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-500">
                        Trang {pagination.page} / {pagination.totalPages} (Tổng:{' '}
                        {pagination.total})
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
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() =>
                                pagination.onPageChange(pagination.page + 1)
                            }
                        >
                            <ChevronRightIcon className="size-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export { DataTable };
