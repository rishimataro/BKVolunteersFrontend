import { AppProvider } from './provider';
import { AppRouter } from '@/routes/index';

export const App = () => {
    return (
        <AppProvider>
            <AppRouter />
        </AppProvider>
    );
};
