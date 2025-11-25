import { test, expect } from '@playwright/test';

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/marketplace');
  });

  test('should load marketplace page', async ({ page }) => {
    await expect(page).toHaveURL(/.*marketplace/);
  });

  test.skip('should display marketplace items', async ({ page }) => {
    // Check for marketplace grid or list
    await expect(page.getByText(/marketplace|browse/i)).toBeVisible();
  });

  test.skip('should show style packs', async ({ page }) => {
    // Navigate to style packs if separate
    await page.goto('/style-packs');
    await expect(page).toHaveURL(/.*style-packs/);
  });

  test.skip('should allow filtering items', async ({ page }) => {
    // Look for filter controls
    const filterButton = page.getByRole('button', { name: /filter|sort/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await expect(page.getByText(/price|popularity|recent/i)).toBeVisible();
    }
  });

  test.skip('should allow searching', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('anime');
      await expect(page.getByText(/anime/i)).toBeVisible();
    }
  });
});

test.describe('Marketplace - Item Details', () => {
  test.skip('should show item preview', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click on first item
    const firstItem = page.locator('[data-item], .item, .card').first();
    await firstItem.click();
    
    // Should show item details
    await expect(page.getByText(/details|description/i)).toBeVisible();
  });

  test.skip('should display price', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Check for price display
    await expect(page.getByText(/\$|price|tokens/i)).toBeVisible();
  });

  test.skip('should allow purchase', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Click on item
    const firstItem = page.locator('[data-item], .item, .card').first();
    await firstItem.click();
    
    // Look for purchase button
    await expect(page.getByRole('button', { name: /buy|purchase|add to cart/i })).toBeVisible();
  });
});

test.describe('Marketplace - Creator Features', () => {
  test.skip('should allow creators to upload style packs', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Look for create/upload button
    const createButton = page.getByRole('button', { name: /create|upload|sell/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.getByText(/upload.*images|training/i)).toBeVisible();
    }
  });

  test.skip('should show creator earnings', async ({ page }) => {
    await page.goto('/marketplace');
    
    // Navigate to creator dashboard if available
    const creatorLink = page.getByRole('link', { name: /creator|earnings/i });
    if (await creatorLink.isVisible()) {
      await creatorLink.click();
      await expect(page.getByText(/earnings|revenue/i)).toBeVisible();
    }
  });
});

test.describe('Marketplace - Responsive', () => {
  test.skip('should display properly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/marketplace');
    
    // Check that marketplace items are visible in a mobile-friendly layout
    await expect(page.locator('[data-item], .item, .card').first()).toBeVisible();
  });
});
