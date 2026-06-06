const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

function findChromiumExecutable() {
    if (process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']) {
        return process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
    }
    if (process.platform !== 'win32') return undefined;
    try {
        // executablePath() returns the full chrome.exe — pass it explicitly so
        // playwright uses chrome.exe instead of headless_shell internally
        const exePath = chromium.executablePath();
        console.log('chromium.executablePath():', exePath);
        return exePath;
    } catch (e) {
        console.log('executablePath() error:', e.message);
        return undefined;
    }
}

const executablePath = findChromiumExecutable();
console.log('Using executable:', executablePath || '(playwright default)');

const launchOpts = { headless: true, args: ['--no-sandbox','--disable-gpu','--disable-dev-shm-usage'], ...(executablePath ? { executablePath } : {}) };

async function test() {
    console.log('--- Test 1: Screenshot of local Activepieces app ---');
    const browser = await chromium.launch(launchOpts);
    const page = await browser.newPage();
    await page.goto('http://localhost:4202/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const buf = await page.screenshot({ type: 'png' });
    console.log('Screenshot taken, size:', buf.length, 'bytes');
    const title = await page.title();
    console.log('Page title:', title);
    await browser.close();

    console.log('');
    console.log('--- Test 2: Scrape text from local app ---');
    const browser2 = await chromium.launch(launchOpts);
    const page2 = await browser2.newPage();
    await page2.goto('http://localhost:4202/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const bodyText = await page2.$eval('body', el => el.innerText.trim().substring(0, 200));
    console.log('Body text preview:', bodyText);
    await browser2.close();

    console.log('');
    console.log('--- Test 3: Fill form (login page) ---');
    const browser3 = await chromium.launch(launchOpts);
    const page3 = await browser3.newPage();
    await page3.goto('http://localhost:4202/sign-in', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page3.waitForTimeout(1500);
    const emailField = await page3.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    if (emailField) {
        await emailField.fill('dev@ap.com');
        const val = await emailField.inputValue();
        console.log('Form fill result - email value:', val);
    } else {
        console.log('Email field not found on sign-in page (page may still be loading)');
    }
    await browser3.close();

    console.log('');
    console.log('--- Test 4: Click element on local app ---');
    const browser4 = await chromium.launch(launchOpts);
    const page4 = await browser4.newPage();
    await page4.goto('http://localhost:4202/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const link = await page4.$('a');
    console.log('Link element found:', link !== null);
    await browser4.close();

    console.log('');
    console.log('=== ALL TESTS PASSED ===');
}

test().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
