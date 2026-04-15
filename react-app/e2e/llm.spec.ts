import { test, expect } from '@playwright/test'

// ─── LLM Settings Modal ───────────────────────────────────────────────────────

test.describe('LLM Settings Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  test('settings button opens LLM settings modal', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    await expect(page.getByRole('dialog', { name: /LLM Settings/i })).toBeVisible()
  })

  test('comma shortcut opens LLM settings modal', async ({ page }) => {
    await page.keyboard.press(',')
    await expect(page.getByRole('dialog', { name: /LLM Settings/i })).toBeVisible()
  })

  test('settings modal contains API key input', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })
    await expect(dialog.getByRole('textbox', { name: /CometAPI key/i })).toBeVisible()
  })

  test('settings modal contains base URL input', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })
    await expect(dialog.getByRole('textbox', { name: /CometAPI base URL/i })).toBeVisible()
  })

  test('settings modal contains model ID inputs', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })
    await expect(dialog.getByRole('textbox', { name: /Model ID for opus/i })).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: /Model ID for sonnet/i })).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: /Model ID for haiku/i })).toBeVisible()
  })

  test('can fill API key and save', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })

    const keyInput = dialog.getByRole('textbox', { name: /CometAPI key/i })
    await keyInput.fill('sk-test-key-12345')

    await dialog.getByRole('button', { name: 'Save', exact: true }).click()

    // Modal closes after save
    await expect(dialog).toHaveCount(0)
  })

  test('Cancel button closes the modal without saving', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })

    await dialog.getByRole('button', { name: /Cancel/i }).click()
    await expect(dialog).toHaveCount(0)
  })

  test('Escape key closes the settings modal', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    await expect(page.getByRole('dialog', { name: /LLM Settings/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /LLM Settings/i })).toHaveCount(0)
  })

  test('debug mode checkbox is present', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })
    await expect(dialog.getByRole('checkbox', { name: /Debug Mode/i })).toBeVisible()
  })

  test('LLM badge appears in header after saving a key', async ({ page }) => {
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog = page.getByRole('dialog', { name: /LLM Settings/i })

    await dialog.getByRole('textbox', { name: /CometAPI key/i }).fill('sk-test-key-99999')
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()

    // LLM ✓ badge should appear in the TopBar
    await expect(page.getByRole('banner')).toContainText('LLM')
  })
})
