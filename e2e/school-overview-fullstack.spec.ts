import { expect, test, type Page } from '@playwright/test';

type LoginRole = 'org' | 'schoolAdmin';
type SchoolOverviewResponse = {
    total_campaigns: number;
    total_students: number;
    total_organizations: number;
    total_money_donations: number;
    organization_breakdown: Array<{
        organization_id: number;
        organization_name: string;
        organization_code: string;
        campaign_count: number;
    }>;
    module_breakdown: Array<{
        module_type: string;
        campaign_count: number;
    }>;
    status_breakdown: Array<{
        status: string;
        campaign_count: number;
    }>;
};

type ApiEnvelope<T> = {
    data: T;
};

const login = async (page: Page, role: LoginRole) => {
    const credentials =
        role === 'schoolAdmin'
            ? {
                  identifier: 'school.admin@dut.udn.vn',
                  password: 'Password@123',
              }
            : {
                  identifier: 'lcd.cntt@dut.udn.vn',
                  password: 'Password@123',
              };

    await page.goto('/');
    await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });
    await page.goto('/auth/login');
    await page.getByLabel('MSSV / Email:').fill(credentials.identifier);
    await page.getByLabel('Mật khẩu:').fill(credentials.password);
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForURL('**/app');
};

const waitForOverviewResponse = (page: Page) =>
    page.waitForResponse(
        (response) =>
            response.request().method() === 'GET' &&
            response.url().includes('/reports/school/overview') &&
            response.ok(),
    );

const parseOverviewResponse = async (
    responsePromise: ReturnType<typeof waitForOverviewResponse>,
) => {
    const response = await responsePromise;
    const body = (await response.json()) as ApiEnvelope<SchoolOverviewResponse>;
    return body.data;
};

test.describe('school overview fullstack', () => {
    test.describe.configure({ mode: 'serial' });

    test('school admin sees breakdowns and filters update school overview', async ({
        page,
    }) => {
        test.setTimeout(120000);

        await login(page, 'schoolAdmin');
        const initialOverviewResponse = waitForOverviewResponse(page);
        await page.goto('/app/reports');
        const initialOverview = await parseOverviewResponse(
            initialOverviewResponse,
        );
        const ongoingOverview = initialOverview.status_breakdown.find(
            (item) => item.status === 'ONGOING',
        );
        const organization = initialOverview.organization_breakdown.find(
            (item) => item.organization_code === 'LCD_CNTT',
        );

        await expect(
            page.getByRole('heading', { name: 'Tổng quan trường' }),
        ).toBeVisible();
        await expect(
            page.getByTestId('school-overview-organization-table'),
        ).toContainText(
            initialOverview.organization_breakdown[0]!.organization_name,
        );
        await expect(
            page.getByTestId('school-overview-stat-total_campaigns'),
        ).toContainText(String(initialOverview.total_campaigns));
        await expect(
            page.getByTestId('school-overview-stat-total_organizations'),
        ).toContainText(String(initialOverview.total_organizations));

        const statusResponse = waitForOverviewResponse(page);
        await page
            .getByTestId('school-overview-filter-status')
            .selectOption('ONGOING');
        const statusOverview = await parseOverviewResponse(statusResponse);
        await expect(
            page.getByTestId('school-overview-stat-total_campaigns'),
        ).toContainText(String(statusOverview.total_campaigns));
        await expect(
            page.getByTestId('school-overview-status-breakdown'),
        ).toContainText('ONGOING');
        if (ongoingOverview) {
            await expect(
                page.getByTestId('school-overview-status-breakdown'),
            ).toContainText(String(ongoingOverview.campaign_count));
        }

        const moduleResponse = waitForOverviewResponse(page);
        await page
            .getByTestId('school-overview-filter-module-type')
            .selectOption('event');
        const moduleOverview = await parseOverviewResponse(moduleResponse);
        await expect(
            page.getByTestId('school-overview-module-breakdown'),
        ).toContainText('Sự kiện');
        await expect(
            page.getByTestId('school-overview-stat-total_campaigns'),
        ).toContainText(String(moduleOverview.total_campaigns));
        const filteredEventOverview = moduleOverview.module_breakdown.find(
            (item) => item.module_type === 'event',
        );
        if (filteredEventOverview) {
            await expect(
                page.getByTestId('school-overview-module-breakdown'),
            ).toContainText(String(filteredEventOverview.campaign_count));
        }

        if (organization) {
            const organizationResponse = waitForOverviewResponse(page);
            await page
                .getByTestId('school-overview-filter-organization')
                .selectOption({ label: organization.organization_name });
            const organizationOverview =
                await parseOverviewResponse(organizationResponse);
            await expect(
                page.getByTestId('school-overview-organization-table'),
            ).toContainText(organization.organization_code);
            await expect(
                page.getByTestId('school-overview-stat-total_campaigns'),
            ).toContainText(String(organizationOverview.total_campaigns));
        }

        const futureFrom = new Date();
        futureFrom.setDate(futureFrom.getDate() + 30);
        const futureTo = new Date();
        futureTo.setDate(futureTo.getDate() + 31);

        const dateFromValue = futureFrom.toISOString().slice(0, 16);
        const dateToValue = futureTo.toISOString().slice(0, 16);

        const fromResponse = waitForOverviewResponse(page);
        await page
            .getByTestId('school-overview-filter-from')
            .fill(dateFromValue);
        await parseOverviewResponse(fromResponse);

        const toResponse = waitForOverviewResponse(page);
        await page.getByTestId('school-overview-filter-to').fill(dateToValue);
        const dateOverview = await parseOverviewResponse(toResponse);

        await expect(
            page.getByTestId('school-overview-stat-total_campaigns'),
        ).toContainText(String(dateOverview.total_campaigns));
        if (dateOverview.organization_breakdown.length === 0) {
            await expect(
                page.getByTestId('school-overview-organization-table'),
            ).toContainText(
                'Không có dữ liệu tổ chức trong phạm vi filter hiện tại.',
            );
        } else {
            await expect(
                page.getByTestId('school-overview-organization-table'),
            ).toContainText(
                dateOverview.organization_breakdown[0]!.organization_name,
            );
        }
    });

    test('non school operator does not see school overview section', async ({
        page,
    }) => {
        await login(page, 'org');
        await page.goto('/app/reports');

        await expect(
            page.getByRole('heading', { name: 'Báo cáo chiến dịch' }),
        ).toBeVisible();
        await expect(
            page.getByRole('heading', { name: 'Tổng quan trường' }),
        ).toHaveCount(0);
        await expect(
            page.getByTestId('school-overview-organization-table'),
        ).toHaveCount(0);
    });
});
