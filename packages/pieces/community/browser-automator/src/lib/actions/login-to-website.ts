import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser, type SessionCookie } from '../common/browser';

export const loginToWebsite = createAction({
    name: 'login_to_website',
    displayName: 'Login to Website',
    description: 'Log in to any website by filling the username/email and password fields. Returns session cookies to use in other Browser Automator steps.',
    props: {
        url: Property.ShortText({
            displayName: 'Login Page URL',
            description: 'Full URL of the login page (e.g. https://app.example.com/login)',
            required: true,
        }),
        usernameSelector: Property.ShortText({
            displayName: 'Username / Email Field Selector',
            description: 'CSS selector for the username or email input (e.g. input[name="email"], #username)',
            required: true,
            defaultValue: 'input[type="email"], input[name="email"], input[name="username"], input[name="user"]',
        }),
        username: Property.ShortText({
            displayName: 'Username / Email',
            description: 'The username or email address to log in with',
            required: true,
        }),
        passwordSelector: Property.ShortText({
            displayName: 'Password Field Selector',
            description: 'CSS selector for the password input (e.g. input[type="password"], #password)',
            required: true,
            defaultValue: 'input[type="password"]',
        }),
        password: Property.ShortText({
            displayName: 'Password',
            description: 'The password to log in with',
            required: true,
        }),
        submitSelector: Property.ShortText({
            displayName: 'Submit Button Selector',
            description: 'CSS selector for the login/submit button',
            required: true,
            defaultValue: 'button[type="submit"]',
        }),
        successIndicatorSelector: Property.ShortText({
            displayName: 'Success Indicator Selector',
            description: 'Optional CSS selector that appears only when logged in successfully (e.g. .user-menu, #dashboard). Used to verify login worked.',
            required: false,
        }),
        waitAfterLoginMs: Property.Number({
            displayName: 'Wait After Login (ms)',
            description: 'How long to wait after clicking the login button',
            required: false,
            defaultValue: 3000,
        }),
    },
    async run(context) {
        const {
            url,
            usernameSelector,
            username,
            passwordSelector,
            password,
            submitSelector,
            successIndicatorSelector,
            waitAfterLoginMs,
        } = context.propsValue;

        return withBrowser({ url }, async (page) => {
            await page.waitForSelector(usernameSelector, { timeout: 15000 });
            await page.fill(usernameSelector, username);
            await page.fill(passwordSelector, password);
            await page.click(submitSelector);
            await page.waitForTimeout(waitAfterLoginMs ?? 3000);

            let loginSucceeded = true;
            if (successIndicatorSelector) {
                try {
                    await page.waitForSelector(successIndicatorSelector, { timeout: 10000 });
                } catch {
                    loginSucceeded = false;
                }
            }

            const rawCookies = await page.context().cookies();
            const cookies: SessionCookie[] = rawCookies.map((c) => ({
                name: c.name,
                value: c.value,
                domain: c.domain,
                path: c.path,
            }));

            return {
                login_succeeded: loginSucceeded,
                url: page.url(),
                title: await page.title(),
                cookies,
            };
        });
    },
});
