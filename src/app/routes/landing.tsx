import { useNavigate } from 'react-router';

import { Head } from '@/components/seo';
import { paths } from '@/config/paths';
import { LandingHomePage } from '@/features/landing/components/landing-home-page';

export const LandingRoute = () => {
    const navigate = useNavigate();

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
                onLogin={handleLogin}
                onOrganizations={handleViewOrganizations}
                onViewCampaigns={handleViewCampaigns}
            />
        </>
    );
};
