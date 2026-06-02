import {
    LayoutDashboard,
    Heart,
    Users,
    Settings,
    type LucideIcon,
} from 'lucide-react';
import * as React from 'react';

import { paths } from '@/config/paths';
import { ROLES, useAuthorization } from '@/features/auth';

export type SideNavigationItem = {
    name: string;
    to: string;
    icon: LucideIcon;
};

export const useNavigationItems = () => {
    const { checkAccess } = useAuthorization();

    return React.useMemo(
        () =>
            [
                {
                    name: 'Tổng quan',
                    to: paths.app.dashboard.getHref(),
                    icon: LayoutDashboard,
                },
                {
                    name: 'Chiến dịch',
                    to: paths.app.campaigns.getHref(),
                    icon: Heart,
                },
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Thành viên',
                          to: paths.app.users.getHref(),
                          icon: Users,
                      }
                    : null,
                {
                    name: 'Cài đặt',
                    to: paths.app.settings.getHref(),
                    icon: Settings,
                },
            ].filter((item): item is SideNavigationItem => item !== null),
        [checkAccess],
    );
};
