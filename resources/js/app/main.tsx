import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionWatcher } from './auth';
import { router } from './router';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function SessionWatcher() {
    useSessionWatcher();
    return null;
}

const root = document.getElementById('app');

if (root) {
    createRoot(root).render(
        <StrictMode>
            <QueryClientProvider client={queryClient}>
                <SessionWatcher />
                <RouterProvider router={router} />
            </QueryClientProvider>
        </StrictMode>,
    );
}
