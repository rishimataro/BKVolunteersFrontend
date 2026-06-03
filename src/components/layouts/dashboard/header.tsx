import * as React from 'react';
import { Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { NavLink, useLocation, useNavigation } from 'react-router';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';
import { cn } from '@/lib/utils';
import { Logo } from './navigation';
import { NotificationMenu } from './notification-menu';
import { useNavigationItems } from './navigation-utils';
import { UserMenu } from './user-menu';

const Progress = () => {
    const { state } = useNavigation();
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        if (state !== 'loading') return;
        const timer = setInterval(() => {
            setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
        }, 200);

        return () => {
            clearInterval(timer);
            setProgress(0);
        };
    }, [state]);

    if (state !== 'loading') return null;

    return (
        <div className="fixed left-0 top-0 z-[100] h-1 w-full bg-slate-200">
            <div
                className="h-full bg-bk-blue transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="size-9" />;

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
            {theme === 'dark' ? (
                <Sun className="size-5 text-yellow-500" />
            ) : (
                <Moon className="size-5 text-slate-700" />
            )}
        </Button>
    );
};

export const Header = () => {
    const navigation = useNavigationItems();
    const { pathname } = useLocation();
    const user = useUser();

    const currentItem = navigation.find((item) =>
        item.to === paths.app.dashboard.getHref()
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
    const pageTitle = currentItem?.name || 'Tổng quan';
    const isMinimalSchoolBoard = user.data?.role === ROLES.DOANTRUONG;

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
            <Progress />
            <div className="flex w-full flex-col gap-4 px-4 py-4 sm:px-8 lg:px-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 sm:hidden">
                        <Drawer direction="left">
                            <DrawerTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-full"
                                >
                                    <Menu className="size-6" />
                                </Button>
                            </DrawerTrigger>
                            <DrawerContent className="h-full w-[280px] rounded-none border-none p-0 focus:outline-none">
                                <div className="flex h-20 items-center bg-card px-6">
                                    <Logo />
                                </div>
                                <nav className="space-y-2 p-4 pt-6">
                                    {navigation.map((item) => (
                                        <NavLink
                                            key={item.name}
                                            to={item.to}
                                            className={({ isActive }) =>
                                                cn(
                                                    'flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold transition-all',
                                                    isActive
                                                        ? 'bg-bk-blue text-white'
                                                        : 'text-slate-700 hover:bg-blue-50 hover:text-bk-blue',
                                                )
                                            }
                                        >
                                            <item.icon className="size-6" />
                                            <span>{item.name}</span>
                                        </NavLink>
                                    ))}
                                </nav>
                            </DrawerContent>
                        </Drawer>
                        <Logo collapsed />
                    </div>

                    <div className="hidden min-w-0 flex-1 items-center gap-6 sm:flex">
                        <Logo />
                        <div className="min-w-0">
                            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                Khu vực quản trị
                            </p>
                            <h2 className="truncate text-xl font-bold text-slate-900">
                                {pageTitle}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden items-center gap-2 sm:flex">
                            <NotificationMenu />
                            <ThemeToggle />
                        </div>

                        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

                        <UserMenu />
                    </div>
                </div>

                <nav
                    className={cn(
                        'hidden w-full items-center gap-2 border-t border-slate-200 pt-4 sm:flex',
                        isMinimalSchoolBoard
                            ? 'justify-stretch overflow-visible'
                            : 'overflow-x-auto pb-1',
                    )}
                >
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            end={item.to === '/app'}
                            className={({ isActive }) =>
                                cn(
                                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all',
                                    isMinimalSchoolBoard &&
                                        'flex-1 justify-center px-6 py-3 text-base',
                                    isActive
                                        ? 'border-bk-blue bg-bk-blue text-white shadow-sm shadow-bk-blue/20'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-bk-blue',
                                )
                            }
                        >
                            <item.icon className="size-4" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
};
