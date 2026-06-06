import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { takeScreenshot } from './lib/actions/take-screenshot';
import { scrapeData } from './lib/actions/scrape-data';
import { fillForm } from './lib/actions/fill-form';
import { clickElement } from './lib/actions/click-element';
import { loginToWebsite } from './lib/actions/login-to-website';
import { extractTable } from './lib/actions/extract-table';

export const browserAutomator = createPiece({
    displayName: 'Browser Automator',
    description: 'Automate any website without code — take screenshots, scrape data, fill forms, click buttons, log in, and extract tables using a real browser.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/browser-automator.png',
    categories: [PieceCategory.DEVELOPER_TOOLS, PieceCategory.PRODUCTIVITY],
    auth: PieceAuth.None(),
    authors: [],
    actions: [
        takeScreenshot,
        scrapeData,
        fillForm,
        clickElement,
        loginToWebsite,
        extractTable,
    ],
    triggers: [],
});
