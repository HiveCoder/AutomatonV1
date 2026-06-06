import { createAction, Property } from '@activepieces/pieces-framework';
import { searchIndeedJobs } from '../common/indeed-browser';

export const searchJobs = createAction({
    name: 'search_jobs',
    displayName: 'Search Jobs on Indeed',
    description: 'Search Indeed Canada for job listings matching your criteria. Returns a list of job postings with title, company, location, salary, and apply URL.',
    props: {
        keywords: Property.ShortText({
            displayName: 'Job Keywords',
            description: 'Job title or keywords to search (e.g. "IT Support entry level", "Junior Developer", "Help Desk")',
            required: true,
            defaultValue: 'IT entry level',
        }),
        location: Property.ShortText({
            displayName: 'Location',
            description: 'City or province (e.g. "Toronto, ON", "Ontario", "Canada"). Ignored if Remote Only is enabled.',
            required: false,
            defaultValue: 'Ontario, Canada',
        }),
        remoteOnly: Property.Checkbox({
            displayName: 'Remote Only',
            description: 'Only show remote jobs',
            required: false,
            defaultValue: false,
        }),
        datePosted: Property.StaticDropdown({
            displayName: 'Date Posted',
            description: 'Only show jobs posted within this time range',
            required: false,
            defaultValue: 'last7days',
            options: {
                options: [
                    { label: 'Last 24 hours', value: 'last24h' },
                    { label: 'Last 3 days', value: 'last3days' },
                    { label: 'Last 7 days', value: 'last7days' },
                    { label: 'Last 14 days', value: 'last14days' },
                ],
            },
        }),
        maxResults: Property.Number({
            displayName: 'Max Results',
            description: 'Maximum number of job listings to return (1–25)',
            required: false,
            defaultValue: 10,
        }),
    },
    async run(context) {
        const { keywords, location, remoteOnly, datePosted, maxResults } = context.propsValue;

        const jobs = await searchIndeedJobs({
            keywords: keywords,
            location: location ?? 'Ontario, Canada',
            maxResults: Math.min(maxResults ?? 10, 25),
            remoteOnly: remoteOnly ?? false,
            datePosted: datePosted ?? 'last7days',
        });

        return {
            total: jobs.length,
            jobs,
        };
    },
});
