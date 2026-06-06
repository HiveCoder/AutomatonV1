import { createAction, Property } from '@activepieces/pieces-framework';
import { applyEasyApply } from '../common/indeed-browser';

export const applyToJob = createAction({
    name: 'apply_to_job',
    displayName: 'Apply to Job on Indeed',
    description: 'Automatically apply to an Indeed job listing using Easy Apply. Uploads your resume, fills in your contact info, and submits the application. Returns a screenshot of the result.',
    props: {
        jobUrl: Property.ShortText({
            displayName: 'Job URL',
            description: 'The Indeed job URL to apply to (e.g. from the Search Jobs step output: {{steps.search.jobs[0].url}})',
            required: true,
        }),
        indeedEmail: Property.ShortText({
            displayName: 'Indeed Account Email',
            description: 'Your Indeed account email address used to log in',
            required: true,
        }),
        indeedPassword: Property.ShortText({
            displayName: 'Indeed Account Password',
            description: 'Your Indeed account password',
            required: true,
        }),
        firstName: Property.ShortText({
            displayName: 'First Name',
            description: 'Your first name',
            required: true,
            defaultValue: 'Hans Lloyd',
        }),
        lastName: Property.ShortText({
            displayName: 'Last Name',
            description: 'Your last name',
            required: true,
            defaultValue: 'Reyes',
        }),
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: 'Email address to use on applications (can be same as Indeed login)',
            required: true,
        }),
        phone: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Your phone number (e.g. 647-555-1234)',
            required: true,
        }),
        resumePath: Property.ShortText({
            displayName: 'Resume File Path',
            description: 'Full path to your resume PDF on this computer',
            required: true,
            defaultValue: 'C:\\Users\\asust\\Downloads\\REYES, Hans Lloyd-Resume CAN (2).pdf',
        }),
        coverLetter: Property.LongText({
            displayName: 'Cover Letter (optional)',
            description: 'Optional cover letter text. Leave blank to skip. You can use {{steps.x.output}} to insert dynamic text from an AI step.',
            required: false,
            defaultValue: '',
        }),
    },
    async run(context) {
        const { jobUrl, indeedEmail, indeedPassword, firstName, lastName, email, phone, resumePath, coverLetter } = context.propsValue;

        const result = await applyEasyApply({
            jobUrl,
            firstName,
            lastName,
            email,
            phone,
            resumePath,
            coverLetter: coverLetter ?? '',
            indeedEmail,
            indeedPassword,
        });

        return {
            success: result.success,
            message: result.message,
            job_url: jobUrl,
            screenshot_base64: result.screenshot,
        };
    },
});
