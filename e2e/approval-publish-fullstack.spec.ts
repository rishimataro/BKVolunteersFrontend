import { expect, test, type Page } from '@playwright/test';

type UserRole = 'org' | 'reviewer';

const timestamp = Date.now();
const campaignTitle = `Sprint2 Fullstack ${timestamp}`;
const campaignSummary = `Summary ${timestamp}`;
const moduleTitle = `Fundraising ${timestamp}`;

test.describe('approval publish fullstack', () => {
    test('org submit -> reviewer approve -> org publish -> public sees campaign', async ({
        page,
    }) => {
        test.setTimeout(90000);

        await login(page, 'org');
        await page.goto('/app/campaigns');

        await page.getByPlaceholder('Tiêu đề chiến dịch').fill(campaignTitle);
        await page.getByPlaceholder('Tóm tắt chiến dịch').fill(campaignSummary);
        await page
            .getByPlaceholder('Mô tả ngắn')
            .fill('Fullstack approval publish smoke');
        await page
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill('2026-06-01T08:00');
        await page
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill('2026-06-30T17:00');

        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().includes('/api/v1/campaigns') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            page.getByRole('button', { name: 'Tạo chiến dịch' }).click(),
        ]);

        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        const moduleForm = page
            .locator('form')
            .filter({ hasText: 'Thêm hạng mục vào chiến dịch' });

        await moduleForm.getByPlaceholder('Tên hạng mục').fill(moduleTitle);
        await moduleForm
            .getByPlaceholder('Mô tả hạng mục')
            .fill('Fullstack fundraising module');
        await moduleForm
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill('2026-06-02T08:00');
        await moduleForm
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill('2026-06-20T17:00');
        await moduleForm.getByPlaceholder('Mục tiêu gây quỹ').fill('20000000');
        await moduleForm
            .getByPlaceholder('Tên người thụ hưởng')
            .fill('CLB CNTT');
        await moduleForm.getByPlaceholder('Ngân hàng').fill('Vietcombank');
        await moduleForm.getByPlaceholder('Số tài khoản').fill('0123456789');

        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().includes('/modules') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            moduleForm.getByRole('button', { name: 'Tạo hạng mục' }).click(),
        ]);

        await expect(
            page.locator('p.text-sm.font-semibold.text-slate-900', {
                hasText: moduleTitle,
            }),
        ).toBeVisible();

        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().includes('/submit-review') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            page.getByRole('button', { name: 'Gửi duyệt' }).click(),
        ]);

        await expect(
            page.locator('span[title="Đã gửi duyệt"]').first(),
        ).toBeVisible();

        await login(page, 'reviewer');
        await page.goto('/app/users');
        await expect(
            page.getByRole('button', {
                name: new RegExp(campaignTitle),
            }),
        ).toBeVisible();
        await page
            .getByRole('button', {
                name: new RegExp(campaignTitle),
            })
            .click();
        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        await acceptPrompt(page, 'Fullstack pre-approve');
        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().includes('/pre-approve') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            page
                .getByRole('button', { name: 'Tiền duyệt', exact: true })
                .click(),
        ]);

        await expect(
            page.locator('span[title="Tiền duyệt"]').first(),
        ).toBeVisible();

        await acceptPrompt(page, 'Fullstack approve');
        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().endsWith('/approve') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            page.getByRole('button', { name: 'Duyệt', exact: true }).click(),
        ]);

        await expect(
            page.locator('span[title="Đã duyệt"]').first(),
        ).toBeVisible();

        await login(page, 'org');
        await page.goto('/app/campaigns');
        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        await Promise.all([
            page.waitForResponse(
                (response) =>
                    response.url().includes('/publish') &&
                    response.request().method() === 'POST' &&
                    response.ok(),
            ),
            page.getByRole('button', { name: 'Công khai' }).click(),
        ]);

        await expect(
            page.locator('span[title="Công khai"]').first(),
        ).toBeVisible();

        await page.goto('/campaigns');
        await page
            .getByPlaceholder('Tìm theo tên chiến dịch hoặc đơn vị')
            .fill(campaignTitle);
        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
                level: 2,
            }),
        ).toBeVisible();
    });
});

const acceptPrompt = async (page: Page, message: string) => {
    page.once('dialog', async (dialog) => {
        await dialog.accept(message);
    });
};

const login = async (page: Page, role: UserRole) => {
    const credentials =
        role === 'org'
            ? {
                  identifier: 'lcd.cntt@dut.udn.vn',
                  password: 'Password@123',
              }
            : {
                  identifier: 'reviewer@dut.udn.vn',
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
