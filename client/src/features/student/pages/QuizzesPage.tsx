import { motion } from 'framer-motion';
import { FileQuestion, BarChart3, BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function QuizzesPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Quiz History</h1>
        <p className="mt-1 text-muted-foreground">Track your quiz performance across courses</p>
      </motion.div>

      <motion.div variants={item}>
        <EmptyState
          icon={<FileQuestion className="h-8 w-8" />}
          title="No quiz attempts yet"
          description="Attempt quizzes from the course player to see your results here"
          action={{ label: 'Go to My Courses', href: '/student/my-courses' }}
        />
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 text-center">
          <BarChart3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">Total Attempts</p>
          <p className="text-2xl font-bold text-muted-foreground">0</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-center">
          <FileQuestion className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">Average Score</p>
          <p className="text-2xl font-bold text-muted-foreground">--</p>
        </div>
        <div className="rounded-xl border bg-card p-5 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-2 text-sm font-medium">Passed</p>
          <p className="text-2xl font-bold text-muted-foreground">0</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
