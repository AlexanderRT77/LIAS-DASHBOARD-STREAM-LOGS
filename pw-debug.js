import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('\n=== PAGE ERROR ===\n', err.message);
    console.log(err.stack);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('\n=== CONSOLE ERROR ===\n', msg.text());
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  await browser.close();
})();
