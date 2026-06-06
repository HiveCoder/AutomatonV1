import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser } from '../common/browser';

export const clickElement = createAction({
    name: 'click_element',
    displayName: 'Click Element',
    description: 'Navigate to a webpage and click a button, link, or any element.',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'Full URL of the page containing the element to click',
            required: true,
        }),
        selector: Property.ShortText({
            displayName: 'Element Selector',
            description: 'CSS selector for the element to click (e.g. button.submit, a.next-page, #accept-btn)',
            required: true,
        }),
        waitAfterClickMs: Property.Number({
            displayName: 'Wait After Click (ms)',
            description: 'How many milliseconds to wait after clicking before capturing the result',
            required: false,
            defaultValue: 2000,
        }),
        extractAfterClick: Property.Array({
            displayName: 'Extract Data After Click',
            description: 'Optional — extract data from the page after clicking (same as Scrape Data fields)',
            required: false,
            properties: {
                name: Property.ShortText({
                    displayName: 'Output Field Name',
                    description: 'Name for this value in the output',
                    required: true,
                }),
                selector: Property.ShortText({
                    displayName: 'CSS Selector',
                    description: 'Element to extract text from after the click',
                    required: true,
                }),
            },
        }),
        cookies: Property.Json({
            displayName: 'Session Cookies',
            description: 'Optional — pass cookies from a "Login to Website" step',
            required: false,
        }),
    },
    async run(context) {
        const { url, selector, waitAfterClickMs, extractAfterClick, cookies } = context.propsValue;

        return withBrowser(
            {
                url,
                cookies: Array.isArray(cookies) ? cookies : undefined,
            },
            async (page) => {
                await page.waitForSelector(selector, { timeout: 15000 });
                await page.click(selector);
                await page.waitForTimeout(waitAfterClickMs ?? 2000);

                const extracted: Record<string, unknown> = {};
                for (const field of (extractAfterClick ?? []) as Array<{ name: string; selector: string }>) {
                    try {
                        extracted[field.name] = await page.$eval(field.selector, (el) => el.textContent?.trim() ?? '');
                    } catch {
                        extracted[field.name] = null;
                    }
                }

                return {
                    success: true,
                    url: page.url(),
                    title: await page.title(),
                    extracted,
                };
            }
        );
    },
});
