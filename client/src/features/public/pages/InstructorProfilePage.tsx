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
import { Star, Users, Award, BookOpen, Code, Globe, Linkedin, Twitter, Github, Mail, MapPin, Calendar, Phone, FileText, PlayCircle, GraduationCap, Briefcase } from 'lucide-react';
import { Section, Container } from '@/components/common/Section';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { formatNumber, getInitials } from '@/lib/utils';
import { categorizeError } from '@/lib/error-utils';
import { ROUTES } from '@/lib/constants';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { personSchema, breadcrumbListSchema } from '@/lib/schema';
import { buildCanonical } from '@/lib/seo';
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
    teachingCategories: string[];
    resume?: { url: string; publicId: string };
    demoVideo?: { url: string; publicId: string };
    completedCourses: number;
    totalStudents: number;
    rating: number;
  };
  specialties: string[];
  totalCourses: number;
  totalStudents: number;
  totalReviews: number;
  averageRating: number;
  createdAt: string;
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

export function InstructorProfilePage() {
  const { id } = useParams<{ id: string }>();

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['instructor-courses', id],
    queryFn: ({ signal }) => studentApi.listCourses({ limit: 100 }, signal).then(r => {
      const courses = r.data.data.courses || [];
      return courses.filter((c: any) => c.instructor?._id === id);
    }),
    enabled: !!id,
  });

  const { data: instructorData, isLoading: instructorLoading, error } = useQuery({
    queryKey: ['instructor-profile', id],
    queryFn: ({ signal }) => studentApi.getInstructorProfile(id!, signal).then(r => r.data.data),
    enabled: !!id,
  });

  const instructor = instructorData;
  const courses = coursesData || [];

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
    if (!instructor && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="instructor" />;
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
        title="Instructor Not Found"
        message="This instructor profile doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  const profile = instructor.instructorProfile;
  const socialLinks = [
    { icon: Linkedin, url: instructor.socialLinks?.linkedin, label: 'LinkedIn' },
    { icon: Twitter, url: instructor.socialLinks?.twitter, label: 'Twitter' },
    { icon: Github, url: instructor.socialLinks?.github, label: 'GitHub' },
    { icon: Globe, url: instructor.socialLinks?.website, label: 'Website' },
    { icon: Code, url: instructor.socialLinks?.portfolio, label: 'Portfolio' },
  ].filter(s => s.url);

  const memberSince = instructor.createdAt
    ? new Date(instructor.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  const seoTitle = instructor?.name ? `${instructor.name} - Instructor` : 'Instructor';

  return (
    <div className="min-h-screen">
      <SEO
        title={seoTitle}
        description={instructor?.bio || `Learn from instructor ${instructor?.name || ''} on NextEra.`}
        image={instructor?.avatar?.url || ''}
        url={`/instructors/${id}`}
        canonical={`/instructors/${id}`}
        type="profile"
      />
      <StructuredData schemas={[
        personSchema({
          name: instructor.name,
          image: instructor.avatar?.url,
          bio: instructor.bio,
          jobTitle: profile.qualification || 'Instructor',
          url: buildCanonical(`/instructors/${id}`),
          sameAs: [
            instructor.socialLinks?.linkedin,
            instructor.socialLinks?.twitter,
            instructor.socialLinks?.github,
            instructor.socialLinks?.website,
            instructor.socialLinks?.portfolio,
          ].filter(Boolean),
        }),
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'Instructors', path: '/instructors' },
          { name: instructor.name, path: `/instructors/${id}` },
        ]),
      ]} />

      {/* Hero Section */}
      <Section size="md" background="gradient">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row gap-8 items-center md:items-start"
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-32 w-32 ring-4 ring-background shadow-xl">
                <AvatarImage src={instructor.avatar?.url} alt={`Profile photo of ${instructor.name}`} />
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
              <div className="space-y-1">
                <h1 className="text-heading-lg font-bold text-foreground">{instructor.name}</h1>
                {profile.qualification && (
                  <p className="text-body text-primary font-medium">{profile.qualification}</p>
                )}
              </div>

              {instructor.bio && (
                <p className="text-body text-muted-foreground max-w-2xl">{instructor.bio}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{instructor.totalCourses || 0}</p>
                  <p className="text-sm text-muted-foreground">Courses</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur">
                  <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{formatNumber(instructor.totalStudents || 0)}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur">
                  <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold text-primary">{instructor.averageRating?.toFixed(1) || '0.0'}</p>
                  <p className="text-sm text-muted-foreground">Rating</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-background/60 backdrop-blur">
                  <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
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
                      className="p-2 rounded-lg bg-background/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
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

      {/* Main content */}
      <Section size="lg">
        <Container>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <Card id="about">
                <CardHeader>
                  <CardTitle>About {instructor.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {instructor.bio || 'Experienced instructor passionate about sharing knowledge and helping students succeed in their learning journey.'}
                  </p>
                </CardContent>
              </Card>

              {/* Qualifications & Experience */}
              {(profile.qualification || profile.experience) && (
                <Card id="qualifications">
                  <CardHeader>
                    <CardTitle>Professional Background</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Qualification</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.qualification || 'Not specified'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Experience</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{profile.experience || 'Not specified'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Expertise */}
              {instructor.specialties && instructor.specialties.length > 0 && (
                <Card id="expertise">
                  <CardHeader>
                    <CardTitle>Areas of Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {instructor.specialties.map((specialty: string) => (
                        <Badge key={specialty} variant="outline" className="text-sm px-3 py-1">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Teaching Categories */}
              {profile.teachingCategories && profile.teachingCategories.length > 0 && (
                <Card id="teaching">
                  <CardHeader>
                    <CardTitle>Teaching Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.teachingCategories.map((cat: string) => (
                        <Badge key={cat} variant="secondary">{cat}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Courses */}
              <div id="courses">
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all">All Courses ({instructor.totalCourses || 0})</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                    <TabsTrigger value="featured">Featured</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="mt-6">
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
                        className="grid gap-6 sm:grid-cols-2"
                      >
                        {courses.map((course: any) => (
                          <CourseCard key={course._id} course={course} variant="default" />
                        ))}
                      </motion.div>
                    )}
                  </TabsContent>

                  <TabsContent value="published" className="mt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid gap-6 sm:grid-cols-2"
                    >
                      {courses.filter((c: any) => c.status === 'published').map((course: any) => (
                        <CourseCard key={course._id} course={course} variant="default" />
                      ))}
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="featured" className="mt-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid gap-6 sm:grid-cols-2"
                    >
                      {courses.filter((c: any) => c.featured).map((course: any) => (
                        <CourseCard key={course._id} course={course} variant="featured" />
                      ))}
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InfoRow icon={Mail} label="Email" value={instructor.email} />
                  <InfoRow icon={Phone} label="Phone" value={instructor.phone} />
                  <InfoRow icon={MapPin} label="Location" value={instructor.address} />
                  {memberSince && <InfoRow icon={Calendar} label="Member Since" value={memberSince} />}
                </CardContent>
              </Card>

              {(profile.resume || profile.demoVideo) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {profile.resume?.url && (
                      <Button asChild variant="outline" className="w-full justify-start" size="sm">
                        <a href={profile.resume.url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Resume
                        </a>
                      </Button>
                    )}
                    {profile.demoVideo?.url && (
                      <Button asChild variant="outline" className="w-full justify-start" size="sm">
                        <a href={profile.demoVideo.url} target="_blank" rel="noopener noreferrer">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Watch Intro Video
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </aside>
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
              <Link to={ROUTES.COURSES}>Browse All Courses</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </div>
  );
}
