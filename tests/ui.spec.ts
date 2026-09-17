import { test, expect } from '@playwright/test';

test.describe('UI Navigation and Interactions', () => {
  test('Dashboard loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Admin|ThoorigAI/);
    await expect(page.locator('body')).toContainText('THOORIGAI');
    await expect(page.locator('body')).toContainText('INFOTECH LLP');
    await expect(page.getByRole('heading', { name: /Good morning/i })).toBeVisible();
  });

  test('Navigate to Students and Add a Student', async ({ page }) => {
    await page.goto('/');
    // Click on Students in sidebar
    await page.getByText('Students', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();

    // Click Add student
    await page.getByRole('button', { name: /Add student/i }).click();
    await expect(page.getByPlaceholder('Full name')).toBeVisible();

    // Fill form
    await page.getByPlaceholder('Full name').fill('Aisha Kumar');
    await page.getByPlaceholder('10-digit number').fill('9876543210');
    
    // Total fees and Paid amount
    const numberInputs = page.locator('input[type="number"]');
    await numberInputs.nth(0).fill('25000');
    await numberInputs.nth(1).fill('5000');
    
    // Save
    await page.getByRole('button', { name: /Save student/i }).click();

    // Verify
    await expect(page.locator('body')).toContainText('Aisha Kumar');
  });

  test('Check Reports', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Reports', { exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Download CSV/i })).toBeVisible();
  });
});
