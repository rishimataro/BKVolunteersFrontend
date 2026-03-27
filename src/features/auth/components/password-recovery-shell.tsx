import {
    BadgeCheck,
    KeyRound,
    MailCheck,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';

import { Head } from '@/components/seo';

const recoverySteps = [
    { step: 1, label: 'Xác minh email', Icon: MailCheck },
    { step: 2, label: 'Nhập mã', Icon: ShieldCheck },
    { step: 3, label: 'Mật khẩu mới', Icon: KeyRound },
] as const;

const panelDecorations = [
    {
        Icon: ShieldCheck,
        className:
            'right-[40%] top-[24%] text-[#4DA1A9] shadow-[0_24px_48px_-30px_rgba(77,161,169,0.85)]',
    },
    {
        Icon: BadgeCheck,
        className:
            'right-[150%] top-[44%] text-[#79D7BE] shadow-[0_18px_40px_-28px_rgba(121,215,190,0.75)]',
    },
    {
        Icon: Sparkles,
        className:
            'right-[30%] bottom-[30%] text-[#4DA1A9] shadow-[0_24px_54px_-34px_rgba(77,161,169,0.72)]',
    },
] as const;

export const authInputClass =
    'h-12 sm:h-14 rounded-[1rem] border border-slate-300 bg-white px-5 text-base text-slate-700 shadow-[0_10px_30px_-26px_rgba(15,23,42,0.8)] transition-all duration-200 placeholder:text-slate-300 hover:border-[#79D7BE] focus-visible:border-[#4DA1A9] focus-visible:ring-4 focus-visible:ring-[#79D7BE]/30';

export const authPrimaryButtonClass =
    'inline-flex h-12 sm:h-14 w-full items-center justify-center rounded-full bg-[#4DA1A9] px-4 sm:px-6 text-[1.05rem] font-semibold text-white shadow-[5px_20px_20px_-24px_rgba(77,161,169,0.95)] transition-all duration-200 hover:bg-[#428f96] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#79D7BE]/50 active:translate-y-0 active:scale-[0.985]';

export const authSecondaryButtonClass =
    'inline-flex h-12 sm:h-14 w-full items-center justify-center rounded-full border border-slate-300 bg-white/95 px-4 sm:px-6 text-base font-medium text-slate-400 transition-all duration-200 hover:border-[#79D7BE] hover:text-[#2E5077] hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-200 active:translate-y-0 active:scale-[0.985]';

export const authHelperLinkClass =
    'font-semibold text-[#2E5077] transition-colors duration-200 hover:text-[#4DA1A9] hover:underline';

type PasswordRecoveryShellProps = {
    title: string;
    description: string;
    pageTitle: string;
    activeStep: 1 | 2 | 3;
    assetSrc: string;
    assetAlt: string;
    children: React.ReactNode;
};

export const PasswordRecoveryShell = ({
    title,
    description,
    pageTitle,
    activeStep,
    assetSrc,
    assetAlt,
    children,
}: PasswordRecoveryShellProps) => {
    return (
        <>
            <Head title={pageTitle} />
            <main className="relative min-h-screen overflow-hidden bg-slate-100">
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/background.png')" }}
                />
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(235,255,251,0.35)_34%,_rgba(46,80,119,0.18)_100%)]"
                />
                <div
                    aria-hidden="true"
                    className="absolute inset-0 backdrop-blur-[7px]"
                />

                <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
                    {/* Start section: Recovery-shell */}
                    <section className="relative mx-auto w-full max-w-[1376px] px-4 sm:px-6 lg:px-8 animate-fade-in-up">
                        {/* Start: Recovery-card */}
                        <div className="group relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-white bg-white shadow-[0_30px_80px_-32px_rgba(28,74,97,0.55)] backdrop-blur-md transition-transform duration-500">
                            {/* Start: Recovery-grid */}
                            <div className="grid min-h-[620px] md:min-h-[680px] lg:min-h-[720px] lg:grid-cols-[minmax(0,0.68fr)_minmax(320px,0.32fr)]">
                                {/* Start: Recovery-content */}
                                <div className="relative z-10 flex items-center px-4 py-8 sm:px-8 sm:py-10 lg:px-0 lg:pl-20">
                                    {/* Start: Recovery-body */}
                                    <div className="w-full max-w-[26rem] sm:max-w-[30rem]">
                                        <img
                                            src="/logo_nobg.svg"
                                            alt="BK Volunteers"
                                            className="w-auto h-20 mb-7"
                                        />

                                        {/* Step indicator */}
                                        <div className="flex flex-wrap gap-3 mb-7">
                                            {recoverySteps.map(
                                                ({ step, label, Icon }) => {
                                                    const isActive =
                                                        step === activeStep;
                                                    const isCompleted =
                                                        step < activeStep;

                                                    return (
                                                        <div
                                                            key={step}
                                                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                                                                isActive
                                                                    ? 'border-[#4DA1A9] bg-[#4DA1A9] text-white shadow-[0_20px_40px_-28px_rgba(77,161,169,0.95)]'
                                                                    : isCompleted
                                                                      ? 'border-[#79D7BE] bg-[#79D7BE]/25 text-[#2E5077]'
                                                                      : 'border-slate-200 bg-white/85 text-slate-400'
                                                            }`}
                                                        >
                                                            <Icon className="h-4 w-4" />
                                                            <span>
                                                                {step}. {label}
                                                            </span>
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>

                                        {/* Title and description */}
                                        <div className="mb-8">
                                            <h1 className="text-4xl font-bold tracking-tight text-[#2E5077] sm:text-4xl lg:text-5xl">
                                                {title}
                                            </h1>
                                            <p className="mt-3 text-base leading-7 text-slate-500">
                                                {description}
                                            </p>
                                        </div>

                                        {children}
                                    </div>
                                    {/* End: Recovery-body */}
                                </div>
                                {/* End: Recovery-content */}

                                {/* Start: Recovery-sidebar */}
                                <div className="absolute inset-0 z-20 hidden pointer-events-none xl:block">
                                    <div className="absolute right-0 top-0 h-full w-[32%] bg-[#eef9fb]/90">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.98),rgba(238,249,251,0.68)_38%,rgba(121,215,190,0.3)_100%)]" />

                                        {panelDecorations.map(
                                            ({ Icon, className }) => (
                                                <div
                                                    key={className}
                                                    className={`absolute flex h-14 w-14 animate-float items-center justify-center rounded-full ${className}`}
                                                >
                                                    <Icon className="w-16 h-16" />
                                                </div>
                                            ),
                                        )}

                                        <img
                                            src={assetSrc}
                                            alt={assetAlt}
                                            className="absolute bottom-0 -left-[48%] h-[92%] scale-[1.35] max-h-[720px] w-auto z-30 drop-shadow-[0_30px_40px_rgba(0,0,0,0.12)]"
                                        />
                                    </div>
                                </div>
                                {/* End: Recovery-sidebar */}
                            </div>
                            {/* End: Recovery-grid */}
                        </div>
                        {/* End: Recovery-card */}
                    </section>
                    {/* End section: Recovery-shell */}
                </div>
            </main>
        </>
    );
};
