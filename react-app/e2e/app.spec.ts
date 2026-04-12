import { test, expect } from '@playwright/test'

test.describe('Agent Architecture Designer — core UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for i18n to load and app to render
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  // ─── Layout ───────────────────────────────────────────────────────────────

  test('renders three-panel layout', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible()                       // TopBar
    await expect(page.getByRole('complementary', { name: 'Left sidebar' })).toBeVisible()
    await expect(page.getByRole('main', { name: 'Canvas area' })).toBeVisible()
    await expect(page.getByRole('complementary', { name: /Agent|preset|Right/i })).toBeVisible()
  })

  test('shows app title and version badge', async ({ page }) => {
    await expect(page.locator('text=Agent Architecture')).toBeVisible()
    await expect(page.locator('text=v32.16')).toBeVisible()
  })

  // ─── TopBar controls ──────────────────────────────────────────────────────

  test('lang toggle switches PL ↔ EN', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Language/i })
    await expect(btn).toContainText('PL')
    await btn.click()
    await expect(btn).toContainText('EN')
    await btn.click()
    await expect(btn).toContainText('PL')
  })

  test('theme toggle switches dark ↔ light', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Theme/i })
    const htmlEl = page.locator('html')

    // Default: dark theme — no data-theme attribute (or data-theme="dark")
    const before = await htmlEl.getAttribute('data-theme')
    await btn.click()
    const after = await htmlEl.getAttribute('data-theme')
    expect(before).not.toBe(after)
  })

  // ─── Left sidebar ─────────────────────────────────────────────────────────

  test('left sidebar shows 3 tabs', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar.getByRole('tab', { name: 'Agenci' })).toBeVisible()
    await expect(sidebar.getByRole('tab', { name: 'Presety' })).toBeVisible()
    await expect(sidebar.getByRole('tab', { name: 'Zapisane' })).toBeVisible()
  })

  test('agent palette shows Orchestrator with model badge', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const item = sidebar.getByRole('button', { name: /Orkiestrator/i }).first()
    await expect(item).toBeVisible()
    await expect(item).toContainText('OPUS')
  })

  test('agent search filters the list', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const search = sidebar.getByRole('searchbox')
    await search.fill('backend')
    await expect(sidebar.getByRole('button', { name: /Backend/i })).toBeVisible()
    // Orchestrator should be hidden after filtering
    const orch = sidebar.getByRole('button', { name: /Orkiestrator/i })
    await expect(orch).toHaveCount(0)
    await search.clear()
    await expect(sidebar.getByRole('button', { name: /Orkiestrator/i })).toBeVisible()
  })

  test('presets tab shows preset categories', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await expect(sidebar.locator('text=MICRO (2-3)').first()).toBeVisible()
    await expect(sidebar.locator('text=ENTERPRISE').first()).toBeVisible()
  })

  // ─── Canvas ───────────────────────────────────────────────────────────────

  test('canvas shows empty hint initially', async ({ page }) => {
    await expect(page.getByRole('main')).toContainText('Przeciagnij agenta')
  })

  test('drag agent from sidebar onto canvas places a node', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })

    const agentItem = sidebar.getByRole('button', { name: /Orkiestrator/i }).first()
    await agentItem.dragTo(canvas)

    // Node should appear on canvas
    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toBeVisible()
    // Empty hint should be gone
    await expect(canvas.locator('text=Przeciagnij agenta')).toHaveCount(0)
  })

  test('cost HUD appears after dropping a node', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await sidebar.getByRole('button', { name: /Orkiestrator/i }).first().dragTo(canvas)

    // Cost HUD button should appear in TopBar
    const hud = page.getByRole('button', { name: /Cost Command Center/i })
    await expect(hud).toBeVisible()
    await expect(hud).toContainText('KOSZT')
    await expect(hud).toContainText('TOK')
    await expect(hud).toContainText('CTX')
  })

  // ─── Right sidebar ────────────────────────────────────────────────────────

  test('clicking agent in sidebar populates right sidebar', async ({ page }) => {
    const leftSidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await leftSidebar.getByRole('button', { name: /Orkiestrator/i }).first().click()

    const rightSidebar = page.getByRole('complementary', { name: /Agent|preset details/i })
    await expect(rightSidebar).toContainText('Orkiestrator')
    // Should show role section
    await expect(rightSidebar.locator('text=ROLA')).toBeVisible()
    await expect(rightSidebar.locator('text=NARZEDZIA')).toBeVisible()
  })

  test('clicking canvas node populates right sidebar', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await sidebar.getByRole('button', { name: /Orkiestrator/i }).first().dragTo(canvas)

    const node = canvas.getByRole('button', { name: /Agent Orkiestrator/i })
    await node.click()

    const rightSidebar = page.getByRole('complementary', { name: /Agent|preset details/i })
    await expect(rightSidebar).toContainText('Orkiestrator')
  })

  // ─── Simulation ───────────────────────────────────────────────────────────

  test('simulation button starts and stops', async ({ page }) => {
    // Find and click the start button
    const startBtn = page.getByRole('button', { name: /Symulacja/i })
    await expect(startBtn).toBeVisible()
    await startBtn.click()
    // After starting, a "Stop" button should appear (aria-label changes)
    const stopBtn = page.getByRole('button', { name: /Stop/i })
    await expect(stopBtn).toBeVisible()
    await expect(stopBtn).toContainText('Stop')
    await stopBtn.click()
    // Back to Symulacja state
    await expect(page.getByRole('button', { name: /Symulacja/i })).toBeVisible()
  })

  // ─── Accessibility ────────────────────────────────────────────────────────

  test('skip link is present for accessibility', async ({ page }) => {
    const skip = page.getByRole('link', { name: /Skip to canvas/i })
    await expect(skip).toBeAttached()
  })

  test('canvas has accessible label', async ({ page }) => {
    await expect(page.getByRole('main', { name: 'Canvas area' })).toBeVisible()
  })

  // ─── Zoom indicator ───────────────────────────────────────────────────────

  test('zoom indicator shows 100% by default', async ({ page }) => {
    await expect(page.getByRole('main')).toContainText('100%')
  })
})
