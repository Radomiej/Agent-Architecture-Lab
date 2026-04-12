/**
 * Mobile UX E2E tests (Pixel 5 — 393 × 851, touch-enabled).
 *
 * Covers:
 *  - Bottom nav bar visible and desktop sidebars hidden
 *  - Left drawer: open via hamburger / close via backdrop / close via Escape / toggle
 *  - Left drawer content: tabs + agent list + presets
 *  - Right drawer: open via "Szczegóły" button / contains right sidebar
 *  - Right drawer: opens automatically when agent is selected from left drawer
 *  - Canvas reachable and shows empty hint on mobile
 *  - TopBar mobile appearance
 *  - Mermaid / Export modal reachable from bottom nav
 *  - Accessibility: skip link, aria-labels on nav buttons
 */

import { test, expect } from '@playwright/test'

// ─── shared setup ──────────────────────────────────────────────────────────
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.locator('text=Loading...')).toHaveCount(0)
})

// ─── Layout visibility ─────────────────────────────────────────────────────

test.describe('Mobile layout — visibility', () => {
  test('bottom navigation bar is visible', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav).toBeVisible()
  })

  test('canvas area is visible on mobile', async ({ page }) => {
    await expect(page.getByRole('main', { name: 'Canvas area' })).toBeVisible()
  })

  test('desktop sidebars are hidden on mobile', async ({ page }) => {
    // The desktop sidebar wrappers use Tailwind "hidden md:flex" → display:none on mobile
    // The complementary sidebars inside them should not be visible
    // (They become visible only inside drawers when opened)
    const leftSidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(leftSidebar).toBeHidden()
    const rightSidebar = page.getByRole('complementary', { name: /Right sidebar|Agent\/preset details/i })
    await expect(rightSidebar).toBeHidden()
  })

  test('TopBar is visible with app title', async ({ page }) => {
    await expect(page.getByRole('banner')).toBeVisible()
    const header = page.getByRole('banner')
    const titleText = await header.textContent()
    expect(titleText).toMatch(/Agent Architecture|AA/)
  })
})

// ─── Bottom navigation buttons ─────────────────────────────────────────────

test.describe('Mobile bottom navigation', () => {
  test('shows Agenci button', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav.getByRole('button', { name: /Agenci/i })).toBeVisible()
  })

  test('shows Canvas button', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav.getByRole('button', { name: /Canvas/i })).toBeVisible()
  })

  test('shows Eksport button', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav.getByRole('button', { name: /Eksport/i })).toBeVisible()
  })

  test('shows Szczegóły button', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await expect(nav.getByRole('button', { name: /Szczeg/i })).toBeVisible()
  })
})

// ─── Left drawer ──────────────────────────────────────────────────────────

test.describe('Mobile left drawer', () => {
  test('Agenci button opens left drawer with agent list', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar).toBeVisible()
    await expect(sidebar.getByRole('button', { name: /Orkiestrator/i }).first()).toBeVisible()
  })

  test('left drawer shows tabs: Agenci, Presety, Zapisane', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar.getByRole('tab', { name: 'Agenci' })).toBeVisible()
    await expect(sidebar.getByRole('tab', { name: 'Presety' })).toBeVisible()
    await expect(sidebar.getByRole('tab', { name: 'Zapisane' })).toBeVisible()
  })

  test('left drawer closes when backdrop is clicked', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar).toBeVisible()

    // Click the dedicated backdrop element
    await page.locator('[data-testid="left-drawer-backdrop"]').click()
    await expect(sidebar).toBeHidden()
  })

  test('left drawer closes when Escape is pressed', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sidebar).toBeHidden()
  })

  test('toggling Agenci button twice closes the drawer', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    const agentiBtn = nav.getByRole('button', { name: /Agenci/i })

    // First click: open drawer
    await agentiBtn.click()
    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(sidebar).toBeVisible()

    // Second click: close drawer (backdrop ends above MobileNav, so button is clickable)
    await agentiBtn.click()
    await expect(sidebar).toBeHidden()
  })

  test('presets tab inside drawer shows preset categories', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const sidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    // Presety tab is inside the drawer panel (z-50, starts below TopBar at top-12)
    await sidebar.getByRole('tab', { name: 'Presety' }).click()
    await expect(sidebar.locator('text=MICRO (2-3)').first()).toBeVisible()
  })
})

// ─── Right drawer ─────────────────────────────────────────────────────────

test.describe('Mobile right drawer', () => {
  test('Szczegóły button opens right drawer', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Szczeg/i }).click()

    // Right sidebar (empty state) should become visible
    const rightSidebar = page.getByRole('complementary', { name: 'Right sidebar' })
    await expect(rightSidebar).toBeVisible()
    // Should show the empty state hint
    await expect(rightSidebar).toContainText('Kliknij agenta')
  })

  test('right drawer closes when backdrop is clicked', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Szczeg/i }).click()

    const rightSidebar = page.getByRole('complementary', { name: 'Right sidebar' })
    await expect(rightSidebar).toBeVisible()

    await page.locator('[data-testid="right-drawer-backdrop"]').click()
    await expect(rightSidebar).toBeHidden()
  })

  test('clicking agent in left drawer navigates to right sidebar with agent detail', async ({ page }) => {
    // Open left drawer
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    const leftSidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(leftSidebar).toBeVisible()

    // Click an agent — this should close left drawer and open right drawer
    await leftSidebar.getByRole('button', { name: /Orkiestrator/i }).first().click()

    // Left drawer should close
    await expect(leftSidebar).toBeHidden()

    // Right sidebar should open with agent details
    const rightSidebar = page.getByRole('complementary', { name: 'Agent/preset details' })
    await expect(rightSidebar).toBeVisible()
    await expect(rightSidebar).toContainText('Orkiestrator')
  })

  test('opening left drawer closes right drawer', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })

    // Open right drawer first
    await nav.getByRole('button', { name: /Szczeg/i }).click()
    const rightSidebar = page.getByRole('complementary', { name: 'Right sidebar' })
    await expect(rightSidebar).toBeVisible()

    // Now open left drawer — right should close (Agenci btn calls setLeftDrawer + setRightDrawer(false))
    await nav.getByRole('button', { name: /Agenci/i }).click()
    const leftSidebar = page.getByRole('complementary', { name: 'Left sidebar' })
    await expect(leftSidebar).toBeVisible()
    await expect(rightSidebar).toBeHidden()
  })

  test('toggling Szczegóły button twice closes the right drawer', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    const detailsBtn = nav.getByRole('button', { name: /Szczeg/i })

    await detailsBtn.click()
    const rightSidebar = page.getByRole('complementary', { name: 'Right sidebar' })
    await expect(rightSidebar).toBeVisible()

    await detailsBtn.click()
    await expect(rightSidebar).toBeHidden()
  })
})

// ─── Canvas on mobile ─────────────────────────────────────────────────────

test.describe('Canvas on mobile', () => {
  test('canvas shows empty hint on mobile', async ({ page }) => {
    await expect(page.getByRole('main')).toContainText('Przeciagnij agenta')
  })

  test('canvas shows zoom indicator', async ({ page }) => {
    await expect(page.getByRole('main')).toContainText('100%')
  })

  test('canvas is not covered by drawers when no drawer is open', async ({ page }) => {
    const canvas = page.getByRole('main', { name: 'Canvas area' })
    await expect(canvas).toBeVisible()
    // No overlay should exist
    await expect(page.locator('[data-testid="left-drawer-backdrop"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="right-drawer-backdrop"]')).toHaveCount(0)
  })
})

// ─── Modals via bottom nav ─────────────────────────────────────────────────

test.describe('Modals via bottom nav', () => {
  test('Export button opens Mermaid modal', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Eksport/i }).click()

    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Mermaid')
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()
  })

  test('Escape closes modal opened from bottom nav', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Eksport/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})

// ─── Accessibility on mobile ──────────────────────────────────────────────

test.describe('Mobile accessibility', () => {
  test('skip link is present on mobile', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Skip to canvas/i })).toBeAttached()
  })

  test('mobile nav buttons all have aria-labels', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    const buttons = nav.getByRole('button')
    const count = await buttons.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const label = await buttons.nth(i).getAttribute('aria-label')
      expect(label, `Button ${i} should have aria-label`).toBeTruthy()
    }
  })

  test('left sidebar has accessible role and label when open', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Mobile navigation' })
    await nav.getByRole('button', { name: /Agenci/i }).click()

    // aria-label="Left sidebar" and role=complementary
    await expect(page.getByRole('complementary', { name: 'Left sidebar' })).toBeVisible()
  })
})

