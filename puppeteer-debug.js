const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
    
    await browser.close();
  } catch (err) {
    console.error("Puppeteer Script Error:", err);
  }
})();
