import { expect, test, type Page } from '@playwright/test';

type LoginRole = 'studentA' | 'org' | 'reviewer' | 'schoolAdmin';

const timestamp = Date.now();
const campaignTitle = `Sprint4 MVP ${timestamp}`;
const campaignSummary = `Summary ${timestamp}`;
const eventModuleTitle = `Volunteer Event ${timestamp}`;

const toDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const login = async (page: Page, role: LoginRole) => {
    const credentials =
        role === 'studentA'
            ? {
                  identifier: '102210001',
                  password: '102210001',
              }
            : role === 'reviewer'
              ? {
                    identifier: 'reviewer@dut.udn.vn',
                    password: 'Password@123',
                }
              : role === 'schoolAdmin'
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

const acceptPrompt = async (page: Page, message: string) => {
    page.once('dialog', async (dialog) => {
        await dialog.accept(message);
    });
};

const openManagedCampaign = async (page: Page, title: string) => {
    await page.goto('/app/campaigns');
    const campaignButton = page
        .getByRole('button')
        .filter({ hasText: title })
        .first();
    await expect(campaignButton).toBeVisible();
    await campaignButton.click();
    await expect(
        page.getByRole('heading', {
            name: title,
            exact: true,
        }),
    ).toBeVisible();
};

const openEventPanel = async (page: Page, moduleTitle: string) => {
    const panelHeading = page.getByRole('heading', {
        name: 'Vận hành tuyển TNV',
        level: 4,
    });
    await expect(panelHeading).toBeVisible();
    const panel = panelHeading.locator(
        'xpath=ancestor::div[contains(@class,"space-y-4") and contains(@class,"border-t")]',
    );
    await panel.locator('select').first().selectOption({ label: moduleTitle });
    return panel;
};

const runBackgroundJobs = async (page: Page) => {
    await page.goto('/app/background-jobs');
    const responsePromise = page.waitForResponse(
        (response) =>
            response.request().method() === 'POST' &&
            response.url().includes('/admin/background-jobs/run'),
    );
    await page.getByRole('button', { name: 'Chạy job đến hạn' }).click();
    const response = await responsePromise;
    if (!response.ok()) {
        throw new Error(
            `Run background jobs failed with ${response.status()}: ${await response.text()}`,
        );
    }
    await expect(page.getByText('Đã xử lý queue')).toBeVisible();
};

const getMetricValue = async (page: Page, label: string) => {
    const card = page
        .locator('div.rounded-lg.border.border-slate-200')
        .filter({ hasText: label })
        .first();
    await expect(card).toBeVisible();
    const value = await card.locator('p').nth(1).textContent();
    return Number((value ?? '0').replace(/[^\d]/g, '')) || 0;
};

const extractDataId = async (
    response: Awaited<ReturnType<Page['waitForResponse']>>,
) => {
    const body = (await response.json()) as {
        data?: { id?: string | number };
        id?: string | number;
    };

    const id = body.data?.id ?? body.id;
    expect(id).toBeTruthy();
    return String(id);
};

test.describe('mvp fullstack', () => {
    test.describe.configure({ mode: 'serial' });

    test('create -> approve -> publish -> participate -> certificate -> report', async ({
        page,
    }) => {
        test.setTimeout(180000);

        const now = new Date();
        const campaignStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const campaignEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
        const moduleStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const moduleEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        await login(page, 'org');
        await page.goto('/app/campaigns');

        await page.getByPlaceholder('Tiêu đề chiến dịch').fill(campaignTitle);
        await page.getByPlaceholder('Tóm tắt chiến dịch').fill(campaignSummary);
        await page
            .getByPlaceholder('Mô tả ngắn')
            .fill(
                'Fullstack MVP create approve publish participate certificate report',
            );
        await page
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill(toDateTimeLocal(campaignStart));
        await page
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill(toDateTimeLocal(campaignEnd));

        const createCampaignResponsePromise = page.waitForResponse(
            (response) =>
                response.url().includes('/api/v1/campaigns') &&
                response.request().method() === 'POST' &&
                response.ok(),
        );
        await page.getByRole('button', { name: 'Tạo chiến dịch' }).click();
        const createCampaignResponse = await createCampaignResponsePromise;
        const campaignId = await extractDataId(createCampaignResponse);

        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        const moduleForm = page.locator('form').filter({
            hasText: 'Thêm hạng mục vào chiến dịch',
        });
        await moduleForm.locator('select').first().selectOption('event');
        await moduleForm
            .getByPlaceholder('Tên hạng mục')
            .fill(eventModuleTitle);
        await moduleForm
            .getByPlaceholder('Mô tả hạng mục')
            .fill('Fullstack MVP volunteer event');
        await moduleForm
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill(toDateTimeLocal(moduleStart));
        await moduleForm
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill(toDateTimeLocal(moduleEnd));
        await moduleForm.getByPlaceholder('Số lượng quota').fill('50');
        await moduleForm.getByPlaceholder('Địa điểm').fill('DUT Campus');

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
                hasText: eventModuleTitle,
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
        const reviewerCampaignButton = page
            .getByRole('button', { name: new RegExp(campaignTitle) })
            .first();
        await expect(reviewerCampaignButton).toBeVisible();
        await reviewerCampaignButton.click();
        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        await acceptPrompt(page, 'Fullstack MVP pre-approve');
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

        await acceptPrompt(page, 'Fullstack MVP approve');
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
            page
                .getByRole('button', { name: 'Công khai', exact: true })
                .click(),
        ]);

        await expect(
            page.locator('span[title="Công khai"]').first(),
        ).toBeVisible();

        await page.goto('/campaigns');
        await page
            .getByPlaceholder('Tìm theo tên chiến dịch hoặc đơn vị')
            .fill(campaignTitle);
        const publicCampaignLink = page
            .locator('a')
            .filter({ hasText: campaignTitle })
            .first();
        await expect(publicCampaignLink).toBeVisible();
        const detailHref = await publicCampaignLink.getAttribute('href');
        expect(detailHref).toMatch(/^\/campaigns\/.+/);
        const slug = detailHref!.split('/').at(-1);
        expect(slug).toBeTruthy();

        await login(page, 'studentA');
        await page.goto(`/app/campaigns/${slug}`);
        const eventModuleBlock = page
            .locator('section, div')
            .filter({ hasText: eventModuleTitle })
            .filter({ hasText: 'Đăng ký tham gia sự kiện' })
            .first();
        await eventModuleBlock
            .getByPlaceholder('Ghi chú đăng ký (nếu có)')
            .fill('student A MVP fullstack note');
        const createRegistrationResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/events/modules/') &&
                response.url().includes('/registrations'),
        );
        await eventModuleBlock
            .getByRole('button', { name: 'Gửi đăng ký sự kiện' })
            .click();
        const createRegistrationResponse =
            await createRegistrationResponsePromise;
        if (!createRegistrationResponse.ok()) {
            throw new Error(
                `Create event registration failed with ${createRegistrationResponse.status()}: ${await createRegistrationResponse.text()}`,
            );
        }

        await login(page, 'org');
        await openManagedCampaign(page, campaignTitle);
        const eventPanel = await openEventPanel(page, eventModuleTitle);
        const registrationCard = eventPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: 'Nguyen Van A' })
            .filter({ hasText: '102210001' })
            .first();

        const approveResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/events/registrations/') &&
                response.url().endsWith('/approve'),
        );
        await registrationCard.getByRole('button', { name: 'Duyệt' }).click();
        const approveResponse = await approveResponsePromise;
        if (!approveResponse.ok()) {
            throw new Error(
                `Approve event failed with ${approveResponse.status()}: ${await approveResponse.text()}`,
            );
        }

        const checkinResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/events/registrations/') &&
                response.url().endsWith('/check-in'),
        );
        await registrationCard
            .getByRole('button', { name: 'Check-in' })
            .click();
        const checkinResponse = await checkinResponsePromise;
        if (!checkinResponse.ok()) {
            throw new Error(
                `Check-in event failed with ${checkinResponse.status()}: ${await checkinResponse.text()}`,
            );
        }

        await acceptPrompt(page, '4');
        const completeResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/events/registrations/') &&
                response.url().endsWith('/complete'),
        );
        await registrationCard
            .getByRole('button', { name: 'Hoàn thành' })
            .click();
        const completeResponse = await completeResponsePromise;
        if (!completeResponse.ok()) {
            throw new Error(
                `Complete event failed with ${completeResponse.status()}: ${await completeResponse.text()}`,
            );
        }
        await expect(registrationCard).toContainText('Hoàn thành');

        await page.goto(`/app/certificates/campaigns/${campaignId}`);
        await page.getByRole('button', { name: 'Tạo chứng nhận' }).click();
        await expect(
            page.getByText('Tạo chứng nhận cho chiến dịch'),
        ).toBeVisible();
        await expect(page.locator('select').first()).toContainText(
            'Volunteer MVP Certificate',
        );

        const generateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response
                    .url()
                    .includes(`/certificates/campaigns/${campaignId}/generate`),
        );
        await page.getByRole('button', { name: 'Tạo ngay' }).click();
        const generateResponse = await generateResponsePromise;
        if (!generateResponse.ok()) {
            throw new Error(
                `Generate certificates failed with ${generateResponse.status()}: ${await generateResponse.text()}`,
            );
        }

        const pendingCertificateRow = page
            .locator('tbody tr')
            .filter({ hasText: 'Nguyen Van A' })
            .filter({ hasText: '102210001' })
            .first();
        await expect(pendingCertificateRow).toContainText('Chờ xử lý');
        const certificateNo =
            (
                await pendingCertificateRow.locator('td').first().textContent()
            )?.trim() ?? '';
        expect(certificateNo).toMatch(/^CERT-/);

        await login(page, 'schoolAdmin');
        await runBackgroundJobs(page);

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${campaignId}`);
        const readyCertificateRow = page
            .locator('tbody tr')
            .filter({ hasText: certificateNo })
            .first();
        await expect(readyCertificateRow).toContainText('Sẵn sàng');

        await page.goto('/certificates/verify');
        await page.getByPlaceholder('Nhập mã chứng nhận').fill(certificateNo);
        await page.getByRole('button', { name: 'Kiểm tra' }).click();
        await expect(page.getByText('Chứng nhận hợp lệ')).toBeVisible();

        await login(page, 'schoolAdmin');
        await page.goto('/app/reports');
        const reportSection = page
            .locator('section')
            .filter({ hasText: 'Báo cáo chiến dịch' })
            .first();
        await reportSection
            .locator('select')
            .selectOption({ label: campaignTitle });
        await expect(
            page.getByRole('heading', {
                name: campaignTitle,
                exact: true,
            }),
        ).toBeVisible();

        await expect
            .poll(async () => getMetricValue(page, 'Sự kiện hoàn thành'), {
                timeout: 10000,
            })
            .toBeGreaterThanOrEqual(1);

        await expect
            .poll(async () => getMetricValue(page, 'Chứng nhận đã phát hành'), {
                timeout: 10000,
            })
            .toBeGreaterThanOrEqual(1);
    });
});
