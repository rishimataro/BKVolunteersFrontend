import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';

type UserRole = 'student' | 'org';

const campaignSlug = 'mvp-chien-dich-thien-nguyen';
const campaignButtonPattern = /MVP .*thiện nguyện/i;

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(value);

const getFundraisingFixture = async (request: APIRequestContext) => {
    const response = await request.get(
        `http://127.0.0.1:4000/api/v1/public/campaigns/${campaignSlug}`,
    );
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data: {
            id: string;
            title: string;
            modules: Array<{ id: string; type: string; title: string }>;
        };
    };

    const module = body.data.modules.find(
        (item) => item.type === 'fundraising',
    );
    expect(module).toBeTruthy();

    return {
        campaignId: body.data.id,
        campaignTitle: body.data.title,
        moduleId: module!.id,
        moduleTitle: module!.title,
    };
};

const login = async (page: Page, role: UserRole) => {
    const credentials =
        role === 'student'
            ? {
                  identifier: '102210001',
                  password: '102210001',
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

const openManagedCampaign = async (page: Page) => {
    await page.goto('/app/campaigns');
    const campaignButton = page
        .getByRole('button')
        .filter({ hasText: campaignButtonPattern });
    await expect(campaignButton.first()).toBeVisible();
    await campaignButton.first().click();
};

const openFundraisingPanel = async (page: Page) => {
    const panelHeading = page.getByRole('heading', {
        name: 'Vận hành gây quỹ',
        level: 4,
    });
    await expect(panelHeading).toBeVisible();
    const panel = panelHeading.locator(
        'xpath=ancestor::div[contains(@class,"space-y-4") and contains(@class,"border-t")]',
    );
    return panel;
};

const createDonationAsStudent = async (
    page: Page,
    args: {
        moduleId: string;
        amount: number;
        donorName: string;
        message: string;
    },
) => {
    await login(page, 'student');
    await page.goto(`/app/donate/${args.moduleId}`);
    await expect(
        page.getByRole('heading', { name: 'Ủng hộ', level: 1 }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('Nhập số tiền')).toBeVisible();
    await page.getByPlaceholder('Nhập số tiền').fill(String(args.amount));
    await page.getByPlaceholder('Tên của bạn').fill(args.donorName);
    await page.getByPlaceholder('Lời nhắn của bạn...').fill(args.message);
    const donateButton = page
        .locator('form')
        .getByRole('button', { name: /^Ủng hộ/ });
    await expect(donateButton).toBeEnabled();
    await donateButton.click();
    await page.waitForURL('**/app/my-donations');
};

const triggerSepayWebhook = async (
    request: APIRequestContext,
    args: {
        transactionId: string;
        campaignId: string;
        moduleId: string;
        amount: number;
        content: string;
    },
) => {
    const response = await request.post(
        'http://127.0.0.1:4000/api/v1/fundraising/sepay/webhook',
        {
            data: {
                transaction_id: args.transactionId,
                campaign_id: String(args.campaignId),
                module_id: String(args.moduleId),
                amount: args.amount,
                content: args.content,
                account_number: '9704xxxx',
                transaction_time: new Date().toISOString(),
            },
        },
    );

    if (!response.ok()) {
        throw new Error(
            `Webhook failed with ${response.status()}: ${await response.text()}`,
        );
    }
};

test.describe('fundraising reconciliation fullstack', () => {
    test.describe.configure({ mode: 'serial' });
    test('student donation can be matched, verified, and shown in reconciliation', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getFundraisingFixture(request);
        const amount = 123456;
        const donorName = `Student verify ${Date.now()}`;
        const transactionId = `verify_${Date.now()}`;

        await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'verify branch',
        });

        const studentDonationCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: formatCurrency(amount) });
        await expect(
            studentDonationCard.getByText('Chờ xác nhận'),
        ).toBeVisible();

        await triggerSepayWebhook(request, {
            transactionId,
            campaignId: fixture.campaignId,
            moduleId: fixture.moduleId,
            amount,
            content: `verify ${donorName}`,
        });

        await login(page, 'org');
        await openManagedCampaign(page);
        const fundraisingPanel = await openFundraisingPanel(page);

        const donationCard = fundraisingPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: donorName })
            .first();
        await expect(donationCard).toContainText('Đã khớp giao dịch');

        const transactionCard = fundraisingPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: transactionId })
            .first();
        await expect(transactionCard).toContainText('Đã khớp giao dịch');
        await expect(transactionCard).toContainText(donorName);

        const verifyResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/fundraising/donations/') &&
                response.url().endsWith('/verify'),
        );
        await donationCard.getByRole('button', { name: 'Xác minh' }).click();
        const verifyResponse = await verifyResponsePromise;
        if (!verifyResponse.ok()) {
            throw new Error(
                `Verify failed with ${verifyResponse.status()}: ${await verifyResponse.text()}`,
            );
        }
        await expect(donationCard).toContainText('Đã xác minh');

        await login(page, 'student');
        await page.goto('/app/my-donations');
        const verifiedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: formatCurrency(amount) })
            .first();
        await expect(verifiedCard.getByText('Đã xác nhận')).toBeVisible();
    });

    test('matched donation can be rejected and transaction returns to unmatched', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getFundraisingFixture(request);
        const amount = 234567;
        const donorName = `Student reject ${Date.now()}`;
        const transactionId = `reject_${Date.now()}`;

        await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'reject branch',
        });

        await triggerSepayWebhook(request, {
            transactionId,
            campaignId: fixture.campaignId,
            moduleId: fixture.moduleId,
            amount,
            content: `reject ${donorName}`,
        });

        await login(page, 'org');
        await openManagedCampaign(page);
        const fundraisingPanel = await openFundraisingPanel(page);

        const donationCard = fundraisingPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: donorName })
            .first();
        const transactionCard = fundraisingPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: transactionId })
            .first();

        await expect(donationCard).toContainText('Đã khớp giao dịch');
        await expect(transactionCard).toContainText('Đã khớp giao dịch');

        page.once('dialog', async (dialog) => {
            await dialog.accept('reject from fullstack test');
        });
        const rejectResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/fundraising/donations/') &&
                response.url().endsWith('/reject'),
        );
        await donationCard.getByRole('button', { name: 'Từ chối' }).click();
        const rejectResponse = await rejectResponsePromise;
        if (!rejectResponse.ok()) {
            throw new Error(
                `Reject failed with ${rejectResponse.status()}: ${await rejectResponse.text()}`,
            );
        }
        await expect(donationCard).toContainText('Từ chối');
        await expect(transactionCard).toContainText('Chưa khớp giao dịch');

        await login(page, 'student');
        await page.goto('/app/my-donations');
        const rejectedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: formatCurrency(amount) })
            .first();
        await expect(rejectedCard.getByText('Từ chối')).toBeVisible();
    });
});
