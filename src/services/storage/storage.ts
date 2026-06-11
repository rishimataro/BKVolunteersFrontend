import { api } from '@/lib/api-clients';

export const uploadFile = async (
    file: File,
    kind: 'image' | 'document',
    folder?: string,
) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    if (folder) {
        formData.append('folder', folder);
    }

    const res = (await api.post('/storage/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })) as {
        id: string;
        originalName: string;
        mimeType: string;
        fileSize: number;
        publicUrl?: string | null;
        accessUrl: string;
    };

    return res;
};

export const getStorageFileAccessUrl = (fileId: string) =>
    api.get(`/storage/files/${fileId}/access-url`) as Promise<{
        id: string;
        originalName: string;
        accessUrl: string;
        publicUrl?: string | null;
    }>;
