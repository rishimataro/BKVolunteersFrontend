import type { PublicHomeData } from '@/types/api';

import { LandingCampaignsSection } from './landing-campaigns-section';
import { LandingFooter } from './landing-footer';
import { LandingHero } from './landing-hero';
import { LandingInsightsSection } from './landing-insights-section';
import { LandingPageHeader } from './landing-page-header';

type LandingHomePageProps = {
    data: PublicHomeData | null;
    hasError: boolean;
    isLoading: boolean;
    onLogin: () => void;
    onOrganizations: () => void;
    onViewCampaigns: () => void;
};

export const LandingHomePage = ({
    data,
    hasError,
    isLoading,
    onLogin,
    onOrganizations,
    onViewCampaigns,
}: LandingHomePageProps) => {
    return (
        <div className="min-h-screen bg-[#F8F9FA] text-[#191C1D] [font-family:'Public_Sans',Inter,system-ui,sans-serif]">
            <LandingPageHeader
                onLogin={onLogin}
                onOrganizations={onOrganizations}
            />
            <main>
                <LandingHero
                    hasError={hasError}
                    isLoading={isLoading}
                    metrics={data?.metrics ?? null}
                    onLogin={onLogin}
                    onViewCampaigns={onViewCampaigns}
                />
                <LandingCampaignsSection
                    campaigns={data?.featured_campaigns ?? []}
                    hasError={hasError}
                    isLoading={isLoading}
                    onViewCampaigns={onViewCampaigns}
                />
                <LandingInsightsSection
                    data={data}
                    hasError={hasError}
                    isLoading={isLoading}
                    onLogin={onLogin}
                />
            </main>
            <LandingFooter />
        </div>
    );
};
