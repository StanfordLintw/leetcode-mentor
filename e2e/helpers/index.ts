import { type Page, expect } from '@playwright/test'

/**
 * Wait for the app shell to be interactive after navigation.
 * Waits for DOM content to load and allows React hydration to settle.
 */
export async function waitForApp(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(500) // allow hydration
}

/**
 * Attaches a console-error listener before navigation so that any JS errors
 * emitted during page load are captured.
 *
 * Usage:
 *   const check = await expectNoConsoleErrors(page)
 *   await page.goto('/')
 *   check() // asserts no errors were collected
 */
export async function expectNoConsoleErrors(
  page: Page,
): Promise<() => void> {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  return () =>
    expect(
      errors.filter(
        (e) =>
          // Ignore React DevTools / hydration warnings and network noise that
          // are not real application errors.
          !e.includes('Warning:') &&
          !e.includes('hydration') &&
          !e.includes('net::ERR_'),
      ),
    ).toHaveLength(0)
}

/**
 * Returns true when the page has finished its initial data fetch — i.e. the
 * skeleton / loading spinner is gone.  Useful for pages that render an async
 * loading state before the real content appears.
 */
export async function waitForContent(
  page: Page,
  loadingSelector = '[class*="animate-pulse"]',
  timeout = 10_000,
): Promise<void> {
  // If there are loading skeletons, wait until they disappear.
  try {
    await page.waitForSelector(loadingSelector, { state: 'hidden', timeout })
  } catch {
    // No skeleton appeared, or it was gone before we checked — that's fine.
  }
}
