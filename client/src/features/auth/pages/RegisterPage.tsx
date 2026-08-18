import { RegisterForm } from '../components/RegisterForm';
import { RegisterBrandPanel } from '../components/RegisterBrandPanel';
import { PageTransition } from '@/components/common/PageTransition';
import { SEO } from '@/components/seo/SEO';
import { PageBackground } from '@/components/layout/PageBackground';

export function RegisterPage() {
  return (
    <PageTransition>
      <SEO
        title="Create Account"
        description="Create your NextEra account and start learning web development and programming."
        robots="noindex,nofollow"
      />
      <div className="relative isolate flex min-h-[calc(100vh-4rem)] overflow-x-hidden">
        <PageBackground variant="auth" className="absolute inset-0 -z-10" />

        <div className="m-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid w-full grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="mx-auto w-full max-w-md">
              <div className="flex h-full flex-col rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <RegisterForm />
              </div>
            </div>

            <RegisterBrandPanel />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NextEra. All rights reserved.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}