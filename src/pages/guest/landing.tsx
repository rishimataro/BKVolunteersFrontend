import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { Head } from '@/components/seo';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { LandingHomePage } from '@/features/landing/components/landing-home-page';
import { getPublicHomeData } from '@/services/public/home';
import type { PublicHomeData } from '@/types/api';

export const LandingRoute = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [homeData, setHomeData] = useState<PublicHomeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let mounted = true;

        getPublicHomeData()
            .then((data) => {
                if (!mounted) {
                    return;
                }

                setHomeData(data);
            })
            .catch((error) => {
                if (!mounted) {
                    return;
                }

                setHasError(true);
                addNotification({
                    type: 'error',
                    title: 'Không thể tải trang chủ',
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Không thể đồng bộ dữ liệu trang chủ từ backend.',
                });
            })
            .finally(() => {
                if (mounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, [addNotification]);

    const handleLogin = () => {
        navigate(paths.auth.login.getHref());
    };

    const handleViewCampaigns = () => {
        navigate(paths.campaigns.getHref());
    };

    const handleViewOrganizations = () => {
        navigate(paths.organizations.getHref());
    };

    return (
        <>
            <Head title="BK Volunteers | Trang chủ hệ thống tình nguyện số" />
            <LandingHomePage
                data={homeData}
                hasError={hasError}
                isLoading={isLoading}
                onLogin={handleLogin}
                onOrganizations={handleViewOrganizations}
                onViewCampaigns={handleViewCampaigns}
            />
        </>
    );
};
