import { Head } from '@/components/seo';

type ContentLayoutProps = {
    children: React.ReactNode;
    title: string;
};

export const ContentLayout = ({ children, title }: ContentLayoutProps) => {
    return (
        <>
            <Head title={title} />
            <div className="bg-background py-8 sm:py-10 min-h-screen">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                    <div className="border-b border-border pb-6 mb-8 flex flex-col gap-2">
                        <p className="text-sm font-medium uppercase tracking-wider text-secondary">
                            Khu vực quản trị
                        </p>
                        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-primary tracking-tight">
                            {title}
                        </h1>
                    </div>
                    <div>{children}</div>
                </div>
            </div>
        </>
    );
};
