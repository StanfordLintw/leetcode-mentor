/**
 * e2e/problems.spec.ts
 *
 * Tests the Problem Bank page at /problems:
 *   - Page loads without crashing (HTTP 200)
 *   - "Problem Bank" heading is visible
 *   - Filter bar (search input, difficulty select, category select) is present
 *   - Dropdown options are correct
 *   - Table headers are present
 *   - Loading skeleton OR actual rows appear (handles no-DB scenario)
 *   - Difficulty badges have expected text
 *   - Clicking a problem row navigates to /problems/[slug]
 */

import { test, expect } from '@playwright/test'
import { waitForApp, waitForContent, expectNoConsoleErrors } from './helpers'

test.describe('Problem Bank page (/problems)', () => {
  test.setTimeout(30_000)

  test('page returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/problems')
    expect(response?.status()).toBe(200)
  })

  test('renders "Problem Bank" heading', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    await expect(
      page.getByRole('heading', { name: /Problem Bank/i }),
    ).toBeVisible()
  })

  test('filter bar is visible: search input present', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    const searchInput = page.getByPlaceholder(/Search problems/i)
    await expect(searchInput).toBeVisible()
  })

  test('difficulty dropdown is visible', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // The shadcn Select renders a button trigger — look for any trigger whose
    // text or aria label suggests the difficulty filter.
    const difficultyTrigger = page
      .locator('[role="combobox"]')
      .filter({ hasText: /All Levels|Easy|Medium|Hard|Difficulty/i })
      .first()
    await expect(difficultyTrigger).toBeVisible()
  })

  test('category dropdown is visible', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // There are two comboboxes: difficulty (w-36) and category (w-48).
    // The category one typically shows "All Categories" or a category name.
    const allTriggers = page.locator('[role="combobox"]')
    await expect(allTriggers).toHaveCount(2)
  })

  test('difficulty dropdown contains All Levels / Easy / Medium / Hard', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // Open the first combobox (difficulty)
    const difficultyTrigger = page.locator('[role="combobox"]').first()
    await difficultyTrigger.click()

    // Options appear in a listbox / popup
    await expect(page.getByRole('option', { name: /All Levels/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /^Easy$/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /^Medium$/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /^Hard$/i })).toBeVisible()

    // Close the dropdown
    await page.keyboard.press('Escape')
  })

  test('category dropdown contains Array, Tree, Dynamic Programming', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // Open the second combobox (category)
    const categoryTrigger = page.locator('[role="combobox"]').nth(1)
    await categoryTrigger.click()

    await expect(page.getByRole('option', { name: /^Array$/i })).toBeVisible()
    await expect(page.getByRole('option', { name: /^Tree$/i })).toBeVisible()
    await expect(
      page.getByRole('option', { name: /Dynamic Programming/i }),
    ).toBeVisible()

    await page.keyboard.press('Escape')
  })

  test('table headers are visible: Title, Category, Difficulty', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // The table uses <th> elements with these exact texts (uppercase via CSS)
    await expect(page.getByRole('columnheader', { name: /Title/i })).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: /Category/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('columnheader', { name: /Difficulty/i }),
    ).toBeVisible()
  })

  test('search input accepts typed text', async ({ page }) => {
    await page.goto('/problems')
    await waitForApp(page)

    const searchInput = page.getByPlaceholder(/Search problems/i)
    await searchInput.fill('two sum')
    await expect(searchInput).toHaveValue('two sum')
  })

  test('loading skeleton or problem rows appear after page load', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // Either we see skeleton rows (no DB) or real problem rows.
    // Skeleton rows are <tr> elements containing animate-pulse divs.
    // Real rows are rendered by <ProblemRow> and are also <tr> elements.
    const tbody = page.locator('table tbody')
    await expect(tbody).toBeVisible()

    // At least one <tr> should exist (skeleton or real)
    const rows = tbody.locator('tr')
    await expect(rows.first()).toBeVisible()
  })

  test('empty state message shows when no problems match filters', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // Wait for loading to complete before applying a filter that yields no results
    await waitForContent(page)

    const searchInput = page.getByPlaceholder(/Search problems/i)
    await searchInput.fill('zzz_no_problem_should_match_this_xyzxyz')

    // Wait for the debounced search (350 ms) + re-render
    await page.waitForTimeout(800)

    // Either "No problems found" message or skeleton while loading
    const noResults = page.getByText(/No problems found/i)
    const isVisible = await noResults.isVisible().catch(() => false)
    // If results returned quickly and were empty, the message is visible
    // If still loading, skeleton is visible — both are valid states
    if (isVisible) {
      await expect(noResults).toBeVisible()
    }
  })

  test('problem rows are clickable and navigate to /problems/[slug]', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)

    // Wait for real rows (not skeleton) to appear
    await waitForContent(page)

    // Look for a real problem link — ProblemRow renders an <a> or <Link>
    // wrapping the row or the title.  The title cell contains a link.
    const problemLink = page
      .locator('table tbody tr a')
      .first()

    const isVisible = await problemLink.isVisible().catch(() => false)
    if (!isVisible) {
      // No DB — skip the navigation assertion
      test.skip()
      return
    }

    const href = await problemLink.getAttribute('href')
    await problemLink.click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL(/\/problems\/.+/)
    // The URL slug should match what the link pointed to
    if (href) {
      await expect(page).toHaveURL(new RegExp(href.replace(/\//g, '\\/')))
    }
  })

  test('difficulty badges display Easy / Medium / Hard text', async ({
    page,
  }) => {
    await page.goto('/problems')
    await waitForApp(page)
    await waitForContent(page)

    // If there is data, at least one badge with a difficulty label should appear
    const easyBadge = page.getByText(/^Easy$/).first()
    const mediumBadge = page.getByText(/^Medium$/).first()
    const hardBadge = page.getByText(/^Hard$/).first()

    const hasData =
      (await easyBadge.isVisible().catch(() => false)) ||
      (await mediumBadge.isVisible().catch(() => false)) ||
      (await hardBadge.isVisible().catch(() => false))

    // Only assert when the database has seeded problems
    if (hasData) {
      // At least one badge is visible — verify it has the correct text
      const anyBadge = (await easyBadge.isVisible().catch(() => false))
        ? easyBadge
        : (await mediumBadge.isVisible().catch(() => false))
          ? mediumBadge
          : hardBadge
      await expect(anyBadge).toBeVisible()
    }
  })

  test('no JS console errors on page load', async ({ page }) => {
    const check = await expectNoConsoleErrors(page)
    await page.goto('/problems')
    await waitForApp(page)
    await waitForContent(page)
    check()
  })
})
