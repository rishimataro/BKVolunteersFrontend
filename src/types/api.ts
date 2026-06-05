export type BaseEntity = {
    id: string;
    createdAt: number | string | Date;
};

export type Entity<T> = {
    [K in keyof T]: T[K];
} & BaseEntity;

export type Meta = {
    page: number;
    total: number;
    totalPages: number;
    total_pages?: number;
};

export type UserRole = 'SINHVIEN' | 'LCD' | 'CLB' | 'DOANTRUONG';

export type AccountType = 'STUDENT' | 'OPERATOR';
export type Role = UserRole;
export type UserStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';

export type CampaignStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'APPROVED'
    | 'REVISION_REQUIRED'
    | 'REJECTED'
    | 'PUBLISHED'
    | 'ONGOING'
    | 'ENDED'
    | 'ARCHIVED';

export type ModuleStatus =
    | 'DRAFT'
    | 'READY_FOR_REVIEW'
    | 'APPROVED'
    | 'OPEN'
    | 'CLOSED'
    | 'CANCELLED';

export type ModuleType = 'fundraising' | 'item_donation' | 'event';

export type DonationStatus =
    | 'PENDING'
    | 'MATCHED'
    | 'VERIFIED'
    | 'REJECTED'
    | 'REFUNDED';

export type PledgeStatus =
    | 'PLEDGED'
    | 'CONFIRMED'
    | 'RECEIVED'
    | 'REJECTED'
    | 'CANCELLED';

export type EventRegistrationStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'CANCELLED'
    | 'CHECKED_IN'
    | 'COMPLETED';

export type CertificateStatus =
    | 'PENDING'
    | 'RENDERING'
    | 'READY'
    | 'SIGNED'
    | 'REVOKED'
    | 'FAILED';

export type CampaignProgress = {
    percent: number;
    modules: Array<{
        type: ModuleType;
        current: number;
        target: number;
        percent: number;
    }>;
};

export type PublicCampaignCard = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    cover_image_url?: string | null;
    organization: {
        id: string;
        code: string;
        name: string;
        type: string;
        logo_url?: string | null;
    };
    module_types: ModuleType[];
    status: Extract<CampaignStatus, 'PUBLISHED' | 'ONGOING'>;
    start_at: string;
    end_at: string;
    progress: CampaignProgress;
};

export type PublicCampaignDetail = PublicCampaignCard & {
    description?: string | null;
    beneficiary?: string | null;
    scope_type: string;
    published_at?: string | null;
    modules: Array<{
        id: string;
        type: ModuleType;
        title: string;
        description?: string | null;
        status: ModuleStatus;
        start_at: string;
        end_at: string;
        settings: Record<string, unknown>;
        progress?: CampaignProgress['modules'][number];
        cta: {
            enabled: boolean;
            label: string;
            action: string | null;
        };
    }>;
};

export type User = Entity<{
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status?: UserStatus;
    facultyId?: number | null;
    mssv?: string;
    fullName?: string;
    className?: string | null;
    phone?: string | null;
    totalPoints?: number;
    updatedAt?: number | string | Date;
    lastLoginAt?: number | string | Date | null;
    accountType?: AccountType;
    facultyName?: string | null;
    managedClubName?: string | null;
    organizationId?: string | null;
    organization?: {
        id: string;
        name: string;
        code?: string;
        type: string;
        faculty?: { name: string } | null;
    } | null;
    studentCode?: string | null;
}>;

export type AuthResponse = {
    accessToken?: string;
    refreshToken?: string | null;
    user?: User | null;
    access_token?: string | null;
    refresh_token?: string | null;
    account?: User | null;
};

export type ApiError = {
    message: string;
    statusCode: number;
    error?: string;
};

export type GeneralResponse = {
    message: string;
};
