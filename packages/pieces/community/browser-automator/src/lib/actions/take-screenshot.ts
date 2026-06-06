import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser } from '../common/browser';

export const takeScreenshot = createAction({
    name: 'take_screenshot',
    displayName: 'Take Screenshot',
    description: 'Capture a screenshot of any webpage and return it as a base64 image.',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'Full URL of the page to screenshot (e.g. https://example.com)',
            required: true,
        }),
        fullPage: Property.Checkbox({
            displayName: 'Full Page',
            description: 'Capture the entire scrollable page, not just the visible viewport',
            required: false,
            defaultValue: false,
        }),
        viewportWidth: Property.Number({
            displayName: 'Viewport Width (px)',
            description: 'Browser window width in pixels',
            required: false,
            defaultValue: 1280,
        }),
        viewportHeight: Property.Number({
            displayName: 'Viewport Height (px)',
            description: 'Browser window height in pixels',
            required: false,
            defaultValue: 720,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Element (CSS selector)',
            description: 'Wait for this CSS selector to appear before screenshotting (e.g. .content, #main)',
            required: false,
        }),
        delayMs: Property.Number({
            displayName: 'Delay Before Screenshot (ms)',
            description: 'Extra wait time in milliseconds after page load (useful for animated content)',
            required: false,
            defaultValue: 0,
        }),
        cookies: Property.Json({
            displayName: 'Session Cookies',
            description: 'Optional — pass cookies from a previous "Login to Website" step to access authenticated pages',
            required: false,
        }),
    },
    async run(context) {
        const { url, fullPage, viewportWidth, viewportHeight, waitForSelector, delayMs, cookies } = context.propsValue;

        return withBrowser(
            {
                url,
                viewportWidth: viewportWidth ?? 1280,
                viewportHeight: viewportHeight ?? 720,
                cookies: Array.isArray(cookies) ? cookies : undefined,
            },
            async (page) => {
                if (waitForSelector) {
                    await page.waitForSelector(waitForSelector, { timeout: 30000 });
                }
                if (delayMs && delayMs > 0) {
                    await page.waitForTimeout(delayMs);
                }

                const buffer = await page.screenshot({ fullPage: fullPage ?? false, type: 'png' });

                return {
                    screenshot_base64: buffer.toString('base64'),
                    format: 'png',
                    url: page.url(),
                    title: await page.title(),
                };
            }
        );
    },
});
