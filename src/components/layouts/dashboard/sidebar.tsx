import { ChevronRight } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';

import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';
import { Logo } from './navigation';
import { useNavigationItems } from './navigation-utils';

export const Sidebar = () => {
    const location = useLocation();
    const navigation = useNavigationItems();

    return (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white sm:flex">
            <div className="flex h-20 items-center  px-6">
                <Logo />
            </div>
            <nav className="flex-1 space-y-2 overflow-y-auto p-4 pt-6">
                {navigation.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.to}
                        end={item.to === paths.app.dashboard.getHref()}
                        className={({ isActive }) =>
                            cn(
                                'group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                                isActive
                                    ? 'bg-bk-blue text-white shadow-md shadow-bk-blue/25'
                                    : 'text-slate-700 hover:bg-blue-50 hover:text-bk-blue',
                            )
                        }
                    >
                        <item.icon className="size-5" />
                        <span>{item.name}</span>
                        {location.pathname === item.to && (
                            <ChevronRight className="ml-auto size-4 opacity-70" />
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="p-4">
                <div className="rounded-2xl bg-gradient-to-br from-bk-blue/10 to-transparent p-4 border border-bk-blue/10">
                    <p className="text-xs font-bold uppercase text-bk-blue/60 tracking-wider">
                        Hệ thống
                    </p>
                    <p className="mt-1 text-sm font-bold">BK Volunteers</p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                        Phiên bản 1.2.0
                    </p>
                </div>
            </div>
        </aside>
    );
};
