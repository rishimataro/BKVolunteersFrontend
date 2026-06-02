import {
    expect,
    test,
    type APIRequestContext,
    type Page,
} from '@playwright/test';

type LoginRole = 'org' | 'schoolAdmin';

const campaignSlug = 'mvp-chien-dich-thien-nguyen';

const toDateTimeLocal = (value: Date) => {
    const pad = (input: number) => String(input).padStart(2, '0');

    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
};

const getCampaignFixture = async (request: APIRequestContext) => {
    const response = await request.get(
        `http://127.0.0.1:4000/api/v1/public/campaigns/${campaignSlug}`,
    );
    expect(response.ok()).toBeTruthy();

    const body = (await response.json()) as {
        data: {
            id: string;
        };
    };

    return {
        campaignId: body.data.id,
    };
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

const acceptNextConfirm = (page: Page) => {
    page.once('dialog', async (dialog) => {
        await dialog.accept();
    });
};

const fillTemplateForm = async (
    page: Page,
    args: {
        name: string;
        type: string;
        fileUrl: string;
        layoutJson: string;
    },
) => {
    await page.getByTestId('certificate-template-form-name').fill(args.name);
    await page.getByTestId('certificate-template-form-type').fill(args.type);
    await page
        .getByTestId('certificate-template-form-file-url')
        .fill(args.fileUrl);
    await page
        .getByTestId('certificate-template-form-layout-json')
        .fill(args.layoutJson);
};

test.describe('certificate template and admin core fullstack', () => {
    test.describe.configure({ mode: 'serial' });

    test('school admin manages organizations, templates, audit logs and background jobs', async ({
        page,
        request,
    }) => {
        test.setTimeout(180000);

        const fixture = await getCampaignFixture(request);
        const stamp = Date.now();
        const orgCode = `S4E2E-${stamp}`;
        const orgName = `To chuc E2E ${stamp}`;
        const templateActiveName = `Template Active ${stamp}`;
        const templateToggleName = `Template Toggle ${stamp}`;
        const layoutJson = JSON.stringify(
            {
                version: 1,
                fields: ['student_name', 'campaign_title', 'issued_at'],
            },
            null,
            4,
        );

        await login(page, 'schoolAdmin');

        await page.goto('/app/organizations');
        await page.getByRole('button', { name: 'Thêm tổ chức' }).click();
        await page.getByTestId('admin-org-form-code').fill(orgCode);
        await page.getByTestId('admin-org-form-name').fill(orgName);
        await page.getByTestId('admin-org-form-type').selectOption('CLUB');
        await page
            .getByTestId('admin-org-form-description')
            .fill('Organization created by admin core fullstack spec');
        await page.getByTestId('admin-org-form-submit').click();

        const createdOrgRow = page
            .locator('tbody tr')
            .filter({ hasText: orgCode })
            .first();
        await expect(createdOrgRow).toContainText(orgName);
        await expect(createdOrgRow).toContainText('Hoạt động');

        await page.getByTestId('admin-org-filter-q').fill(orgCode);
        await page.getByTestId('admin-org-filter-type').selectOption('CLUB');
        await page
            .getByTestId('admin-org-filter-status')
            .selectOption('ACTIVE');
        await page.getByTestId('admin-org-filter-submit').click();
        await expect(createdOrgRow).toContainText('Hoạt động');

        await createdOrgRow.getByTitle('Chỉnh sửa').click();
        await page
            .getByTestId('admin-org-form-status')
            .selectOption('INACTIVE');
        await page.getByTestId('admin-org-form-submit').click();
        await page
            .getByTestId('admin-org-filter-status')
            .selectOption('INACTIVE');
        await page.getByTestId('admin-org-filter-submit').click();
        await expect(createdOrgRow).toContainText('Ngưng hoạt động');

        await page.goto('/app/certificate-templates');
        await page.getByRole('button', { name: 'Thêm mẫu' }).click();
        await fillTemplateForm(page, {
            name: templateActiveName,
            type: 'VOLUNTEER',
            fileUrl: `https://cdn.example.com/templates/${stamp}-active.pdf`,
            layoutJson,
        });
        await page.getByTestId('certificate-template-form-submit').click();

        const activeTemplateRow = page
            .locator('tbody tr')
            .filter({ hasText: templateActiveName })
            .first();
        await expect(activeTemplateRow).toContainText('Hoạt động');

        await page.getByRole('button', { name: 'Thêm mẫu' }).click();
        await fillTemplateForm(page, {
            name: templateToggleName,
            type: 'VOLUNTEER',
            fileUrl: `https://cdn.example.com/templates/${stamp}-toggle.pdf`,
            layoutJson,
        });
        await page.getByTestId('certificate-template-form-submit').click();

        const toggleTemplateRow = page
            .locator('tbody tr')
            .filter({ hasText: templateToggleName })
            .first();
        await expect(toggleTemplateRow).toContainText('Hoạt động');

        acceptNextConfirm(page);
        await toggleTemplateRow
            .getByTestId(/certificate-template-deactivate-/)
            .click();
        await expect(toggleTemplateRow).toContainText('Ngưng hoạt động');

        const now = new Date();
        const from = new Date(now.getTime() - 60 * 60 * 1000);
        const to = new Date(now.getTime() + 60 * 60 * 1000);

        await page.goto('/app/audit-logs');
        await page
            .getByTestId('audit-filter-action')
            .fill('CERTIFICATE_TEMPLATE_DEACTIVATED');
        await page
            .getByTestId('audit-filter-entity')
            .fill('certificate_template');
        await page.getByTestId('audit-filter-from').fill(toDateTimeLocal(from));
        await page.getByTestId('audit-filter-to').fill(toDateTimeLocal(to));
        await page.getByTestId('audit-filter-submit').click();

        const auditRow = page
            .locator('tbody tr')
            .filter({ hasText: 'Ngưng hoạt động template chứng nhận' })
            .filter({ hasText: 'certificate_template' })
            .first();
        await expect(auditRow).toContainText('OPERATOR');

        await page.goto('/app/background-jobs');
        await page
            .getByTestId('background-jobs-filter-type')
            .fill('RENDER_CERTIFICATE');
        await page.getByTestId('background-jobs-filter-status').fill('PENDING');
        await page.getByTestId('background-jobs-filter-submit').click();
        await page.getByTestId('background-jobs-run-due').click();
        await expect(page.getByText('Đã xử lý queue')).toBeVisible();

        await page.getByTestId('background-jobs-filter-status').fill('FAILED');
        await page.getByTestId('background-jobs-filter-submit').click();
        const retryButtons = page.getByRole('button', { name: 'Retry' });
        if ((await retryButtons.count()) > 0) {
            await retryButtons.first().click();
            await expect(
                page.getByText(/Đã retry job|Không thể retry job/i),
            ).toBeVisible();
        }

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        await page.getByRole('button', { name: 'Tạo chứng nhận' }).click();
        const templateSelect = page.getByTestId(
            'certificate-generate-template-select',
        );
        await expect(templateSelect).toContainText(templateActiveName);
        await expect(templateSelect).not.toContainText(templateToggleName);

        await login(page, 'schoolAdmin');
        await page.goto('/app/certificate-templates');
        const reactivatedRow = page
            .locator('tbody tr')
            .filter({ hasText: templateToggleName })
            .first();
        await reactivatedRow
            .getByTestId(/certificate-template-reactivate-/)
            .click();
        await expect(reactivatedRow).toContainText('Hoạt động');

        await login(page, 'org');
        await page.goto(`/app/certificates/campaigns/${fixture.campaignId}`);
        await page.getByRole('button', { name: 'Tạo chứng nhận' }).click();
        await expect(templateSelect).toContainText(templateToggleName);
    });
});
