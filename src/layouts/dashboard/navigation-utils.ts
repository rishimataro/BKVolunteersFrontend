import * as React from 'react';
import {
    BarChart3,
    Banknote,
    Building2,
    Compass,
    Cpu,
    FileText,
    Heart,
    History,
    LayoutDashboard,
    ScrollText,
    Settings,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';

import { paths } from '@/config/paths';
import { ROLES, useAuthorization, useUser } from '@/features/auth';

export type SideNavigationItem = {
    name: string;
    to: string;
    icon: LucideIcon;
};

type AllowedDashboardPathMatcher = {
    match: 'exact' | 'prefix';
    value: string;
};

const roleAllowedDashboardPaths: Partial<
    Record<string, AllowedDashboardPathMatcher[]>
> = {
    [ROLES.DOANTRUONG]: [
        { match: 'exact', value: paths.app.dashboard.getHref() },
        { match: 'exact', value: paths.app.campaigns.getHref() },
        { match: 'exact', value: paths.app.adminOrganizations.getHref() },
        { match: 'exact', value: paths.app.users.getHref() },
        { match: 'exact', value: paths.app.users.dataTransfer.getHref() },
        { match: 'exact', value: paths.app.changePassword.getHref() },
        { match: 'exact', value: paths.app.notifications.getHref() },
        { match: 'exact', value: paths.app.settings.getHref() },
        { match: 'exact', value: paths.app.reports.getHref() },
        { match: 'exact', value: paths.app.auditLogs.getHref() },
        { match: 'exact', value: paths.app.backgroundJobs.getHref() },
        { match: 'exact', value: paths.app.certificateTemplates.getHref() },
        {
            match: 'prefix',
            value: `${paths.app.campaigns.getHref()}/`,
        },
        {
            match: 'prefix',
            value: `${paths.app.certificates.getHref()}/`,
        },
    ],
};

export const isDashboardPathAllowedForRole = (
    role: string | undefined,
    pathname: string,
) => {
    if (!role) {
        return true;
    }

    const matchers = roleAllowedDashboardPaths[role];
    if (!matchers) {
        return true;
    }

    return matchers.some((matcher) =>
        matcher.match === 'exact'
            ? pathname === matcher.value
            : pathname.startsWith(matcher.value),
    );
};

export const useNavigationItems = () => {
    const { checkAccess } = useAuthorization();
    const user = useUser();
    const role = user.data?.role;
    const isStudent = role === ROLES.SINHVIEN;
    const isMinimalSchoolBoard = role === ROLES.DOANTRUONG;

    return React.useMemo(() => {
        if (isMinimalSchoolBoard) {
            return [
                {
                    name: 'Tổng quan',
                    to: paths.app.dashboard.getHref(),
                    icon: LayoutDashboard,
                },
                {
                    name: 'Phê duyệt chiến dịch',
                    to: paths.app.campaigns.getHref(),
                    icon: Heart,
                },
                {
                    name: 'Báo cáo',
                    to: paths.app.reports.getHref(),
                    icon: BarChart3,
                },
                {
                    name: 'Quản lý đơn vị',
                    to: paths.app.adminOrganizations.getHref(),
                    icon: Building2,
                },
                {
                    name: 'Quản lý tài khoản',
                    to: paths.app.users.getHref(),
                    icon: Users,
                },
            ];
        }

        return [
            {
                name: 'Tổng quan',
                to: paths.app.dashboard.getHref(),
                icon: LayoutDashboard,
            },
            {
                name: 'Trang cá nhân',
                to: paths.app.profile.getHref(),
                icon: User,
            },
            checkAccess({ allowedRoles: [ROLES.SINHVIEN] })
                ? {
                      name: 'Lịch sử hoạt động',
                      to: paths.app.myImpact.getHref(),
                      icon: History,
                  }
                : null,
            {
                name: isStudent
                    ? 'Chiến dịch công khai'
                    : role === ROLES.LCD
                      ? 'Quản lý chiến dịch'
                      : 'Vận hành chiến dịch',
                to: paths.app.campaigns.getHref(),
                icon: isStudent ? Compass : Heart,
            },
            checkAccess({ allowedRoles: [ROLES.SINHVIEN] })
                ? {
                      name: 'Đóng góp của tôi',
                      to: paths.app.myDonations.getHref(),
                      icon: Banknote,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.SINHVIEN] })
                ? {
                      name: 'Chứng nhận',
                      to: paths.app.certificates.getHref(),
                      icon: FileText,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                ? {
                      name: 'Mẫu chứng nhận',
                      to: paths.app.certificateTemplates.getHref(),
                      icon: ScrollText,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                ? {
                      name: 'Nhật ký hoạt động',
                      to: paths.app.auditLogs.getHref(),
                      icon: History,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                ? {
                      name: 'Tác vụ nền',
                      to: paths.app.backgroundJobs.getHref(),
                      icon: Cpu,
                  }
                : null,
            checkAccess({
                allowedRoles: [ROLES.DOANTRUONG, ROLES.LCD, ROLES.CLB],
            })
                ? {
                      name: 'Báo cáo',
                      to: paths.app.reports.getHref(),
                      icon: BarChart3,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                ? {
                      name: 'Quản lý đơn vị',
                      to: paths.app.adminOrganizations.getHref(),
                      icon: Building2,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.DOANTRUONG] })
                ? {
                      name: 'Thành viên',
                      to: paths.app.users.getHref(),
                      icon: Users,
                  }
                : null,
            checkAccess({ allowedRoles: [ROLES.CLB] })
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
        ].filter((item): item is SideNavigationItem => item !== null);
    }, [checkAccess, isMinimalSchoolBoard, isStudent, role]);
};
