import * as React from 'react';
import { useMutation } from '@tanstack/react-query';
import {
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
} from 'lucide-react';

import { Head } from '@/components/seo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotifications } from '@/components/ui/notifications';
import {
    uploadStorageFile,
    type StorageUploadKind,
    type StorageUploadResponse,
} from '@/features/storage/api/storage';

const kindOptions: Array<{
    value: StorageUploadKind;
    label: string;
    hint: string;
}> = [
    {
        value: 'image',
        label: 'Image / Public bucket',
        hint: 'Anh se vao public bucket va backend tra ve public URL.',
    },
    {
        value: 'document',
        label: 'Document / Private bucket',
        hint: 'Tai lieu se vao private bucket va backend tra ve signed URL.',
    },
];

const formatFileSize = (value: number) => {
    if (value >= 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    if (value >= 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${value} B`;
};

const getFileExtension = (fileName: string) =>
    fileName.split('.').pop()?.toLowerCase() ?? '';

const getPreviewMode = (file: File | null) => {
    if (!file) {
        return 'none' as const;
    }

    if (file.type.startsWith('image/')) {
        return 'image' as const;
    }

    if (file.type === 'application/pdf') {
        return 'pdf' as const;
    }

    return 'icon' as const;
};

const getFileVisual = (file: File | null) => {
    if (!file) {
        return {
            Icon: File,
            accentClassName: 'bg-slate-100 text-slate-700',
            label: 'File',
        };
    }

    const extension = getFileExtension(file.name);

    if (file.type.startsWith('image/')) {
        return {
            Icon: FileImage,
            accentClassName: 'bg-emerald-100 text-emerald-700',
            label: 'Image',
        };
    }

    if (
        file.type === 'application/pdf' ||
        ['doc', 'docx'].includes(extension)
    ) {
        return {
            Icon: FileText,
            accentClassName: 'bg-amber-100 text-amber-700',
            label: 'Document',
        };
    }

    if (['xls', 'xlsx', 'csv'].includes(extension)) {
        return {
            Icon: FileSpreadsheet,
            accentClassName: 'bg-cyan-100 text-cyan-700',
            label: 'Spreadsheet',
        };
    }

    return {
        Icon: File,
        accentClassName: 'bg-slate-100 text-slate-700',
        label: 'File',
    };
};

export const StorageTestRoute = () => {
    const { addNotification } = useNotifications();
    const [kind, setKind] = React.useState<StorageUploadKind>('image');
    const [folder, setFolder] = React.useState('manual-test');
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [uploadedFile, setUploadedFile] =
        React.useState<StorageUploadResponse | null>(null);
    const [localPreviewUrl, setLocalPreviewUrl] = React.useState<string | null>(
        null,
    );

    const uploadMutation = useMutation({
        mutationFn: uploadStorageFile,
        onSuccess: (data) => {
            setUploadedFile(data);
            addNotification({
                type: 'success',
                title: 'Upload thanh cong',
                message: `File ${data.originalName} da duoc day len Supabase Storage.`,
            });
        },
        onError: () => {
            setUploadedFile(null);
        },
    });

    React.useEffect(() => {
        return () => {
            if (localPreviewUrl) {
                URL.revokeObjectURL(localPreviewUrl);
            }
        };
    }, [localPreviewUrl]);

    const handleFileSelected = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0] ?? null;

        setSelectedFile(file);
        setUploadedFile(null);

        if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
            setLocalPreviewUrl(null);
        }

        if (!file) {
            return;
        }

        const previewMode = getPreviewMode(file);

        if (previewMode === 'image' || previewMode === 'pdf') {
            setLocalPreviewUrl(URL.createObjectURL(file));
        }

        await uploadMutation.mutateAsync({
            file,
            kind,
            folder,
        });
    };

    const selectedOption =
        kindOptions.find((option) => option.value === kind) ?? kindOptions[0];
    const previewMode = getPreviewMode(selectedFile);
    const visual = getFileVisual(selectedFile);
    const previewUrl =
        uploadedFile?.accessUrl && previewMode !== 'icon'
            ? uploadedFile.accessUrl
            : localPreviewUrl;

    return (
        <>
            <Head title="Supabase Storage Test" />
            <div className="bg-white">
                <section className="border-b border-border pb-6">
                    <p className="broadsheet-kicker">Storage QA</p>
                    <h1 className="mt-3 font-heading text-[40px] leading-[1.05] font-bold text-primary sm:text-[54px]">
                        Supabase Storage test
                    </h1>
                    <p className="mt-4 max-w-3xl text-[18px] leading-[1.7] text-muted-foreground">
                        Man hinh nay goi truc tiep backend moi de upload file
                        vao Supabase Storage va xem metadata luu trong bang
                        files.
                    </p>
                </section>

                <section className="grid gap-6 py-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                    <div className="space-y-6 border border-border bg-[#FCFCFA] p-6">
                        <div className="space-y-2">
                            <Label htmlFor="storage-kind">Loai upload</Label>
                            <select
                                id="storage-kind"
                                className="broadsheet-input w-full"
                                value={kind}
                                onChange={(event) =>
                                    setKind(
                                        event.target.value as StorageUploadKind,
                                    )
                                }
                            >
                                {kindOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm leading-6 text-[#6B7280]">
                                {selectedOption.hint}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storage-folder">
                                Folder prefix
                            </Label>
                            <Input
                                id="storage-folder"
                                value={folder}
                                onChange={(event) =>
                                    setFolder(event.target.value)
                                }
                                placeholder="manual-test"
                            />
                            <p className="text-sm leading-6 text-[#6B7280]">
                                Cho phep nhom test path sinh ra tren Supabase
                                Storage.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storage-file">File</Label>
                            <Input
                                id="storage-file"
                                type="file"
                                accept={
                                    kind === 'image'
                                        ? '.jpg,.jpeg,.png,.webp'
                                        : '.pdf,.doc,.docx,.xls,.xlsx'
                                }
                                onChange={handleFileSelected}
                            />
                            <p className="text-sm leading-6 text-[#6B7280]">
                                Chon file la upload ngay. Khong can bam nut xac
                                nhan.
                            </p>
                        </div>

                        {selectedFile ? (
                            <div className="space-y-3 border border-border bg-white p-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${visual.accentClassName}`}
                                    >
                                        <visual.Icon
                                            className="size-6"
                                            strokeWidth={1.8}
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="truncate text-sm font-semibold text-[#111827]">
                                                {selectedFile.name}
                                            </p>
                                            <span className="rounded-full bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-muted-foreground">
                                                {visual.label}
                                            </span>
                                            <span className="rounded-full bg-[#ECFDF5] px-2 py-1 text-[11px] font-medium text-[#166534]">
                                                {kind === 'image'
                                                    ? 'Public bucket'
                                                    : 'Private bucket'}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm leading-6 text-[#6B7280]">
                                            {selectedFile.type || 'unknown'} •{' '}
                                            {formatFileSize(selectedFile.size)}
                                        </p>
                                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                            {uploadMutation.isPending ? (
                                                <span className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-3 py-1 font-medium text-[#1D4ED8]">
                                                    <LoaderCircle
                                                        className="size-3.5 animate-spin"
                                                        strokeWidth={2}
                                                    />
                                                    Dang upload
                                                </span>
                                            ) : null}
                                            {uploadedFile ? (
                                                <span className="rounded-full bg-[#ECFDF5] px-3 py-1 font-medium text-[#166534]">
                                                    Da upload
                                                </span>
                                            ) : null}
                                            {uploadMutation.isError ? (
                                                <span className="rounded-full bg-[#FEF2F2] px-3 py-1 font-medium text-[#B91C1C]">
                                                    Upload that bai
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>

                                {previewMode === 'image' && previewUrl ? (
                                    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                                        <img
                                            src={previewUrl}
                                            alt={selectedFile.name}
                                            className="h-56 w-full object-cover"
                                        />
                                    </div>
                                ) : null}

                                {previewMode === 'pdf' && previewUrl ? (
                                    <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                                        <iframe
                                            title={selectedFile.name}
                                            src={previewUrl}
                                            className="h-72 w-full"
                                        />
                                    </div>
                                ) : null}

                                {previewMode === 'icon' ? (
                                    <div className="rounded-2xl border border-dashed border-input bg-muted p-4 text-sm leading-6 text-muted-foreground">
                                        Trinh duyet khong render preview truc
                                        tiep cho dinh dang nay. Card da hien
                                        loai file, kich thuoc va trang thai
                                        upload.
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-4 border border-border bg-white p-6">
                        <div>
                            <p className="broadsheet-kicker">Ket qua</p>
                            <h2 className="mt-2 text-[26px] font-semibold leading-8 text-primary">
                                Metadata file
                            </h2>
                        </div>

                        {!uploadedFile ? (
                            <p className="text-[15px] leading-7 text-[#6B7280]">
                                Chon file de xem preview va metadata duoc cap
                                nhat tu dong.
                            </p>
                        ) : (
                            <div className="space-y-3 text-sm leading-6 text-[#374151]">
                                <p>
                                    <span className="font-semibold">
                                        File ID:
                                    </span>{' '}
                                    {uploadedFile.id}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Bucket:
                                    </span>{' '}
                                    {uploadedFile.bucketName}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Storage key:
                                    </span>{' '}
                                    {uploadedFile.storageKey}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Visibility:
                                    </span>{' '}
                                    {uploadedFile.visibility}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Checksum:
                                    </span>{' '}
                                    {uploadedFile.checksumSha256 ?? 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Access URL:
                                    </span>{' '}
                                    <span className="break-all text-[#0F766E]">
                                        {uploadedFile.accessUrl}
                                    </span>
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Public URL:
                                    </span>{' '}
                                    {uploadedFile.publicUrl ? (
                                        <span className="break-all text-[#0F766E]">
                                            {uploadedFile.publicUrl}
                                        </span>
                                    ) : (
                                        'private file'
                                    )}
                                </p>
                                <p>
                                    <span className="font-semibold">
                                        Access URL expires:
                                    </span>{' '}
                                    {uploadedFile.accessUrlExpiresAt ??
                                        'public URL'}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};
