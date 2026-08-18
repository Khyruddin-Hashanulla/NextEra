import { BookOpen, PlayCircle, GraduationCap, Award } from 'lucide-react';
import type { StudentDashboard } from '@/types/student';
import { StudentStatCard, type StudentStat } from './StudentStatCard';

const stats: StudentStat[] = [
  {
    key: 'totalCourses',
    label: 'Enrolled Courses',
    description: 'Your course library',
    icon: BookOpen,
    bar: 'bg-cyan-500',
    iconClass: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    description: 'Keep the momentum',
    icon: PlayCircle,
    bar: 'bg-warning',
    iconClass: 'bg-warning/15 text-warning',
  },
  {
    key: 'completedCourses',
    label: 'Completed',
    description: 'Great work!',
    icon: GraduationCap,
    bar: 'bg-success',
    iconClass: 'bg-success/15 text-success',
  },
  {
    key: 'certificates',
    label: 'Certificates',
    description: 'Ready to share',
    icon: Award,
    bar: 'bg-primary',
    iconClass: 'bg-primary/15 text-primary',
  },
];

interface StudentStatsGridProps {
  dashboard?: StudentDashboard;
}

export function StudentStatsGrid({ dashboard }: StudentStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StudentStatCard key={stat.key} stat={stat} value={dashboard?.[stat.key] ?? 0} />
      ))}
    </div>
  );
}