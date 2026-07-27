import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { TOKEN_KEYS, ROUTES } from '@/lib/constants';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { useToast } from '@/providers/ToastProvider';
import axios from 'axios';

export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { addToast } = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    if (!accessToken) {
      setError('No access token received');
      return;
    }

    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);

    const fetchUser = async () => {
      try {
        const { data } = await axios.get('/api/v1/users/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setUser(data.data);
        addToast({ title: 'Google sign in successful', variant: 'success' });
        navigate(ROUTES.DASHBOARD, { replace: true });
      } catch {
        setError('Failed to fetch user profile');
        navigate(ROUTES.LOGIN, { replace: true });
      }
    };

    fetchUser();
  }, []);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-destructive">Authentication Failed</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <PageLoader />;
}
