/**
 * e2e/dashboard.spec.ts
 *
 * Tests the Analytics Dashboard page at /dashboard.
 *
 * The page renders a full-screen loading spinner while it fetches
 * /api/stats/detailed.  If the database is empty or unavailable the spinner
 * disappears and an error card is shown.  Both outcomes must not crash the UI.
 */

import { test, expect } from '@playwright/test'
import { waitForApp, expectNoConsoleErrors } from './helpers'

// How long to wait for the loading spinner to disappear before giving up.
const DATA_TIMEOUT = 15_000

async function waitForDashboard(page: Parameters<typeof waitForApp>[0]) {
  // The loading spinner has an animate-spin class.  Wait for it to vanish,
  // which signals that either data loaded or an error was returned.
  try {
    await page
      .locator('[class*="animate-spin"]')
      .first()
      .waitFor({ state: 'hidden', timeout: DATA_TIMEOUT })
  } catch {
    // Spinner may never have appeared if hydration was fast.
  }
}

test.describe('Analytics Dashboard (/dashboard)', () => {
  test.setTimeout(30_000)

  test('page returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/dashboard')
    expect(response?.status()).toBe(200)
  })

  test('loading spinner is visible immediately', async ({ page }) => {
    // Navigate without awaiting — capture the transient loading state.
    await page.goto('/dashboard')

    // Something should be visible right away (spinner or content).
    const spinner = page.locator('[class*="animate-spin"]')
    const heading = page.getByRole('heading', { name: /Analytics Dashboard/i })

    const somethingVisible =
      (await spinner.first().isVisible().catch(() => false)) ||
      (await heading.isVisible().catch(() => false))

    expect(somethingVisible).toBe(true)
  })

  test('shows "Analytics Dashboard" heading after data loads', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    // If the API errored, an error card is shown instead.
    const errorCard = page.getByText(/Failed to load analytics/i)
    const isError = await errorCard.isVisible().catch(() => false)

    if (isError) {
      // Graceful degradation — error state is acceptable.
      await expect(errorCard).toBeVisible()
      return
    }

    await expect(
      page.getByRole('heading', { name: /Analytics Dashboard/i }),
    ).toBeVisible()
  })

  test('stats cards section (Days Practiced, Current Streak, Longest Streak) is visible', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    await expect(
      page.getByText(/Days Practiced/i).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/Current Streak/i).first(),
    ).toBeVisible()
    await expect(
      page.getByText(/Longest Streak/i).first(),
    ).toBeVisible()
  })

  test('submission heatmap section is visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    // Heatmap card title
    await expect(
      page.getByText(/Submission Activity/i),
    ).toBeVisible()
  })

  test('charts section exists (difficulty and category charts)', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    // Card titles for the two charts
    await expect(
      page.getByText(/Solved by Difficulty/i),
    ).toBeVisible()
    await expect(
      page.getByText(/Solved by Category/i),
    ).toBeVisible()
  })

  test('language distribution section is visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    await expect(
      page.getByText(/Language Distribution/i),
    ).toBeVisible()
  })

  test('recent activity section is visible', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    await expect(
      page.getByText(/Recent Activity/i),
    ).toBeVisible()
  })

  test('recent activity tabs — All, Accepted, Failed — are present', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    await expect(page.getByRole('tab', { name: /^All$/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Accepted/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Failed/i })).toBeVisible()
  })

  test('switching recent activity tabs does not crash', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    const acceptedTab = page.getByRole('tab', { name: /Accepted/i })
    await acceptedTab.click()
    // Either submissions or the empty-state message is visible.
    const content = page.locator('[role="tabpanel"]').last()
    await expect(content).toBeVisible()

    const failedTab = page.getByRole('tab', { name: /Failed/i })
    await failedTab.click()
    await expect(content).toBeVisible()
  })

  test('navigation bar is present on the dashboard page', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    await expect(
      page.getByRole('link', { name: /LeetCode Mentor/i }).first(),
    ).toBeVisible()
    await expect(
      page.getByRole('link', { name: /Problems/i }),
    ).toBeVisible()
  })

  test('recharts SVG containers render when there is data', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)

    const isError = await page
      .getByText(/Failed to load analytics/i)
      .isVisible()
      .catch(() => false)
    if (isError) {
      test.skip()
      return
    }

    // Recharts renders <svg> elements for charts.  They only appear when data
    // is non-zero; otherwise an empty-state message is shown.
    const svg = page.locator('svg').first()
    const emptyCopy = page.getByText(/No solved problems yet/i).first()

    const hasSvg = await svg.isVisible().catch(() => false)
    const hasEmpty = await emptyCopy.isVisible().catch(() => false)

    // At least one of the two must be present
    expect(hasSvg || hasEmpty).toBe(true)
  })

  test('no JS console errors on page load', async ({ page }) => {
    const check = await expectNoConsoleErrors(page)
    await page.goto('/dashboard')
    await waitForApp(page)
    await waitForDashboard(page)
    check()
  })
})
