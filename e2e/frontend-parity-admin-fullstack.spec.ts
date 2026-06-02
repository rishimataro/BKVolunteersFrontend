import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';

const campaignSlug = 'mvp-chien-dich-thien-nguyen';
const sepayApiBaseUrl = 'http://127.0.0.1:4010';
const sepayBankAccountId = 'acc_demo_bidv_1';

const getFundraisingFixture = async (request: APIRequestContext) => {
    const response = await request.get(
        `http://127.0.0.1:4000/api/v1/public/campaigns/${campaignSlug}`,
    );
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data: {
            modules: Array<{ id: string; type: string }>;
        };
    };

    const module = body.data.modules.find(
        (item) => item.type === 'fundraising',
    );
    expect(module).toBeTruthy();

    return {
        moduleId: module!.id,
    };
};

const login = async (page: Page) => {
    await page.goto('/');
    await page.evaluate(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });
    await page.goto('/auth/login');
    await page.getByLabel('MSSV / Email:').fill('school.admin@dut.udn.vn');
    await page.getByLabel('Mật khẩu:').fill('Password@123');
    await page.getByRole('button', { name: /^Đăng nhập$/ }).click();
    await page.waitForURL('**/app');
};

const loginApi = async (
    request: APIRequestContext,
    role: 'school' | 'student',
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
    return body.data?.accessToken ?? body.data?.access_token ?? '';
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
    const response = await request.fetch(
        `http://127.0.0.1:4000/api/v1${args.path}`,
        {
            method: args.method ?? 'GET',
            headers: {
                Authorization: `Bearer ${args.accessToken}`,
            },
            data: args.data,
        },
    );

    if (!response.ok()) {
        throw new Error(
            `${args.method ?? 'GET'} ${args.path} failed with ${response.status()}: ${await response.text()}`,
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
    stamp: number,
) => {
    const response = await request.post(
        `${sepayApiBaseUrl}/__test/transactions`,
        {
            data: {
                transactions: [
                    {
                        id: `ui_pull_${stamp}`,
                        bank_account_id: sepayBankAccountId,
                        account_number: '0000000001',
                        transaction_content: `UNMATCHED-${stamp}`,
                        amount_in: 111111,
                        reference_number: `ref_ui_pull_${stamp}`,
                    },
                ],
            },
        },
    );
    expect(response.ok()).toBeTruthy();
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
            receiver_name: String(config.receiver_name ?? 'CLB Tinh nguyện CNTT'),
            bank_name: String(config.bank_name ?? 'BIDV'),
            bank_account_no: String(config.bank_account_no ?? '0000000001'),
            currency: String(config.currency ?? 'VND'),
            sepay_enabled: true,
            sepay_account_id: sepayBankAccountId,
            sepay_bank_account_id: sepayBankAccountId,
            sepay_mode: args.sepayMode,
            sepay_va_prefix: args.sepayMode === 'ORDER_VA' ? 'BKVVA' : null,
        },
    });
};

test.describe('frontend parity admin surfaces', () => {
    test.describe.configure({ mode: 'serial' });

    test('school admin can manage titles and SePay ops pages', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const stamp = Date.now();
        const titleName = `Danh hieu ${stamp}`;
        const titleNameUpdated = `Danh hieu cap nhat ${stamp}`;
        const fundraisingFixture = await getFundraisingFixture(request);
        const schoolToken = await loginApi(request, 'school');
        const studentToken = await loginApi(request, 'student');

        await resetSepayApiMock(request);

        await backendJson(request, {
            method: 'POST',
            path: '/fundraising/sepay/accounts/sync',
            accessToken: schoolToken,
        });

        await pushSepayApiTransactions(request, stamp);

        await configureFundraisingSepayMode(request, schoolToken, {
            moduleId: fundraisingFixture.moduleId,
            sepayMode: 'TRANSFER_CODE',
        });
        const orderVaDonation = await backendJson<{
            id: string;
            payment_instruction?: {
                sepay_order_id?: string | null;
            } | null;
        }>(request, {
            method: 'POST',
            path: `/fundraising/modules/${fundraisingFixture.moduleId}/donations`,
            accessToken: studentToken,
            data: {
                amount: 135000,
                donor_name: `Parity Student ${stamp}`,
                message: 'Bootstrap donation for ORDER_VA admin action',
            },
        });
        expect(orderVaDonation.payment_instruction?.sepay_order_id ?? null).toBeNull();
        await configureFundraisingSepayMode(request, schoolToken, {
            moduleId: fundraisingFixture.moduleId,
            sepayMode: 'ORDER_VA',
        });

        await login(page);

        await page.goto('/app/titles');
        await page.getByTestId('titles-open-create').click();
        await page.getByTestId('titles-form-name').fill(titleName);
        await page.getByTestId('titles-form-min-points').fill('120');
        await page
            .getByTestId('titles-form-description')
            .fill('Created by fullstack parity spec');
        await page
            .getByTestId('titles-form-icon-url')
            .fill(`https://cdn.example.com/title-${stamp}.svg`);
        await page.getByTestId('titles-form-submit').click();

        const createdTitleRow = page
            .locator('tbody tr')
            .filter({ hasText: titleName })
            .first();
        await expect(createdTitleRow).toContainText('120');

        await createdTitleRow.getByTitle('Chỉnh sửa').click();
        await page.getByTestId('titles-form-name').fill(titleNameUpdated);
        await page.getByTestId('titles-form-min-points').fill('180');
        await page.getByTestId('titles-form-submit').click();
        await expect(
            page.locator('tbody tr').filter({ hasText: titleNameUpdated }).first(),
        ).toContainText('180');

        page.once('dialog', async (dialog) => {
            await dialog.accept();
        });
        await page
            .locator('tbody tr')
            .filter({ hasText: titleNameUpdated })
            .first()
            .getByTitle('Xóa')
            .click();
        await expect(
            page.locator('tbody tr').filter({ hasText: titleNameUpdated }),
        ).toHaveCount(0);

        await page.goto('/app/sepay-ops');
        await expect(
            page.getByRole('heading', { name: 'SePay API v2 Operations' }),
        ).toBeVisible();

        await page.getByTestId('sepay-ops-sync-accounts').click();
        await expect(page.getByText('Đã hoàn tất').first()).toBeVisible();
        await expect(
            page.getByRole('cell', { name: sepayBankAccountId }).first(),
        ).toBeVisible();

        await page.getByTestId('sepay-ops-sync-transactions').click();
        await expect(
            page.getByText('Đã kéo transaction từ SePay API.'),
        ).toBeVisible();
        await expect(page.getByText(`ui_pull_${stamp}`)).toBeVisible();

        await page.getByTestId('sepay-ops-va-bank-account-id').fill(
            sepayBankAccountId,
        );
        await page.getByTestId('sepay-ops-sync-virtual-accounts').click();
        await expect(
            page.getByText('Đã đồng bộ virtual accounts từ SePay API.'),
        ).toBeVisible();

        await page
            .getByTestId('sepay-ops-order-va-donation-id')
            .fill(String(orderVaDonation.id));
        await page.getByTestId('sepay-ops-create-order-va').click();
        await expect(
            page.getByText('Đã gửi yêu cầu tạo ORDER_VA cho donation.'),
        ).toBeVisible();

        const refreshedDonation = await backendJson<{
            id: string;
            payment_instruction?: {
                sepay_order_id?: string | null;
                virtual_account?:
                    | {
                          va_number?: string | null;
                      }
                    | string
                    | null;
                provider_qr_url?: string | null;
            } | null;
        }>(request, {
            path: `/fundraising/donations/${orderVaDonation.id}`,
            accessToken: schoolToken,
        });
        expect(refreshedDonation.payment_instruction?.sepay_order_id).toBeTruthy();
        expect(refreshedDonation.payment_instruction?.provider_qr_url).toBeTruthy();
        if (
            refreshedDonation.payment_instruction?.virtual_account &&
            typeof refreshedDonation.payment_instruction.virtual_account === 'object'
        ) {
            expect(
                refreshedDonation.payment_instruction.virtual_account.va_number,
            ).toBeTruthy();
        }

    });
});
