import { LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/features/auth';

const roleLabel: Record<string, string> = {
    STUDENT: 'Sinh viên',
    ORG_ADMIN: 'Quản trị đơn vị',
    ORG_MEMBER: 'Thành viên đơn vị',
    SCHOOL_REVIEWER: 'Người duyệt cấp trường',
    SCHOOL_ADMIN: 'Quản trị cấp trường',
    SYSTEM: 'Hệ thống',
};

export const UserMenu = () => {
    const navigate = useNavigate();
    const user = useUser();
    const logout = useLogout({
        onSuccess: () => navigate(paths.auth.login.getHref()),
    });

    if (!user.data) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center gap-3 rounded-full px-2 py-1.5 hover:bg-muted sm:px-3 focus-visible:ring-0"
                >
                    <div className="flex size-9 items-center justify-center rounded-full bg-bk-blue text-white shadow-md">
                        <User className="size-5" />
                    </div>
                    <div className="hidden text-left sm:block">
                        <p className="text-sm font-bold leading-tight text-slate-900">
                            {user.data.firstName} {user.data.lastName}
                        </p>
                        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">
                            {roleLabel[user.data.role] ?? user.data.role}
                        </p>
                    </div>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="z-[100] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl ring-1 ring-black/5"
                >
                    <div className="bg-muted/40 px-5 py-5 border-b border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-bk-blue text-white font-extrabold text-base shadow-lg shadow-bk-blue/20">
                                {user.data.firstName?.[0]}
                                {user.data.lastName?.[0]}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <p className="truncate text-sm font-extrabold leading-tight text-slate-900">
                                    {user.data.firstName} {user.data.lastName}
                                </p>
                                <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                                    {user.data.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-2">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">
                                Cá nhân
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={() =>
                                    navigate(paths.app.profile.getHref())
                                }
                                className="group/item cursor-pointer rounded-xl px-3 py-2.5 text-slate-900 transition-colors focus:bg-blue-50 focus:!text-slate-900"
                            >
                                <User className="mr-3 size-4.5 text-slate-600 transition-colors group-focus/item:text-bk-blue" />
                                <span className="font-semibold text-slate-800">
                                    Hồ sơ của tôi
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    navigate(paths.app.settings.getHref())
                                }
                                className="group/item cursor-pointer rounded-xl px-3 py-2.5 text-slate-900 transition-colors focus:bg-blue-50 focus:!text-slate-900"
                            >
                                <Settings className="mr-3 size-4.5 text-slate-600 transition-colors group-focus/item:text-bk-blue" />
                                <span className="font-semibold text-slate-800">
                                    Cài đặt hệ thống
                                </span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="my-2 mx-1 opacity-50" />

                        <DropdownMenuItem
                            onClick={() => logout.mutate({})}
                            className="rounded-xl px-3 py-2.5 cursor-pointer transition-colors text-destructive focus:bg-red-50 focus:text-red-700"
                        >
                            <LogOut className="mr-3 size-4.5" />
                            <span className="font-bold">Đăng xuất</span>
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
};
