import { Page } from '@playwright/test';

/**
 * Authentication utilities for E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
}

export const TEST_USERS = {
  regular: {
    email: 'test@flowai.com',
    password: 'TestPassword123!',
  },
  admin: {
    email: 'admin@flowai.com',
    password: 'AdminPassword123!',
  },
} as const;

/**
 * Authenticate a user via the login page
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/auth');
  
  // Fill in credentials
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  
  // Submit form
  await page.getByRole('button', { name: /sign in|login/i }).click();
  
  // Wait for redirect to dashboard
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

/**
 * Sign up a new user
 */
export async function signup(page: Page, user: TestUser) {
  await page.goto('/auth');
  
  // Switch to sign up mode if needed
  const signUpButton = page.getByRole('button', { name: /sign up|create account/i });
  if (await signUpButton.isVisible()) {
    await signUpButton.click();
  }
  
  // Fill in credentials
  await page.locator('input[type="email"]').fill(user.email);
  await page.locator('input[type="password"]').fill(user.password);
  
  // Submit form
  await page.getByRole('button', { name: /sign up|create/i }).click();
  
  // Wait for redirect
  await page.waitForURL(/.*dashboard/, { timeout: 10000 });
}

/**
 * Logout the current user
 */
export async function logout(page: Page) {
  await page.getByRole('button', { name: /logout|sign out/i }).click();
  await page.waitForURL(/.*auth/, { timeout: 5000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    await page.waitForURL(/.*dashboard/, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
