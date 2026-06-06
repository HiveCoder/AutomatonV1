import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser } from '../common/browser';

export const fillForm = createAction({
    name: 'fill_form',
    displayName: 'Fill Form & Submit',
    description: 'Navigate to a page, fill form fields by CSS selector or label, and optionally click a submit button.',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'Full URL of the page containing the form',
            required: true,
        }),
        fields: Property.Array({
            displayName: 'Form Fields',
            description: 'List of fields to fill. Use CSS selectors like input[name="email"], #username, or textarea.',
            required: true,
            properties: {
                selector: Property.ShortText({
                    displayName: 'Field Selector',
                    description: 'CSS selector for the input (e.g. input[name="email"], #first-name, textarea)',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Value',
                    description: 'Text to type into this field',
                    required: true,
                }),
                clearFirst: Property.Checkbox({
                    displayName: 'Clear Existing Value First',
                    description: 'Clear the field before typing',
                    required: false,
                    defaultValue: true,
                }),
            },
        }),
        submitSelector: Property.ShortText({
            displayName: 'Submit Button Selector',
            description: 'CSS selector for the submit button to click after filling (e.g. button[type="submit"], .btn-submit). Leave blank to skip.',
            required: false,
        }),
        waitAfterSubmitMs: Property.Number({
            displayName: 'Wait After Submit (ms)',
            description: 'How long to wait after clicking submit before reading the result page',
            required: false,
            defaultValue: 2000,
        }),
        cookies: Property.Json({
            displayName: 'Session Cookies',
            description: 'Optional — pass cookies from a previous "Login to Website" step',
            required: false,
        }),
    },
    async run(context) {
        const { url, fields, submitSelector, waitAfterSubmitMs, cookies } = context.propsValue;

        return withBrowser(
            {
                url,
                cookies: Array.isArray(cookies) ? cookies : undefined,
            },
            async (page) => {
                for (const field of fields as Array<{ selector: string; value: string; clearFirst: boolean }>) {
                    await page.waitForSelector(field.selector, { timeout: 15000 });
                    if (field.clearFirst !== false) {
                        await page.fill(field.selector, '');
                    }
                    await page.fill(field.selector, field.value);
                }

                if (submitSelector) {
                    await page.waitForSelector(submitSelector, { timeout: 15000 });
                    await page.click(submitSelector);
                    await page.waitForTimeout(waitAfterSubmitMs ?? 2000);
                }

                return {
                    success: true,
                    url: page.url(),
                    title: await page.title(),
                    fields_filled: (fields as Array<{ selector: string }>).map((f) => f.selector),
                };
            }
        );
    },
});
