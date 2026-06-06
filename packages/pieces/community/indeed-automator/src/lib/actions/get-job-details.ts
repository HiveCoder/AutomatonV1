import { createAction, Property } from '@activepieces/pieces-framework';
import { getJobDescription } from '../common/indeed-browser';

export const getJobDetails = createAction({
    name: 'get_job_details',
    displayName: 'Get Job Description',
    description: 'Fetch the full job description from an Indeed job listing URL.',
    props: {
        jobUrl: Property.ShortText({
            displayName: 'Job URL',
            description: 'The Indeed job URL (e.g. from the Search Jobs step: {{steps.search.jobs[0].url}})',
            required: true,
        }),
    },
    async run(context) {
        const { jobUrl } = context.propsValue;
        const description = await getJobDescription(jobUrl);
        return {
            url: jobUrl,
            description,
        };
    },
});
