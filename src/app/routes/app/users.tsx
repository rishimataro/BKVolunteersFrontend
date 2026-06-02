import { Navigate } from 'react-router';

import { paths } from '@/config/paths';
import { ROLES, useUser } from '@/features/auth';

export const UsersRoute = () => {
    const user = useUser();

    if (!user.data) return null;

    return (
        <Navigate
            to={
                user.data.role === ROLES.DOANTRUONG ||
                user.data.role === ROLES.LCD
                    ? paths.app.approvals.getHref()
                    : paths.app.profile.getHref()
            }
            replace
        />
    );
};
