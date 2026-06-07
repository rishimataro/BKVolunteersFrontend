import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { paths } from '@/config/paths';
import { useUser } from '@/features/auth';

import { Head } from '@/components/seo';

type LayoutProps = {
    children: React.ReactNode;
    title: string;
};

export const AuthLayout = ({ children, title }: LayoutProps) => {
    const user = useUser();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');
    const navigate = useNavigate();

    useEffect(() => {
        if (user.data) {
            navigate(redirectTo ? redirectTo : paths.app.dashboard.getHref(), {
                replace: true,
            });
        }
    }, [user.data, navigate, redirectTo]);

    return (
        <>
            <Head title={title} />
            <div className="flex min-h-screen bg-bk-bg font-sans">
                {/* Sidebar Image Frame - Left Panel */}
                <div className="hidden lg:block lg:w-1/2 relative bg-gray-50 border-r border-gray-200 p-12 ">
                    <img
                        src="/sibar-login.png"
                        alt="BK Volunteers Background"
                        className="w-full max-h-[850px] object-contain object-center"
                    />
                </div>

                {/* Action Frame - Right Panel */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-14 bg-white relative z-10">
                    <div className="w-full max-w-md">{children}</div>
                </div>
            </div>
        </>
    );
};
