import { chromium, type Page, type BrowserType } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

interface BrowserOptions {
    url: string;
    viewportWidth?: number;
    viewportHeight?: number;
    cookies?: SessionCookie[];
}

interface SessionCookie {
    name: string;
    value: string;
    domain: string;
    path: string;
}

/**
 * On Windows, playwright-core internally picks headless_shell.exe which hangs.
 * executablePath() already returns the full chrome.exe path — pass it explicitly
 * so playwright uses that instead of the headless shell.
 */
function findChromiumExecutable(): string | undefined {
    if (process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']) {
        return process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
    }
    if (process.platform !== 'win32') return undefined;
    try {
        // On Windows executablePath() returns chrome.exe (not headless_shell).
        // Passing it explicitly forces playwright to use it instead of headless_shell.
        return (chromium as BrowserType).executablePath();
    } catch {
        return undefined;
    }
}

async function withBrowser<T>({ url, viewportWidth, viewportHeight, cookies }: BrowserOptions, fn: (page: Page) => Promise<T>): Promise<T> {
    const executablePath = findChromiumExecutable();

    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
    ];

    const browser = await chromium.launch({
        headless: true,
        args: launchArgs,
        ...(executablePath ? { executablePath } : {}),
    }).catch((err: Error) => {
        throw new Error(
            `Failed to launch browser. Run "npx playwright install chromium" once to install the browser, ` +
            `or set the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH environment variable to your Chromium path. ` +
            `Original error: ${err.message}`
        );
    });

    try {
        const context = await browser.newContext({
            viewport: {
                width: viewportWidth ?? 1280,
                height: viewportHeight ?? 720,
            },
            ignoreHTTPSErrors: true,
        });

        if (cookies && cookies.length > 0) {
            await context.addCookies(cookies);
        }

        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

        return await fn(page);
    } finally {
        await browser.close();
    }
}

export { withBrowser };
export type { BrowserOptions, SessionCookie };
