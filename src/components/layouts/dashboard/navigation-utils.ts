import {
    LayoutDashboard,
    Heart,
    Compass,
    Settings,
    FileText,
    BarChart3,
    Building2,
    ScrollText,
    Cpu,
    Banknote,
    User,
    History,
    Users,
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
    const isStudent = role === ROLES.SINHVIEN;

    return React.useMemo(
        () =>
            [
                {
                    name: 'Tong quan',
                    to: paths.app.dashboard.getHref(),
                    icon: LayoutDashboard,
                },
                {
                    name: 'Trang ca nhan',
                    to: paths.app.profile.getHref(),
                    icon: User,
                },
                {
                    name: isStudent ? 'Chien dich cong khai' : 'Van hanh chien dich',
                    to: paths.app.campaigns.getHref(),
                    icon: isStudent ? Compass : Heart,
                },
                checkAccess({ allowedRoles: [ROLES.SINHVIEN] })
                    ? {
                          name: 'Dong gop cua toi',
                          to: paths.app.myDonations.getHref(),
                          icon: Banknote,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.SINHVIEN] })
                    ? {
                          name: 'Chung nhan',
                          to: paths.app.certificates.getHref(),
                          icon: FileText,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Mau chung nhan',
                          to: paths.app.certificateTemplates.getHref(),
                          icon: ScrollText,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Nhat ky hoat dong',
                          to: paths.app.auditLogs.getHref(),
                          icon: History,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Tac vu nen',
                          to: paths.app.backgroundJobs.getHref(),
                          icon: Cpu,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG, ROLES.LCD, ROLES.CLB] })
                    ? {
                          name: 'Bao cao',
                          to: paths.app.reports.getHref(),
                          icon: BarChart3,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Quan ly to chuc',
                          to: paths.app.adminOrganizations.getHref(),
                          icon: Building2,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                    ? {
                          name: 'Thanh vien',
                          to: paths.app.users.getHref(),
                          icon: Users,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.CLB] })
                    ? {
                          name: 'Thiet lap don vi',
                          to: paths.app.orgSettings.getHref(),
                          icon: Settings,
                      }
                    : null,
                {
                    name: 'Cai dat',
                    to: paths.app.settings.getHref(),
                    icon: Settings,
                },
            ].filter((item): item is SideNavigationItem => item !== null),
        [checkAccess, isStudent],
    );
};
