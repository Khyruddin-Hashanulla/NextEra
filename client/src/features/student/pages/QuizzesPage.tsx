import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, BarChart3, BookOpen, TrendingUp, Clock, User, Award } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { quizApi } from '@/api/endpoints/quiz';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/providers/ToastProvider';
import { categorizeError } from '@/lib/error-utils';

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
  const { addToast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['student', 'quizzes'],
    queryFn: () => studentApi.getQuizzes().then((r: any) => r.data.data),
  });

  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [isViewResultOpen, setIsViewResultOpen] = useState(false);
  const [_isStartQuizOpen, setIsStartQuizOpen] = useState(false);
  const [selectedLectureId, setSelectedLectureId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const startQuizMutation = useMutation({
    mutationFn: (data: { courseId: string; lectureId: string }) =>
      quizApi.startQuizEnhanced(data).then((r: any) => r.data),
    onSuccess: () => {
      addToast({
        title: 'Quiz started',
        description: 'You can now begin answering quiz questions',
        variant: 'success',
      });
      refetch();
      setIsStartQuizOpen(false);
    },
    onError: (error: any) => {
      const category = categorizeError(error);
      if (category === 'forbidden') {
        addToast({
          title: 'Access denied',
          description: 'You do not have permission to start this quiz',
          variant: 'error',
        });
      } else if (category === 'not-found') {
        addToast({ title: 'Quiz not found', description: 'The requested quiz does not exist', variant: 'error' });
      } else {
        addToast({ title: 'Error', description: 'Failed to start quiz', variant: 'error' });
      }
    },
  });

  const viewResultMutation = useMutation({
    mutationFn: (attemptId: string) => quizApi.getAttemptResult(attemptId).then((r: any) => r.data),
    onSuccess: (data) => {
      setSelectedAttemptId(data.attemptId);
      setIsViewResultOpen(true);
    },
    onError: (_error: any) => {
      addToast({ title: 'Error', description: 'Failed to load attempt result', variant: 'error' });
    },
  });

  const downloadResultMutation = useMutation({
    mutationFn: (attemptId: string) => quizApi.downloadResult(attemptId).then((r: any) => r.data),
    onSuccess: (_data) => {
      addToast({ title: 'Success', description: 'Result downloaded successfully', variant: 'success' });
    },
    onError: (_error: any) => {
      addToast({ title: 'Error', description: 'Failed to download result', variant: 'error' });
    },
  });

  if (isLoading) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (error) {
    const category = categorizeError(error);
    if (category === 'network') {
      return (
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => refetch()}
        />
      );
    }
    return <ErrorState title="Unable to load quiz data" message="Please try again later." onRetry={() => refetch()} />;
  }

  const quizzes = data?.quizzes || [];
  const stats = data?.stats || {
    totalAttempts: 0,
    averageScore: 0,
    passedCount: 0,
    latestAttempt: null,
    bestAttempt: null,
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800';
      case 'D':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold tracking-tight">Quiz History</h1>
        <p className="mt-1 text-muted-foreground">Track your quiz performance across courses</p>
      </motion.div>

      <motion.div variants={item} className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{Number(stats.averageScore || 0).toFixed(1)}%</div>
              <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Passed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.passedCount}</div>
              <Award className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {quizzes.length === 0 ? (
        <motion.div variants={item}>
          <EmptyState
            icon={<FileQuestion className="h-8 w-8" />}
            title="No quiz attempts yet"
            description="Attempt quizzes from the course player to see your results here"
            action={{ label: 'Go to My Courses', href: '/student/my-courses' }}
          />
        </motion.div>
      ) : (
        <motion.div variants={item}>
          <Tabs defaultValue="attempts" className="w-full">
            <TabsList>
              <TabsTrigger value="attempts">Recent Attempts</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="attempts" className="space-y-4 mt-4">
              {quizzes.map((attempt: any) => (
                <Card key={attempt._id} className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{attempt.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Attempt #{attempt.attemptNumber} • {new Date(attempt.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getGradeColor(attempt.letterGrade || '')}>{attempt.letterGrade || 'F'}</Badge>
                        <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                          {attempt.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Score</p>
                        <p className="text-sm font-semibold">
                          {attempt.score}/{attempt.totalMarks}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Percentage</p>
                        <p className="text-sm font-semibold">{attempt.percentage}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Correct/Total</p>
                        <p className="text-sm font-semibold">
                          {attempt.correctAnswers}/{attempt.totalQuestions}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Time Taken</p>
                        <p className="text-sm font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {Math.floor((attempt.timeTaken || 0) / 60)}min
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {attempt.status === 'published' && (
                        <Dialog
                          open={isViewResultOpen && selectedAttemptId === attempt._id}
                          onOpenChange={setIsViewResultOpen}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewResultMutation.mutate(attempt._id)}
                              disabled={viewResultMutation.isPending}
                            >
                              <FileQuestion className="h-3 w-3 mr-1" /> View Result
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Quiz Attempt Details</DialogTitle>
                              <DialogDescription>
                                Attempt #{attempt.attemptNumber} • {attempt.title}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedAttemptId && viewResultMutation.data && (
                              <div className="space-y-4 max-h-[60vh] overflow-auto">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Attempt ID</p>
                                    <p className="text-sm font-mono">{selectedAttemptId}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                                    <p className="text-sm">{attempt.evaluationStatus}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Submitted At</p>
                                    <p className="text-sm">{new Date(attempt.submittedAt).toLocaleString()}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h4 className="font-semibold">Question Details</h4>
                                  {attempt.details?.map((detail: any) => (
                                    <div key={detail.questionId} className="border rounded-lg p-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm mb-1">{detail.question}</p>
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge
                                              variant={detail.isCorrect ? 'default' : 'secondary'}
                                              className="text-xs"
                                            >
                                              {detail.isCorrect ? 'Correct' : 'Incorrect'}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs">
                                              {detail.marksObtained}/{detail.maxMarks} marks
                                            </Badge>
                                          </div>
                                        </div>
                                        <Badge className={getGradeColor(detail.letterGrade || '')}>
                                          {detail.letterGrade || 'F'}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadResultMutation.mutate(attempt._id)}
                        disabled={downloadResultMutation.isPending}
                      >
                        <FileQuestion className="h-3 w-3 mr-1" /> Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Trend</CardTitle>
                    <CardDescription>Your quiz scores over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.scoreHistory && stats.scoreHistory.length > 0 ? (
                      <div className="space-y-3">
                        {stats.scoreHistory.map((attempt: any) => (
                          <div
                            key={attempt.attemptNumber}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium">Attempt #{attempt.attemptNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(attempt.completedAt).toLocaleDateString()} • {attempt.percentage}% score
                              </p>
                            </div>
                            <Badge className={getGradeColor('')}>
                              {attempt.percentage >= 90
                                ? 'A+'
                                : attempt.percentage >= 80
                                  ? 'A'
                                  : attempt.percentage >= 70
                                    ? 'B+'
                                    : attempt.percentage >= 60
                                      ? 'B'
                                      : 'F'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<BarChart3 className="h-8 w-8" />}
                        title="No analytics data"
                        description="Complete quizzes to see performance analytics"
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attempt Distribution</CardTitle>
                    <CardDescription>Breakdown of your quiz attempts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.attemptDistribution && Object.keys(stats.attemptDistribution).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(stats.attemptDistribution).map(([attemptNumber, count]) => (
                          <div key={attemptNumber} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Attempt #{attemptNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${(Number(count) / stats.totalAttempts) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{String(count)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={<BookOpen className="h-8 w-8" />}
                        title="No distribution data"
                        description="You haven't attempted any quizzes yet"
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}

      {selectedCourseId && selectedLectureId && (
        <motion.div variants={item}>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-center">Start New Quiz</CardTitle>
              <CardDescription className="text-center">
                Select a course and lecture to start a new quiz attempt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-2 block">Course</label>
                  <Select onValueChange={setSelectedCourseId} value={selectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course1">Web Development</SelectItem>
                      <SelectItem value="course2">JavaScript Advanced</SelectItem>
                      <SelectItem value="course3">Python Programming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Lecture</label>
                  <Select onValueChange={setSelectedLectureId} value={selectedLectureId} disabled={!selectedCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a lecture" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture1">Quiz 1: Fundamentals</SelectItem>
                      <SelectItem value="lecture2">Quiz 2: Intermediate</SelectItem>
                      <SelectItem value="lecture3">Quiz 3: Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => startQuizMutation.mutate({ courseId: selectedCourseId, lectureId: selectedLectureId })}
                disabled={startQuizMutation.isPending || !selectedCourseId || !selectedLectureId}
              >
                {startQuizMutation.isPending ? 'Starting...' : 'Start Quiz'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
