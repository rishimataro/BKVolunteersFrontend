import {
    LayoutDashboard,
    Heart,
    Compass,
    Settings,
    ClipboardCheck,
    FileText,
    BarChart3,
    Building2,
    ScrollText,
    Cpu,
    Banknote,
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
                        ? paths.app.campaigns.getHref()
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
                checkAccess({ allowedRoles: [ROLES.STUDENT] })
                    ? {
                          name: 'Đóng góp của tôi',
                          to: paths.app.myDonations.getHref(),
                          icon: Banknote,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.STUDENT] })
                    ? {
                          name: 'Chứng nhận',
                          to: paths.app.certificates.getHref(),
                          icon: FileText,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.SCHOOL_ADMIN] })
                    ? {
                          name: 'Mẫu chứng nhận',
                          to: paths.app.certificateTemplates.getHref(),
                          icon: ScrollText,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.SCHOOL_ADMIN] })
                    ? {
                          name: 'Nhật ký hoạt động',
                          to: paths.app.auditLogs.getHref(),
                          icon: ClipboardCheck,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.SCHOOL_ADMIN] })
                    ? {
                          name: 'Tác vụ nền',
                          to: paths.app.backgroundJobs.getHref(),
                          icon: Cpu,
                      }
                    : null,
                checkAccess({
                    allowedRoles: [
                        ROLES.SCHOOL_ADMIN,
                        ROLES.SCHOOL_REVIEWER,
                        ROLES.ORG_ADMIN,
                        ROLES.ORG_MEMBER,
                    ],
                })
                    ? {
                          name: 'Báo cáo',
                          to: paths.app.reports.getHref(),
                          icon: BarChart3,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.SCHOOL_ADMIN] })
                    ? {
                          name: 'Quản lý tổ chức',
                          to: paths.app.adminOrganizations.getHref(),
                          icon: Building2,
                      }
                    : null,
                checkAccess({ allowedRoles: [ROLES.ORG_ADMIN] })
                    ? {
                          name: 'Thiết lập đơn vị',
                          to: paths.app.orgSettings.getHref(),
                          icon: Settings,
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
