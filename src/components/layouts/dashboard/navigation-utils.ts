import {
    LayoutDashboard,
    Heart,
    Compass,
    Settings,
    ClipboardCheck,
    type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { paths } from '@/config/paths';
import { ROLES, useAuthorization, useUser } from '@/features/auth';

export type SideNavigationItem = {
    name: string;
    to: string;
    icon: LucideIcon;
};

export const useNavigationItems = () => {
    const { checkAccess } = useAuthorization();
    const user = useUser();
    const role = user.data?.role;
    const isStudent = role === ROLES.STUDENT;

    return React.useMemo(
        () =>
            [
                {
                    name: 'Tổng quan',
                    to: paths.app.dashboard.getHref(),
                    icon: LayoutDashboard,
                },
                {
                    name: isStudent
                        ? 'Chiến dịch công khai'
                        : 'Vận hành chiến dịch',
                    to: isStudent
                        ? paths.campaigns.getHref()
                        : paths.app.campaigns.getHref(),
                    icon: isStudent ? Compass : Heart,
                },
                checkAccess({
                    allowedRoles: [ROLES.SCHOOL_ADMIN, ROLES.SCHOOL_REVIEWER],
                })
                    ? {
                          name: 'Hàng chờ duyệt',
                          to: paths.app.users.getHref(),
                          icon: ClipboardCheck,
                      }
                    : null,
                {
                    name: 'Cài đặt',
                    to: paths.app.settings.getHref(),
                    icon: Settings,
                },
            ].filter((item): item is SideNavigationItem => item !== null),
        [checkAccess, isStudent],
    );
};
