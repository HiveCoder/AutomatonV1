import { chromium, type BrowserType, type Page } from 'playwright-core';
import * as fs from 'fs';
import * as path from 'path';

function getChromiumExePath(): string | undefined {
    if (process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH']) {
        return process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
    }
    if (process.platform !== 'win32') return undefined;
    try {
        return (chromium as BrowserType).executablePath();
    } catch {
        return undefined;
    }
}

const LAUNCH_OPTS = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    executablePath: getChromiumExePath(),
};

interface JobListing {
    title: string;
    company: string;
    location: string;
    salary: string;
    jobType: string;
    postedDate: string;
    url: string;
    jobId: string;
    isEasyApply: boolean;
    description: string;
}

async function searchIndeedJobs({
    keywords,
    location,
    maxResults,
    remoteOnly,
    datePosted,
}: {
    keywords: string;
    location: string;
    maxResults: number;
    remoteOnly: boolean;
    datePosted: string;
}): Promise<JobListing[]> {
    const browser = await chromium.launch(LAUNCH_OPTS);
    const jobs: JobListing[] = [];

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();

        const params = new URLSearchParams({
            q: keywords,
            l: remoteOnly ? 'remote' : location,
            fromage: datePosted === 'last24h' ? '1' : datePosted === 'last3days' ? '3' : datePosted === 'last7days' ? '7' : '14',
            sort: 'date',
            limit: '25',
        });
        if (remoteOnly) params.set('remotejob', '032b3046-06a3-4876-8dfd-474eb5e7ed11');

        await page.goto(`https://ca.indeed.com/jobs?${params.toString()}`, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        await page.waitForTimeout(2000);

        const pageJobs = await page.$$eval('[data-jk]', (cards) =>
            cards.map((card) => {
                const jk = card.getAttribute('data-jk') ?? '';
                const titleEl = card.querySelector('[data-testid="jobTitle"] span, h2.jobTitle span');
                const companyEl = card.querySelector('[data-testid="company-name"], .companyName');
                const locationEl = card.querySelector('[data-testid="text-location"], .companyLocation');
                const salaryEl = card.querySelector('[data-testid="attribute_snippet_testid"], .salary-snippet');
                const dateEl = card.querySelector('[data-testid="myJobsStateDate"], .date');
                const easyApply = card.querySelector('[aria-label*="Easy Apply"], .iaLabel') !== null;

                return {
                    title: titleEl?.textContent?.trim() ?? '',
                    company: companyEl?.textContent?.trim() ?? '',
                    location: locationEl?.textContent?.trim() ?? '',
                    salary: salaryEl?.textContent?.trim() ?? '',
                    jobType: '',
                    postedDate: dateEl?.textContent?.trim() ?? '',
                    url: `https://ca.indeed.com/viewjob?jk=${jk}`,
                    jobId: jk,
                    isEasyApply: easyApply,
                    description: '',
                };
            })
        );

        jobs.push(...pageJobs.slice(0, maxResults));
    } finally {
        await browser.close();
    }

    return jobs;
}

async function getJobDescription(jobUrl: string): Promise<string> {
    const browser = await chromium.launch(LAUNCH_OPTS);
    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);
        const desc = await page.$eval('#jobDescriptionText, .jobsearch-jobDescriptionText', (el) => el.textContent?.trim() ?? '').catch(() => '');
        return desc.substring(0, 2000);
    } finally {
        await browser.close();
    }
}

async function applyEasyApply({
    jobUrl,
    firstName,
    lastName,
    email,
    phone,
    resumePath,
    coverLetter,
    indeedEmail,
    indeedPassword,
}: {
    jobUrl: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    resumePath: string;
    coverLetter: string;
    indeedEmail: string;
    indeedPassword: string;
}): Promise<{ success: boolean; message: string; screenshot: string }> {
    const browser = await chromium.launch({ ...LAUNCH_OPTS, headless: true });
    let screenshot = '';

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();

        // Log in to Indeed first
        await page.goto('https://ca.indeed.com/account/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);

        const loginResult = await tryLogin(page, indeedEmail, indeedPassword);
        if (!loginResult) {
            const buf = await page.screenshot({ type: 'png' });
            return { success: false, message: 'Failed to log in to Indeed. Check your email/password.', screenshot: buf.toString('base64') };
        }

        // Navigate to job
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Click Apply / Easy Apply button
        const applyBtn = await page.$('[id*="apply-button"], [data-testid="apply-button"], .ia-IndeedApplyButton, button:has-text("Apply now"), button:has-text("Easy Apply")');
        if (!applyBtn) {
            const buf = await page.screenshot({ type: 'png' });
            return { success: false, message: 'Apply button not found on this job page.', screenshot: buf.toString('base64') };
        }
        await applyBtn.click();
        await page.waitForTimeout(3000);

        // Handle the Indeed application modal/page
        const applied = await fillApplicationForm(page, { firstName, lastName, email, phone, resumePath, coverLetter });
        const buf = await page.screenshot({ type: 'png', fullPage: false });
        screenshot = buf.toString('base64');

        return { success: applied, message: applied ? 'Application submitted successfully.' : 'Could not complete application — screenshot attached for review.', screenshot };
    } finally {
        await browser.close();
    }
}

async function tryLogin(page: Page, email: string, password: string): Promise<boolean> {
    try {
        // Indeed may show email first, then password
        const emailField = await page.$('input[type="email"], input[name="__email"], #ifl-InputFormField-3');
        if (emailField) {
            await emailField.fill(email);
            const continueBtn = await page.$('button[type="submit"], #login-submit-component');
            if (continueBtn) await continueBtn.click();
            await page.waitForTimeout(2000);
        }

        const pwField = await page.$('input[type="password"], input[name="__password"]');
        if (pwField) {
            await pwField.fill(password);
            const submitBtn = await page.$('button[type="submit"], #login-submit-component');
            if (submitBtn) await submitBtn.click();
            await page.waitForTimeout(3000);
        }

        // Check if logged in by looking for account menu
        const loggedIn = await page.$('[data-testid="UserDropdown"], .gnav-logged-in, [href*="/my/jobs"]') !== null;
        return loggedIn;
    } catch {
        return false;
    }
}

async function fillApplicationForm(
    page: Page,
    { firstName, lastName, email, phone, resumePath, coverLetter }: { firstName: string; lastName: string; email: string; phone: string; resumePath: string; coverLetter: string }
): Promise<boolean> {
    try {
        await page.waitForTimeout(2000);

        // Upload resume if file input exists
        if (resumePath && fs.existsSync(resumePath)) {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.setInputFiles(resumePath);
                await page.waitForTimeout(2000);
            }
        }

        // Fill in name fields if present
        const firstNameField = await page.$('input[name*="firstName" i], input[placeholder*="first name" i], input[id*="firstName" i]');
        if (firstNameField) await firstNameField.fill(firstName);

        const lastNameField = await page.$('input[name*="lastName" i], input[placeholder*="last name" i], input[id*="lastName" i]');
        if (lastNameField) await lastNameField.fill(lastName);

        const emailField = await page.$('input[type="email"]:not([readonly]):not([disabled])');
        if (emailField) {
            const currentVal = await emailField.inputValue();
            if (!currentVal) await emailField.fill(email);
        }

        const phoneField = await page.$('input[type="tel"], input[name*="phone" i], input[placeholder*="phone" i]');
        if (phoneField) await phoneField.fill(phone);

        // Cover letter textarea
        if (coverLetter) {
            const clField = await page.$('textarea[name*="coverLetter" i], textarea[placeholder*="cover" i], textarea');
            if (clField) await clField.fill(coverLetter);
        }

        // Click through multi-step form (up to 5 pages)
        for (let step = 0; step < 5; step++) {
            await page.waitForTimeout(1500);
            const continueBtn = await page.$('button:has-text("Continue"), button:has-text("Next"), button:has-text("Submit"), [data-testid="IndeedApplyButton"]');
            if (!continueBtn) break;
            const btnText = await continueBtn.textContent() ?? '';
            await continueBtn.click();
            if (btnText.toLowerCase().includes('submit')) {
                await page.waitForTimeout(3000);
                return true;
            }
        }

        // Final check — look for confirmation
        const confirmation = await page.$('[data-testid="app-submitted"], .ia-JobApplicationSuccess, h1:has-text("application was sent"), h1:has-text("applied")');
        return confirmation !== null;
    } catch {
        return false;
    }
}

export { searchIndeedJobs, getJobDescription, applyEasyApply };
export type { JobListing };
