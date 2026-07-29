import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GraduationCap, Code, Globe, Award, Clock, Brain,
  BookOpen, Users,
} from 'lucide-react';

import { PageTransition } from '@/components/common/PageTransition';
import { Section, Container } from '@/components/common/Section';
import { ROUTES } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

import { Hero } from '../components/Hero';
import { FeatureGrid } from '../components/FeatureGrid';
import { StatsBar } from '../components/StatsBar';
import { CourseShowcase } from '../components/CourseShowcase';
import { InstructorShowcase } from '../components/InstructorShowcase';
import { TestimonialCarousel } from '../components/TestimonialCarousel';
import { CTASection } from '../components/CTASection';
import { NewsletterForm } from '../components/NewsletterForm';

import { studentApi } from '@/api/endpoints/student';
import { blogApi } from '@/api/endpoints/blog';

const features = [
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Expert-Led Courses',
    description: 'Learn from industry professionals with years of real-world experience.',
    color: 'yellow' as const,
  },
  {
    icon: <Code className="h-6 w-6" />,
    title: 'Hands-On Projects',
    description: 'Build real projects that showcase your skills to employers.',
    color: 'blue' as const,
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Community',
    description: 'Join 50,000+ learners worldwide. Collaborate, share, and grow together.',
    color: 'brand' as const,
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Verified Certificates',
    description: 'Earn certificates that are recognized by top companies worldwide.',
    color: 'orange' as const,
  },
  {
    icon: <Brain className="h-6 w-6" />,
    title: 'AI Learning Assistant',
    description: 'Get personalized recommendations and instant help with our AI tutor.',
    color: 'purple' as const,
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: 'Lifetime Access',
    description: 'Learn at your own pace with lifetime access to all course materials.',
    color: 'pink' as const,
  },
];

const stats = [
  { label: 'Courses', value: 500, suffix: '+', icon: <BookOpen className="h-6 w-6" /> },
  { label: 'Students', value: 50, suffix: 'K+', icon: <Users className="h-6 w-6" /> },
  { label: 'Instructors', value: 200, suffix: '+', icon: <GraduationCap className="h-6 w-6" /> },
  { label: 'Countries', value: 120, suffix: '+', icon: <Globe className="h-6 w-6" /> },
];

const testimonials = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'Software Engineer',
    company: 'Tech Corp',
    content: 'This platform completely transformed my career. The courses are well-structured and the instructors are incredibly knowledgeable. I went from beginner to landing my dream job in just 6 months!',
    rating: 5,
  },
  {
    id: '2',
    name: 'Mark Williams',
    role: 'Data Scientist',
    company: 'DataFlow Inc',
    content: 'The hands-on projects and real-world examples made all the difference. I finally understand concepts I struggled with for years. The community support is amazing!',
    rating: 5,
  },
  {
    id: '3',
    name: 'Emily Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    content: "Best learning platform I've ever used. The AI learning assistant is a game-changer - it helped me stay on track and understand complex topics easily.",
    rating: 5,
  },
];

export function HomePage() {
  const { data: coursesRes, isLoading } = useQuery({
    queryKey: ['featured-courses'],
    queryFn: () => studentApi.listCourses({ featured: 'true', limit: 6 }),
  });

  const { data: allCoursesRes } = useQuery({
    queryKey: ['all-courses-instructors'],
    queryFn: () => studentApi.listCourses({ limit: 50 }),
  });

  const { data: blogsRes } = useQuery({
    queryKey: ['featured-blogs'],
    queryFn: () => blogApi.getFeatured(3),
  });

  const featuredCourses = coursesRes?.data?.data?.courses || [];
  const allCourses = allCoursesRes?.data?.data?.courses || [];
  const featuredBlogs = blogsRes?.data?.blogs || [];

  const instructors = useMemo(() => {
    const instructorMap = new Map();
    allCourses.forEach((course: any) => {
      if (course.instructor?._id && !instructorMap.has(course.instructor._id)) {
        instructorMap.set(course.instructor._id, {
          _id: course.instructor._id,
          name: course.instructor.name,
          avatar: course.instructor.avatar?.url || course.instructor.avatar,
          title: course.instructor.title,
          bio: course.instructor.bio,
          specialties: course.instructor.specialties || [],
          rating: course.averageRating || 0,
          studentsCount: course.totalEnrollments || 0,
          coursesCount: 1,
        });
      } else if (course.instructor?._id) {
        const inst = instructorMap.get(course.instructor._id);
        inst.coursesCount++;
        inst.studentsCount += course.totalEnrollments || 0;
      }
    });
    return Array.from(instructorMap.values());
  }, [allCourses]);

  const firstBlog = featuredBlogs[0];
  const remainingBlogs = featuredBlogs.slice(1, 3);

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Hero />

        <Section background="muted" id="features">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
            >
              Everything You Need to Succeed
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-base text-muted-foreground leading-relaxed"
            >
              Our platform provides all the tools, content, and community support
              you need to master new skills and advance your career.
            </motion.p>
          </div>
          <FeatureGrid features={features} />
        </Section>

        <section id="stats" className="bg-primary text-white py-16 sm:py-24 lg:py-32">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <StatsBar stats={stats} />
            </motion.div>
          </Container>
        </section>

        <Section id="courses">
          <CourseShowcase
            courses={featuredCourses}
            isLoading={isLoading}
            title="Popular Courses"
            subtitle="Most enrolled courses loved by our students"
            viewAllHref={ROUTES.COURSES}
          />
        </Section>

        <Section background="muted" id="instructors">
          <InstructorShowcase
            instructors={instructors}
            title="Expert Instructors"
            subtitle="Learn from industry leaders and experts"
          />
        </Section>

        <Section id="testimonials">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
            >
              Trusted by Learners Worldwide
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-4 text-base text-muted-foreground leading-relaxed"
            >
              See what our students have to say about their learning experience
            </motion.p>
          </div>
          <TestimonialCarousel testimonials={testimonials} />
        </Section>

        <Section background="muted" id="blog">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground text-center mb-4"
          >
            Latest from Our Blog
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base text-muted-foreground leading-relaxed text-center mb-12 max-w-2xl mx-auto"
          >
            Insights, tutorials, and industry trends from our experts
          </motion.p>

          {featuredBlogs.length > 0 ? (
            <div className="flex flex-col lg:flex-row gap-8">
              {firstBlog && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="lg:w-3/5"
                >
                  <Link to={`/blog/${firstBlog.slug}`} className="block group h-full">
                    <div className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col">
                      <div className="relative overflow-hidden">
                        <img
                          src={firstBlog.featuredImage?.url}
                          alt={firstBlog.title}
                          className="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground/70 mb-3">
                          <span>{formatDate(firstBlog.publishedAt)}</span>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                          {firstBlog.categories?.length > 0 && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                              {firstBlog.categories[0]}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                          {firstBlog.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
                          {firstBlog.excerpt}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}

              {remainingBlogs.length > 0 && (
                <div className="lg:w-2/5 flex flex-col gap-6">
                  {remainingBlogs.map((blog: any, index: number) => (
                    <motion.div
                      key={blog._id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex-1"
                    >
                      <Link to={`/blog/${blog.slug}`} className="block group h-full">
                        <div className="rounded-2xl bg-background border border-border shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex sm:flex-row">
                          <div className="sm:w-2/5 relative overflow-hidden">
                            <img
                              src={blog.featuredImage?.url}
                              alt={blog.title}
                              className="h-28 sm:h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-4 sm:w-3/5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 mb-1.5">
                              <span>{formatDate(blog.publishedAt)}</span>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                              {blog.categories?.length > 0 && (
                                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                  {blog.categories[0]}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm sm:text-base">
                              {blog.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1 hidden sm:block">
                              {blog.excerpt}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground/70 py-12">No articles available</p>
          )}
        </Section>

        <CTASection
          title="Ready to Start Your Learning Journey?"
          description="Join over 50,000 students already learning with NextEra. Get started today with a free trial."
          primaryAction={{ label: 'Get Started Free', href: ROUTES.REGISTER }}
          secondaryAction={{ label: 'Explore Courses', href: ROUTES.COURSES }}
          background="brand"
        />

        <Section background="muted" id="newsletter">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
                Stay Updated
              </h2>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">
                Get the latest courses and learning resources.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-8"
            >
              <NewsletterForm />
            </motion.div>
          </div>
        </Section>
      </div>
    </PageTransition>
  );
}
