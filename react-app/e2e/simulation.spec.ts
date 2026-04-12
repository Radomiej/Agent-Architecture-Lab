import { test, expect, type Page } from '@playwright/test'

// Helper: load Migration Crew preset (has 1 decision_presenter node)
async function loadMigrationCrewPreset(page: Page) {
  const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
  await sidebar.getByRole('tab', { name: 'Presety' }).click()
  const search = sidebar.getByRole('searchbox')
  await search.fill('Migration')
  await sidebar.getByRole('button', { name: /Migration Crew/i }).click()
  await search.clear()
  // Wait for canvas nodes to appear
  await page.getByRole('main', { name: 'Canvas area' }).getByRole('button', { name: /Agent/i }).first().waitFor()
}

// Helper: start simulation and wait for HITL gate
async function startSimAndWaitForGate(page: Page) {
  await page.getByRole('button', { name: /Symulacja/i }).click()
  await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toBeVisible({ timeout: 3000 })
}

test.describe('Decision Gate — preset with decision_presenter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  // ─── Preset loads correctly ───────────────────────────────────────────────

  test('Migration Crew preset loads with a decision_presenter node on canvas', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    const canvas = page.getByRole('main', { name: 'Canvas area' })
    // decision_presenter agent is named "Decision Presenter" on canvas
    await expect(canvas.getByRole('button', { name: /Agent Decision Presenter/i })).toBeVisible()
  })

  test('Deep Five Minds preset loads multiple decision_presenter nodes', async ({ page }) => {
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    const search = sidebar.getByRole('searchbox')
    // Search uses preset IDs (underscores), not display labels
    await search.fill('deep_five_minds')
    await sidebar.getByRole('button', { name: /Deep Five Minds/i }).click()
    await search.clear()

    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await canvas.getByRole('button', { name: /Agent/i }).first().waitFor()
    // Deep Five Minds has 3 decision_presenter nodes
    const gates = canvas.getByRole('button', { name: /Agent Decision Presenter/i })
    await expect(gates).toHaveCount(3)
  })

  // ─── HITL gate modal — open ───────────────────────────────────────────────

  test('starting simulation with a decision_presenter node opens HITL Decision Gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await page.getByRole('button', { name: /Symulacja/i }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toBeVisible({ timeout: 3000 })
  })

  test('HITL gate dialog shows three option buttons (A, B, C)', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await expect(dialog.getByRole('button', { name: /Option A/i })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Option B/i })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Option C/i })).toBeVisible()
  })

  test('HITL gate shows "Kontynuuj plan" option A label', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await expect(dialog).toContainText('Kontynuuj plan')
  })

  test('HITL gate shows "Dostosuj zakres" option B label', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await expect(dialog).toContainText('Dostosuj zakres')
  })

  test('HITL gate shows "Zatrzymaj i przejrzyj" option C label', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await expect(dialog).toContainText('Zatrzymaj i przejrzyj')
  })

  // ─── HITL gate modal — close / choose ────────────────────────────────────

  test('clicking Option A closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await dialog.getByRole('button', { name: /Option A/i }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  test('clicking Option B closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await dialog.getByRole('button', { name: /Option B/i }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  test('clicking Option C closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await dialog.getByRole('button', { name: /Option C/i }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  test('pressing Escape closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  test('clicking the × close button closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    const dialog = page.getByRole('dialog', { name: /HITL Decision Gate/i })
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  test('clicking the backdrop closes the HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toBeVisible()
    await page.locator('[role="presentation"]').click({ position: { x: 5, y: 5 } })
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
  })

  // ─── HITL gate — simulation interaction ───────────────────────────────────

  test('HITL gate does NOT appear when simulation starts with no decision_presenter on canvas', async ({ page }) => {
    // Load Solo preset (no decision_presenter node)
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Solo' }).click()
    await page.getByRole('main', { name: 'Canvas area' }).getByRole('button', { name: /Agent/i }).first().waitFor()

    await page.getByRole('button', { name: /Symulacja/i }).click()
    await expect(page.getByRole('button', { name: /Stop/i })).toBeVisible()

    // Wait a moment longer than the 800ms trigger delay
    await page.waitForTimeout(1200)
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)

    // Cleanup
    await page.getByRole('button', { name: /Stop/i }).click()
  })

  test('stopping simulation closes an open HITL gate', async ({ page }) => {
    await loadMigrationCrewPreset(page)
    await startSimAndWaitForGate(page)
    // TopBar z-index (2010) is above the gate overlay (2000) — Stop is always clickable
    await page.getByRole('button', { name: /Stop/i }).click()
    await expect(page.getByRole('dialog', { name: /HITL Decision Gate/i })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Symulacja/i })).toBeVisible()
  })
})
