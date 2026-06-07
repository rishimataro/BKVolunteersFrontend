import { paths } from '@/config/paths';
import { Link } from '@/components/ui/link';

export const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
    return (
        <Link
            className="flex items-center gap-3 px-2 transition-all"
            to={paths.home.getHref()}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bk-blue shadow-lg shadow-bk-blue/20">
                <img
                    className="h-7 w-7"
                    src="/logo-bkvolunteers.png"
                    alt="BK Volunteers"
                />
            </div>
            {!collapsed && (
                <span className="text-lg font-bold tracking-tight text-foreground">
                    BK Volunteers
                </span>
            )}
        </Link>
    );
};
