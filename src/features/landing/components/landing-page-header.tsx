import { ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

type LandingPageHeaderProps = {
    onLogin: () => void;
    onOrganizations: () => void;
};

const navItems = [
    {
        href: '#tac-dong',
        label: 'Tác động',
    },
    {
        href: '#chien-dich',
        label: 'Chiến dịch',
    },
    {
        href: '#doi-tac',
        label: 'Đối tác',
    },
    {
        href: '#ve-nen-tang',
        label: 'Về nền tảng',
    },
] as const;

export const LandingPageHeader = ({
    onLogin,
    onOrganizations,
}: LandingPageHeaderProps) => {
    return (
        <header className="sticky top-0 z-50 border-b border-[#C3C6D2] bg-white">
            <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
                <a className="flex items-center gap-3" href="/">
                    <img
                        src="/logo-bkvolunteers.png"
                        alt="BK Volunteers Logo"
                        className="size-10 object-contain"
                    />
                    <div>
                        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#424750]">
                            Nền tảng điều phối số
                        </p>
                        <p className="text-[24px] font-semibold leading-8 text-[#002A58]">
                            BK Volunteers
                        </p>
                    </div>
                </a>

                <nav className="hidden items-center gap-8 lg:flex">
                    {navItems.map((item, index) => (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`border-b-2 pb-1 text-[15px] font-medium transition-colors ${
                                index === 1
                                    ? 'border-[#002A58] text-[#002A58]'
                                    : 'border-transparent text-[#424750] hover:border-[#002A58] hover:text-[#002A58]'
                            }`}
                        >
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="hidden rounded-none border border-transparent px-3 normal-case tracking-normal text-[#002A58] hover:bg-[#F3F4F5] md:inline-flex"
                        onClick={onOrganizations}
                    >
                        Đơn vị đồng hành
                        <ArrowUpRight className="size-4" strokeWidth={1.5} />
                    </Button>
                    <Button
                        size="sm"
                        className="rounded-none border border-[#002A58] bg-[#002A58] px-4 normal-case tracking-normal text-white hover:bg-[#004080]"
                        onClick={onLogin}
                    >
                        Đăng nhập
                    </Button>
                </div>
            </div>
        </header>
    );
};
