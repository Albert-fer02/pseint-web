import { expect, test } from '@playwright/test'

test.describe('Playground mobile', () => {
  test('shows core mobile controls and avoids horizontal overflow', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('PSeInt Learning Studio')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activar modo claro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activar modo OLED dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ejecutar programa' })).toBeVisible()

    await page.getByRole('tab', { name: 'Entradas' }).click()
    await expect(page.getByRole('heading', { name: 'Entradas' })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasHorizontalOverflow).toBeFalsy()
  })

  test('executes default program and shows expected output', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Ejecutar programa' }).click()
    await page.getByRole('tab', { name: 'Salida' }).click()

    await expect(page.getByRole('heading', { name: 'Salida de ejecucion' })).toBeVisible()
    await expect(page.getByText('Hola, Ana!')).toBeVisible()
    await expect(page.getByText('Tu inicial es: A')).toBeVisible()
  })

  test('persists projects after reload', async ({ page }) => {
    await page.goto('/')

    const projectSelect = page.getByLabel('Proyecto activo')
    await expect(projectSelect.locator('option')).toHaveCount(1)

    await page.getByRole('button', { name: 'Nuevo' }).click()
    await expect(projectSelect.locator('option')).toHaveCount(2)

    await page.waitForTimeout(700)
    await page.reload()

    await expect(page.getByLabel('Proyecto activo').locator('option')).toHaveCount(2)
  })

  test('shows educational runtime error details for invalid numeric input', async ({ page }) => {
    await page.goto('/')

    await page.getByLabel('Cargar ejemplo').selectOption('comparar-dos-numeros')
    await page.getByRole('button', { name: 'Cargar ejemplo' }).click()

    await page.getByRole('tab', { name: 'Entradas' }).click()
    await page.getByPlaceholder('Ingresa num1').fill('abc')

    await page.getByRole('button', { name: 'Ejecutar programa' }).click()
    await page.getByRole('tab', { name: 'Salida' }).click()

    await expect(page.getByText(/PS_TYPE_MISMATCH/)).toBeVisible()
    await expect(page.getByText('Sugerencia:')).toBeVisible()
    await expect(page.getByText('La variable num1 requiere un Real.')).toBeVisible()
  })

  test('renders and expands flowchart with accessible modal close on Escape', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('tab', { name: 'Diagrama' }).click()

    const hydrateButton = page.getByRole('button', { name: 'Ver diagrama' })
    if (await hydrateButton.isVisible()) {
      await hydrateButton.click()
    }

    await expect(page.getByRole('button', { name: 'Acercar diagrama' })).toBeVisible()
    await page.getByRole('button', { name: 'Expandir diagrama' }).click()

    const dialog = page.getByRole('dialog', { name: 'Diagrama en vista ampliada' })
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('uses AI panel and returns feedback summary', async ({ page }) => {
    await page.route('https://api.openai.com/**', (route) => route.fulfill({ status: 503, body: 'blocked by e2e' }))
    await page.route('https://generativelanguage.googleapis.com/**', (route) => route.fulfill({ status: 503, body: 'blocked by e2e' }))

    await page.goto('/')

    await page.getByRole('tab', { name: 'Tutor IA' }).click()
    await page.getByRole('button', { name: 'Analizar con IA' }).click()

    await expect(page.getByText('Resumen')).toBeVisible()
    await expect(page.getByText('Siguientes pasos')).toBeVisible()
  })
})
