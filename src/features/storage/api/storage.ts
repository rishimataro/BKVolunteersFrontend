import { api } from '@/lib/api-clients';

export type StorageUploadKind = 'image' | 'document';
export type StorageFileVisibility = 'PUBLIC' | 'PRIVATE';

export type StorageUploadResponse = {
    id: string;
    bucketName: string;
    storageKey: string;
    visibility: StorageFileVisibility;
    originalName: string;
    mimeType: string;
    fileSize: number;
    extension: string | null;
    checksumSha256: string | null;
    publicUrl: string | null;
    accessUrl: string;
    accessUrlExpiresIn: number | null;
    accessUrlExpiresAt: string | null;
    createdAt: string;
};

export const uploadStorageFile = async (input: {
    file: File;
    kind: StorageUploadKind;
    folder?: string;
}) => {
    const formData = new FormData();
    formData.append('file', input.file);
    formData.append('kind', input.kind);

    if (input.folder?.trim()) {
        formData.append('folder', input.folder.trim());
    }

    const response = await api.post<StorageUploadResponse>(
        '/storage/upload',
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        },
    );

    return response as unknown as StorageUploadResponse;
};

export const getStorageFileAccessUrl = async (fileId: string) => {
    const response = await api.get<{
        id: string;
        originalName: string;
        visibility: StorageFileVisibility;
        publicUrl: string | null;
        accessUrl: string;
        accessUrlExpiresIn: number | null;
        accessUrlExpiresAt: string | null;
        createdAt: string;
    }>(`/storage/files/${fileId}/access-url`);

    return response as unknown as {
        id: string;
        originalName: string;
        visibility: StorageFileVisibility;
        publicUrl: string | null;
        accessUrl: string;
        accessUrlExpiresIn: number | null;
        accessUrlExpiresAt: string | null;
        createdAt: string;
    };
};
