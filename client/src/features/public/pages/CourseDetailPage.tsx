import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  Clock,
  BookOpen,
  CheckCircle2,
  Share2,
  PlayCircle,
  Award,
  Lock,
  Home,
  ChevronRight,
  Languages,
  CalendarDays,
  Layers,
  MessageSquare,
  User,
} from 'lucide-react';
import { studentApi } from '@/api/endpoints/student';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Section } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { CourseCard } from '@/components/course/CourseCard';
import { WishlistButton } from '@/components/course/WishlistButton';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { courseSchema, breadcrumbListSchema } from '@/lib/schema';
import { cn, formatCurrency, formatDate, formatNumber, getInitials } from '@/lib/utils';
import { categorizeError } from '@/lib/error-utils';
import { ROUTES } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { getCoursePricing } from '@/lib/coursePricing';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { formatLectureDuration } from '@/features/student/player/format';
import { PreviewVideoModal } from '../components/PreviewVideoModal';
import { resolveThumbnailUrl } from '@/lib/video';
import type { Review } from '@/types/student';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course-detail', id, user?._id],
    queryFn: ({ signal }) => studentApi.getCourseDetail(id!, signal).then((r) => r.data.data),
    enabled: !!id,
    retry: 1,
  });

  const course = data?.course;
  const curriculum = data?.curriculum || [];
  const isEnrolled = data?.isEnrolled || false;

  const { price, originalPrice, hasDiscount } = getCoursePricing(course);

  const [previewLecture, setPreviewLecture] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const enrollInFlight = useRef(false);

  const [reviewPage, setReviewPage] = useState(1);
  const [loadedReviews, setLoadedReviews] = useState<Review[]>([]);

  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError } = useQuery({
    queryKey: ['course-reviews', id, reviewPage],
    queryFn: ({ signal }) =>
      studentApi.listReviews(id!, { page: reviewPage, limit: 6 }, signal).then((r) => r.data.data),
    enabled: !!id && isAuthenticated,
  });

  useEffect(() => {
    setReviewPage(1);
    setLoadedReviews([]);
  }, [id]);

  useEffect(() => {
    if (!reviewsData?.reviews?.length) return;
    setLoadedReviews((prev) => {
      const map = new Map(prev.map((r) => [r._id, r]));
      reviewsData.reviews.forEach((r: Review) => map.set(r._id, r));
      return Array.from(map.values());
    });
  }, [reviewsData]);

  const catId = typeof course?.category === 'object' ? course.category?._id : undefined;
  const { data: relatedData } = useQuery({
    queryKey: ['course-related', id, catId],
    queryFn: ({ signal }) =>
      studentApi.listCourses({ category: catId, sort: 'popular', page: 1, limit: 4 }, signal).then(
        (r) => r.data.data?.courses || []
      ),
    enabled: !!id && !!catId,
  });
  const relatedCourses = (relatedData || []).filter((c: any) => c._id !== id);
  const totalReviewPages = reviewsData?.totalPages || 1;

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: course?.title || 'Course',
      text: course?.shortDescription || course?.description || '',
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      addToast({ title: 'Link copied to clipboard', variant: 'success' });
    } catch {
      addToast({ title: 'Could not share this course', variant: 'error' });
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.LOGIN}?redirect=/courses/${id}`);
      return;
    }
    if (enrollInFlight.current) return;
    enrollInFlight.current = true;
    setIsEnrolling(true);
    try {
      if (price === 0) {
        const res: any = await studentApi.enrollFreeCourse(course._id);
        const payload = res?.data?.data || res?.data || {};
        addToast({
          title: payload.alreadyEnrolled ? 'You are already enrolled' : 'Enrolled successfully',
          variant: 'success',
        });
        // Drop the 5-minute stale cache for this course so a return trip to the
        // details page reflects the enrollment immediately (Continue button,
        // unlocked curriculum) instead of showing the pre-enrollment snapshot.
        await queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
        navigate(ROUTES.STUDENT_COURSE_PLAYER(course._id), { replace: true });
        return;
      }
      const res: any = await studentApi.initiatePayment(course._id);
      const data = res?.data?.data || {};
      if (data.free) {
        await queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
        addToast({ title: 'Enrolled successfully', variant: 'success' });
        navigate(ROUTES.STUDENT_COURSE_PLAYER(course._id), { replace: true });
        return;
      }
      const opened = await openRazorpayCheckout({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        orderId: data.orderId,
        description: `Course: ${course.title}`,
        onSuccess: async (response: any) => {
          try {
            await studentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            addToast({ title: 'Payment successful! You are now enrolled', variant: 'success' });
            await queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
            navigate(ROUTES.STUDENT_COURSE_PLAYER(course._id), { replace: true });
          } catch {
            addToast({ title: 'Payment verification failed', variant: 'error' });
          }
        },
        onDismiss: () => {
          enrollInFlight.current = false;
          setIsEnrolling(false);
        },
      });
      if (!opened) {
        addToast({ title: 'Failed to load payment gateway', variant: 'error' });
      }
      await queryClient.invalidateQueries({ queryKey: ['course-detail', id] });
    } catch (e: any) {
      const message = e?.response?.data?.message || 'Failed to enroll in this course';
      addToast({ title: message, variant: 'error' });
    } finally {
      enrollInFlight.current = false;
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="border-b border-border">
          <div className="container-custom py-12 sm:py-16 lg:py-20">
            <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="aspect-video animate-pulse rounded-2xl bg-muted" />
              <div className="space-y-6">
                <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                <div className="h-9 w-3/4 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-12 w-full max-w-md animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
        <div className="container-custom py-10">
          <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
          <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    if (!course && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="course" />;
    }
    const category = categorizeError(error);
    if (category === 'network') {
      return (
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return (
      <ErrorState
        title="Course Not Found"
        message="This course doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const totalSections = curriculum.length;
  const totalLectures = curriculum.reduce((acc, section) => acc + (section.lectures?.length || 0), 0);

  const seoTitle = course?.meta?.seoTitle || course?.title || 'Course';
  const seoDescription = course?.meta?.seoDescription || course?.shortDescription || '';
  const seoKeywords = course?.meta?.seoKeywords?.join(', ') || '';

  const ratingDist = [5, 4, 3, 2, 1].map((stars) => {
    const count = loadedReviews.filter((r) => Math.round(r.rating) === stars).length;
    return { stars, count, pct: loadedReviews.length ? (count / loadedReviews.length) * 100 : 0 };
  });

  return (
    <div>
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={course?.thumbnail?.url || ''}
        url={`/courses/${id}`}
        canonical={`/courses/${id}`}
        type="article"
        author={course?.instructor?.name}
      />
      <StructuredData
        schemas={[
          courseSchema({
            title: course.title,
            description: course.shortDescription || course.description,
            slug: course.slug,
            thumbnail: course.thumbnail,
            instructor: course.instructor ?? undefined,
            category: course.category,
            level: course.level,
            price: course.price,
            averageRating: course.averageRating,
            totalReviews: course.totalReviews,
            language: course.language,
            whatYouWillLearn: course.whatYouWillLearn,
            prerequisites: course.prerequisites,
            updatedAt: course.updatedAt,
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'Courses', path: '/courses' },
            { name: course.title, path: `/courses/${id}` },
          ]),
        ]}
      />

      {/* Hero */}
      <Section size="sm">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-muted shadow-sm">
              {(course.thumbnail?.url || course.introVideo?.source === 'youtube') && (
                <OptimizedImage
                  src={resolveThumbnailUrl(course.thumbnail?.url, course.introVideo)}
                  alt={course.title}
                  placeholderType="course"
                  className="object-cover"
                  lazy={false}
                  fetchPriority="high"
                  fallbackSrc={
                    course.introVideo?.source === 'youtube'
                      ? resolveThumbnailUrl(course.thumbnail?.url, course.introVideo).replace(
                          'maxresdefault',
                          'hqdefault'
                        )
                      : undefined
                  }
                />
              )}
              {course.introVideo?.url && course.introVideo?.videoId && (
                <button
                  type="button"
                  aria-label="Play intro video"
                  onClick={() => {
                    setPreviewLecture({
                      _id: 'intro',
                      title: course.title,
                      type: 'video',
                      videoSource: {
                        source: course.introVideo.source,
                        videoId: course.introVideo.videoId,
                        url: course.introVideo.url,
                      },
                    });
                    setPreviewOpen(true);
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors"
                >
                  <PlayCircle className="h-16 w-16 text-white" />
                </button>
              )}
              {course.featured && (
                <Badge className="absolute top-4 left-4" variant="secondary">
                  Featured
                </Badge>
              )}
              <Badge className="absolute top-4 right-4 capitalize" variant="outline">
                {course.level}
              </Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
              <Link to="/courses" className="transition-colors hover:text-foreground">
                Courses
              </Link>
              {course.category?.name && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" aria-hidden="true" />
                  <span className="font-medium text-foreground">
                    {typeof course.category === 'object' ? course.category.name : course.category}
                  </span>
                </>
              )}
            </nav>

            <div className="flex flex-wrap gap-2">
              {course.category?.name && (
                <Badge variant="outline">
                  {typeof course.category === 'object' ? course.category.name : course.category}
                </Badge>
              )}
              {course.tags?.slice(0, 3).map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {course.badge && <Badge variant="default">{course.badge}</Badge>}
            </div>

            <h1 className="text-heading-lg font-bold text-foreground">{course.title}</h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={course.instructor?.avatar?.url} alt={course.instructor?.name || ''} />
                  <AvatarFallback>{getInitials(course.instructor?.name)}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{course.instructor?.name}</span>
              </span>
              {course.averageRating > 0 && (
                <span className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">{course.averageRating.toFixed(1)}</span>
                  <span>({formatNumber(course.totalReviews)})</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {formatNumber(course.totalEnrollments)} students
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {course.totalDuration}h
              </span>
              {course.level && (
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4" />
                  <span className="capitalize">{course.level}</span>
                </span>
              )}
              {course.language && (
                <span className="flex items-center gap-1.5">
                  <Languages className="h-4 w-4" />
                  {course.language}
                </span>
              )}
              {course.updatedAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  Updated {formatDate(course.updatedAt)}
                </span>
              )}
            </div>

            <p className="text-body leading-relaxed text-muted-foreground">{course.shortDescription}</p>

            {/* Price & Actions */}
            <div className="border-t border-border pt-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-heading-lg font-bold text-foreground">
                  {price === 0 ? 'Free' : formatCurrency(price)}
                </span>
                {hasDiscount && <span className="text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>}
                {hasDiscount && <Badge variant="secondary">Save {course.pricing?.discountPercent}%</Badge>}
                {isEnrolled && <Badge variant="success">Enrolled</Badge>}
              </div>
              <div className="mt-5 grid gap-3 sm:max-w-md">
                {isEnrolled ? (
                  <Button asChild size="lg" fullWidth>
                    <Link to={`/student/courses/${course._id}/learn`}>
                      <BookOpen className="h-4 w-4" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    fullWidth
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    loading={isEnrolling}
                  >
                    <BookOpen className="h-4 w-4" />
                    {price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </Button>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button variant="outline" size="lg" onClick={handleShare} className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  <WishlistButton courseId={course._id} variant="button" className="w-full" />
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Lifetime Access
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Certificate Included
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                30-Day Guarantee
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" />
                Mobile & TV Access
              </span>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Tabs + persistent sticky sidebar */}
      <Section className="py-8 sm:py-10 lg:py-12">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
          <div className="min-w-0">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 md:grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({course.totalReviews})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-8 space-y-8">
                <section className="space-y-4">
                  <h2 className="text-heading-md font-semibold">Course Description</h2>
                  <p className="text-body leading-relaxed text-muted-foreground">
                    {course.description || course.shortDescription}
                  </p>
                </section>

                <Separator />

                <section className="space-y-4">
                  <h2 className="text-heading-md font-semibold">What You'll Learn</h2>
                  {course.whatYouWillLearn?.length ? (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {course.whatYouWillLearn.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-body">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No learning outcomes have been listed yet. Check back soon.
                    </p>
                  )}
                </section>

                <Separator />

                <section className="space-y-4">
                  <h2 className="text-heading-md font-semibold">Requirements</h2>
                  {course.requirements?.length ? (
                    <ul className="space-y-2">
                      {course.requirements.map((req: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-body text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No specific prerequisites. Just a willingness to learn!</p>
                  )}
                </section>

                <Separator />

                <section className="space-y-4">
                  <h2 className="text-heading-md font-semibold">Course Benefits</h2>
                  <p className="text-body leading-relaxed text-muted-foreground">
                    {course.benefits || 'Gain practical skills and industry-recognized certification.'}
                  </p>
                </section>

                {course.prerequisites && (
                  <>
                    <Separator />
                    <section className="space-y-4">
                      <h2 className="text-heading-md font-semibold">Prerequisites</h2>
                      <p className="text-body leading-relaxed text-muted-foreground">{course.prerequisites}</p>
                    </section>
                  </>
                )}
              </TabsContent>

              <TabsContent value="curriculum" className="mt-8">
                <div className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Curriculum</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {totalSections} section{totalSections === 1 ? '' : 's'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {totalLectures} lecture{totalLectures === 1 ? '' : 's'}
                  </span>
                  {course.totalDuration > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{course.totalDuration}h</span>
                    </>
                  )}
                </div>
                {curriculum.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
                    title="No curriculum available"
                    description="The instructor hasn't added any sections yet."
                  />
                ) : (
                  <Accordion type="single" collapsible className="w-full space-y-3">
                    {curriculum.map((section: any, sectionIndex: number) => (
                      <AccordionItem key={section._id} value={section._id}>
                        <AccordionTrigger className="text-base font-medium sm:text-lg">
                          <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                            <span className="shrink-0 text-primary font-bold">{sectionIndex + 1}.</span>
                            <span className="min-w-0 flex-1 break-words">{section.title}</span>
                          </span>
                          <span className="ml-3 shrink-0 whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
                            {section.lectures?.length || 0} lectures · {section.totalDuration || 0}h
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="ml-4 space-y-2 sm:ml-8">
                            {section.lectures?.map((lecture: any, lectureIndex: number) => {
                              const canPlay = isEnrolled || lecture.isFree;
                              return (
                                <button
                                  key={lecture._id}
                                  type="button"
                                  onClick={() => {
                                    if (isEnrolled) {
                                      navigate(`/student/courses/${course._id}/learn`);
                                      return;
                                    }
                                    if (!lecture.isFree) return;
                                    setPreviewLecture(lecture);
                                    setPreviewOpen(true);
                                  }}
                                  disabled={!canPlay}
                                  className="flex w-full items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left disabled:cursor-not-allowed disabled:opacity-70 sm:gap-3"
                                >
                                  <span className="shrink-0 text-muted-foreground">
                                    {sectionIndex + 1}.{lectureIndex + 1}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">{lecture.title}</p>
                                    <p className="truncate text-sm text-muted-foreground">
                                      {lecture.type}
                                      {formatLectureDuration(lecture.duration) &&
                                        ` · ${formatLectureDuration(lecture.duration)}`}
                                    </p>
                                  </div>
                                  {isEnrolled ? (
                                    <PlayCircle className="h-4 w-4 shrink-0 text-success" />
                                  ) : lecture.isFree ? (
                                    <Badge variant="secondary" className="shrink-0 whitespace-nowrap text-xs">
                                      Free Preview
                                    </Badge>
                                  ) : (
                                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>

              <TabsContent value="instructor" className="mt-8">
                {course.instructor ? (
                  <Card>
                    <CardContent className="p-6 lg:p-8">
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                          <AvatarImage src={course.instructor.avatar?.url} alt={course.instructor.name || ''} />
                          <AvatarFallback className="text-2xl font-bold">
                            {getInitials(course.instructor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                          <h2 className="text-heading-lg font-semibold">{course.instructor.name}</h2>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Users className="h-4 w-4" />
                              {formatNumber(course.totalEnrollments)} students
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {course.averageRating.toFixed(1)} rating
                            </span>
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4" />
                              {formatNumber(course.totalReviews)} reviews
                            </span>
                          </div>
                          <p className="text-body leading-relaxed text-muted-foreground">
                            {course.instructor.bio || 'Experienced instructor passionate about teaching.'}
                          </p>
                          <Button asChild variant="outline" className="gap-2">
                            <Link to={`/instructors/${course.instructor._id}`}>
                              <User className="h-4 w-4" />
                              View Instructor Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <EmptyState
                    icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
                    title="Instructor information unavailable"
                    description="Information about this course's instructor is not available right now."
                  />
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-8">
                {reviewsLoading ? (
                  <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    <div className="h-56 animate-pulse rounded-2xl bg-muted" />
                    <div className="space-y-4">
                      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                    </div>
                  </div>
                ) : reviewsError ? (
                  <ErrorState
                    title="Unable to load reviews"
                    message="We couldn't load the reviews for this course right now."
                    onRetry={() => queryClient.invalidateQueries({ queryKey: ['course-reviews', id] })}
                    showHomeLink={false}
                  />
                ) : !isAuthenticated && course.totalReviews > 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-12 w-12 text-muted-foreground/50" />}
                    title="Reviews available after signing in"
                    description="Sign in to read reviews and ratings for this course."
                  />
                ) : course.totalReviews === 0 ? (
                  <EmptyState
                    icon={<MessageSquare className="h-12 w-12 text-muted-foreground/50" />}
                    title="No reviews yet"
                    description="This course doesn't have any reviews yet. Enroll and be the first to share your experience."
                  />
                ) : (
                  <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
                    <div className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
                      <div className="flex items-end gap-2">
                        <span className="text-heading-lg font-bold text-foreground">
                          {course.averageRating.toFixed(1)}
                        </span>
                        <span className="pb-1 text-sm text-muted-foreground">out of 5</span>
                      </div>
                      <div
                        className="mt-2 flex items-center gap-1"
                        aria-label={`Rated ${course.averageRating.toFixed(1)} out of 5`}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={cn(
                              'h-5 w-5',
                              n <= Math.round(course.averageRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{formatNumber(course.totalReviews)} reviews</p>
                      {loadedReviews.length > 0 && (
                        <div className="mt-6 space-y-2">
                          {ratingDist.map(({ stars, count, pct }) => (
                            <div key={stars} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="w-12 shrink-0">
                                {stars} star{stars === 1 ? '' : 's'}
                              </span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="presentation">
                                <div
                                  className="h-full rounded-full bg-warning"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-8 shrink-0 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {loadedReviews.length === 0 ? (
                        <p className="text-muted-foreground">No reviews available right now.</p>
                      ) : (
                        loadedReviews.map((review) => (
                          <div key={review._id} className="rounded-2xl border border-border bg-card p-6">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={review.user?.avatar?.url} alt={review.user?.name || ''} />
                                <AvatarFallback>{getInitials(review.user?.name)}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-foreground">
                                  {review.user?.name || 'Anonymous'}
                                </p>
                                <p className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
                              </div>
                              <div className="ml-auto flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <Star
                                    key={n}
                                    className={cn(
                                      'h-4 w-4',
                                      n <= review.rating
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-muted-foreground/30'
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.review && (
                              <p className="mt-3 text-body leading-relaxed text-muted-foreground">{review.review}</p>
                            )}
                          </div>
                        ))
                      )}
                      {reviewPage < totalReviewPages && (
                        <Button variant="outline" className="w-full" onClick={() => setReviewPage((p) => p + 1)}>
                          Load more reviews
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <Card>
              <CardHeader>
                <CardTitle className="text-heading-sm">Course Includes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{course.totalLectures} Lectures</p>
                    <p className="text-sm text-muted-foreground">{course.totalDuration} hours of content</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="font-medium">Lifetime Access</p>
                    <p className="text-sm text-muted-foreground">Learn at your own pace</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-medium">Certificate of Completion</p>
                    <p className="text-sm text-muted-foreground">Share on LinkedIn</p>
                  </div>
                </div>
                {course.certificateSettings?.enabled && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Verified Certificate</p>
                      <p className="text-sm text-muted-foreground">Blockchain verified</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <Button asChild className="w-full" size="lg" variant="default">
                  <Link
                    to="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleEnroll();
                    }}
                  >
                    {isEnrolled ? 'Continue Learning' : price === 0 ? 'Enroll for Free' : 'Enroll Now'}
                  </Link>
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-3">30-day money-back guarantee</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </Section>

      {/* Related Courses */}
      {relatedCourses.length > 0 && (
        <Section background="muted" className="py-10 sm:py-14 lg:py-16">
          <div className="mb-6 lg:mb-8">
            <h2 className="text-heading-lg font-semibold">You May Also Like</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedCourses.map((related: any) => (
              <CourseCard key={related._id} course={related} />
            ))}
          </div>
        </Section>
      )}

      <PreviewVideoModal lecture={previewLecture} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}