import React from 'react';
import { Navigate, useLocation } from 'react-router';

import { paths } from '@/config/paths';
import { useUser } from '@/features/auth';
import { Header } from './dashboard/header';
import { isDashboardPathAllowedForRole } from './dashboard/navigation-utils';
import { Head } from '../seo';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { pathname } = useLocation();
    const user = useUser();

    if (
        user.data?.role &&
        !isDashboardPathAllowedForRole(user.data.role, pathname)
    ) {
        return <Navigate to={paths.app.dashboard.getHref()} replace />;
    }

    return (
        <>
            <Head title="BK Volunteers" />
            <div className="min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300">
                <Header />

                <main className="px-4 py-6 sm:px-8 sm:py-8">
                    <div className="mx-auto max-w-7xl animate-fade-in-up">
                        {children}
                    </div>
                </main>
            </div>
        </>
    );
}
