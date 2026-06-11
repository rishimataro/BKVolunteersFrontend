import { api } from '@/lib/api-clients';
import type { PublicHomeData } from '@/types/api';

export const getPublicHomeData = () => {
    return api.get('/public/home') as Promise<PublicHomeData>;
};
