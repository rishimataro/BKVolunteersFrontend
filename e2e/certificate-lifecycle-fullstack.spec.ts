import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';

type LoginRole = 'studentA' | 'org' | 'schoolAdmin';

const campaignSlug = 'mvp-chien-dich-thien-nguyen';
const campaignTitlePattern = /MVP .*thiện nguyện/i;

const getCampaignFixture = async (request: APIRequestContext) => {
    const response = await request.get(
        `http://127.0.0.1:4000/api/v1/public/campaigns/${campaignSlug}`,
    );
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data: {
            id: string;
            title: string;
            slug: string;
            modules: Array<{ id: string; type: string; title: string }>;
        };
    };

    const eventModule = body.data.modules.find((item) => item.type === 'event');
    expect(eventModule).toBeTruthy();

    return {
        campaignId: body.data.id,
        campaignTitle: body.data.title,
        slug: body.data.slug,
        eventModuleId: eventModule!.id,
        eventModuleTitle: eventModule!.title,
    };
};

const login = async (page: Page, role: LoginRole) => {
    const credentials =
        role === 'studentA'
            ? {
                  identifier: '102210001',
                  password: '102210001',
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

const openManagedCampaign = async (page: Page) => {
    await page.goto('/app/campaigns');
    const campaignButton = page
        .getByRole('button')
        .filter({ hasText: campaignTitlePattern })
        .first();
    await expect(campaignButton).toBeVisible();
    await campaignButton.click();
    await expect(
        page.getByRole('heading', {
            name: campaignTitlePattern,
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

const acceptPrompt = async (page: Page, message: string) => {
    page.once('dialog', async (dialog) => {
        await dialog.accept(message);
    });
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

test.describe('certificate lifecycle fullstack', () => {
    test.describe.configure({ mode: 'serial' });

    test('completed event -> certificate render -> public verify -> revoke -> reissue -> report', async ({
        page,
        request,
    }) => {
        test.setTimeout(180000);

        const fixture = await getCampaignFixture(request);

        await login(page, 'studentA');
        await page.goto(`/app/campaigns/${fixture.slug}`);
        const eventModuleBlock = page
            .locator('section, div')
            .filter({ hasText: fixture.eventModuleTitle })
            .filter({ hasText: 'Đăng ký tham gia sự kiện' })
            .first();
        await eventModuleBlock
            .getByPlaceholder('Ghi chú đăng ký (nếu có)')
            .fill('student A certificate fullstack note');
        const createRegistrationResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response
                    .url()
                    .includes(
                        `/events/modules/${fixture.eventModuleId}/registrations`,
                    ),
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
        await openManagedCampaign(page);
        const eventPanel = await openEventPanel(page, fixture.eventModuleTitle);
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

        acceptPrompt(page, '3');
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

        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        await page.getByRole('button', { name: 'Tạo chứng nhận' }).click();
        await expect(
            page.getByText('Tạo chứng nhận cho chiến dịch'),
        ).toBeVisible();
        const templateSelect = page.locator('select').first();
        await expect(templateSelect).toContainText('Volunteer MVP Certificate');
        const generateResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response
                    .url()
                    .includes(
                        `/certificates/campaigns/${fixture.campaignId}/generate`,
                    ),
        );
        await page.getByRole('button', { name: 'Tạo ngay' }).click();
        const generateResponse = await generateResponsePromise;
        if (!generateResponse.ok()) {
            throw new Error(
                `Generate certificates failed with ${generateResponse.status()}: ${await generateResponse.text()}`,
            );
        }

        const initialCertificateRow = page
            .locator('tbody tr')
            .filter({ hasText: 'Nguyen Van A' })
            .filter({ hasText: '102210001' })
            .first();
        await expect(initialCertificateRow).toContainText('Chờ xử lý');
        const originalCertificateNo =
            (
                await initialCertificateRow.locator('td').first().textContent()
            )?.trim() ?? '';
        expect(originalCertificateNo).toMatch(/^CERT-/);

        await login(page, 'schoolAdmin');
        await runBackgroundJobs(page);

        await login(page, 'org');
        const listReadyCertificatesResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'GET' &&
                response
                    .url()
                    .includes(
                        `/api/v1/certificates/campaigns/${fixture.campaignId}`,
                    ) &&
                response.ok(),
        );
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        const listReadyCertificatesResponse =
            await listReadyCertificatesResponsePromise;
        const readyCertificateRow = page
            .locator('tbody tr')
            .filter({ hasText: originalCertificateNo })
            .first();
        await expect(readyCertificateRow).toContainText('Sẵn sàng');
        const readyCertificatesBody =
            (await listReadyCertificatesResponse.json()) as {
                data: Array<{
                    certificate_no: string;
                    file_url: string | null;
                }>;
            };
        const readyCertificate = readyCertificatesBody.data.find(
            (item) => item.certificate_no === originalCertificateNo,
        );
        expect(readyCertificate?.file_url).toBeTruthy();
        const pdfResponse = await request.get(
            readyCertificate!.file_url!.startsWith('http')
                ? readyCertificate!.file_url!
                : `http://127.0.0.1:4000${readyCertificate!.file_url!}`,
        );
        expect(pdfResponse.ok()).toBeTruthy();
        const pdfBytes = await pdfResponse.body();
        expect(pdfBytes.toString('utf8', 0, 8)).toBe('%PDF-1.4');

        await login(page, 'schoolAdmin');
        await page.goto('/app/reports');
        const reportSection = page
            .locator('section')
            .filter({ hasText: 'Báo cáo chiến dịch' })
            .first();
        await reportSection
            .locator('select')
            .selectOption({ label: fixture.campaignTitle });
        await expect(
            page.getByRole('heading', { name: fixture.campaignTitle }),
        ).toBeVisible();
        await expect
            .poll(async () => getMetricValue(page, 'Chứng nhận đã phát hành'), {
                timeout: 10000,
            })
            .toBeGreaterThanOrEqual(1);

        await page.goto('/certificates/verify');
        await page
            .getByPlaceholder('Nhập mã chứng nhận')
            .fill(originalCertificateNo);
        await page.getByRole('button', { name: 'Kiểm tra' }).click();
        await expect(page.getByText('Chứng nhận hợp lệ')).toBeVisible();

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        const revokableRow = page
            .locator('tbody tr')
            .filter({ hasText: originalCertificateNo })
            .first();
        await expect(revokableRow).toContainText('Sẵn sàng');

        const revokeResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/certificates/') &&
                response.url().endsWith('/revoke'),
        );
        await revokableRow.getByTitle('Thu hồi').click();
        await page
            .getByPlaceholder('Nhập lý do thu hồi (không bắt buộc)')
            .fill('Thu hồi để kiểm tra full-stack');
        await page.getByRole('button', { name: 'Xác nhận thu hồi' }).click();
        const revokeResponse = await revokeResponsePromise;
        if (!revokeResponse.ok()) {
            throw new Error(
                `Revoke certificate failed with ${revokeResponse.status()}: ${await revokeResponse.text()}`,
            );
        }
        await expect(revokableRow).toContainText('Đã thu hồi');

        await page.goto('/certificates/verify');
        await page
            .getByPlaceholder('Nhập mã chứng nhận')
            .fill(originalCertificateNo);
        await page.getByRole('button', { name: 'Kiểm tra' }).click();
        await expect(page.getByText('Chứng nhận không hợp lệ')).toBeVisible();

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        const revokedRow = page
            .locator('tbody tr')
            .filter({ hasText: originalCertificateNo })
            .first();
        const reissueResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/certificates/') &&
                response.url().endsWith('/reissue'),
        );
        await revokedRow.getByTitle('Cấp lại').click();
        const reissueResponse = await reissueResponsePromise;
        if (!reissueResponse.ok()) {
            throw new Error(
                `Reissue certificate failed with ${reissueResponse.status()}: ${await reissueResponse.text()}`,
            );
        }
        const reissueBody = (await reissueResponse.json()) as {
            data: {
                certificate_no: string;
            };
        };
        const replacementCertificateNo = reissueBody.data.certificate_no;
        expect(replacementCertificateNo).toMatch(/^CERT-/);
        expect(replacementCertificateNo).not.toBe(originalCertificateNo);

        const replacementRow = page
            .locator('tbody tr')
            .filter({ hasText: replacementCertificateNo })
            .first();
        await expect(replacementRow).toContainText('Chờ xử lý');

        await login(page, 'schoolAdmin');
        await runBackgroundJobs(page);

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        const replacementReadyRow = page
            .locator('tbody tr')
            .filter({ hasText: replacementCertificateNo })
            .first();
        await expect(replacementReadyRow).toContainText('Sẵn sàng');

        await page.goto('/certificates/verify');
        await page
            .getByPlaceholder('Nhập mã chứng nhận')
            .fill(replacementCertificateNo);
        await page.getByRole('button', { name: 'Kiểm tra' }).click();
        await expect(page.getByText('Chứng nhận hợp lệ')).toBeVisible();
    });
});
