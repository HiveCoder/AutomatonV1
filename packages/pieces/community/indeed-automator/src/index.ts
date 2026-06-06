import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { searchJobs } from './lib/actions/search-jobs';
import { applyToJob } from './lib/actions/apply-to-job';
import { getJobDetails } from './lib/actions/get-job-details';
import { newJobsAlert } from './lib/triggers/new-jobs-alert';

export const indeedAutomator = createPiece({
    displayName: 'Indeed Job Automator',
    description: 'Search Indeed Canada for IT jobs, auto-apply with your resume, and get alerts when new matching jobs are posted.',
    minimumSupportedRelease: '0.36.1',
    logoUrl: 'https://cdn.activepieces.com/pieces/indeed.png',
    categories: [PieceCategory.PRODUCTIVITY],
    auth: PieceAuth.None(),
    authors: [],
    actions: [
        searchJobs,
        applyToJob,
        getJobDetails,
    ],
    triggers: [newJobsAlert],
});
