const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:8080');
  
  // wait 3 seconds
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
