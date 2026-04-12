import { test, expect } from '@playwright/test'

const EMPTY_CANVAS_HINT = 'Przeciagnij agenta'
const EMPTY_SAVED_MSG = 'Brak zapisanych konfiguracji'

test.describe('Canvas interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  // ─── Preset loading ───────────────────────────────────────────────────────

  test('loading a preset from the palette places nodes on the canvas', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()

    // "Solo" preset has 2 nodes: orchestrator + backend
    await sidebar.getByRole('button', { name: 'Solo' }).click()

    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Agent Backend/i })).toBeVisible()
    await expect(canvas.locator(`text=${EMPTY_CANVAS_HINT}`)).toHaveCount(0)
  })

  test('loading a preset clears previous canvas contents', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })

    // First drop a single agent manually
    await sidebar.getByRole('button', { name: /Orkiestrator/i }).first().dragTo(canvas)
    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toBeVisible()

    // Then load a preset — canvas should be replaced
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Quick Fix' }).click()

    // Quick Fix has 3 nodes: orchestrator, backend, qa_quality
    const nodes = canvas.getByRole('button', { name: /^Agent /i })
    await expect(nodes).toHaveCount(3)
  })

  test('loading "Solo" preset populates right sidebar with preset details', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Solo' }).click()

    const rightSidebar = page.getByRole('complementary', { name: /Agent|preset details/i })
    await expect(rightSidebar).toContainText('Solo')
  })

  test('preset search filters the preset list', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()

    const search = sidebar.getByRole('searchbox')
    await search.fill('solo')

    await expect(sidebar.getByRole('button', { name: 'Solo' })).toBeVisible()
    // A preset that doesn't match should be hidden
    await expect(sidebar.getByRole('button', { name: 'Quick Fix' })).toHaveCount(0)

    await search.clear()
    await expect(sidebar.getByRole('button', { name: 'Quick Fix' })).toBeVisible()
  })

  // ─── Node deletion ────────────────────────────────────────────────────────

  test('Delete key removes the selected node from the canvas', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })

    // Place a node
    await sidebar.getByRole('button', { name: /Orkiestrator/i }).first().dragTo(canvas)
    const node = canvas.getByRole('button', { name: /Agent Orkiestrator/i })
    await expect(node).toBeVisible()

    // Select it by clicking
    await node.click()

    // Delete it
    await page.keyboard.press('Delete')

    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toHaveCount(0)
    await expect(canvas.locator(`text=${EMPTY_CANVAS_HINT}`)).toBeVisible()
  })

  test('Delete key does nothing when no node is selected', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    const canvas = page.getByRole('main', { name: 'Canvas area' })

    // Place a node but don't select it (click elsewhere to deselect)
    await sidebar.getByRole('button', { name: /Orkiestrator/i }).first().dragTo(canvas)
    // Click the canvas background to deselect
    await canvas.click({ position: { x: 50, y: 50 } })

    await page.keyboard.press('Delete')

    // Node should still be there
    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toBeVisible()
  })

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

  test('K shortcut opens the Cost Command Center modal', async ({ page }) => {
    await page.keyboard.press('k')
    await expect(page.getByRole('dialog', { name: /Cost Command Center/i })).toBeVisible()
  })

  test('M shortcut opens the Mermaid export modal', async ({ page }) => {
    await page.keyboard.press('m')
    await expect(page.getByRole('dialog', { name: /Export Mermaid Diagram/i })).toBeVisible()
  })

  test('D shortcut toggles the LLM debug panel open', async ({ page }) => {
    await page.keyboard.press('d')
    await expect(page.getByRole('region', { name: /LLM Debug Panel/i })).toBeVisible()
  })

  test('D shortcut toggles the LLM debug panel closed again', async ({ page }) => {
    // Open it
    await page.keyboard.press('d')
    await expect(page.getByRole('region', { name: /LLM Debug Panel/i })).toBeVisible()
    // Close it
    await page.keyboard.press('d')
    await expect(page.getByRole('region', { name: /LLM Debug Panel/i })).toHaveCount(0)
  })

  // ─── Canvas empty state ───────────────────────────────────────────────────

  test('Saved tab shows empty-state message when no configs exist', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Zapisane' }).click()
    await expect(sidebar.locator(`text=${EMPTY_SAVED_MSG}`)).toBeVisible()
  })

  // ─── Multi-node canvas state ──────────────────────────────────────────────

  test('loading a preset shows the cost HUD in the topbar', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Solo' }).click()

    const hud = page.getByRole('button', { name: /Cost Command Center/i })
    await expect(hud).toBeVisible()
    await expect(hud).toContainText('KOSZT')
  })

  // ─── Simulation with loaded preset ───────────────────────────────────────

  test('simulation can be started and stopped after loading a preset', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Solo' }).click()

    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await expect(canvas.getByRole('button', { name: /Agent/i }).first()).toBeVisible()

    await page.getByRole('button', { name: /Symulacja/i }).click()
    await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible()
    await page.getByRole('button', { name: /Stop/i }).click()
    await expect(page.getByRole('button', { name: /Symulacja/i })).toBeVisible()
  })
})
