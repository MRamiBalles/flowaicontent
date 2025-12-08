import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should display login page', async ({ page }) => {
        await page.goto('/auth');

        await expect(page).toHaveTitle(/FlowAI/);
        await expect(page.locator('text=Sign in')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/auth');

        await page.fill('input[type="email"]', 'invalid@test.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Expect error message
        await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    });

    test('should redirect unauthenticated users from dashboard', async ({ page }) => {
        await page.goto('/dashboard');

        // Should redirect to auth page
        await expect(page).toHaveURL(/\/auth/);
    });
});
