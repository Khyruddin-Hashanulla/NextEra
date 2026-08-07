import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/endpoints/admin';
import { instructorApi } from '@/api/endpoints/instructor';
import { isFreeCourse } from '@/lib/coursePricing';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/providers/ToastProvider';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { motion } from 'framer-motion';
import { Link, ArrowLeft, CheckCircle, XCircle, Clock, User, DollarSign, Tag, BookOpen, Video, FileText, AlertTriangle, ExternalLink, Menu, MessageSquare, Loader2, Archive, RotateCcw, RefreshCw, Globe, Lock } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const actionColors: Record<string, string> = {
  approve: 'bg-green-600 hover:bg-green-700',
  reject: 'bg-red-600 hover:bg-red-700',
  requestChanges: 'bg-orange-600 hover:bg-orange-700',
  publish: 'bg-blue-600 hover:bg-blue-700',
  unpublish: 'bg-purple-600 hover:bg-purple-700',
  archive: 'bg-gray-600 hover:bg-gray-700',
  returnDraft: 'bg-slate-600 hover:bg-slate-700',
};

export function CourseReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin', 'course', id],
    queryFn: ({ signal }) => adminApi.getCourseDetail(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: curriculum } = useQuery({
    queryKey: ['admin', 'curriculum', id],
    queryFn: ({ signal }) => instructorApi.getCurriculum(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course approved successfully', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to approve course', variant: 'destructive' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectCourse(id!, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course rejected', variant: 'success' });
      setShowRejectDialog(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to reject course', variant: 'destructive' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => adminApi.publishCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course published', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to publish course', variant: 'destructive' });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => adminApi.unpublishCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course unpublished', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to unpublish course', variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => adminApi.archiveCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course archived', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to archive course', variant: 'destructive' });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: () => adminApi.restoreCourse(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      addToast({ title: 'Course restored to draft', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error.response?.data?.message || 'Failed to restore course', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return <CourseReviewSkeleton />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold">Course not found</h2>
        <p className="mt-2 text-muted-foreground">The course you're looking for doesn't exist or has been removed.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Management
        </Button>
      </div>
    );
  }

  const canApprove = ['review'].includes(course.status);
  const canPublish = ['approved'].includes(course.status);
  const canUnpublish = ['published'].includes(course.status);
  const canArchive = ['published', 'approved'].includes(course.status);
  const canRestore = ['archived'].includes(course.status);
  const canReject = ['review', 'approved'].includes(course.status);

  const handleAction = (action: string) => {
    if (action === 'reject') {
      setShowRejectDialog(true);
      return;
    }
    setPendingAction(action);
    const confirmMessages: Record<string, string> = {
      approve: 'Approve this course? It will move to approved status.',
      publish: 'Publish this course? Students will be able to enroll.',
      unpublish: 'Unpublish this course? Students can no longer enroll.',
      archive: 'Archive this course? It will be hidden from listings.',
      returnDraft: 'Return to draft? This will remove it from review.',
    };
    if (confirm(confirmMessages[action] || `Perform ${action}?`)) {
      switch (action) {
        case 'approve':
          approveMutation.mutate();
          break;
        case 'publish':
          publishMutation.mutate();
          break;
        case 'unpublish':
          unpublishMutation.mutate();
          break;
        case 'archive':
          archiveMutation.mutate();
          break;
        case 'returnDraft':
          restoreMutation.mutate();
          break;
      }
    }
    setPendingAction(null);
  };

  const isAnyPending = approveMutation.isPending || rejectMutation.isPending || publishMutation.isPending || unpublishMutation.isPending || archiveMutation.isPending || restoreMutation.isPending;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
            <p className="mt-1 text-muted-foreground">Course Review & Moderation</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={statusColors[course.status]}>
            {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
          </Badge>
          {course.submittedAt && (
            <Badge variant="secondary">
              <Clock className="mr-1 h-3 w-3" />
              Submitted {new Date(course.submittedAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-32 w-48 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {course.thumbnail?.url ? (
                      <OptimizedImage src={course.thumbnail.url} alt={course.title} placeholderType="course" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">No thumbnail</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="font-semibold truncate">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{course.description || 'No description provided'}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className={statusColors[course.status]}>
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </Badge>
                      {course.category && <Badge variant="outline">{course.category.name}</Badge>}
                      <Badge variant="outline">{course.level}</Badge>
                      <Badge variant="outline">{course.language}</Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Instructor</p>
                    <p className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {course.instructor?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      {isFreeCourse(course) ? 'Free' : `₹${course.price?.toLocaleString() ?? 0}`}
                      {!isFreeCourse(course) && course.pricing?.hasDiscount && course.pricing.discountPercent && (
                        <Badge variant="secondary">-{course.pricing.discountPercent}%</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{course.courseType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Visibility</p>
                    <p className="font-medium capitalize">{course.visibility}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                    <p className="font-medium">{Math.round((course.totalDuration || 0) / 60)} min</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Lectures</p>
                    <p className="font-medium">{course.totalLectures || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Sections</p>
                    <p className="font-medium">{course.totalSections || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Enrollments</p>
                    <p className="font-medium">{course.totalEnrollments || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                    <p className="font-medium">{course.averageRating ? course.averageRating.toFixed(1) : 'N/A'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Requirements</p>
                    <p className="text-sm">{course.requirements?.join(', ') || 'None specified'}</p>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-sm text-muted-foreground">What You Will Learn</p>
                    <p className="text-sm">{course.whatYouWillLearn?.join(', ') || 'None specified'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Instructor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.instructor ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden bg-muted shrink-0">
                        {course.instructor.avatar?.url ? (
                          <OptimizedImage src={course.instructor.avatar.url} alt={course.instructor.name} placeholderType="avatar" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">No avatar</div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{course.instructor.name}</p>
                        <p className="text-sm text-muted-foreground">{course.instructor.email}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Total Courses</p>
                        <p className="font-medium">{course.instructor.totalCourses || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Total Students</p>
                        <p className="font-medium">{course.instructor.instructorProfile?.totalStudents || 0}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Rating</p>
                        <p className="font-medium">{course.instructor.instructorProfile?.rating || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Subscription</p>
                        <Badge variant="outline" className="capitalize">{course.instructor.instructorProfile?.subscriptionStatus || 'none'}</Badge>
                      </div>
                    </div>
                    {course.instructor.bio && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="text-sm line-clamp-3">{course.instructor.bio}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Instructor information not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="curriculum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Course Curriculum
                {curriculum && curriculum.length > 0 && (
                  <Badge variant="secondary">{curriculum.reduce((acc: number, s: any) => acc + (s.lectures?.length || 0), 0)} lectures</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {curriculum && curriculum.length > 0 ? (
                <div className="space-y-4">
                  {curriculum.map((section: any, sIndex: number) => (
                    <motion.div key={section._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sIndex * 0.05 }} className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">Section {sIndex + 1}</span>
                          <h4 className="font-medium">{section.title}</h4>
                          <Badge variant="outline">{section.lectures?.length || 0} lectures</Badge>
                          {section.totalDuration > 0 && (
                            <Badge variant="secondary">{Math.round(section.totalDuration / 60)} min</Badge>
                          )}
                        </div>
                      </div>
                      <div className="divide-y p-2">
                        {section.lectures?.map((lecture: any, lIndex: number) => {
                            const LectureIcon = {
                              video: Video,
                              article: FileText,
                              assignment: FileText,
                              quiz: AlertTriangle,
                            }[lecture.type];
                            return (
                              <div key={lecture._id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-sm text-muted-foreground w-6 text-right">{lIndex + 1}.</span>
                                  {LectureIcon && <LectureIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{lecture.title}</p>
                                    <p className="text-xs text-muted-foreground capitalize">{lecture.type}</p>
                                  </div>
                                  {lecture.isFree && <Badge variant="secondary" className="text-xs">Free Preview</Badge>}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                                  {lecture.duration > 0 && <span>{Math.floor(lecture.duration / 60)}:{String(lecture.duration % 60).padStart(2, '0')}</span>}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="mx-auto h-12 w-12 mb-3 text-muted-foreground/40" />
                  <p>No curriculum available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Learning Outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 ? (
                  <ul className="space-y-2">
                    {course.whatYouWillLearn.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span>{outcome}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No learning outcomes specified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                {course.requirements && course.requirements.length > 0 ? (
                  <ul className="space-y-2">
                    {course.requirements.map((req: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Tag className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No requirements specified</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm">{course.description || <p className="text-muted-foreground">No description provided</p>}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">SEO & Meta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SEO Title</p>
                    <p className="font-medium">{course.seoTitle || 'Not set (will use course title)'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SEO Description</p>
                    <p className="text-sm line-clamp-2">{course.seoDescription || 'Not set (will use short description)'}</p>
                  </div>
                </div>
                {course.meta?.seoKeywords && course.meta.seoKeywords.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {course.meta.seoKeywords.map((kw: string, i: number) => (
                        <Badge key={i} variant="outline">{kw}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Certificate Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.certificateSettings ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Enabled</p>
                      <Badge variant={course.certificateSettings.enabled ? 'default' : 'secondary'}>
                        {course.certificateSettings.enabled ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Template</p>
                      <p className="font-medium">{course.certificateSettings.template}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Issue Automatically</p>
                      <Badge variant={course.certificateSettings.issueAutomatically ? 'default' : 'secondary'}>
                        {course.certificateSettings.issueAutomatically ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Passing Criteria</p>
                      <p className="font-medium capitalize">{course.certificateSettings.passingCriteria?.replace('_', ' ')}</p>
                    </div>
                    {course.certificateSettings.minimumQuizScore && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Minimum Quiz Score</p>
                        <p className="font-medium">{course.certificateSettings.minimumQuizScore}%</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Default certificate settings applied</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Admin Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current status: <strong className={statusColors[course.status]}>{course.status.charAt(0).toUpperCase() + course.status.slice(1)}</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                {canApprove && (
                  <Button
                    className={actionColors.approve}
                    onClick={() => handleAction('approve')}
                    loading={pendingAction === 'approve' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Course
                  </Button>
                )}
                {canReject && (
                  <Button
                    className={actionColors.reject}
                    variant="destructive"
                    onClick={() => handleAction('reject')}
                    loading={pendingAction === 'reject' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Course
                  </Button>
                )}
                {canPublish && (
                  <Button
                    className={actionColors.publish}
                    onClick={() => handleAction('publish')}
                    loading={pendingAction === 'publish' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Publish Course
                  </Button>
                )}
                {canUnpublish && (
                  <Button
                    className={actionColors.unpublish}
                    variant="outline"
                    onClick={() => handleAction('unpublish')}
                    loading={pendingAction === 'unpublish' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Unpublish Course
                  </Button>
                )}
                {canArchive && (
                  <Button
                    className={actionColors.archive}
                    variant="outline"
                    onClick={() => handleAction('archive')}
                    loading={pendingAction === 'archive' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive Course
                  </Button>
                )}
                {canRestore && (
                  <Button
                    className={actionColors.returnDraft}
                    variant="outline"
                    onClick={() => handleAction('returnDraft')}
                    loading={pendingAction === 'returnDraft' || isAnyPending}
                    disabled={isAnyPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Return to Draft
                  </Button>
                )}
              </div>
              {showRejectDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                  <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
                    <h2 className="text-lg font-semibold">Reject Course</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Please provide a reason for rejecting this course. The instructor will see this feedback.</p>
                    <Textarea
                      className="mt-4"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={4}
                    />
                    <div className="mt-6 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => { setShowRejectDialog(false); setRejectReason(''); }}>Cancel</Button>
                      <Button variant="destructive" onClick={() => rejectMutation.mutate()} loading={rejectMutation.isPending} disabled={!rejectReason.trim()}>
                        Reject Course
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/admin/courses/${id}`)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Course Data
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/admin/courses')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Course Management
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function CourseReviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4"><Skeleton className="h-32 w-48 rounded" /><div className="flex-1 space-y-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div></div>
              <Skeleton className="h-4 w-full" />
              <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent><div className="space-y-4"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div></CardContent>
        </Card>
      </div>
    </div>
  );
}