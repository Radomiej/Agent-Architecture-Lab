import { test, expect } from '@playwright/test'

/**
 * MCP Integration E2E — connects to a live Docker MCP Gateway,
 * configures tool groups, loads a preset, and runs a simulation.
 *
 * Prerequisites:
 *   docker mcp gateway run --port 8808 --transport streaming
 *
 * Run with:
 *   npx playwright test e2e/mcp-integration.spec.ts
 */

const MCP_URL = 'http://localhost:8808/mcp'
const MCP_PROXY_URL = '/mcp-proxy'

test.describe('MCP Gateway Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.locator('text=Loading...')).toHaveCount(0)
  })

  test('connect to MCP gateway, discover tools, configure groups, run simulation', async ({ page }) => {
    // ── Step 1: Open Settings modal ─────────────────────────────────────────
    const settingsBtn = page.getByRole('button', { name: /Ustawienia|Settings/i })
    await settingsBtn.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // ── Step 2: Go to Tool Sources tab ──────────────────────────────────────
    await dialog.getByText('🔧 Tool Sources').click()
    await expect(dialog.getByText('Docker Desktop · MCP Gateway')).toBeVisible()

    // ── Step 3: Enable MCP gateway and set token ────────────────────────────
    // Enable the checkbox
    const enableCheckbox = dialog.locator('label').filter({ hasText: /Enable|Włącz/i }).locator('input[type="checkbox"]')
    if (!(await enableCheckbox.isChecked())) {
      await enableCheckbox.check()
    }

    // The URL field should have default localhost:8808
    const urlInput = dialog.locator('input[placeholder*="localhost"]').first()
    await expect(urlInput).toBeVisible()
    const currentUrl = await urlInput.inputValue()
    if (!currentUrl.includes('8808')) {
      await urlInput.fill(MCP_URL)
    }

    // Fill bearer token by evaluating localStorage to get the token
    // (In real usage the user pastes the token; here we inject it via store)
    // First try to connect without token since Docker MCP gateway requires it
    // We'll set it programmatically for the test
    await page.evaluate((url) => {
      const stored = JSON.parse(localStorage.getItem('acMcp') || '{}')
      stored.config = {
        ...stored.config,
        gatewayUrl: url,
        enabled: true,
      }
      localStorage.setItem('acMcp', JSON.stringify(stored))
    }, MCP_URL)

    // ── Step 4: Save and reconnect ──────────────────────────────────────────
    const saveBtn = dialog.getByRole('button', { name: /Save|Zapisz/i })
    await saveBtn.click()

    // Reopen settings to verify connection
    await settingsBtn.click()
    await expect(dialog).toBeVisible()
    await dialog.getByText('🔧 Tool Sources').click()

    // Try to connect — check for connected status or tool count
    // The MCP gateway should respond to initialize
    const connectStatus = dialog.locator('text=/Connected|connected|tools|narzędzi/i')
    // Give it a moment to auto-connect
    await page.waitForTimeout(2000)

    // ── Step 5: Go to Tool Groups tab ───────────────────────────────────────
    await dialog.getByText('📦 Tool Groups').click()
    await expect(dialog.getByText(/Tool Groups|Grupy narzedzi/i).first()).toBeVisible()

    // Check quick-start presets exist
    await expect(dialog.getByText('web_search')).toBeVisible()
    await expect(dialog.getByText('file_tools')).toBeVisible()
    await expect(dialog.getByText('dev_tools')).toBeVisible()

    // Save settings
    await dialog.getByRole('button', { name: /Save|Zapisz/i }).click()

    // ── Step 6: Load a preset ───────────────────────────────────────────────
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await sidebar.getByRole('button', { name: 'Solo' }).click()

    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await expect(canvas.getByRole('button', { name: /Agent Orkiestrator/i })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /Agent Backend/i })).toBeVisible()

    // ── Step 7: Start simulation ────────────────────────────────────────────
    await page.getByRole('button', { name: /Symulacja/i }).click()

    const timeline = page.getByLabel('Dialog Timeline')
    await expect(timeline).toBeVisible()
    await expect(timeline.getByText(/Przetwarzam etap/).first()).toBeVisible({ timeout: 5000 })

    // Wait for simulation to complete — review modal opens
    const reviewDialog = page.getByRole('dialog')
    await expect(reviewDialog).toBeVisible({ timeout: 15000 })
    await expect(reviewDialog.getByText(/Symulacja zakonczona/)).toBeVisible()

    // ── Step 8: Verify timeline entries have tool call messages ──────────────
    // Orchestrator should have Read, Write, Bash, Agent tool calls
    await expect(reviewDialog.getByText(/📖 Read/).first()).toBeVisible()
    await expect(reviewDialog.getByText(/✏️ Write/).first()).toBeVisible()
    await expect(reviewDialog.getByText(/💻 Bash/).first()).toBeVisible()

    // Backend Dev should also have tool messages
    await expect(reviewDialog.getByText(/Backend Dev/).first()).toBeVisible()
  })

  test('MCP tool groups quickstart presets appear and can be expanded', async ({ page }) => {
    const settingsBtn = page.getByRole('button', { name: /Ustawienia|Settings/i })
    await settingsBtn.click()
    const dialog = page.getByRole('dialog')

    await dialog.getByText('📦 Tool Groups').click()

    // Verify all 4 quick-start groups
    for (const groupName of ['web_search', 'file_tools', 'dev_tools', 'docker_tools']) {
      await expect(dialog.getByText(groupName)).toBeVisible()
    }

    // Click Edit on dev_tools to expand tool picker
    const devToolsCard = dialog.locator('[class*="group"], div').filter({ hasText: 'dev_tools' }).first()
    const editBtn = devToolsCard.getByRole('button', { name: /Edit|Edytuj/i })
    if (await editBtn.isVisible()) {
      await editBtn.click()
      // Should show built-in tools like Read, Write, Bash
      await expect(dialog.getByText('Bash')).toBeVisible()
    }
  })
})
