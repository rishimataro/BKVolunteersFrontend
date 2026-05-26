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
                    name: 'Tổng quan',
                    to: paths.app.dashboard.getHref(),
                    icon: LayoutDashboard,
                },
                {
                    name: 'Trang cá nhân',
                    to: paths.app.profile.getHref(),
                    icon: User,
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
                    allowedRoles: [ROLES.SINHVIEN],
                })
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
                          name: 'Quản lý tổ chức',
                          to: paths.app.adminOrganizations.getHref(),
                          icon: Building2,
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
            ].filter((item): item is SideNavigationItem => item !== null),
        [checkAccess, isStudent],
    );
};
