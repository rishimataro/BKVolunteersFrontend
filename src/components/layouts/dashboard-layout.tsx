import React from 'react';

import { Sidebar } from './dashboard/sidebar';
import { Header } from './dashboard/header';
import { Head } from '../seo';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Head title="BK Volunteers" />
            <div className="flex min-h-screen w-full bg-slate-50 text-slate-900 transition-colors duration-300">
                {/* Desktop Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col sm:pl-64">
                    <Header />

                    <main className="flex-1 p-4 sm:p-8">
                        <div className="mx-auto max-w-7xl animate-fade-in-up">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
