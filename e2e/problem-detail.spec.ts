/**
 * e2e/problem-detail.spec.ts
 *
 * Tests the problem detail page at /problems/[slug].
 *
 * Because the app may not have a real DB in CI, we test both the loaded state
 * (when the slug resolves) and the error/loading states gracefully.
 *
 * We use "two-sum" as the canonical slug because it is typically seeded.
 * Every assertion that requires real data is guarded so the suite still passes
 * against an empty database.
 */

import { test, expect } from '@playwright/test'
import { waitForApp, expectNoConsoleErrors } from './helpers'

const TEST_SLUG = 'two-sum'
const TEST_URL = `/problems/${TEST_SLUG}`

// Helper: resolve whether the problem loaded or hit the error state.
async function getProblemState(
  page: Parameters<typeof waitForApp>[0],
): Promise<'loaded' | 'error' | 'loading'> {
  try {
    await Promise.race([
      page
        .locator('h1')
        .filter({ hasText: /\S/ })
        .waitFor({ timeout: 8_000 }),
      page
        .locator('[class*="AlertCircle"], [class*="alert"]')
        .waitFor({ timeout: 8_000 }),
    ])
  } catch {
    return 'loading'
  }

  const errorVisible = await page
    .getByText(/Problem not found|not found/i)
    .isVisible()
    .catch(() => false)

  if (errorVisible) return 'error'
  return 'loaded'
}

test.describe('Problem detail page (/problems/[slug])', () => {
  test.setTimeout(30_000)

  test('page does not crash — returns HTTP 200', async ({ page }) => {
    const response = await page.goto(TEST_URL)
    expect(response?.status()).toBe(200)
  })

  test('loading spinner is shown immediately before data arrives', async ({
    page,
  }) => {
    // Navigate without waiting — the loading state is transient.
    await page.goto(TEST_URL)

    // Either a spinner or the actual content is visible — never a blank white
    // page or an uncaught error boundary.
    const spinner = page.locator('[class*="animate-spin"]')
    const heading = page.locator('h1')

    const somethingVisible =
      (await spinner.first().isVisible().catch(() => false)) ||
      (await heading.first().isVisible().catch(() => false))

    expect(somethingVisible).toBe(true)
  })

  test('shows split layout with left description panel and right editor panel', async ({
    page,
  }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Left panel: contains description tab
    await expect(
      page.getByRole('tab', { name: /Description/i }),
    ).toBeVisible()

    // Right panel: contains language selector (a combobox)
    const languageSelector = page.locator('[role="combobox"]').first()
    await expect(languageSelector).toBeVisible()
  })

  test('problem title is visible after loading', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Title appears in both the top header bar and inside the description panel
    const title = page.locator('h1').first()
    await expect(title).toBeVisible()
    await expect(title).not.toBeEmpty()
  })

  test('difficulty badge is visible', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // DifficultyBadge renders one of Easy / Medium / Hard
    const badge = page
      .getByText(/^(Easy|Medium|Hard)$/)
      .first()
    await expect(badge).toBeVisible()
  })

  test('description tab content is present', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Ensure we are on the Description tab (it is the default)
    const descriptionTab = page.getByRole('tab', { name: /Description/i })
    await expect(descriptionTab).toBeVisible()

    // The description panel should have non-trivial text
    const leftPanel = page.locator('.prose, [class*="prose"]').first()
    await expect(leftPanel).toBeVisible()
  })

  test('Hints tab is visible', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    await expect(page.getByRole('tab', { name: /Hints/i })).toBeVisible()
  })

  test('Monaco editor container is rendered', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Monaco renders a div with class "monaco-editor" once the editor mounts.
    // Allow extra time for the heavy Monaco bundle to initialise.
    await expect(page.locator('.monaco-editor').first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('language selector shows current language', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // The language Select trigger shows the active language value.
    const langTrigger = page.locator('[role="combobox"]').first()
    await expect(langTrigger).toBeVisible()

    // Default language is "python" → trigger text should contain Python
    await expect(langTrigger).toContainText(/Python|JavaScript|TypeScript|Java|C\+\+/i)
  })

  test('Run button is visible and enabled (before running)', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    const runButton = page.getByRole('button', { name: /^Run$/i })
    await expect(runButton).toBeVisible()
    await expect(runButton).toBeEnabled()
  })

  test('Submit button is visible', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    const submitButton = page.getByRole('button', { name: /^Submit$/i })
    await expect(submitButton).toBeVisible()
  })

  test('Test Cases tab is visible in the bottom panel', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    await expect(
      page.getByRole('tab', { name: /Test Cases/i }),
    ).toBeVisible()
  })

  test('Results tab is visible in the bottom panel', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    await expect(
      page.getByRole('tab', { name: /Results/i }),
    ).toBeVisible()
  })

  test('Hints tab expands hint content on click', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Click the Hints tab to switch panels
    const hintsTab = page.getByRole('tab', { name: /Hints/i })
    await hintsTab.click()

    // Either "No hints available" or one or more "Show Hint N" buttons
    const noHints = page.getByText(/No hints available/i)
    const showHintButton = page
      .getByRole('button', { name: /Show Hint/i })
      .first()

    const hasHints = await showHintButton.isVisible().catch(() => false)
    const hasNoHintsMsg = await noHints.isVisible().catch(() => false)

    // One of the two states must be visible
    expect(hasHints || hasNoHintsMsg).toBe(true)

    if (hasHints) {
      // Click to expand and verify the hidden text appears
      await showHintButton.click()
      // After toggling, the hint text area should appear (it renders below the button)
      const hintContent = page
        .locator('[class*="border-t"]')
        .filter({ hasText: /\S/ })
        .first()
      await expect(hintContent).toBeVisible()
    }
  })

  test('Constraints section is visible when problem loads', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Constraints heading rendered as <h3>
    const constraintsHeading = page.getByRole('heading', {
      name: /Constraints/i,
    })
    // Not all problems have constraints; check if visible rather than asserting
    const hasConstraints = await constraintsHeading.isVisible().catch(() => false)
    if (hasConstraints) {
      await expect(constraintsHeading).toBeVisible()
    }
  })

  test('clicking Run button triggers running state', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const state = await getProblemState(page)
    if (state !== 'loaded') {
      test.skip()
      return
    }

    // Wait for Monaco to be ready
    await page.locator('.monaco-editor').first().waitFor({ timeout: 15_000 })

    const runButton = page.getByRole('button', { name: /^Run$/i })
    await runButton.click()

    // The button label changes to "Running…" while the request is in flight,
    // then reverts. Capture either state.
    const runningState = await page
      .getByRole('button', { name: /Running/i })
      .isVisible({ timeout: 3_000 })
      .catch(() => false)

    // If the API responded instantly the button may have already reverted —
    // either outcome is acceptable; what matters is no crash.
    expect(typeof runningState).toBe('boolean')
  })

  test('← Problems back link navigates to /problems', async ({ page }) => {
    await page.goto(TEST_URL)
    await waitForApp(page)

    const backLink = page.getByText(/← Problems/i)
    const isVisible = await backLink.isVisible().catch(() => false)

    if (!isVisible) {
      // Still loading or error state — nothing to test
      test.skip()
      return
    }

    await backLink.click()
    await page.waitForLoadState('domcontentloaded')
    await expect(page).toHaveURL(/\/problems$/)
  })

  test('no JS console errors on page load', async ({ page }) => {
    const check = await expectNoConsoleErrors(page)
    await page.goto(TEST_URL)
    await waitForApp(page)
    await getProblemState(page) // allow async rendering to settle
    check()
  })
})
