import { expect, test } from '@playwright/test'

test.describe('Playground mobile', () => {
  test('shows core mobile controls and avoids horizontal overflow', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('PSeInt Lab')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activar modo claro' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Activar modo OLED dark' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ejecutar programa' })).toBeVisible()

    const panelSelector = page.getByLabel('Panel visible')
    await expect(panelSelector).toBeVisible()
    await panelSelector.selectOption('inputs')

    await expect(page.getByRole('heading', { name: 'Entradas' })).toBeVisible()

    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(hasHorizontalOverflow).toBeFalsy()
  })

  test('executes default program and shows expected output', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Ejecutar programa' }).click()

    await expect(page.getByRole('heading', { name: 'Salida de ejecucion' })).toBeVisible()
    await expect(page.getByText('Consola')).toBeVisible()
    await expect(page.getByText('Hola, Ana!')).toBeVisible()
    await expect(page.getByText('Tu inicial es: A')).toBeVisible()
  })
})
