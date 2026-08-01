import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { studentApi } from '@/api/endpoints/student';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { OptimizedImage } from '@/components/common/OptimizedImage';
import { Star, Users, Clock, BookOpen, CheckCircle2, Share2, Heart, Bookmark, AlertCircle, PlayCircle, ArrowRight, Award } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { formatCurrency, formatDate, formatNumber, getInitials } from '@/lib/utils';
import { categorizeError } from '@/lib/error-utils';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { CourseShowcase } from '../components/CourseShowcase';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { courseSchema, breadcrumbListSchema } from '@/lib/schema';

interface CourseDetail {
  course: {
    _id: string;
    title: string;
    slug: string;
    description: string;
    shortDescription: string;
    thumbnail: { url: string; publicId: string };
    introVideo: { url: string; videoId: string; posterUrl: string; source: string };
    welcomeMessage: string;
    congratulationMessage: string;
    pricing: { originalPrice: number; discountPercent: number; hasDiscount: boolean; gstPercent: number; gstInclusive: boolean };
    price: number;
    category: { _id: string; name: string } | string;
    instructor: { _id: string; name: string; email: string; avatar?: { url: string }; bio?: string; socialLinks?: Record<string, string>; totalCourses?: number; totalStudents?: number; averageRating?: number; totalReviews?: number };
    level: 'beginner' | 'intermediate' | 'advanced' | 'all';
    language: string;
    prerequisites: string;
    benefits: string;
    requirements: string[];
    tags: string[];
    whatYouWillLearn: string[];
    visibility: 'public' | 'private';
    courseType: 'paid' | 'free' | 'draft' | 'private';
    status: 'draft' | 'review' | 'published' | 'archived';
    isApproved: boolean;
    featured: boolean;
    badge: string;
    totalDuration: number;
    totalLectures: number;
    totalSections: number;
    totalResources: number;
    averageRating: number;
    totalReviews: number;
    totalEnrollments: number;
    certificateSettings: { enabled: boolean; template: string; issueAutomatically: boolean };
    meta: { seoTitle: string; seoDescription: string; seoKeywords: string[] };
    lastActivity: string;
    createdAt: string;
    updatedAt: string;
  };
  curriculum: any[];
  isEnrolled: boolean;
  enrollment: any;
}

export function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['course-detail', slug],
    queryFn: ({ signal }) => studentApi.getCourseDetail(slug!, signal).then(r => r.data.data),
    enabled: !!slug,
    retry: 1,
  });

  const course = data?.course;
  const curriculum = data?.curriculum || [];
  const isEnrolled = data?.isEnrolled || false;
  const enrollment = data?.enrollment;

  const price = course?.pricing?.originalPrice || course?.price || 0;
  const hasDiscount = course?.pricing?.hasDiscount && course?.pricing?.discountPercent > 0;
  const displayPrice = hasDiscount ? price * (1 - course.pricing.discountPercent / 100) : price;

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`${ROUTES.LOGIN}?redirect=/courses/${slug}`);
      return;
    }
    try {
      await studentApi.initiatePayment(course._id);
      addToast({ title: 'Redirecting to payment...', variant: 'info' });
    } catch {
      addToast({ title: 'Failed to initiate payment', variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto px-4">
          <div className="aspect-video rounded-2xl bg-muted" />
          <div className="h-8 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-12 bg-muted rounded" /><div className="h-12 bg-muted rounded" /><div className="h-12 bg-muted rounded" />
          </div>
          <div className="h-64 bg-muted rounded" />
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

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        image={course?.thumbnail?.url || ''}
        url={`/courses/${slug}`}
        canonical={`/courses/${slug}`}
        type="article"
        author={course?.instructor?.name}
      />
      <StructuredData schemas={[
        courseSchema({
          title: course.title,
          description: course.shortDescription || course.description,
          slug: course.slug,
          thumbnail: course.thumbnail,
          instructor: course.instructor,
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
          { name: course.title, path: `/courses/${course.slug}` },
        ]),
      ]} />
      {/* Hero Section */}
      <Section size="sm" className="relative overflow-hidden">
        <Container>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted relative">
                {course.thumbnail?.url && (
                  <OptimizedImage 
                    src={course.thumbnail.url} 
                    alt={course.title} 
                    placeholderType="course"
                    className="object-cover" 
                    lazy={false}
                    fetchPriority="high"
                  />
                )}
                {course.introVideo?.url && (
                  <button className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors">
                    <PlayCircle className="h-16 w-16 text-white" />
                  </button>
                )}
                {course.featured && (
                  <Badge className="absolute top-4 left-4" variant="secondary">Featured</Badge>
                )}
                <Badge className="absolute top-4 right-4 capitalize" variant="outline">
                  {course.level}
                </Badge>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              <div className="flex flex-wrap gap-2">
                {course.category?.name && (
                  <Badge variant="outline">{typeof course.category === 'object' ? course.category.name : course.category}</Badge>
                )}
                {course.tags?.slice(0, 3).map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                ))}
                {course.badge && <Badge variant="default">{course.badge}</Badge>}
              </div>

              <h1 className="text-heading-lg font-bold text-foreground">{course.title}</h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={course.instructor?.avatar?.url} alt={course.instructor?.name || ''} />
                    <AvatarFallback>{getInitials(course.instructor?.name)}</AvatarFallback>
                  </Avatar>
                  <span>{course.instructor?.name}</span>
                </div>
                {course.averageRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {course.averageRating.toFixed(1)} ({formatNumber(course.totalReviews)})
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatNumber(course.totalEnrollments)} students
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {course.totalDuration}h
                </span>
              </div>

              <p className="text-body text-muted-foreground">{course.shortDescription}</p>

              {/* Price & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t">
                <div className="flex items-baseline gap-3">
                  <span className="text-heading-lg font-bold text-foreground">
                    {displayPrice === 0 ? 'Free' : formatCurrency(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-muted-foreground line-through">{formatCurrency(price)}</span>
                  )}
                  {hasDiscount && (
                    <Badge variant="secondary">Save {course.pricing.discountPercent}%</Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  {isEnrolled ? (
                    <Button asChild size="lg" className="w-full sm:w-auto" variant="default">
                      <Link to={`/student/courses/${course._id}/learn`}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  ) : displayPrice === 0 ? (
                    <Button asChild size="lg" className="w-full sm:w-auto" onClick={handleEnroll}>
                      <Link to="#" onClick={(e) => { e.preventDefault(); handleEnroll(); }}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll for Free
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" className="w-full sm:w-auto" onClick={handleEnroll}>
                      <Link to="#" onClick={(e) => { e.preventDefault(); handleEnroll(); }}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Enroll Now
                      </Link>
                    </Button>
                  )}

                  <Button variant="outline" size="lg" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-4 border-t">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Lifetime Access</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Certificate Included</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>30-Day Guarantee</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Mobile & TV Access</span>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Tabs Content */}
      <Section size="lg">
        <Container>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum ({totalSections} sections, {totalLectures} lectures)</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({course.totalReviews})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8 space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-heading-md font-semibold mb-4">What You'll Learn</h3>
                    <ul className="space-y-3">
                      {course.whatYouWillLearn?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-body">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-heading-md font-semibold mb-4">Requirements</h3>
                    <ul className="space-y-2">
                      {course.requirements?.length > 0 ? (
                        course.requirements.map((req: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-body text-muted-foreground">
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                            <span>{req}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No specific prerequisites. Just a willingness to learn!</p>
                      )}
                    </ul>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-heading-md font-semibold mb-4">Course Benefits</h3>
                    <p className="text-body text-muted-foreground">{course.benefits || 'Gain practical skills and industry-recognized certification.'}</p>
                  </div>

                  {course.prerequisites && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="text-heading-md font-semibold mb-4">Prerequisites</h3>
                        <p className="text-body text-muted-foreground">{course.prerequisites}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-6">
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
                          <div className="h-10 w-10 rounded-lg bg-purple/10 flex items-center justify-center">
                            <Star className="h-5 w-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">Verified Certificate</p>
                            <p className="text-sm text-muted-foreground">Blockchain verified</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-heading-sm">This Course Includes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Level</span>
                        <span className="font-medium capitalize">{course.level}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Language</span>
                        <span className="font-medium">{course.language || 'English'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="font-medium">{formatDate(course.updatedAt)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <Button asChild className="w-full" size="lg" variant={displayPrice === 0 ? 'default' : 'default'}>
                        <Link to="#" onClick={(e) => { e.preventDefault(); handleEnroll(); }}>
                          {isEnrolled ? 'Continue Learning' : displayPrice === 0 ? 'Enroll for Free' : 'Enroll Now'}
                        </Link>
                      </Button>
                      <p className="text-center text-sm text-muted-foreground mt-3">
                        30-day money-back guarantee
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="curriculum" className="mt-8">
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
                      <AccordionTrigger className="text-lg font-medium">
                        <span className="mr-3 text-primary font-bold">{sectionIndex + 1}.</span>
                        {section.title}
                        <span className="ml-auto text-sm text-muted-foreground">
                          {section.lectures?.length || 0} lectures · {section.totalDuration || 0}h
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-2 ml-8">
                          {section.lectures?.map((lecture: any, lectureIndex: number) => (
                            <div key={lecture._id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <span className="text-muted-foreground flex-shrink-0">
                                {sectionIndex + 1}.{lectureIndex + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{lecture.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {lecture.type} · {lecture.duration}min
                                </p>
                              </div>
                              {lecture.isFree && (
                                <Badge variant="secondary" className="text-xs">Free Preview</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>

            <TabsContent value="instructor" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="flex items-start gap-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={course.instructor?.avatar?.url} alt={course.instructor?.name || ''} />
                      <AvatarFallback className="text-3xl font-bold">{getInitials(course.instructor?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-heading-lg font-semibold">{course.instructor?.name}</h3>
                      <p className="text-muted-foreground mt-1">{course.instructor?.bio || 'Experienced instructor passionate about teaching.'}</p>
                    </div>
                  </div>

                  {course.instructor?.socialLinks && (
                    <div className="flex gap-4">
                      {Object.entries(course.instructor.socialLinks as Record<string, string>).map(([platform, url]) => (
                        url && <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-heading-sm">Instructor Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-primary">{course.instructor?.totalCourses || 0}</p>
                          <p className="text-sm text-muted-foreground">Courses</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-muted/50">
                          <p className="text-2xl font-bold text-primary">{formatNumber(course.instructor?.totalStudents || 0)}</p>
                          <p className="text-sm text-muted-foreground">Students</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-5 w-5 ${i < (course.instructor?.averageRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">Based on {course.instructor?.totalReviews || 0} reviews</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <Button asChild variant="outline" className="w-full">
                        <Link to={`/instructors/${course.instructor?._id}`}>
                          View Instructor Profile
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <div className="max-w-3xl">
                <p className="text-muted-foreground">
                  Reviews feature coming soon. Students who have enrolled in this course can leave reviews and ratings.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>

      {/* Related Courses */}
      <Section size="lg" background="muted">
        <Container>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-heading-lg font-semibold">You May Also Like</h2>
          </div>
          <CourseShowcase 
            courses={[]} 
            title="" 
            limit={4}
            className="hidden"
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[]}
          </motion.div>
        </Container>
      </Section>
    </div>
  );
}
