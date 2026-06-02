import { Head } from '../seo';

type ContentLayoutProps = {
    children: React.ReactNode;
    title: string;
};

export const ContentLayout = ({ children, title }: ContentLayoutProps) => {
    return (
        <>
            <Head title={title} />
            <div className="bg-white py-8 sm:py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    <div className="border-b-2 border-b-[#0A0A0A] pb-5">
                        <p className="broadsheet-kicker">Khu vực quản trị</p>
                        <h1 className="mt-3 font-heading text-[48px] leading-[1.15] font-bold text-[#0A0A0A]">
                            {title}
                        </h1>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
                    {children}
                </div>
            </div>
        </>
    );
};
