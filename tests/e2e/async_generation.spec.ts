import { test, expect } from '@playwright/test';

test.describe('Async AI Generation Flow', () => {
    test('should invoke generation, get job ID, and poll for result', async ({ request, page }) => {
        // NOTE: This test mocks the backend response or assumes the backend is running.
        // For a true E2E, we need the backend up.
        // Since we cannot easily control the backend state here without seeding,
        // we will focus on verifying that the frontend handles the "Processing" state UI.

        await page.goto('/dashboard');

        // Mock the generate-content response to return a Job ID
        await page.route('**/functions/v1/generate-content', async route => {
            const json = {
                success: true,
                jobId: '123e4567-e89b-12d3-a456-426614174000',
                status: 'processing',
                message: 'Content generation started.'
            };
            await route.fulfill({ json });
        });

        // Mock the polling response 1 (processing)
        let pollCount = 0;
        await page.route('**/rest/v1/generation_jobs*', async route => {
            pollCount++;
            if (pollCount < 3) {
                await route.fulfill({
                    json: { status: 'processing', result: null }
                });
            } else {
                await route.fulfill({
                    json: {
                        status: 'completed',
                        result: {
                            twitter: 'Tweet 1',
                            linkedin: 'Post 1',
                            instagram: 'Reel 1'
                        }
                    }
                });
            }
        });

        // Fill form
        await page.locator('input[name="title"]').fill('Test Project');
        await page.locator('textarea[name="content"]').fill('This is a test content for async generation.');
        await page.getByRole('button', { name: /generate/i }).click();

        // Expect loading state
        await expect(page.getByText('AI is processing your content')).toBeVisible();

        // Expect final content to appear
        await expect(page.getByText('Tweet 1')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Post 1')).toBeVisible();
    });
});
