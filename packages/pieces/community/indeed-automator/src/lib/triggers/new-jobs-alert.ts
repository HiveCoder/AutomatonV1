import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { searchIndeedJobs, type JobListing } from '../common/indeed-browser';

export const newJobsAlert = createTrigger({
    name: 'new_jobs_alert',
    displayName: 'New Jobs Alert',
    description: 'Triggers when new job listings matching your search appear on Indeed Canada. Checks every 30 minutes and fires once per new job found.',
    type: TriggerStrategy.POLLING,
    props: {
        keywords: Property.ShortText({
            displayName: 'Job Keywords',
            description: 'Job title or keywords to monitor (e.g. "IT Support entry level", "Junior Developer")',
            required: true,
            defaultValue: 'IT entry level',
        }),
        location: Property.ShortText({
            displayName: 'Location',
            description: 'City or province to monitor (e.g. "Ontario, Canada", "Toronto, ON")',
            required: false,
            defaultValue: 'Ontario, Canada',
        }),
        remoteOnly: Property.Checkbox({
            displayName: 'Include Remote Jobs',
            description: 'Also search for remote jobs in addition to the location above',
            required: false,
            defaultValue: true,
        }),
    },
    sampleData: {
        title: 'IT Support Specialist (Entry Level)',
        company: 'Acme Corp',
        location: 'Toronto, ON',
        salary: '$45,000–$55,000 a year',
        jobType: 'Full-time',
        postedDate: 'Just posted',
        url: 'https://ca.indeed.com/viewjob?jk=abc123',
        jobId: 'abc123',
        isEasyApply: true,
        description: '',
    },
    async onEnable() { /* no setup needed for polling */ },
    async onDisable() { /* no teardown needed */ },
    async run(context) {
        const { keywords, location, remoteOnly } = context.propsValue;

        const jobs = await searchIndeedJobs({
            keywords,
            location: location ?? 'Ontario, Canada',
            maxResults: 25,
            remoteOnly: remoteOnly ?? true,
            datePosted: 'last24h',
        });

        const store = context.store;
        const seenKey = 'seen_job_ids';
        const seenRaw = await store.get<string[]>(seenKey);
        const seen = new Set<string>(seenRaw ?? []);

        const newJobs = jobs.filter((j: JobListing) => j.jobId && !seen.has(j.jobId));

        // Save new IDs
        const updatedSeen = [...seen, ...newJobs.map((j: JobListing) => j.jobId)].slice(-500);
        await store.put(seenKey, updatedSeen);

        return newJobs;
    },
});
