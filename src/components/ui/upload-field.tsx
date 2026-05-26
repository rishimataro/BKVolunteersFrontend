import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    UploadIcon,
    XIcon,
    FileTextIcon,
    CheckCircleIcon,
    AlertCircleIcon,
} from 'lucide-react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadedFile {
    file: File;
    status: UploadStatus;
    error?: string;
}

export interface UploadFieldProps {
    onUpload: (files: File[]) => void | Promise<void>;
    accept?: string;
    maxSize?: number;
    multiple?: boolean;
    label?: string;
    hint?: string;
    className?: string;
    disabled?: boolean;
}

function UploadField({
    onUpload,
    accept,
    maxSize = 10,
    multiple = false,
    label = 'Tải lên tệp tin',
    hint,
    className,
    disabled,
}: UploadFieldProps) {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
        if (maxSize && file.size > maxSize * 1024 * 1024) {
            return `Kích thước tệp vượt quá ${maxSize}MB`;
        }
        return null;
    };

    const addFiles = (newFiles: FileList | File[]) => {
        const fileList = Array.from(newFiles);
        const uploaded = fileList.map((file) => {
            const error = validateFile(file);
            return {
                file,
                status: error
                    ? ('error' as UploadStatus)
                    : ('uploading' as UploadStatus),
                error: error ?? undefined,
            };
        });

        setFiles((prev) => (multiple ? [...prev, ...uploaded] : uploaded));

        const valid = uploaded
            .filter((f) => f.status !== 'error')
            .map((f) => f.file);
        if (valid.length > 0) {
            Promise.resolve(onUpload(valid))
                .then(() => {
                    setFiles((prev) =>
                        prev.map((f) =>
                            valid.includes(f.file)
                                ? { ...f, status: 'success' as UploadStatus }
                                : f,
                        ),
                    );
                })
                .catch(() => {
                    setFiles((prev) =>
                        prev.map((f) =>
                            valid.includes(f.file)
                                ? {
                                      ...f,
                                      status: 'error' as UploadStatus,
                                      error: 'Tải lên thất bại',
                                  }
                                : f,
                        ),
                    );
                });
        }
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (disabled) return;
        addFiles(e.dataTransfer.files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
            e.target.value = '';
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    return (
        <div className={cn('space-y-2', className)}>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled) setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
                    isDragOver
                        ? 'border-bk-blue bg-bk-blue/5'
                        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50',
                    disabled && 'cursor-not-allowed opacity-50',
                )}
            >
                <UploadIcon className="size-8 text-slate-400" />
                <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">
                        {label}
                    </p>
                    {hint && (
                        <p className="mt-1 text-xs text-slate-500">{hint}</p>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleChange}
                    className="hidden"
                    disabled={disabled}
                />
            </div>

            {files.length > 0 && (
                <ul className="space-y-2">
                    {files.map((f, index) => (
                        <li
                            key={`${f.file.name}-${index}`}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                                f.status === 'error'
                                    ? 'border-red-200 bg-red-50'
                                    : f.status === 'success'
                                      ? 'border-emerald-200 bg-emerald-50'
                                      : 'border-slate-200 bg-white',
                            )}
                        >
                            <FileTextIcon className="size-4 shrink-0 text-slate-500" />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-slate-900">
                                    {f.file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {formatSize(f.file.size)}
                                </p>
                                {f.error && (
                                    <p className="text-xs text-red-500">
                                        {f.error}
                                    </p>
                                )}
                            </div>
                            {f.status === 'success' && (
                                <CheckCircleIcon className="size-4 shrink-0 text-emerald-500" />
                            )}
                            {f.status === 'error' && (
                                <AlertCircleIcon className="size-4 shrink-0 text-red-500" />
                            )}
                            {f.status === 'uploading' && (
                                <div className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-bk-blue" />
                            )}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600"
                            >
                                <XIcon className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export { UploadField };
