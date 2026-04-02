/**
 * e2e/ai-mentor.spec.ts
 *
 * Tests the AI Mentor page at /ai.
 *
 * The page renders five tabs:
 *   1. Interview Mode
 *   2. Whiteboard Mode
 *   3. Code Review
 *   4. Study Planner
 *   5. Concept Explainer
 *
 * Tests verify UI interactions only — no AI response content is asserted
 * because it is dynamic.  Tabs that require a DB-backed problem list are
 * guarded: when the problem selector is empty (no DB) those tests are skipped.
 */

import { test, expect } from '@playwright/test'
import { waitForApp, expectNoConsoleErrors } from './helpers'

/** Wait until the AI page has settled (problems may still be loading). */
async function waitForAIPage(page: Parameters<typeof waitForApp>[0]) {
  await waitForApp(page)
  // Wait up to 5 s for the "Loading problems…" indicator to vanish if present.
  try {
    await page
      .getByText(/Loading problems/i)
      .waitFor({ state: 'hidden', timeout: 5_000 })
  } catch {
    // Already gone or never appeared.
  }
}

test.describe('AI Mentor page (/ai)', () => {
  test.setTimeout(30_000)

  // ── Setup ───────────────────────────────────────────────────────────────────

  test('page returns HTTP 200', async ({ page }) => {
    const response = await page.goto('/ai')
    expect(response?.status()).toBe(200)
  })

  test('shows "AI Mentor" heading', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await expect(
      page.getByRole('heading', { name: /AI Mentor/i }),
    ).toBeVisible()
  })

  // ── Tab presence ────────────────────────────────────────────────────────────

  test('all five tabs are visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await expect(
      page.getByRole('tab', { name: /Interview Mode/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: /Whiteboard Mode/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: /Code Review/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: /Study Planner/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('tab', { name: /Concept Explainer/i }),
    ).toBeVisible()
  })

  // ── Tab switching ───────────────────────────────────────────────────────────

  test('clicking each tab does not crash the page', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    const tabNames = [
      'Whiteboard Mode',
      'Code Review',
      'Study Planner',
      'Concept Explainer',
      'Interview Mode', // return to default
    ]

    for (const name of tabNames) {
      await page.getByRole('tab', { name: new RegExp(name, 'i') }).click()
      // Give React a tick to render the new panel
      await page.waitForTimeout(200)
      // Verify the page is still alive (heading still present)
      await expect(
        page.getByRole('heading', { name: /AI Mentor/i }),
      ).toBeVisible()
    }
  })

  // ── Interview Mode tab ──────────────────────────────────────────────────────

  test('Interview Mode: problem selector is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    // Interview tab is the default — its panel is already active.
    // The problem selector is a shadcn Select (renders as role="combobox").
    const problemSelector = page.locator('[role="combobox"]').first()
    await expect(problemSelector).toBeVisible()
  })

  test('Interview Mode: Start Interview button is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await expect(
      page.getByRole('button', { name: /Start Interview/i }),
    ).toBeVisible()
  })

  test('Interview Mode: Start Interview button is disabled when no problem selected', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    const startButton = page.getByRole('button', { name: /Start Interview/i })
    await expect(startButton).toBeDisabled()
  })

  test('Interview Mode: chat area is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    // The chat container is the background area that shows "Select a problem…"
    await expect(
      page.getByText(/Select a problem and click/i),
    ).toBeVisible()
  })

  // ── Whiteboard Mode tab ─────────────────────────────────────────────────────

  test('Whiteboard Mode: problem selector and explanation textarea visible', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Whiteboard Mode/i }).click()
    await page.waitForTimeout(200)

    // Problem selector combobox
    await expect(page.locator('[role="combobox"]').first()).toBeVisible()

    // Explanation textarea — it has a descriptive placeholder
    await expect(
      page.getByPlaceholder(/Describe your approach/i),
    ).toBeVisible()
  })

  test('Whiteboard Mode: Evaluate Explanation button is visible', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Whiteboard Mode/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Evaluate Explanation/i }),
    ).toBeVisible()
  })

  test('Whiteboard Mode: Evaluate Explanation button is disabled when no problem/text', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Whiteboard Mode/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Evaluate Explanation/i }),
    ).toBeDisabled()
  })

  // ── Code Review tab ─────────────────────────────────────────────────────────

  test('Code Review: code textarea is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Code Review/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByPlaceholder(/Paste your .+ solution here/i),
    ).toBeVisible()
  })

  test('Code Review: language selector is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Code Review/i }).click()
    await page.waitForTimeout(200)

    // There are two comboboxes on this tab: problem selector + language selector
    const comboboxes = page.locator('[role="combobox"]')
    await expect(comboboxes.nth(1)).toBeVisible()
  })

  test('Code Review: Review Code button is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Code Review/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Review Code/i }),
    ).toBeVisible()
  })

  test('Code Review: Review Code button is disabled when no code entered', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Code Review/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Review Code/i }),
    ).toBeDisabled()
  })

  test('Code Review: accepts text in the code textarea', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Code Review/i }).click()
    await page.waitForTimeout(200)

    const codeArea = page.getByPlaceholder(/Paste your .+ solution here/i)
    await codeArea.fill('def two_sum(nums, target):\n    return []')
    await expect(codeArea).toHaveValue(/def two_sum/)
  })

  // ── Study Planner tab ───────────────────────────────────────────────────────

  test('Study Planner: category checkboxes/buttons are visible', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Study Planner/i }).click()
    await page.waitForTimeout(200)

    // The category toggle buttons are rendered as <button> elements inside the
    // "Weak Categories" section.
    await expect(
      page.getByText(/Weak Categories/i),
    ).toBeVisible()

    // At least one category button must be in the DOM (e.g. ARRAY)
    await expect(
      page.getByRole('button', { name: /ARRAY/i }),
    ).toBeVisible()
  })

  test('Study Planner: days range slider is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Study Planner/i }).click()
    await page.waitForTimeout(200)

    await expect(page.locator('input[type="range"]')).toBeVisible()
  })

  test('Study Planner: level buttons (Beginner, Intermediate, Advanced) are visible', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Study Planner/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Beginner/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Intermediate/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Advanced/i }),
    ).toBeVisible()
  })

  test('Study Planner: clicking a category toggles its selected state', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Study Planner/i }).click()
    await page.waitForTimeout(200)

    const arrayButton = page.getByRole('button', { name: /^ARRAY$/i })
    // Toggle on
    await arrayButton.click()
    // The button class changes to include bg-blue-600 when selected
    await expect(arrayButton).toHaveClass(/bg-blue-600/)

    // Toggle off
    await arrayButton.click()
    await expect(arrayButton).not.toHaveClass(/bg-blue-600/)
  })

  test('Study Planner: Generate Plan button is disabled with no category selected', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Study Planner/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /Generate Study Plan/i }),
    ).toBeDisabled()
  })

  // ── Concept Explainer tab ───────────────────────────────────────────────────

  test('Concept Explainer: text input is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByPlaceholder(/Dynamic Programming|Binary Search|Trie/i),
    ).toBeVisible()
  })

  test('Concept Explainer: level selector is visible', async ({ page }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    // Level is a Select (combobox)
    await expect(page.locator('[role="combobox"]').first()).toBeVisible()
  })

  test('Concept Explainer: popular concept chips are visible', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    // A sample of the POPULAR_CONCEPTS array defined in the page source
    await expect(
      page.getByRole('button', { name: /Dynamic Programming/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Two Pointers/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: /Binary Search/i }),
    ).toBeVisible()
  })

  test('Concept Explainer: Explain button is disabled when input is empty', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    await expect(
      page.getByRole('button', { name: /^Explain$/i }),
    ).toBeDisabled()
  })

  test('Concept Explainer: Explain button enables when text is typed', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    const input = page.getByPlaceholder(/Dynamic Programming|Binary Search/i)
    await input.fill('Binary Search')

    await expect(
      page.getByRole('button', { name: /^Explain$/i }),
    ).toBeEnabled()
  })

  test('Concept Explainer: clicking a popular chip populates the input', async ({
    page,
  }) => {
    await page.goto('/ai')
    await waitForAIPage(page)

    await page.getByRole('tab', { name: /Concept Explainer/i }).click()
    await page.waitForTimeout(200)

    // Click "Two Pointers" chip — this sets concept AND triggers handleExplain.
    // We only verify the input value updates; we do not await the API response.
    await page.getByRole('button', { name: /Two Pointers/i }).click()

    const input = page.getByPlaceholder(/Dynamic Programming|Binary Search/i)
    await expect(input).toHaveValue('Two Pointers')
  })

  // ── General ─────────────────────────────────────────────────────────────────

  test('no JS console errors on page load', async ({ page }) => {
    const check = await expectNoConsoleErrors(page)
    await page.goto('/ai')
    await waitForAIPage(page)
    check()
  })
})
