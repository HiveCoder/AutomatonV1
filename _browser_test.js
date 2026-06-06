// Force full Chromium on Windows (avoids headless_shell timeout)
process.env['PLAYWRIGHT_CHROMIUM_SKIP_HEADLESS_SHELL'] = '1';

const { chromium } = require('playwright-core');

async function test() {
    console.log('--- Test 1: Take Screenshot of example.com ---');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://example.com');
    const buf = await page.screenshot({ type: 'png' });
    console.log('Screenshot taken, size:', buf.length, 'bytes');
    const title = await page.title();
    console.log('Page title:', title);
    await browser.close();

    console.log('');
    console.log('--- Test 2: Scrape text from example.com ---');
    const browser2 = await chromium.launch({ headless: true });
    const page2 = await browser2.newPage();
    await page2.goto('https://example.com');
    const h1 = await page2.$eval('h1', el => el.textContent.trim());
    const para = await page2.$eval('p', el => el.textContent.trim());
    console.log('h1:', h1);
    console.log('First paragraph (trimmed):', para.substring(0, 80));
    await browser2.close();

    console.log('');
    console.log('--- Test 3: Fill form detection on httpbin ---');
    const browser3 = await chromium.launch({ headless: true });
    const page3 = await browser3.newPage();
    await page3.goto('https://httpbin.org/forms/post');
    await page3.waitForSelector('input[name="custname"]', { timeout: 15000 });
    await page3.fill('input[name="custname"]', 'Test User');
    await page3.fill('input[name="custtel"]', '555-1234');
    const val = await page3.$eval('input[name="custname"]', el => el.value);
    console.log('Form fill result - custname value:', val);
    await browser3.close();

    console.log('');
    console.log('--- Test 4: Extract table from a public page ---');
    const browser4 = await chromium.launch({ headless: true });
    const page4 = await browser4.newPage();
    await page4.goto('https://en.wikipedia.org/wiki/G7');
    await page4.waitForSelector('table.wikitable', { timeout: 15000 });
    const rows = await page4.$$eval('table.wikitable:first-of-type tr', rows =>
        rows.slice(0, 4).map(r => Array.from(r.querySelectorAll('th,td')).map(c => c.textContent.trim()).join(' | '))
    );
    console.log('Table rows (first 4):');
    rows.forEach(r => console.log(' ', r.substring(0, 100)));
    await browser4.close();

    console.log('');
    console.log('--- Test 5: Click element ---');
    const browser5 = await chromium.launch({ headless: true });
    const page5 = await browser5.newPage();
    await page5.goto('https://example.com');
    const linkExists = await page5.$('a') !== null;
    console.log('Link element found on page:', linkExists);
    if (linkExists) {
        await page5.click('a');
        await page5.waitForTimeout(1000);
        console.log('After click URL:', page5.url());
    }
    await browser5.close();

    console.log('');
    console.log('=== ALL TESTS PASSED ===');
}

test().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
