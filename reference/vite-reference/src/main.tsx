import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'

// Suppress Vite HMR WebSocket errors in preview environments
// These errors occur when HMR tries to connect but the connection fails (non-critical)
if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.on('vite:error', (error: unknown) => {
    // Suppress HMR errors in preview - not critical for functionality
    // Page will still work, just without hot module replacement
    const message = error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : '';
    if (message && (
      message.includes('failed to connect to websocket') ||
      message.includes('WebSocket connection')
    )) {
      console.warn('[HMR] Connection issue - page will refresh on file changes if available');
      return;
    }
    // Let other HMR errors through
  });
}

// Suppress console errors for Vite HMR WebSocket failures in preview
// These are non-critical and don't affect app functionality
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');
    // Suppress Vite HMR WebSocket connection errors (non-critical)
    if (
      message.includes('[vite] failed to connect to websocket') ||
      (message.includes('WebSocket connection to') && (
        message.includes('vite') ||
        message.includes('localhost:') ||
        message.includes('wss://') && message.includes('8001')
      ))
    ) {
      // Silently suppress HMR WebSocket errors - not critical
      return;
    }
    originalError.apply(console, args);
  };
}

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
]);

// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
   