import { describe, expect, it } from 'vitest';

import { isDashboardPathAllowedForRole } from '../navigation-utils';

describe('isDashboardPathAllowedForRole', () => {
    it('allows the Đoàn trường routes used by the current dashboard shell', () => {
        expect(isDashboardPathAllowedForRole('DOANTRUONG', '/app')).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/campaigns'),
        ).toBe(true);
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
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/settings'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/reports'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/audit-logs'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/background-jobs'),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole(
                'DOANTRUONG',
                '/app/certificate-templates',
            ),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole(
                'DOANTRUONG',
                '/app/campaigns/chien-dich-mua-he-xanh',
            ),
        ).toBe(true);
        expect(
            isDashboardPathAllowedForRole(
                'DOANTRUONG',
                '/app/certificates/campaigns/campaign-1',
            ),
        ).toBe(true);

        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/profile'),
        ).toBe(false);
        expect(
            isDashboardPathAllowedForRole('DOANTRUONG', '/app/my-impact'),
        ).toBe(false);
    });
});
