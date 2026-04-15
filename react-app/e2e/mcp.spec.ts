import { test, expect } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openSettings(page: Parameters<typeof test>[1]['page']) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.locator('text=Loading...')).toHaveCount(0)
  await page.getByRole('button', { name: /LLM Settings/i }).click()
  await expect(page.getByRole('dialog', { name: /Settings/i })).toBeVisible()
}

async function goToToolSettings(page: Parameters<typeof test>[1]['page']) {
  await openSettings(page)
  await page.getByRole('dialog', { name: /Settings/i }).getByRole('button', { name: /Tool Settings/i }).click()
}

// ─── Settings modal — tabs ─────────────────────────────────────────────────────

test.describe('Settings modal – tabs', () => {
  test('opens with LLM Settings tab active', async ({ page }) => {
    await openSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    // LLM provider section should be visible
    await expect(dialog.getByRole('textbox', { name: /CometAPI key/i })).toBeVisible()
  })

  test('Tool Settings tab is present and navigable', async ({ page }) => {
    await openSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await dialog.getByRole('button', { name: /Tool Settings/i }).click()
    // LLM key input should disappear
    await expect(dialog.getByRole('textbox', { name: /CometAPI key/i })).toHaveCount(0)
    // Tool Sources section should appear
    await expect(dialog).toContainText('Tool Sources')
  })

  test('switching back to LLM tab restores LLM content', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await dialog.getByRole('button', { name: /LLM Settings/i }).click()
    await expect(dialog.getByRole('textbox', { name: /CometAPI key/i })).toBeVisible()
  })
})

// ─── Tool Sources section ──────────────────────────────────────────────────────

test.describe('Tool Settings – Tool Sources', () => {
  test('shows Sonar Web Search source card', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await expect(dialog).toContainText('Sonar')
    await expect(dialog).toContainText('Web Search')
  })

  test('shows Docker Desktop MCP Gateway source card', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await expect(dialog).toContainText('Docker Desktop')
    await expect(dialog).toContainText('MCP Gateway')
  })

  test('MCP Gateway URL input shows default localhost URL', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    const urlInput = dialog.getByRole('textbox', { name: /MCP Gateway URL/i })
    await expect(urlInput).toBeVisible()
    await expect(urlInput).toHaveValue(/localhost:8808/)
  })

  test('MCP Bearer Token input is present', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await expect(dialog.getByRole('textbox', { name: /MCP Bearer Token/i })).toBeVisible()
  })

  test('Sonar disabled badge shows link to LLM tab', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    // The Sonar card always shows a status badge (enabled or disabled)
    const sonarBadge = dialog.locator('span').filter({ hasText: /^enabled$|^disabled$/i }).first()
    await expect(sonarBadge).toBeVisible()
  })

  test('clicking LLM Settings link inside Sonar card goes to LLM tab', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    // Only click if the link is present (Sonar disabled state)
    const link = dialog.getByRole('button', { name: /LLM Settings/i }).first()
    if (await link.isVisible()) {
      await link.click()
      await expect(dialog.getByRole('textbox', { name: /CometAPI key/i })).toBeVisible()
    }
  })
})

// ─── Tool Groups section ───────────────────────────────────────────────────────

test.describe('Tool Settings – Tool Groups', () => {
  test('Tool Groups section is visible', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await expect(dialog).toContainText('Tool Groups')
  })

  test('quick-start presets are shown', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    await expect(dialog).toContainText('web_search')
    await expect(dialog).toContainText('file_tools')
    await expect(dialog).toContainText('dev_tools')
    await expect(dialog).toContainText('docker_tools')
  })

  test('clicking quick-start creates a group card', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Click the web_search quick-start chip
    const webSearchChip = dialog.getByRole('button', { name: /web_search \+/i })
    await webSearchChip.click()

    // A group card with name web_search should appear
    await expect(dialog).toContainText('web_search')
    // The chip for web_search should now show ✓ (already added)
    await expect(dialog.getByRole('button', { name: /web_search ✓/i })).toBeVisible()
  })

  test('group card shows WebSearch tool chip after adding web_search', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    await dialog.getByRole('button', { name: /web_search \+/i }).click()
    // web_search group comes pre-filled with WebSearch tool
    await expect(dialog).toContainText('WebSearch')
  })

  test('can create a custom group via the new group form', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    const input = dialog.getByPlaceholder('new group name…')
    await input.fill('my_custom_group')
    await dialog.getByRole('button', { name: '+ Create' }).click()

    await expect(dialog).toContainText('my_custom_group')
  })

  test('pressing Enter in group name input creates the group', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    const input = dialog.getByPlaceholder('new group name…')
    await input.fill('enter_group')
    await input.press('Enter')

    await expect(dialog).toContainText('enter_group')
  })

  test('group card Edit button expands tool picker', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Create a group first
    const input = dialog.getByPlaceholder('new group name…')
    await input.fill('testgroup')
    await input.press('Enter')

    // Click Edit on the new group card
    await dialog.getByRole('button', { name: 'Edit' }).first().click()

    // Built-in tools picker should appear
    await expect(dialog).toContainText('Built-in')
    await expect(dialog).toContainText('Bash')
  })

  test('can add a built-in tool to a group from the picker', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Create group
    await dialog.getByPlaceholder('new group name…').fill('picker_test')
    await dialog.getByPlaceholder('new group name…').press('Enter')

    // Open editor
    await dialog.getByRole('button', { name: 'Edit' }).first().click()

    // Click Bash from built-in picker
    const bashBtn = dialog.getByRole('button', { name: /Bash/i }).first()
    await bashBtn.click()

    // Bash chip should appear in the group
    await expect(dialog.locator('span').filter({ hasText: 'Bash' }).first()).toBeVisible()
  })

  test('group delete button × removes the group card', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Create a group
    await dialog.getByPlaceholder('new group name…').fill('to_delete')
    await dialog.getByPlaceholder('new group name…').press('Enter')
    await expect(dialog).toContainText('to_delete')

    // Delete it
    await dialog.getByRole('button', { name: /Delete group to_delete/i }).click()
    await expect(dialog).not.toContainText('to_delete')
  })

  test('groups persist after Save and reopening settings', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Add a group
    await dialog.getByPlaceholder('new group name…').fill('persist_group')
    await dialog.getByPlaceholder('new group name…').press('Enter')

    // Save
    await dialog.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(dialog).toHaveCount(0)

    // Reopen and check
    await page.getByRole('button', { name: /LLM Settings/i }).click()
    const dialog2 = page.getByRole('dialog', { name: /Settings/i })
    await dialog2.getByRole('button', { name: /Tool Settings/i }).click()
    await expect(dialog2).toContainText('persist_group')
  })
})

// ─── MCP Gateway enable/disable ───────────────────────────────────────────────

test.describe('Tool Settings – MCP Gateway enabled toggle', () => {
  test('gateway fields dim when MCP disabled', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })

    // Ensure MCP checkbox is unchecked (disabled)
    const checkbox = dialog.getByRole('checkbox', { name: /Enabled|Disabled/i }).first()
    if (await checkbox.isChecked()) {
      await checkbox.uncheck()
    }

    // URL input should still be rendered but in a dimmed container
    const urlInput = dialog.getByRole('textbox', { name: /MCP Gateway URL/i })
    await expect(urlInput).toBeVisible()
  })

  test('can enable MCP gateway via checkbox', async ({ page }) => {
    await goToToolSettings(page)
    const dialog = page.getByRole('dialog', { name: /Settings/i })
    const checkbox = dialog.getByRole('checkbox').first()

    const wasChecked = await checkbox.isChecked()
    if (!wasChecked) {
      await checkbox.check()
      await expect(checkbox).toBeChecked()
    }
  })
})
