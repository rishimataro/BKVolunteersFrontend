import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const localPort = Number(env.VITE_APP_LOCAL_PORT || env.PORT) || 3000;
    return {
        base: './',
        server: {
            port: localPort,
            allowedHosts: ['bkvolunteer.magure.app', 'localhost'],
        },
        preview: {
            port: localPort,
        },
        plugins: [
            react({
                babel: {
                    plugins: [['babel-plugin-react-compiler']],
                },
            }),
            tsconfigPaths(),
        ],
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/testing/setup-tests.ts',
            exclude: ['**/node_modules/**', '**/e2e/**'],
            include: ['src/**/*.test.{ts,tsx}'],
        },
        optimizeDeps: { exclude: ['fsevents'] },
        build: {
            rollupOptions: {
                external: ['fs/promises'],
                output: {
                    experimentalMinChunkSize: 3500,
                },
            },
        },
    };
});
