import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';

type LoginRole = 'studentA' | 'studentB' | 'studentC' | 'org';

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

    const itemModule = body.data.modules.find(
        (item) => item.type === 'item_donation',
    );
    const eventModule = body.data.modules.find((item) => item.type === 'event');

    expect(itemModule).toBeTruthy();
    expect(eventModule).toBeTruthy();

    return {
        campaignId: body.data.id,
        campaignTitle: body.data.title,
        slug: body.data.slug,
        itemModuleId: itemModule!.id,
        itemModuleTitle: itemModule!.title,
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
            : role === 'studentB'
              ? {
                    identifier: '102210002',
                    password: '102210002',
                }
              : role === 'studentC'
                ? {
                      identifier: '102210003',
                      password: '102210003',
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

const parseSummaryMetric = async (page: Page, label: string) => {
    const card = page
        .locator('div.rounded-xl.border.border-blue-100')
        .filter({ hasText: label })
        .first();
    await expect(card).toBeVisible();
    const value = await card.locator('p').nth(1).textContent();
    return Number((value ?? '0').replace(/[^\d]/g, '')) || 0;
};

const waitForStudentDashboard = async (page: Page) => {
    const dashboardResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'GET' &&
            response.url().includes('/students/me/dashboard') &&
            response.ok(),
    );
    const activitiesResponse = page.waitForResponse(
        (response) =>
            response.request().method() === 'GET' &&
            response.url().includes('/students/me/activities') &&
            response.ok(),
    );

    await page.goto('/app');
    await Promise.all([dashboardResponse, activitiesResponse]);
};

const openManagedCampaign = async (page: Page) => {
    await page.goto('/app/campaigns');
    const campaignButton = page
        .getByRole('button')
        .filter({ hasText: campaignTitlePattern });
    await expect(campaignButton.first()).toBeVisible();
    await campaignButton.first().click();
    await expect(
        page.getByRole('heading', {
            name: campaignTitlePattern,
        }),
    ).toBeVisible();
};

const openItemPanel = async (page: Page, moduleTitle: string) => {
    const panelHeading = page.getByRole('heading', {
        name: 'Vận hành hiện vật',
        level: 4,
    });
    await expect(panelHeading).toBeVisible();
    const panel = panelHeading.locator(
        'xpath=ancestor::div[contains(@class,"space-y-4") and contains(@class,"border-t")]',
    );
    await panel.locator('select').first().selectOption({ label: moduleTitle });
    return panel;
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

const openNotificationMenu = async (page: Page) => {
    const trigger = page.locator('button:has(svg.lucide-bell)').first();
    await expect(trigger).toBeVisible();
    await trigger.click();
    await expect(page.getByText(/^Thông báo$/)).toBeVisible();
};

const acceptPrompt = async (page: Page, message: string) => {
    page.once('dialog', async (dialog) => {
        await dialog.accept(message);
    });
};

test.describe('sprint 3 fullstack journeys', () => {
    test.describe.configure({ mode: 'serial' });

    test('item donation confirm -> handover updates student dashboard and notifications', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getCampaignFixture(request);

        await login(page, 'studentA');
        await waitForStudentDashboard(page);
        const itemReceivedBefore = await parseSummaryMetric(
            page,
            'Hiện vật đã nhận',
        );

        await page.goto(`/app/campaigns/${fixture.slug}`);
        await expect(
            page.getByRole('heading', {
                name: campaignTitlePattern,
            }),
        ).toBeVisible();

        const itemModuleBlock = page
            .locator('section, div')
            .filter({ hasText: fixture.itemModuleTitle })
            .filter({ hasText: 'Đăng ký quyên góp hiện vật' })
            .first();
        const loadTargetsResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'GET' &&
                response
                    .url()
                    .includes(
                        `/item-donations/modules/${fixture.itemModuleId}/targets`,
                    ) &&
                response.ok(),
        );
        await itemModuleBlock
            .getByRole('button', { name: 'Tải nhu cầu' })
            .click();
        await loadTargetsResponsePromise;
        await expect(itemModuleBlock.locator('select option')).toHaveCount(3);
        await itemModuleBlock.locator('select').selectOption({ index: 1 });
        await itemModuleBlock.getByRole('spinbutton').fill('2');
        await itemModuleBlock
            .getByPlaceholder('Tên người quyên góp')
            .fill('Nguyen Van A');
        const createPledgeResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response
                    .url()
                    .includes(
                        `/item-donations/modules/${fixture.itemModuleId}/pledges`,
                    ),
        );
        await itemModuleBlock
            .getByRole('button', { name: 'Gửi đăng ký hiện vật' })
            .click();
        const createPledgeResponse = await createPledgeResponsePromise;
        if (!createPledgeResponse.ok()) {
            throw new Error(
                `Create item pledge failed with ${createPledgeResponse.status()}: ${await createPledgeResponse.text()}`,
            );
        }

        await page.goto('/app/my-donations');
        const pledgedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: 'Vo ghi' })
            .first();
        await expect(pledgedCard.getByText('Đã cam kết')).toBeVisible();

        await login(page, 'org');
        await openManagedCampaign(page);
        const itemPanel = await openItemPanel(page, fixture.itemModuleTitle);
        const pledgeCard = itemPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: 'Nguyen Van A - Vo ghi' })
            .first();

        await expect(pledgeCard).toContainText('Đã đăng ký');

        const confirmResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/item-donations/pledges/') &&
                response.url().endsWith('/confirm'),
        );
        await pledgeCard.getByRole('button', { name: 'Xác nhận' }).click();
        const confirmResponse = await confirmResponsePromise;
        if (!confirmResponse.ok()) {
            throw new Error(
                `Confirm pledge failed with ${confirmResponse.status()}: ${await confirmResponse.text()}`,
            );
        }
        await expect(pledgeCard).toContainText('Đã xác nhận');

        const handoverResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response.url().includes('/item-donations/pledges/') &&
                response.url().endsWith('/handover'),
        );
        acceptPrompt(page, '2');
        await pledgeCard
            .getByRole('button', { name: 'Ghi nhận bàn giao' })
            .click();
        const handoverResponse = await handoverResponsePromise;
        if (!handoverResponse.ok()) {
            throw new Error(
                `Handover pledge failed with ${handoverResponse.status()}: ${await handoverResponse.text()}`,
            );
        }
        await expect(pledgeCard).toContainText('Đã tiếp nhận');

        await login(page, 'studentA');
        await waitForStudentDashboard(page);
        const itemReceivedAfter = await parseSummaryMetric(
            page,
            'Hiện vật đã nhận',
        );
        expect(itemReceivedAfter).toBe(itemReceivedBefore + 2);
        await expect(
            page.getByText('Quyên góp hiện vật - Đã tiếp nhận').first(),
        ).toBeVisible();

        await page.goto('/app/my-donations');
        const receivedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: 'Vo ghi' })
            .first();
        await expect(receivedCard.getByText('Đã tiếp nhận')).toBeVisible();

        await openNotificationMenu(page);
        await expect(
            page.getByText('Pledge hiện vật đã được xác nhận').first(),
        ).toBeVisible();
        await expect(
            page.getByText('Đã ghi nhận bàn giao hiện vật').first(),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Đánh dấu đã đọc' }).click();
        await expect(
            page.locator('button:has(svg.lucide-bell) span.bg-red-500'),
        ).toHaveCount(0);
    });

    test('item donation reject flow is visible to student', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getCampaignFixture(request);

        await login(page, 'studentB');
        await page.goto(`/app/campaigns/${fixture.slug}`);

        const itemModuleBlock = page
            .locator('section, div')
            .filter({ hasText: fixture.itemModuleTitle })
            .filter({ hasText: 'Đăng ký quyên góp hiện vật' })
            .first();
        const loadTargetsResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'GET' &&
                response
                    .url()
                    .includes(
                        `/item-donations/modules/${fixture.itemModuleId}/targets`,
                    ) &&
                response.ok(),
        );
        await itemModuleBlock
            .getByRole('button', { name: 'Tải nhu cầu' })
            .click();
        await loadTargetsResponsePromise;
        await expect(itemModuleBlock.locator('select option')).toHaveCount(3);
        await itemModuleBlock.locator('select').selectOption({ index: 2 });
        await itemModuleBlock.getByRole('spinbutton').fill('1');
        await itemModuleBlock
            .getByPlaceholder('Tên người quyên góp')
            .fill('Tran Thi B');
        const createPledgeResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                response
                    .url()
                    .includes(
                        `/item-donations/modules/${fixture.itemModuleId}/pledges`,
                    ),
        );
        await itemModuleBlock
            .getByRole('button', { name: 'Gửi đăng ký hiện vật' })
            .click();
        const createPledgeResponse = await createPledgeResponsePromise;
        if (!createPledgeResponse.ok()) {
            throw new Error(
                `Create item pledge failed with ${createPledgeResponse.status()}: ${await createPledgeResponse.text()}`,
            );
        }

        await login(page, 'org');
        await openManagedCampaign(page);
        const itemPanel = await openItemPanel(page, fixture.itemModuleTitle);
        const pledgeCard = itemPanel
            .locator('div.rounded-lg.border.border-slate-200.bg-white.p-3')
            .filter({ hasText: 'Tran Thi B - But viet' })
            .first();

        acceptPrompt(page, 'reject item from fullstack test');
        const rejectResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/item-donations/pledges/') &&
                response.url().endsWith('/reject'),
        );
        await pledgeCard.getByRole('button', { name: 'Từ chối' }).click();
        const rejectResponse = await rejectResponsePromise;
        if (!rejectResponse.ok()) {
            throw new Error(
                `Reject pledge failed with ${rejectResponse.status()}: ${await rejectResponse.text()}`,
            );
        }
        await expect(pledgeCard).toContainText('Từ chối');

        await login(page, 'studentB');
        await page.goto('/app/my-donations');
        const rejectedCard = page
            .locator('div.rounded-xl.border')
            .filter({ hasText: 'But viet' })
            .first();
        await expect(rejectedCard.getByText('Từ chối')).toBeVisible();

        await openNotificationMenu(page);
        await expect(
            page.getByText('Pledge hiện vật bị từ chối').first(),
        ).toBeVisible();
    });

    test('event approve -> check-in -> complete updates student dashboard and notifications', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getCampaignFixture(request);

        await login(page, 'studentC');
        await waitForStudentDashboard(page);
        const eventHoursBefore = await parseSummaryMetric(
            page,
            'Giờ tình nguyện',
        );

        await page.goto(`/app/campaigns/${fixture.slug}`);
        const eventModuleBlock = page
            .locator('section, div')
            .filter({ hasText: fixture.eventModuleTitle })
            .filter({ hasText: 'Đăng ký tham gia sự kiện' })
            .first();
        await eventModuleBlock
            .getByPlaceholder('Ghi chú đăng ký (nếu có)')
            .fill('student C event note');
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
            .filter({ hasText: 'Le Van C' })
            .filter({ hasText: '102210003' })
            .first();

        await expect(registrationCard).toContainText('Chờ xử lý');

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
        await expect(registrationCard).toContainText('Đã duyệt');

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
        await expect(registrationCard).toContainText('Đã check-in');

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

        await login(page, 'studentC');
        await waitForStudentDashboard(page);
        const eventHoursAfter = await parseSummaryMetric(
            page,
            'Giờ tình nguyện',
        );
        expect(eventHoursAfter).toBe(eventHoursBefore + 3);
        await expect(
            page.getByText('Tham gia sự kiện - Đã hoàn thành'),
        ).toBeVisible();

        await openNotificationMenu(page);
        await expect(
            page.getByText('Đăng ký sự kiện đã được duyệt').first(),
        ).toBeVisible();
        await expect(
            page.getByText('Đã check-in sự kiện').first(),
        ).toBeVisible();
        await expect(
            page.getByText('Đã ghi nhận hoàn thành sự kiện').first(),
        ).toBeVisible();
    });

    test('event reject flow is visible to student', async ({
        page,
        request,
    }) => {
        test.setTimeout(120000);
        const fixture = await getCampaignFixture(request);

        await login(page, 'studentB');
        await page.goto(`/app/campaigns/${fixture.slug}`);
        const eventModuleBlock = page
            .locator('section, div')
            .filter({ hasText: fixture.eventModuleTitle })
            .filter({ hasText: 'Đăng ký tham gia sự kiện' })
            .first();
        await eventModuleBlock
            .getByPlaceholder('Ghi chú đăng ký (nếu có)')
            .fill('student B event note');
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
            .filter({ hasText: 'Tran Thi B' })
            .filter({ hasText: '102210002' })
            .first();

        acceptPrompt(page, 'reject event from fullstack test');
        const rejectResponsePromise = page.waitForResponse(
            (response) =>
                response.request().method() === 'PATCH' &&
                response.url().includes('/events/registrations/') &&
                response.url().endsWith('/reject'),
        );
        await registrationCard.getByRole('button', { name: 'Từ chối' }).click();
        const rejectResponse = await rejectResponsePromise;
        if (!rejectResponse.ok()) {
            throw new Error(
                `Reject event failed with ${rejectResponse.status()}: ${await rejectResponse.text()}`,
            );
        }
        await expect(registrationCard).toContainText('Từ chối');

        await login(page, 'studentB');
        await page.goto('/app');
        await expect(
            page.getByText('Tham gia sự kiện - Bị từ chối'),
        ).toBeVisible();

        await openNotificationMenu(page);
        await expect(
            page.getByText('Đăng ký sự kiện bị từ chối').first(),
        ).toBeVisible();
    });
});
