import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { Section, Container } from '@/components/common/Section';
import { PageBackground } from '@/components/layout/PageBackground';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';
import { FeatureGrid } from '../components/FeatureGrid';
import { StatsBar } from '../components/StatsBar';
import { CTASection } from '../components/CTASection';
import { TeamMember } from '../components/TeamMember';
import { AboutTimeline, type AboutTimelineItem } from '../components/about/AboutTimeline';
import { Users, Target, Lightbulb, Heart, Globe, Shield, Award, BookOpen, Rocket } from 'lucide-react';

const values = [
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Student Success First',
    description: 'Every decision we make starts with: does this help our students achieve their goals?',
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    title: 'Practical Learning',
    description: 'We believe in learning by doing. Our courses focus on real-world projects and applicable skills.',
  },
  {
    icon: <Heart className="h-6 w-6" />,
    title: 'Accessible Education',
    description: 'Quality education should be available to everyone, regardless of background or location.',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Community',
    description: 'Learning is better together. We foster connections between learners worldwide.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Trust & Transparency',
    description: 'No hidden fees, no false promises. We earn your trust through consistent quality.',
  },
  {
    icon: <Award className="h-6 w-6" />,
    title: 'Continuous Innovation',
    description: 'We constantly evolve our platform and content to stay ahead of industry trends.',
  },
];

const stats = [
  { label: 'Learners Empowered', value: 50000, suffix: '+', icon: <Users className="h-6 w-6" /> },
  { label: 'Courses Published', value: 500, icon: <BookOpen className="h-6 w-6" /> },
  { label: 'Expert Instructors', value: 200, suffix: '+', icon: <Award className="h-6 w-6" /> },
  { label: 'Countries Reached', value: 120, icon: <Globe className="h-6 w-6" /> },
];

const team = [
  {
    name: 'Alex Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former engineering lead at Google. Passionate about democratizing education.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    name: 'Maria Santos',
    role: 'CTO & Co-Founder',
    bio: 'Ex-Meta infrastructure engineer. Building scalable learning platforms.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    name: 'James Wilson',
    role: 'VP of Education',
    bio: '20+ years in edtech. Designed curriculum for Fortune 500 companies.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    social: { twitter: '#', linkedin: '#' },
  },
  {
    name: 'Priya Patel',
    role: 'Head of Community',
    bio: 'Community builder and former coding bootcamp instructor.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    social: { twitter: '#', linkedin: '#' },
  },
];

const milestones: AboutTimelineItem[] = [
  { year: '2020', title: 'Founded', description: 'Started with a mission to make quality tech education accessible' },
  {
    year: '2021',
    title: 'First 1,000 Students',
    description: 'Launched our first 10 courses with incredible community response',
  },
  { year: '2022', title: 'Series A Funding', description: 'Raised $10M to expand course catalog and improve platform' },
  { year: '2023', title: '50,000 Learners', description: 'Reached major milestone with learners from 120+ countries' },
  {
    year: '2024',
    title: 'AI Assistant Launch',
    description: 'Introduced personalized AI learning companion for all students',
  },
];

export function AboutPage() {
  return (
    <>
      <SEO
        title="About Us"
        description="Learn about NextEra's mission, vision, and the team behind our learning platform."
        canonical="/about"
      />
      <StructuredData
        schemas={[
          webPageSchema({
            name: 'About Us',
            description: "Learn about NextEra's mission, vision, and the team behind our learning platform.",
            path: '/about',
          }),
          breadcrumbListSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ]}
      />
      <div className="min-h-screen overflow-x-clip">
        {/* Hero */}
        <Section size="sm" id="hero" className="relative overflow-hidden">
          <PageBackground variant="hero" className="absolute inset-0" />
          <Container>
            <div className="relative z-10 mx-auto max-w-5xl">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                    Our Story
                  </span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mt-6 text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
                >
                  Empowering Learners <span className="text-primary">Worldwide</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mt-6 max-w-2xl text-body-lg text-muted-foreground text-balance"
                >
                  Founded in 2020, NextEra was born from a simple belief: everyone deserves access to high-quality,
                  practical education that transforms careers and lives.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  <Button asChild size="lg" className="rounded-full px-7">
                    <Link to={ROUTES.COURSES}>Explore Courses</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-7">
                    <Link to={ROUTES.INSTRUCTOR_APPLY}>Become an Instructor</Link>
                  </Button>
                </motion.div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Mission */}
        <Section size="sm" id="mission" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <span className="text-sm font-medium uppercase tracking-wider text-primary">Our Mission</span>
                  <h2 className="text-heading-lg font-semibold text-foreground">
                    Making Quality Education Accessible to Everyone
                  </h2>
                  <div className="space-y-4 text-body text-muted-foreground">
                    <p>
                      Traditional education is expensive, rigid, and often outdated. We saw millions of talented people
                      unable to access the skills they needed to thrive in the digital economy.
                    </p>
                    <p>
                      NextEra bridges this gap by partnering with industry experts to create practical, up-to-date courses
                      that teach real-world skills—at a fraction of the cost of traditional education.
                    </p>
                    <p>
                      But we're more than just courses. We're a global community of learners, mentors, and industry
                      professionals supporting each other's growth every step of the way.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/30 p-10 backdrop-blur-md">
                    <div
                      className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60"
                      aria-hidden="true"
                    />
                    <div className="relative flex min-h-[180px] flex-col items-center justify-center text-center">
                      <Rocket className="h-16 w-16 text-primary/50" aria-hidden="true" />
                      <h3 className="mt-4 text-heading-md font-semibold text-foreground">NextEra Learning Platform</h3>
                      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                        Hands-on courses, live classes, and AI-assisted learning in one place.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Award className="h-6 w-6 text-primary" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">4.9/5</p>
                          <p className="text-sm text-muted-foreground">Student Satisfaction</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-card/30 p-5 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10">
                          <Users className="h-6 w-6 text-success" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">95%</p>
                          <p className="text-sm text-muted-foreground">Completion Rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </Container>
        </Section>

        {/* Journey — Timeline */}
        <Section size="sm" id="journey" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-14 max-w-3xl">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-heading-lg font-semibold text-foreground"
                >
                  Our Journey
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 text-body-lg text-muted-foreground"
                >
                  From a small team with a big vision to a global learning platform
                </motion.p>
              </div>

              <AboutTimeline items={milestones} />
            </div>
          </Container>
        </Section>

        {/* Stats */}
        <Section size="sm" id="impact" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto max-w-5xl">
              <StatsBar stats={stats} />
            </div>
          </Container>
        </Section>

        {/* Values */}
        <Section size="sm" id="values" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-heading-lg font-semibold text-foreground"
              >
                Our Core Values
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-body-lg text-muted-foreground"
              >
                These principles guide every decision we make and every course we create.
              </motion.p>
            </div>
            <div className="mx-auto max-w-5xl">
              <FeatureGrid features={values} />
            </div>
          </Container>
        </Section>

        {/* Team */}
        <Section size="sm" id="team" className="pt-0 sm:pt-0 lg:pt-0">
          <Container>
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-heading-lg font-semibold text-foreground"
              >
                Meet Our Team
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mt-4 text-body-lg text-muted-foreground"
              >
                A diverse group of educators, engineers, and community builders
              </motion.p>
            </div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
              className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-4"
            >
              {team.map((member) => (
                <TeamMember
                  key={member.name}
                  name={member.name}
                  role={member.role}
                  bio={member.bio}
                  avatar={member.avatar}
                  twitter={member.social.twitter === '#' ? undefined : member.social.twitter}
                  linkedin={member.social.linkedin === '#' ? undefined : member.social.linkedin}
                />
              ))}
            </motion.div>
          </Container>
        </Section>

        {/* CTA */}
        <CTASection
          title="Join Us in Transforming Education"
          description="Whether you're looking to learn, teach, or partner with us, we'd love to hear from you."
          primaryAction={{ label: 'Start Learning Free', href: '/auth/register' }}
          secondaryAction={{ label: 'Become an Instructor', href: '/instructor/apply' }}
          background="gradient"
        />
      </div>
    </>
  );
}