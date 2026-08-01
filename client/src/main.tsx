import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { queryClient } from '@/api/queryClient';
import { router } from '@/routes';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleProvider = ({ children }: { children: React.ReactNode }) => {
  if (!googleClientId) return <>{children}</>;
  return <GoogleOAuthProvider clientId={googleClientId}>{children}</GoogleOAuthProvider>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GoogleProvider>
            <ThemeProvider>
              <ToastProvider>
                <AuthProvider>
                  <RouterProvider router={router} />
                </AuthProvider>
              </ToastProvider>
            </ThemeProvider>
          </GoogleProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </React.StrictMode>
);
