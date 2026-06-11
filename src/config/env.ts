import * as z from 'zod';

const createEnv = () => {
    const EnvSchema = z.object({
        API_URL: z.string(),
        APP_URL: z.string().optional().default('http://localhost:3000'),
    });

    const rawEnv = import.meta.env as Record<string, string | undefined>;
    const envVars: Record<string, string> = {};

    const apiUrl = rawEnv.VITE_API_BASE_URL ?? rawEnv.VITE_APP_API_URL;
    if (apiUrl) {
        envVars.API_URL = apiUrl;
    }

    const appUrl = rawEnv.VITE_APP_APP_URL ?? rawEnv.VITE_APP_URL;
    if (appUrl) {
        envVars.APP_URL = appUrl;
    }

    const parsedEnv = EnvSchema.safeParse(envVars);

    if (!parsedEnv.success) {
        throw new Error(
            `Invalid env provided.
The following variables are missing or invalid: ${Object.entries(
                parsedEnv.error.flatten().fieldErrors,
            )
                .map(([k, v]) => ` - ${k}: ${v}`)
                .join('\n')}`,
        );
    }
    return parsedEnv.data;
};

export const env = createEnv();
