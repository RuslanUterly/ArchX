import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { Notifications } from "@mantine/notifications";
import '@mantine/notifications/styles.css';
import { IconMoon, IconSun } from "@tabler/icons-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <QueryClientProvider client={queryClient}>
        <MantineProvider theme={{
            other: {
                icons: {
                    theme: {
                        light: IconSun,
                        dark: IconMoon,
                    },
                },
            },
        }}>
            <BrowserRouter>
                <Notifications position="bottom-right" zIndex={9999} />
                <App />
            </BrowserRouter>
        </MantineProvider>
    </QueryClientProvider>
)