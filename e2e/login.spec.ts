import { test, expect } from '@playwright/test';

test('should login successfully with email', async ({ page, context }) => {
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
    await expect(
        page.getByRole('heading', {
            level: 1,
            name: /tổng quan|bảng điều khiển/i,
        }),
    ).toBeVisible();
});

test('should show validation error on empty fields', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible(
        { timeout: 15000 },
    );

    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(page.getByText(/vui lòng nhập/i).first()).toBeVisible();
});

test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await expect(page.getByRole('heading', { name: /đăng nhập/i })).toBeVisible(
        { timeout: 15000 },
    );

    await page.locator('#identifier').fill('wrong@email.com');
    await page.locator('#password').fill('wrongpass');
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

    await expect(
        page.getByText(/không hợp lệ|thất bại/i).first(),
    ).toBeVisible();
});
