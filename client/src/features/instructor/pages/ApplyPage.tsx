import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { useAuth } from '@/providers/AuthProvider';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { ApplyHeader } from '../components/apply/ApplyHeader';
import { InstructorBenefits } from '../components/apply/InstructorBenefits';
import { ApplicationForm } from '../components/apply/ApplicationForm';
import { ApplicationStatusCard } from '../components/apply/ApplicationStatusCard';

export function ApplyPage() {
  const { user } = useAuth();
  const [reapplying, setReapplying] = useState(false);

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['instructor', 'application-status'],
    queryFn: ({ signal }) => instructorApi.getApplicationStatus(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return <FormSkeleton className="mx-auto max-w-3xl" />;
  }

  // An approval is only valid while the account is actually an instructor.
  // If an admin revoked the role, the approved application no longer grants
  // instructor access and the user must reapply.
  const isRevoked = !!statusData?.applied && statusData.status === 'approved' && user?.role !== 'instructor';

  const showStatus = !!statusData?.applied && !(isRevoked && reapplying);

  if (showStatus) {
    return (
      <div className="container-custom py-16 sm:py-20">
        <ApplicationStatusCard
          status={statusData.status}
          rejectionReason={statusData.application?.rejectionReason}
          revoked={isRevoked}
          onApplyAgain={() => setReapplying(true)}
        />
      </div>
    );
  }

  return (
    <>
      <ApplyHeader />
      <div className="container-custom py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14">
          <aside className="h-fit lg:sticky lg:top-24">
            <InstructorBenefits />
          </aside>
          <div className="min-w-0">
            <ApplicationForm />
          </div>
        </div>
      </div>
    </>
  );
}
