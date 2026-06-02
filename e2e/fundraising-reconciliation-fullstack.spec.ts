import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';
import crypto from 'node:crypto';

type UserRole = 'student' | 'org' | 'school';

const campaignSlug = 'mvp-chien-dich-thien-nguyen';
const campaignButtonPattern = /MVP .*thiện nguyện/i;
const sepayWebhookSecret = 'test-sepay-secret';
const sepayApiBaseUrl = 'http://127.0.0.1:4010';
const sepayBankAccountId = 'acc_demo_bidv_1';

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
            : role === 'school'
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
    await page.waitForURL('**/app**');
};

const loginApi = async (
    request: APIRequestContext,
    role: Extract<UserRole, 'student' | 'school'>,
) => {
    const credentials =
        role === 'student'
            ? {
                  identifier: '102210001',
                  password: '102210001',
              }
            : {
                  identifier: 'school.admin@dut.udn.vn',
                  password: 'Password@123',
              };

    const response = await request.post(
        'http://127.0.0.1:4000/api/v1/auth/login',
        {
            data: credentials,
        },
    );
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data?: {
            accessToken?: string;
            access_token?: string;
        };
    };
    const accessToken =
        body.data?.accessToken ?? body.data?.access_token ?? null;
    expect(accessToken).toBeTruthy();
    return accessToken!;
};

const backendJson = async <T>(
    request: APIRequestContext,
    args: {
        method?: 'GET' | 'POST' | 'PATCH';
        path: string;
        accessToken: string;
        data?: unknown;
    },
) => {
    const method = args.method ?? 'GET';
    const response = await request.fetch(
        `http://127.0.0.1:4000/api/v1${args.path}`,
        {
            method,
            headers: {
                Authorization: `Bearer ${args.accessToken}`,
            },
            data: args.data,
        },
    );
    if (!response.ok()) {
        throw new Error(
            `${method} ${args.path} failed with ${response.status()}: ${await response.text()}`,
        );
    }

    const body = (await response.json()) as { data: T };
    return body.data;
};

const resetSepayApiMock = async (request: APIRequestContext) => {
    const response = await request.post(`${sepayApiBaseUrl}/__test/reset`);
    expect(response.ok()).toBeTruthy();
};

const pushSepayApiTransactions = async (
    request: APIRequestContext,
    transactions: Array<Record<string, unknown>>,
) => {
    const response = await request.post(
        `${sepayApiBaseUrl}/__test/transactions`,
        {
            data: {
                transactions,
            },
        },
    );
    expect(response.ok()).toBeTruthy();
};

const syncSepayAccounts = async (
    request: APIRequestContext,
    accessToken: string,
) => {
    await backendJson(request, {
        method: 'POST',
        path: '/fundraising/sepay/accounts/sync',
        accessToken,
    });
};

const syncSepayTransactions = async (
    request: APIRequestContext,
    accessToken: string,
    args?: {
        sepay_bank_account_id?: string;
    },
) => {
    await backendJson(request, {
        method: 'POST',
        path: '/fundraising/sepay/transactions/sync',
        accessToken,
        data: {
            sepay_bank_account_id:
                args?.sepay_bank_account_id ?? sepayBankAccountId,
        },
    });
};

const configureFundraisingSepayMode = async (
    request: APIRequestContext,
    accessToken: string,
    args: {
        moduleId: string;
        sepayMode: 'TRANSFER_CODE' | 'ORDER_VA';
    },
) => {
    const moduleDetail = await backendJson<{
        settings_json?: Record<string, unknown>;
    }>(request, {
        path: `/fundraising/modules/${args.moduleId}`,
        accessToken,
    });
    const config = moduleDetail.settings_json ?? {};

    await backendJson(request, {
        method: 'PATCH',
        path: `/fundraising/modules/${args.moduleId}/config`,
        accessToken,
        data: {
            target_amount: Number(config.target_amount ?? 5000000),
            receiver_name: String(
                config.receiver_name ?? 'CLB Tinh nguyện CNTT',
            ),
            bank_name: String(config.bank_name ?? 'BIDV'),
            bank_account_no: String(config.bank_account_no ?? '0000000001'),
            currency: String(config.currency ?? 'VND'),
            sepay_enabled: true,
            sepay_account_id: sepayBankAccountId,
            sepay_bank_account_id: sepayBankAccountId,
            sepay_mode: args.sepayMode,
            sepay_va_prefix:
                args.sepayMode === 'ORDER_VA' ? 'BKVVA' : null,
        },
    });
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
    return panelHeading.locator(
        'xpath=ancestor::div[contains(@class,"space-y-4") and contains(@class,"border-t")]',
    );
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
    await page.getByPlaceholder('Nhập số tiền').fill(String(args.amount));
    await page.getByPlaceholder('Tên của bạn').fill(args.donorName);
    await page.getByPlaceholder('Lời nhắn của bạn...').fill(args.message);

    const donateButton = page
        .locator('form')
        .getByRole('button', { name: /^Ủng hộ/ });
    await expect(donateButton).toBeEnabled();
    await donateButton.click();

    await page.waitForURL('**/app/donations/*/payment');
    await expect(
        page.getByRole('heading', { name: 'Thanh toán donation', level: 3 }),
    ).toBeVisible();

    const donationMatch = page.url().match(/\/app\/donations\/(\d+)\/payment/);
    expect(donationMatch).toBeTruthy();
    const donationId = donationMatch![1];
    const paymentCode = `BKV-${donationId}`;

    await expect(page.getByText(paymentCode, { exact: false })).toBeVisible();
    await expect(page.getByTestId('payment-status-banner')).toBeVisible();

    return { donationId, paymentCode };
};

const triggerSepayWebhook = async (
    request: APIRequestContext,
    args: {
        transactionId: string;
        amount: number;
        paymentCode: string;
    },
) => {
    const payload = {
        gateway: 'BIDV',
        transactionDate: new Date().toISOString(),
        accountNumber: '0000000001',
        content: args.paymentCode,
        description: args.paymentCode,
        transferType: 'in',
        transferAmount: args.amount,
        referenceCode: args.transactionId,
        accumulated: 0,
    };
    const rawBody = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = `sha256=${crypto
        .createHmac('sha256', sepayWebhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex')}`;
    const response = await request.post(
        'http://127.0.0.1:4000/api/v1/fundraising/sepay/webhook',
        {
            headers: {
                'x-sepay-signature': signature,
                'x-sepay-timestamp': timestamp,
            },
            data: payload,
        },
    );

    if (!response.ok()) {
        throw new Error(
            `Webhook failed with ${response.status()}: ${await response.text()}`,
        );
    }
};

const getDonationPaymentState = async (
    request: APIRequestContext,
    accessToken: string,
    donationId: string,
) =>
    backendJson<{
        provider_references?: {
            sepay_order_id?: string | null;
            sepay_bank_account_id?: string | null;
            sepay_virtual_account_id?: string | null;
        } | null;
    }>(request, {
        path: `/fundraising/donations/${donationId}`,
        accessToken,
    });

test.describe('fundraising reconciliation fullstack', () => {
    test.describe.configure({ mode: 'serial' });

    test('student donation can be exact-matched by payment code, verified, and shown in reconciliation', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getFundraisingFixture(request);
        const amount = 123456;
        const donorName = `Student verify ${Date.now()}`;
        const transactionId = `verify_${Date.now()}`;

        const { donationId, paymentCode } = await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'verify branch',
        });

        await triggerSepayWebhook(request, {
            transactionId,
            amount,
            paymentCode,
        });

        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã ghi nhận giao dịch'),
        ).toBeVisible({ timeout: 15000 });

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
        await expect(transactionCard).toContainText(paymentCode);
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
        await page.goto(`/app/donations/${donationId}/payment`);
        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã xác minh thành công'),
        ).toBeVisible();

        await page.goto('/app/my-donations');
        const verifiedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: formatCurrency(amount) })
            .first();
        await expect(verifiedCard.getByText('Đã xác nhận')).toBeVisible();
    });

    test('student donation can be exact-matched by SePay API pull when webhook is absent', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        await resetSepayApiMock(request);
        const fixture = await getFundraisingFixture(request);
        const schoolToken = await loginApi(request, 'school');
        await syncSepayAccounts(request, schoolToken);
        await configureFundraisingSepayMode(request, schoolToken, {
            moduleId: fixture.moduleId,
            sepayMode: 'TRANSFER_CODE',
        });

        const amount = 345678;
        const donorName = `Student api pull ${Date.now()}`;
        const transactionId = `api_pull_${Date.now()}`;

        const { donationId, paymentCode } = await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'api pull branch',
        });

        await pushSepayApiTransactions(request, [
            {
                id: transactionId,
                bank_account_id: sepayBankAccountId,
                account_number: '0000000001',
                transaction_content: paymentCode,
                amount_in: amount,
                reference_number: `ref_${transactionId}`,
            },
        ]);
        await syncSepayTransactions(request, schoolToken);

        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã ghi nhận giao dịch'),
        ).toBeVisible({ timeout: 15000 });

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
        await expect(transactionCard).toContainText(paymentCode);

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

        await login(page, 'student');
        await page.goto(`/app/donations/${donationId}/payment`);
        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã xác minh thành công'),
        ).toBeVisible();
    });

    test('order VA donation renders provider data and matches by order code through API pull', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        await resetSepayApiMock(request);
        const fixture = await getFundraisingFixture(request);
        const schoolToken = await loginApi(request, 'school');
        const studentToken = await loginApi(request, 'student');
        await syncSepayAccounts(request, schoolToken);
        await configureFundraisingSepayMode(request, schoolToken, {
            moduleId: fixture.moduleId,
            sepayMode: 'ORDER_VA',
        });

        const amount = 456789;
        const donorName = `Student order va ${Date.now()}`;
        const transactionId = `order_va_${Date.now()}`;

        const { donationId, paymentCode } = await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'order va branch',
        });

        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Chờ thanh toán qua Order VA'),
        ).toBeVisible();
        await expect(
            page.getByTestId('payment-order-va-summary'),
        ).toBeVisible();
        await expect(
            page.getByTestId('payment-virtual-account'),
        ).toBeVisible();
        await expect(page.getByAltText('SePay order QR')).toBeVisible();

        const donationState = await getDonationPaymentState(
            request,
            studentToken,
            donationId,
        );
        await expect(
            page.getByText(
                donationState.provider_references?.sepay_order_id ?? '',
                { exact: false },
            ),
        ).toBeVisible();

        await pushSepayApiTransactions(request, [
            {
                id: transactionId,
                bank_account_id: sepayBankAccountId,
                account_number: '0000000001',
                transaction_content: 'Thanh toán order VA',
                amount_in: amount,
                reference_number: `ref_${transactionId}`,
                code: paymentCode,
                va_id:
                    donationState.provider_references
                        ?.sepay_virtual_account_id ?? undefined,
            },
        ]);
        await syncSepayTransactions(request, schoolToken);

        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã ghi nhận giao dịch'),
        ).toBeVisible({ timeout: 15000 });

        await login(page, 'org');
        await openManagedCampaign(page);
        const fundraisingPanel = await openFundraisingPanel(page);
        const donationCard = fundraisingPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: donorName })
            .first();
        await expect(donationCard).toContainText('Đã khớp giao dịch');

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

        await login(page, 'student');
        await page.goto(`/app/donations/${donationId}/payment`);
        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã xác minh thành công'),
        ).toBeVisible();
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

        const { donationId, paymentCode } = await createDonationAsStudent(page, {
            moduleId: fixture.moduleId,
            amount,
            donorName,
            message: 'reject branch',
        });

        await triggerSepayWebhook(request, {
            transactionId,
            amount,
            paymentCode,
        });

        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đã ghi nhận giao dịch'),
        ).toBeVisible({ timeout: 15000 });

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

        const rejectResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/fundraising/donations/') &&
                response.url().endsWith('/reject'),
        );
        await donationCard.getByRole('button', { name: 'Từ chối' }).click();
        await expect(
            page.getByRole('heading', {
                name: 'Từ chối khoản đóng góp',
            }),
        ).toBeVisible();
        await page
            .getByPlaceholder('VD: Nội dung chuyển khoản không hợp lệ')
            .fill('reject from fullstack test');
        await page
            .getByRole('button', { name: 'Xác nhận từ chối' })
            .click();
        const rejectResponse = await rejectResponsePromise;
        if (!rejectResponse.ok()) {
            throw new Error(
                `Reject failed with ${rejectResponse.status()}: ${await rejectResponse.text()}`,
            );
        }

        await expect(donationCard).toContainText('Từ chối');
        await expect(transactionCard).toContainText('Chưa khớp giao dịch');

        await login(page, 'student');
        await page.goto(`/app/donations/${donationId}/payment`);
        await expect(
            page
                .getByTestId('payment-status-banner')
                .getByText('Đóng góp cần xử lý lại'),
        ).toBeVisible();

        await page.goto('/app/my-donations');
        const rejectedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: formatCurrency(amount) })
            .first();
        await expect(rejectedCard.getByText('Từ chối')).toBeVisible();
    });
});
