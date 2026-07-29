import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { studentApi } from '@/api/endpoints/student';
import { CourseCard } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Star, Users, Award, BookOpen, Code, Globe, Linkedin, Twitter, Github, Globe as GlobeIcon, Mail, MapPin, Calendar } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { formatNumber, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { Link } from 'react-router-dom';

interface InstructorProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: { url: string; publicId: string };
  bio: string;
  socialLinks: {
    youtube: string;
    twitter: string;
    linkedin: string;
    github: string;
    portfolio: string;
    website: string;
  };
  instructorProfile: {
    qualification: string;
    experience: string;
    expertise: string[];
    resume: { url: string; publicId: string };
    identityProof: { url: string; publicId: string };
    demoVideo: { url: string; publicId: string };
    taxDetails: { pan: string; gst: string };
    bankDetails: {
      accountHolderName: string;
      accountNumber: string;
      ifscCode: string;
      bankName: string;
      branch: string;
      upiId: string;
    };
    teachingCategories: string[];
    completedCourses: number;
    totalStudents: number;
    totalEarnings: number;
    rating: number;
    subscriptionStatus: string;
    subscriptionExpiry?: string;
  };
}

export function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', id],
    queryFn: () => studentApi.listCourses({ limit: 100 }).then(r => {
      const courses = r.data.data.courses || [];
      return courses.filter((c: any) => c.instructor?._id === id);
    }),
    enabled: !!id,
  });

  const { data: instructorData, isLoading: instructorLoading, error } = useQuery({
    queryKey: ['instructor-profile', id],
    queryFn: () => studentApi.listCourses({ limit: 100 }).then(r => {
      const courses = r.data.data.courses || [];
      const instructorMap = new Map();
      courses.forEach((course: any) => {
        if (course.instructor?._id === id && !instructorMap.has(course.instructor._id)) {
          instructorMap.set(course.instructor._id, {
            _id: course.instructor._id,
            name: course.instructor.name,
            email: course.instructor.email,
            avatar: course.instructor.avatar,
            bio: '',
            totalCourses: 0,
            totalStudents: 0,
            averageRating: 0,
            totalReviews: 0,
            specialties: [],
            socialLinks: {
              youtube: '',
              twitter: '',
              linkedin: '',
              github: '',
              portfolio: '',
              website: '',
            },
          } as any);
        }
        if (course.instructor?._id === id) {
          const inst = instructorMap.get(course.instructor._id);
          inst.totalCourses++;
          inst.totalStudents += course.totalEnrollments || 0;
          inst.averageRating = (inst.averageRating * (inst.totalCourses - 1) + (course.averageRating || 0)) / inst.totalCourses;
          inst.totalReviews += course.totalReviews || 0;
        }
      });
      return Array.from(instructorMap.values())[0] || null;
    }),
    enabled: !!id,
  });

  const instructor = instructorData;
  const courses = coursesData?.courses || [];

  if (instructorLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-8 max-w-4xl mx-auto px-4">
          <div className="flex gap-8">
            <div className="h-32 w-32 rounded-full bg-muted" />
            <div className="flex-1 space-y-4">
              <div className="h-8 w-1/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded" />
            </div>
          </div>
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <ErrorState
        title="Instructor Not Found"
        message="This instructor profile doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const socialLinks = [
    { icon: Linkedin, url: instructor.socialLinks?.linkedin, label: 'LinkedIn' },
    { icon: Twitter, url: instructor.socialLinks?.twitter, label: 'Twitter' },
    { icon: Github, url: instructor.socialLinks?.github, label: 'GitHub' },
    { icon: GlobeIcon, url: instructor.socialLinks?.website, label: 'Website' },
    { icon: Code, url: instructor.socialLinks?.portfolio, label: 'Portfolio' },
  ].filter(s => s.url);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section size="md" background="gradient">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8 items-center md:items-start"
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-32 w-32">
                <AvatarImage src={instructor.avatar?.url} alt={instructor.name} />
                <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
                  {getInitials(instructor.name)}
                </AvatarFallback>
              </Avatar>
              {instructor.averageRating && instructor.averageRating > 0 && (
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground shadow-lg">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {instructor.averageRating.toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className="text-heading-md font-bold text-foreground">{instructor.name}</span>
              </div>

              {instructor.bio && (
                <p className="text-body text-muted-foreground max-w-2xl">{instructor.bio}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{instructor.totalCourses || 0}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{formatNumber(instructor.totalStudents || 0)}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{instructor.averageRating?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <p className="text-2xl font-bold text-primary">{instructor.totalReviews || 0}</p>
                  <p className="text-sm text-muted-foreground">Reviews</p>
                </div>
              </div>

              {socialLinks.length > 0 && (
                <div className="flex justify-center md:justify-start gap-4 pt-2">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </Container>
      </Section>

      {/* Expertise */}
      {instructor.specialties && instructor.specialties.length > 0 && (
        <Section size="sm" id="expertise">
          <Container>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading-md font-semibold">Areas of Expertise</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {instructor.specialties.map((specialty: string) => (
                <Badge key={specialty} variant="outline" className="text-sm px-3 py-1">
                  {specialty}
                </Badge>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* Courses Tabs */}
      <Section size="lg" id="courses">
        <Container>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Courses ({instructor.totalCourses || 0})</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-8">
              {courses.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-12 w-12 text-muted-foreground/50" />}
                  title="No courses yet"
                  description="This instructor hasn't published any courses yet."
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {courses.map((course: any) => (
                    <CourseCard key={course._id} course={course} variant="default" />
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="published" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {courses.filter((c: any) => c.status === 'published').map((course: any) => (
                  <CourseCard key={course._id} course={course} variant="default" />
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="featured" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {courses.filter((c: any) => c.featured).map((course: any) => (
                  <CourseCard key={course._id} course={course} variant="featured" />
                ))}
              </motion.div>
            </TabsContent>
          </Tabs>
        </Container>
      </Section>

      {/* About */}
      <Section size="lg" background="muted" id="about">
        <Container>
          <div className="max-w-3xl">
            <h2 className="text-heading-lg font-semibold mb-6">About {instructor.name}</h2>
            <div className="prose prose-gray max-w-none text-muted-foreground">
              <p>{instructor.bio || 'Experienced instructor passionate about sharing knowledge and helping students succeed in their learning journey.'}</p>
            </div>

            {instructor.instructorProfile && (
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-heading-sm font-semibold mb-3">Qualifications</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground">Qualification</p>
                      <p className="font-medium">{instructor.instructorProfile.qualification || 'Not specified'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-background">
                      <p className="text-sm text-muted-foreground">Experience</p>
                      <p className="font-medium">{instructor.instructorProfile.experience || 'Not specified'}</p>
                    </div>
                  </div>
                </div>

                {instructor.instructorProfile.teachingCategories && instructor.instructorProfile.teachingCategories.length > 0 && (
                  <div>
                    <h3 className="text-heading-sm font-semibold mb-3">Teaching Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {instructor.instructorProfile.teachingCategories.map((cat: string) => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section size="sm" background="gradient">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-heading-md font-semibold">Ready to learn from {instructor.name}?</h2>
            <p className="mt-3 text-muted-foreground">Explore their courses and start building new skills today.</p>
            <Button asChild variant="outline" className="mt-4" size="lg">
              <Link to="/courses">Browse All Courses</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
