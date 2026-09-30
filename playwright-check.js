const { chromium } = require('playwright')

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 30000 })
  const bodyText = await page.locator('body').innerText()
  console.log('TITLE=' + (await page.title()))
  console.log('HAS_THOORIGAI=' + /THOORIGAI/i.test(bodyText))

  await page
    .getByRole('button', { name: /Add student/i })
    .first()
    .click()
  await page.getByRole('heading', { name: 'Students' }).waitFor()
  await page
    .getByRole('button', { name: /Add student/i })
    .last()
    .click()

  await page.getByPlaceholder('Full name').fill('Aisha Kumar')
  await page.getByPlaceholder('10-digit number').fill('9876543210')
  const numberInputs = page.locator('input[type="number"]')
  await numberInputs.nth(0).fill('25000')
  await numberInputs.nth(1).fill('5000')
  await page.getByRole('button', { name: /Save student/i }).click()

  console.log('NEW_STUDENT=' + /Aisha Kumar/i.test(await page.locator('body').innerText()))

  await page.getByText('Aisha Kumar', { exact: true }).click()
  await page.locator('input[type="number"]').first().fill('20000')
  await page.getByRole('button', { name: /Record payment/i }).click()
  console.log('PAYMENT_STATUS=' + /Payment recorded/i.test(await page.locator('body').innerText()))

  await page.getByRole('button', { name: /Generate certificate/i }).click()
  console.log('CERT_TITLE=' + /Certificate of Achievement/i.test(await page.locator('body').innerText()))

  await page.getByRole('button', { name: /Back to certificates/i }).click()
  await page
    .getByRole('button', { name: /Invoices/i })
    .first()
    .click()
  console.log('INVOICE_COUNT=' + (await page.getByRole('button', { name: /TAI\//i }).count()))
  const downloadResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/invoices/') && response.url().endsWith('/download'),
  )
  await page.getByRole('button', { name: /TAI\//i }).first().click()
  const downloadResponse = await downloadResponsePromise
  console.log('PDF_DOWNLOAD=' + (downloadResponse.status() === 200))
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 30000 })

  await page
    .getByRole('button', { name: /Dashboard/i })
    .first()
    .click()
  await page.getByRole('button', { name: /View all/i }).click()
  await page
    .getByRole('button', { name: /Reports/i })
    .first()
    .click()
  console.log('REPORTS_TAB=' + /Payment method totals/i.test(await page.locator('body').innerText()))
  console.log('CSV_BUTTON=' + (await page.getByRole('button', { name: /Download CSV/i }).count()))
  console.log('DASHBOARD_VIEW_OK')

  await browser.close()
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
