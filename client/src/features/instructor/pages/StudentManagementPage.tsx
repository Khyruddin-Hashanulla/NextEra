import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { AdminHeader } from '@/features/admin/components/AdminHeader';
import { DataTable } from '@/features/admin/components/DataTable';
import { Input } from '@/components/ui/input';
import { Loader2, Search } from 'lucide-react';

export function StudentManagementPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', 'students', page, search],
    queryFn: () => instructorApi.getStudents({ page, limit: 10, search }).then((r) => r.data.data),
  });

  return (
    <div>
      <AdminHeader title="My Students" description="Students enrolled in your courses" />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (item: any) => (
              <div className="flex items-center gap-2">
                {item.avatar?.url && <img src={item.avatar.url} alt="" className="h-7 w-7 rounded-full object-cover" />}
                <span className="font-medium">{item.name}</span>
              </div>
            )},
            { key: 'email', header: 'Email' },
            { key: 'courseTitle', header: 'Course' },
            { key: 'enrollmentDate', header: 'Enrolled', render: (item: any) => new Date(item.enrollmentDate).toLocaleDateString() },
            { key: 'progress', header: 'Progress', render: (item: any) => (
              <div className="flex items-center gap-2">
                <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(item.progress)}%</span>
              </div>
            )},
          ]}
          data={data?.students || []}
          pagination={{
            page: data?.pagination?.page || 1,
            limit: data?.pagination?.limit || 10,
            total: data?.pagination?.total || 0,
            pages: data?.pagination?.pages || 1,
          }}
          onPageChange={setPage}
          emptyMessage="No students enrolled yet"
        />
      )}
    </div>
  );
}
