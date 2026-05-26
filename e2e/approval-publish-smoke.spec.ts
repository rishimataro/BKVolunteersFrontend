import { expect, test, type Page, type Route } from '@playwright/test';

type UserRole = 'org' | 'reviewer';
type CampaignStatus =
    | 'DRAFT'
    | 'SUBMITTED'
    | 'PRE_APPROVED'
    | 'APPROVED'
    | 'PUBLISHED';

type MockCampaignModule = {
    id: string;
    type: 'fundraising';
    title: string;
    description: string;
    status: 'DRAFT';
    start_at: string;
    end_at: string;
    settings: Record<string, unknown>;
};

type MockCampaign = {
    id: string;
    slug: string;
    title: string;
    summary: string;
    description: string;
    organization_id: string;
    status: CampaignStatus;
    start_at: string;
    end_at: string;
    scope_type: 'PUBLIC';
    published_at: string | null;
    modules: MockCampaignModule[];
};

type MockAuthUser = {
    id: string;
    accountType: 'OPERATOR';
    email: string;
    fullName: string;
    firstName: string;
    lastName: string;
    role: 'CLB' | 'LCD';
    organizationId: string | null;
    organization: {
        id: string;
        name: string;
        type: 'FACULTY';
        faculty?: { name: string };
    } | null;
    facultyId: string | null;
    studentCode: string | null;
    createdAt: number;
};

type CreateModulePayload = {
    title: string;
    description?: string;
    start_at: string;
    end_at: string;
    settings?: Record<string, unknown>;
};

const apiOk = async (route: Route, data: unknown, status = 200) => {
    await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
            success: true,
            message: 'OK',
            data,
        }),
    });
};

test.describe('approval publish smoke', () => {
    test('org submit -> reviewer approve -> org publish -> public sees campaign', async ({
        page,
    }) => {
        test.setTimeout(60000);

        const campaign: MockCampaign = {
            id: '101',
            slug: 'chien-dich-smoke',
            title: 'Chiến dịch smoke',
            summary: 'Smoke summary',
            description: 'Smoke description',
            organization_id: '12',
            status: 'DRAFT',
            start_at: '2026-06-01T08:00:00.000Z',
            end_at: '2026-06-30T17:00:00.000Z',
            scope_type: 'PUBLIC',
            published_at: null,
            modules: [],
        };

        const usersByToken: Record<string, MockAuthUser> = {
            'org-token': {
                id: '201',
                accountType: 'OPERATOR',
                email: 'lcd.cntt@dut.udn.vn',
                fullName: 'CLB CNTT',
                firstName: 'CNTT',
                lastName: 'CLB',
                role: 'CLB',
                organizationId: '12',
                organization: {
                    id: '12',
                    name: 'Lien chi doan CNTT',
                    type: 'FACULTY',
                    faculty: { name: 'Cong nghe thong tin' },
                },
                facultyId: '3',
                studentCode: null,
                createdAt: Date.now(),
            },
            'reviewer-token': {
                id: '202',
                accountType: 'OPERATOR',
                email: 'reviewer@dut.udn.vn',
                fullName: 'Reviewer DUT',
                firstName: 'Reviewer',
                lastName: 'DUT',
                role: 'LCD',
                organizationId: null,
                organization: null,
                facultyId: null,
                studentCode: null,
                createdAt: Date.now(),
            },
        };

        const authByIdentifier: Record<string, { token: string }> = {
            'lcd.cntt@dut.udn.vn': { token: 'org-token' },
            'reviewer@dut.udn.vn': { token: 'reviewer-token' },
        };

        await page.route('**/api/v1/**', async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            const path = url.pathname.replace(/^.*\/api\/v1/, '');
            const method = request.method();
            const authorization = await request.headerValue('authorization');
            const token = authorization?.replace('Bearer ', '') ?? null;
            const currentUser = token ? usersByToken[token] : null;

            if (path === '/auth/login' && method === 'POST') {
                const body = request.postDataJSON() as {
                    identifier: string;
                    password: string;
                };
                const auth = authByIdentifier[body.identifier];
                if (!auth || body.password !== 'Password@123') {
                    await route.fulfill({
                        status: 401,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: false,
                            message: 'Sai thong tin dang nhap',
                        }),
                    });
                    return;
                }
                await apiOk(route, { accessToken: auth.token });
                return;
            }

            if (path === '/auth/me' && method === 'GET') {
                if (!currentUser) {
                    await route.fulfill({
                        status: 401,
                        contentType: 'application/json',
                        body: JSON.stringify({
                            success: false,
                            message: 'Unauthorized',
                        }),
                    });
                    return;
                }

                await apiOk(route, {
                    account_type: currentUser.accountType,
                    role: currentUser.role,
                    organization: currentUser.organization
                        ? {
                              id: Number(currentUser.organization.id),
                              name: currentUser.organization.name,
                              type: currentUser.organization.type,
                          }
                        : null,
                    faculty: currentUser.facultyId
                        ? {
                              id: Number(currentUser.facultyId),
                              code: 'CNTT',
                              name: 'Cong nghe thong tin',
                          }
                        : null,
                    operator: {
                        id: Number(currentUser.id),
                        full_name: currentUser.fullName,
                        email: currentUser.email,
                    },
                    created_at: currentUser.createdAt,
                });
                return;
            }

            if (path === '/campaigns' && method === 'GET') {
                await apiOk(route, {
                    items:
                        currentUser?.role === 'CLB'
                            ? [
                                  {
                                      id: campaign.id,
                                      slug: campaign.slug,
                                      title: campaign.title,
                                      summary: campaign.summary,
                                      status: campaign.status,
                                      organization_id: campaign.organization_id,
                                      start_at: campaign.start_at,
                                      end_at: campaign.end_at,
                                      module_types: campaign.modules.map(
                                          (module) => module.type,
                                      ),
                                  },
                              ]
                            : [],
                });
                return;
            }

            if (path === '/campaigns' && method === 'POST') {
                const body = request.postDataJSON() as Record<string, string>;
                campaign.title = body.title;
                campaign.summary = body.summary;
                campaign.description = body.description ?? '';
                campaign.start_at = new Date(body.start_at).toISOString();
                campaign.end_at = new Date(body.end_at).toISOString();
                campaign.status = 'DRAFT';
                await apiOk(route, { id: campaign.id }, 201);
                return;
            }

            if (path === `/campaigns/${campaign.id}` && method === 'GET') {
                await apiOk(route, {
                    id: campaign.id,
                    organization_id: campaign.organization_id,
                    slug: campaign.slug,
                    title: campaign.title,
                    summary: campaign.summary,
                    description: campaign.description,
                    scope_type: campaign.scope_type,
                    status: campaign.status,
                    start_at: campaign.start_at,
                    end_at: campaign.end_at,
                    published_at: campaign.published_at,
                    modules: campaign.modules,
                    reviews: [],
                });
                return;
            }

            if (
                path === `/campaigns/${campaign.id}/modules` &&
                method === 'POST'
            ) {
                const body = request.postDataJSON() as CreateModulePayload;
                campaign.modules = [
                    {
                        id: '501',
                        type: 'fundraising',
                        title: body.title,
                        description: body.description ?? '',
                        status: 'DRAFT',
                        start_at: new Date(body.start_at).toISOString(),
                        end_at: new Date(body.end_at).toISOString(),
                        settings: body.settings ?? {},
                    },
                ];
                await apiOk(route, { id: '501' }, 201);
                return;
            }

            if (
                path === `/campaigns/${campaign.id}/submit-review` &&
                method === 'POST'
            ) {
                campaign.status = 'SUBMITTED';
                await apiOk(route, {
                    id: campaign.id,
                    from_status: 'DRAFT',
                    to_status: 'SUBMITTED',
                });
                return;
            }

            if (path === '/fundraising/modules/501' && method === 'GET') {
                await apiOk(route, {
                    id: '501',
                    campaign_id: campaign.id,
                    type: 'fundraising',
                    title: campaign.modules[0]?.title ?? 'Quy tu yeu thuong',
                    status: 'OPEN',
                    settings_json: campaign.modules[0]?.settings ?? {},
                    total_raised: 0,
                    campaign: {
                        id: campaign.id,
                        title: campaign.title,
                        slug: campaign.slug,
                        status: campaign.status,
                    },
                    config: campaign.modules[0]?.settings ?? {},
                });
                return;
            }

            if (
                path === '/fundraising/modules/501/donations' &&
                method === 'GET'
            ) {
                await apiOk(route, {
                    items: [],
                    pagination: {
                        page: 1,
                        limit: 100,
                        total: 0,
                        totalPages: 1,
                    },
                });
                return;
            }

            if (path === '/fundraising/transactions' && method === 'GET') {
                await apiOk(route, {
                    items: [],
                    pagination: {
                        page: 1,
                        limit: 100,
                        total: 0,
                        totalPages: 1,
                    },
                });
                return;
            }

            if (
                path === `/campaigns/${campaign.id}/publish` &&
                method === 'POST'
            ) {
                campaign.status = 'PUBLISHED';
                campaign.published_at = '2026-06-01T09:00:00.000Z';
                await apiOk(route, {
                    id: campaign.id,
                    status: 'PUBLISHED',
                });
                return;
            }

            if (path === '/approvals/campaigns' && method === 'GET') {
                const status = url.searchParams.get('status');
                const queueItems =
                    currentUser?.role === 'LCD' &&
                    (!status || status === campaign.status) &&
                    ['SUBMITTED', 'PRE_APPROVED'].includes(campaign.status)
                        ? [
                              {
                                  id: campaign.id,
                                  slug: campaign.slug,
                                  title: campaign.title,
                                  summary: campaign.summary,
                                  status: campaign.status,
                                  organization: {
                                      id: '12',
                                      code: 'LCD-CNTT',
                                      name: 'Lien chi doan CNTT',
                                      type: 'FACULTY',
                                  },
                                  module_types: ['fundraising'],
                                  submitted_at: '2026-05-19T10:00:00.000Z',
                              },
                          ]
                        : [];

                await apiOk(route, queueItems);
                return;
            }

            if (
                path === `/approvals/campaigns/${campaign.id}` &&
                method === 'GET'
            ) {
                await apiOk(route, {
                    id: campaign.id,
                    organization_id: campaign.organization_id,
                    slug: campaign.slug,
                    title: campaign.title,
                    summary: campaign.summary,
                    description: campaign.description,
                    scope_type: 'PUBLIC',
                    status: campaign.status,
                    start_at: campaign.start_at,
                    end_at: campaign.end_at,
                    published_at: campaign.published_at,
                    modules: campaign.modules,
                    reviews: [],
                });
                return;
            }

            if (
                path === `/approvals/campaigns/${campaign.id}/pre-approve` &&
                method === 'POST'
            ) {
                campaign.status = 'PRE_APPROVED';
                await apiOk(route, {
                    campaign_id: campaign.id,
                    from_status: 'SUBMITTED',
                    to_status: 'PRE_APPROVED',
                });
                return;
            }

            if (
                path === `/approvals/campaigns/${campaign.id}/approve` &&
                method === 'POST'
            ) {
                campaign.status = 'APPROVED';
                await apiOk(route, {
                    campaign_id: campaign.id,
                    from_status: 'PRE_APPROVED',
                    to_status: 'APPROVED',
                });
                return;
            }

            if (path === '/public/campaigns' && method === 'GET') {
                const items =
                    campaign.status === 'PUBLISHED'
                        ? [
                              {
                                  id: campaign.id,
                                  slug: campaign.slug,
                                  title: campaign.title,
                                  summary: campaign.summary,
                                  organization: {
                                      id: '12',
                                      code: 'LCD-CNTT',
                                      name: 'Lien chi doan CNTT',
                                      type: 'FACULTY',
                                  },
                                  module_types: ['fundraising'],
                                  status: 'PUBLISHED',
                                  start_at: campaign.start_at,
                                  end_at: campaign.end_at,
                                  progress: {
                                      percent: 0,
                                      modules: [
                                          {
                                              type: 'fundraising',
                                              current: 0,
                                              target: 20000000,
                                              percent: 0,
                                          },
                                      ],
                                  },
                              },
                          ]
                        : [];

                await apiOk(route, {
                    items,
                    pagination: {
                        page: 1,
                        limit: 9,
                        total: items.length,
                        totalPages: 1,
                    },
                });
                return;
            }

            if (
                path === `/public/campaigns/${campaign.slug}` &&
                method === 'GET'
            ) {
                await apiOk(route, {
                    id: campaign.id,
                    slug: campaign.slug,
                    title: campaign.title,
                    summary: campaign.summary,
                    description: campaign.description,
                    organization: {
                        id: '12',
                        code: 'LCD-CNTT',
                        name: 'Lien chi doan CNTT',
                        type: 'FACULTY',
                    },
                    module_types: ['fundraising'],
                    status: campaign.status,
                    start_at: campaign.start_at,
                    end_at: campaign.end_at,
                    progress: {
                        percent: 0,
                        modules: [
                            {
                                type: 'fundraising',
                                current: 0,
                                target: 20000000,
                                percent: 0,
                            },
                        ],
                    },
                    scope_type: 'PUBLIC',
                    published_at: campaign.published_at,
                    modules: campaign.modules.map((module) => ({
                        ...module,
                        progress: {
                            type: 'fundraising',
                            current: 0,
                            target: 20000000,
                            percent: 0,
                        },
                        cta: {
                            enabled: false,
                            label: 'Dang nhap sinh vien de tham gia',
                            action: null,
                        },
                    })),
                });
                return;
            }

            if (path.startsWith('/reports/') && method === 'GET') {
                await apiOk(route, {});
                return;
            }

            await apiOk(route, []);
        });

        const handleReasonDialog = async () => {
            page.once('dialog', async (dialog) => {
                await dialog.accept('Smoke approve');
            });
        };

        await login(page, 'org');
        await page.goto('/app/campaigns');

        await page.getByPlaceholder('Tiêu đề chiến dịch').fill(campaign.title);
        await page
            .getByPlaceholder('Tóm tắt chiến dịch')
            .fill(campaign.summary);
        await page.getByPlaceholder('Mô tả ngắn').fill(campaign.description);
        await page
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill('2026-06-01T08:00');
        await page
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill('2026-06-30T17:00');
        await page.getByRole('button', { name: 'Tạo chiến dịch' }).click();

        await page.getByPlaceholder('Tên hạng mục').fill('Quy tu yeu thuong');
        await page
            .getByPlaceholder('Mô tả hạng mục')
            .fill('Module fundraising smoke');
        await page
            .locator('form')
            .filter({ hasText: 'Thêm hạng mục vào chiến dịch' })
            .locator('input[type="datetime-local"]')
            .nth(0)
            .fill('2026-06-02T08:00');
        await page
            .locator('form')
            .filter({ hasText: 'Thêm hạng mục vào chiến dịch' })
            .locator('input[type="datetime-local"]')
            .nth(1)
            .fill('2026-06-20T17:00');
        await page.getByPlaceholder('Mục tiêu gây quỹ').fill('20000000');
        await page.getByPlaceholder('Tên người thụ hưởng').fill('CLB CNTT');
        await page.getByPlaceholder('Ngân hàng').fill('Vietcombank');
        await page.getByPlaceholder('Số tài khoản').fill('0123456789');
        await page.getByRole('button', { name: 'Tạo hạng mục' }).click();

        await expect(
            page.locator('p.text-sm.font-semibold.text-slate-900', {
                hasText: 'Quy tu yeu thuong',
            }),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Gửi duyệt' }).click();
        await expect(
            page.locator('span[title="Đã gửi duyệt"]').first(),
        ).toBeVisible();

        await login(page, 'reviewer');
        await page.goto('/app/users');
        await expect(
            page.getByRole('heading', {
                name: 'Chiến dịch smoke',
                exact: true,
            }),
        ).toBeVisible();

        await handleReasonDialog();
        await page
            .getByRole('button', { name: 'Tiền duyệt', exact: true })
            .click();
        await expect(
            page.locator('span[title="Tiền duyệt"]').first(),
        ).toBeVisible();

        await handleReasonDialog();
        await page.getByRole('button', { name: 'Duyệt', exact: true }).click();
        await expect(
            page.locator('span[title="Đã duyệt"]').first(),
        ).toBeVisible();

        await login(page, 'org');
        await page.goto('/app/campaigns');
        await expect(
            page.locator('span[title="Đã duyệt"]').first(),
        ).toBeVisible();
        await page.getByRole('button', { name: 'Công khai' }).click();
        await expect(
            page.locator('span[title="Công khai"]').first(),
        ).toBeVisible();

        await page.goto('/campaigns');
        await expect(
            page.getByRole('heading', {
                name: 'Chiến dịch smoke',
                exact: true,
                level: 2,
            }),
        ).toBeVisible();
    });
});

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
