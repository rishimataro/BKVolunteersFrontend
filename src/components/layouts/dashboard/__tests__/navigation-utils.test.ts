import { describe, expect, it } from 'vitest';

import { isDashboardPathAllowedForRole } from '../navigation-utils';

describe('isDashboardPathAllowedForRole', () => {
    it('allows only the reduced Đoàn trường routes', () => {
        expect(isDashboardPathAllowedForRole('DOANTRUONG', '/app')).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/organizations'),
        ).toBe(true);
        expect(isDashboardPathAllowedForRole('DOANTRUONG', '/app/users')).toBe(
            true,
        );
        expect(
            isDashboardPathAllowedForRole(
                'DOANTRUONG',
                '/app/users/data-transfer',
            ),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/change-password'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/notifications'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole(
                'DOANTRUONG',
                '/app/campaigns/chien-dich-mua-he-xanh',
            ),
        ).toBe(true);

        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/campaigns'),
        ).toBe(false);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/reports'),
        ).toBe(false);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/settings'),
        ).toBe(false);
    });
});
