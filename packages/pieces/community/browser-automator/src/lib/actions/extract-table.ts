import { createAction, Property } from '@activepieces/pieces-framework';
import { withBrowser } from '../common/browser';

export const extractTable = createAction({
    name: 'extract_table',
    displayName: 'Extract Table',
    description: 'Extract an HTML table from a webpage and return the data as a structured array of rows.',
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'Full URL of the page containing the table',
            required: true,
        }),
        tableSelector: Property.ShortText({
            displayName: 'Table Selector',
            description: 'CSS selector for the table element (e.g. table, #results-table, .data-table). Defaults to the first table on the page.',
            required: false,
            defaultValue: 'table',
        }),
        hasHeaderRow: Property.Checkbox({
            displayName: 'First Row is Header',
            description: 'Use the first row as column names in the output objects',
            required: false,
            defaultValue: true,
        }),
        waitForSelector: Property.ShortText({
            displayName: 'Wait for Element',
            description: 'CSS selector to wait for before extracting the table (useful for dynamically loaded tables)',
            required: false,
        }),
        cookies: Property.Json({
            displayName: 'Session Cookies',
            description: 'Optional — pass cookies from a "Login to Website" step to access authenticated pages',
            required: false,
        }),
    },
    async run(context) {
        const { url, tableSelector, hasHeaderRow, waitForSelector, cookies } = context.propsValue;

        return withBrowser(
            {
                url,
                cookies: Array.isArray(cookies) ? cookies : undefined,
            },
            async (page) => {
                const selector = tableSelector ?? 'table';

                if (waitForSelector) {
                    await page.waitForSelector(waitForSelector, { timeout: 30000 });
                } else {
                    await page.waitForSelector(selector, { timeout: 30000 });
                }

                const tableData = await page.$eval(
                    selector,
                    (table, useHeader) => {
                        const rows = Array.from(table.querySelectorAll('tr'));
                        if (rows.length === 0) return { headers: [], rows: [] };

                        const getCells = (row: Element) =>
                            Array.from(row.querySelectorAll('th, td')).map((cell) => cell.textContent?.trim() ?? '');

                        if (!useHeader) {
                            return {
                                headers: [],
                                rows: rows.map(getCells),
                            };
                        }

                        const headers = getCells(rows[0]);
                        const dataRows = rows.slice(1).map((row) => {
                            const cells = getCells(row);
                            const rowObj: Record<string, string> = {};
                            headers.forEach((header, i) => {
                                rowObj[header || `column_${i + 1}`] = cells[i] ?? '';
                            });
                            return rowObj;
                        });

                        return { headers, rows: dataRows };
                    },
                    hasHeaderRow !== false
                );

                return {
                    headers: tableData.headers,
                    rows: tableData.rows,
                    row_count: tableData.rows.length,
                    url: page.url(),
                };
            }
        );
    },
});
