import { api } from '@/lib/api-clients';
import type {
    StudentActivityItem,
    StudentDashboardSummary,
    StudentDonationItem,
} from '../types';
export type {
    StudentActivityItem,
    StudentDashboardSummary,
    StudentDonationItem,
};

export const getStudentDashboard = () =>
    api.get('/students/me/dashboard') as Promise<StudentDashboardSummary>;

export const getStudentActivities = (params?: {
    type?:
        | 'money_donation'
        | 'item_pledge'
        | 'event_registration'
        | 'certificate'
        | '';
    status?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/students/me/activities', { params }) as Promise<
        StudentActivityItem[]
    >;

export const getStudentDonations = (params?: {
    type?: 'money' | 'item' | '';
    status?: string;
    page?: number;
    limit?: number;
}) =>
    api.get('/students/me/donations', { params }) as Promise<
        StudentDonationItem[]
    >;
