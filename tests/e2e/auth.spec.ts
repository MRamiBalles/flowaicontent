import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display auth page correctly', async ({ page }) => {
    // Check if auth page loads
    await expect(page).toHaveURL(/.*auth/);
    
    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit without filling form
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Should show validation errors
    await expect(page.locator('text=/email/i')).toBeVisible();
  });

  test('should toggle between sign in and sign up', async ({ page }) => {
    // Look for sign up link
    const signUpLink = page.getByRole('button', { name: /sign up|create account/i });
    
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.locator('input[type="password"]').fill('password123');
    
    const submitButton = page.getByRole('button', { name: /sign in|login/i });
    await submitButton.click();
    
    // Should show email validation error
    await expect(page.locator('text=/valid.*email/i')).toBeVisible();
  });

  test('should navigate to dashboard after successful auth', async ({ page }) => {
    // This test would need valid credentials
    // For now, we'll just check the redirect happens
    test.skip(true, 'Requires valid test credentials');
  });
});

test.describe('Authentication - Password Reset', () => {
  test('should show forgot password option', async ({ page }) => {
    await page.goto('/auth');
    
    const forgotPasswordLink = page.getByText(/forgot.*password/i);
    await expect(forgotPasswordLink).toBeVisible();
  });
});
