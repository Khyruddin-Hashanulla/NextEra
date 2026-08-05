import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { ApplyHeader } from '../components/apply/ApplyHeader';
import { InstructorBenefits } from '../components/apply/InstructorBenefits';
import { ApplicationForm } from '../components/apply/ApplicationForm';
import { ApplicationStatusCard } from '../components/apply/ApplicationStatusCard';

export function ApplyPage() {
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['instructor', 'application-status'],
    queryFn: ({ signal }) => instructorApi.getApplicationStatus(signal).then((r) => r.data.data),
  });

  if (isLoading) {
    return <FormSkeleton className="mx-auto max-w-3xl" />;
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {statusData?.applied ? (
        <div className="container-custom py-16 sm:py-20">
          <ApplicationStatusCard status={statusData.status} />
        </div>
      ) : (
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
      )}
    </div>
  );
}
