import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { TOKEN_KEYS, ROUTES, getDashboardRoute } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import axios from 'axios';
import { PageTransition } from '@/components/common/PageTransition';
import { AuthLayout } from '../components/AuthLayout';
import { SEO } from '@/components/seo/SEO';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { addToast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    if (!accessToken) {
      setError('No access token received');
      setStatus('error');
      return;
    }

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);

    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = data.data;
        setUser(userData);
        setStatus('success');
        addToast({ title: 'Google sign in successful', variant: 'success' });
        navigate(getDashboardRoute(userData.role), { replace: true });
      } catch {
        setError('Failed to fetch user profile');
        setStatus('error');
        navigate(ROUTES.LOGIN, { replace: true });
      }
    };

    fetchUser();
  }, []);

  return (
    <PageTransition>
      <SEO title="Redirecting..." description="Completing your sign in to NextEra." robots="noindex,nofollow" />
      <AuthLayout>
        <div className="flex flex-col items-center text-center py-8">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="mt-4 text-xl font-semibold tracking-tight">Completing sign in...</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Please wait while we authenticate your account
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Signed in successfully!</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Authentication Failed</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Link
                to={ROUTES.LOGIN}
                className="mt-6 font-medium text-primary transition-colors hover:text-primary/80"
              >
                Back to login
              </Link>
            </>
          )}
        </div>
      </AuthLayout>
    </PageTransition>
  );
}
