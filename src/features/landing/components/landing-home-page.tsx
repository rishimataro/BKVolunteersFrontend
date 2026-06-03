import { LandingCampaignsSection } from './landing-campaigns-section';
import { LandingFooter } from './landing-footer';
import { LandingHero } from './landing-hero';
import { LandingInsightsSection } from './landing-insights-section';
import { LandingPageHeader } from './landing-page-header';

type LandingHomePageProps = {
    onLogin: () => void;
    onOrganizations: () => void;
    onViewCampaigns: () => void;
};

export const LandingHomePage = ({
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
                    onLogin={onLogin}
                    onViewCampaigns={onViewCampaigns}
                />
                <LandingCampaignsSection onViewCampaigns={onViewCampaigns} />
                <LandingInsightsSection onLogin={onLogin} />
            </main>
            <LandingFooter />
        </div>
    );
};
