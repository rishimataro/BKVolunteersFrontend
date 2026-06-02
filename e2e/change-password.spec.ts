import { test, expect } from '@playwright/test';

test('should show change password form', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible(
        { timeout: 15000 },
    );

    await page.locator('#identifier').fill('admin@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(page).toHaveURL(/\/app/);

    await page.goto('/app/change-password');
    await expect(
        page.getByRole('heading', { name: /đổi mật khẩu/i }),
    ).toBeVisible();
});

test('should validate empty fields on change password', async ({
    page,
    context,
}) => {
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible(
        { timeout: 15000 },
    );

    await page.locator('#identifier').fill('admin@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(page).toHaveURL(/\/app/);

    await page.goto('/app/change-password');
    await expect(
        page.getByRole('heading', { name: /đổi mật khẩu/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /lưu thay đổi/i }).click();

    await expect(page.getByText(/vui lòng nhập/i)).toBeVisible();
});

test('should validate password mismatch', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/auth/login');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible(
        { timeout: 15000 },
    );

    await page.locator('#identifier').fill('admin@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(page).toHaveURL(/\/app/);

    await page.goto('/app/change-password');

    await page.locator('#oldPassword').fill('oldpass123');
    await page.locator('#newPassword').fill('newpass123');
    await page.locator('#confirmPassword').fill('different');
    await page.getByRole('button', { name: /lưu thay đổi/i }).click();

    await expect(page.getByText(/không khớp/i)).toBeVisible();
});
