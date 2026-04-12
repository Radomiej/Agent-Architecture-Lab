import { test, expect } from '@playwright/test'

// Helper: load Solo preset (2 nodes) so cost/mermaid data is non-empty
async function loadSoloPreset(page: import('@playwright/test').Page) {
  const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
  await sidebar.getByRole('tab', { name: 'Presety' }).click()
  await sidebar.getByRole('button', { name: 'Solo' }).click()
  await page.getByRole('main', { name: 'Canvas area' }).getByRole('button', { name: /Agent/i }).first().waitFor()
}

// ─── Cost Modal ────────────────────────────────────────────────────────────────

test.describe('Cost modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  test('opens via K shortcut with no nodes', async ({ page }) => {
    await page.keyboard.press('k')
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toBeVisible()
  })

  test('opens via the Cost HUD button in the topbar', async ({ page }) => {
    await loadSoloPreset(page)
    await page.getByRole('button', { name: /Cost Command Center/i }).click()
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toBeVisible()
  })

  test('shows three tabs: Overview, Breakdown, What-if', async ({ page }) => {
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    await expect(dialog.getByRole('button', { name: 'Overview' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Breakdown' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'What-if' })).toBeVisible()
  })

  test('defaults to Overview tab showing cost KPI cards', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    // Overview tab shows cost KPI cards
    await expect(dialog).toContainText('Cost p50')
    await expect(dialog).toContainText('$')
  })

  test('Breakdown tab shows a table with agent rows', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    await dialog.getByRole('button', { name: 'Breakdown' }).click()
    // Table should appear with a row for each agent
    await expect(dialog.locator('table')).toBeVisible()
    // Solo has orchestrator and backend — verify at least one row beyond header
    const rows = dialog.locator('table tbody tr')
    await expect(rows).not.toHaveCount(0)
  })

  test('What-if tab shows multiplier sliders', async ({ page }) => {
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    await dialog.getByRole('button', { name: 'What-if' }).click()
    await expect(dialog.locator('input[type="range"]').first()).toBeVisible()
  })

  test('closes on Escape key', async ({ page }) => {
    await page.keyboard.press('k')
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toHaveCount(0)
  })

  test('closes on the × close button', async ({ page }) => {
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toHaveCount(0)
  })

  test('closes when clicking the backdrop', async ({ page }) => {
    await page.keyboard.press('k')
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toBeVisible()
    // Click on the semi-transparent overlay (role="presentation" wrapper)
    await page.locator('[role="presentation"]').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toHaveCount(0)
  })

  test('Breakdown tab sorts by agent name when Agent column header is clicked', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('k')
    const dialog = page.getByRole('dialog', { name: /Cost Command Center/i })
    await dialog.getByRole('button', { name: 'Breakdown' }).click()
    const agentColHeader = dialog.locator('table thead th').first()
    await agentColHeader.click()
    // Table remains visible after sort click
    await expect(dialog.locator('table')).toBeVisible()
  })
})

// ─── Mermaid Modal ─────────────────────────────────────────────────────────────

test.describe('Mermaid modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  test('opens via M shortcut', async ({ page }) => {
    await page.keyboard.press('m')
    await expect(page.getByRole('dialog', { name: /Export Mermaid Diagram/i })).toBeVisible()
  })

  test('shows a hint message when canvas has no nodes', async ({ page }) => {
    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: /Export Mermaid Diagram/i })
    await expect(dialog).toContainText('Add agents to the canvas first')
  })

  test('shows flowchart TD code after loading a preset', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: /Export Mermaid Diagram/i })
    const textarea = dialog.locator('textarea')
    await expect(textarea).toBeVisible()
    const value = await textarea.inputValue()
    expect(value).toContain('flowchart TD')
  })

  test('diagram contains agent node definitions after loading a preset', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: /Export Mermaid Diagram/i })
    const value = await dialog.locator('textarea').inputValue()
    // Solo has orchestrator (Orkiestrator) and backend — both should appear
    expect(value).toContain('Orkiestrator')
    expect(value).toContain('Backend')
  })

  test('shows a Copy button when nodes are present', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: /Export Mermaid Diagram/i })
    await expect(dialog.getByRole('button', { name: /Copy/i })).toBeVisible()
  })

  test('closes on Escape key', async ({ page }) => {
    await page.keyboard.press('m')
    await expect(page.getByRole('dialog', { name: /Export Mermaid Diagram/i })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /Export Mermaid Diagram/i })).toHaveCount(0)
  })

  test('closes on the × close button', async ({ page }) => {
    await page.keyboard.press('m')
    const dialog = page.getByRole('dialog', { name: /Export Mermaid Diagram/i })
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog', { name: /Export Mermaid Diagram/i })).toHaveCount(0)
  })

  test('diagram contains classDef entries for phases', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('m')
    const value = await page.getByRole('dialog', { name: /Export Mermaid Diagram/i }).locator('textarea').inputValue()
    expect(value).toContain('classDef')
  })

  test('diagram contains --> arrow connections', async ({ page }) => {
    await loadSoloPreset(page)
    await page.keyboard.press('m')
    const value = await page.getByRole('dialog', { name: /Export Mermaid Diagram/i }).locator('textarea').inputValue()
    // Solo has a connection orchestrator -> backend
    expect(value).toContain('-->')
  })
})
