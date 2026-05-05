import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { NavLink, useNavigation, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { Logo } from './navigation';
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
        <div className="fixed top-0 left-0 z-[100] h-1 w-full bg-slate-200">
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

    // Find current navigation item based on path
    const currentItem = navigation.find((item) => item.to === pathname);
    // Special case for root/dashboard since it might be empty or "/"
    const pageTitle = currentItem?.name || 'Tổng quan';

    return (
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between bg-white/90 px-4 backdrop-blur-md sm:px-8">
            <Progress />
            {/* Mobile Menu */}
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
                        <div className="flex h-20 items-center  px-6 bg-card">
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

            {/* Dynamic Page Title */}
            <div className="hidden md:flex flex-1 max-w-md">
                <h2 className="text-xl font-bold text-slate-900">
                    {pageTitle}
                </h2>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full text-slate-700 hover:text-bk-blue"
                    >
                        <Bell className="size-5" />
                    </Button>
                    <ThemeToggle />
                </div>

                <div className="h-8 w-px bg-border mx-1 hidden sm:block"></div>

                <UserMenu />
            </div>
        </header>
    );
};
