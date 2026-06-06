import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser } from '../common/browser';

export const scrapeData = createAction({
    name: 'scrape_data',
    displayName: 'Scrape Data',
    description: 'Extract text, HTML, or attributes from elements on any webpage using CSS selectors.',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'Full URL of the page to scrape (e.g. https://example.com)',
            required: true,
        }),
        fields: Property.Array({
            displayName: 'Fields to Extract',
            description: 'Define what data to pull from the page. Each field gets its own output key.',
            required: true,
            properties: {
                name: Property.ShortText({
                    displayName: 'Output Field Name',
                    description: 'Name for this piece of data in the output (e.g. price, title, description)',
                    required: true,
                }),
                selector: Property.ShortText({
                    displayName: 'CSS Selector',
                    description: 'CSS selector pointing to the element (e.g. h1, .price, #product-title)',
                    required: true,
                }),
                extract: Property.StaticDropdown({
                    displayName: 'Extract',
                    description: 'What to extract from the matched element',
                    required: true,
                    defaultValue: 'text',
                    options: {
                        options: [
                            { label: 'Text content', value: 'text' },
                            { label: 'Inner HTML', value: 'innerHTML' },
                            { label: 'href attribute', value: 'href' },
                            { label: 'src attribute', value: 'src' },
                            { label: 'value attribute', value: 'value' },
                            { label: 'All matching elements (array of text)', value: 'all' },
                        ],
                    },
                }),
            },
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Element',
            description: 'Wait for this CSS selector before scraping (useful for dynamic/JS-rendered pages)',
            required: false,
        }),
        cookies: Property.Json({
            displayName: 'Session Cookies',
            description: 'Optional — pass cookies from a "Login to Website" step to scrape authenticated pages',
            required: false,
        }),
    },
    async run(context) {
        const { url, fields, waitForSelector, cookies } = context.propsValue;

        return withBrowser(
            {
                url,
                cookies: Array.isArray(cookies) ? cookies : undefined,
            },
            async (page) => {
                if (waitForSelector) {
                    await page.waitForSelector(waitForSelector, { timeout: 30000 });
                }

                const result: Record<string, unknown> = {};

                for (const field of fields as Array<{ name: string; selector: string; extract: string }>) {
                    const { name, selector, extract } = field;
                    try {
                        if (extract === 'all') {
                            result[name] = await page.$$eval(selector, (els) =>
                                els.map((el) => el.textContent?.trim() ?? '')
                            );
                        } else if (extract === 'text') {
                            result[name] = await page.$eval(selector, (el) => el.textContent?.trim() ?? '');
                        } else if (extract === 'innerHTML') {
                            result[name] = await page.$eval(selector, (el) => el.innerHTML);
                        } else {
                            result[name] = await page.$eval(
                                selector,
                                (el, attr) => el.getAttribute(attr) ?? '',
                                extract
                            );
                        }
                    } catch {
                        result[name] = null;
                    }
                }

                return {
                    data: result,
                    url: page.url(),
                    title: await page.title(),
                };
            }
        );
    },
});
