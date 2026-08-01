import { motion } from 'framer-motion';
import { SEO } from '@/components/seo/SEO';
import { StructuredData } from '@/components/seo/StructuredData';
import { organizationSchema, webPageSchema, breadcrumbListSchema } from '@/lib/schema';
import { Section, Container } from '@/components/common/Section';
import { FeatureGrid } from '../components/FeatureGrid';
import { StatsBar } from '../components/StatsBar';
import { CTASection } from '../components/CTASection';
import { TeamMember } from '../components/TeamMember';
import { Users, Target, Lightbulb, Heart, Globe, Shield, Award, BookOpen, Code, Rocket } from 'lucide-react';

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

const milestones = [
  { year: '2020', title: 'Founded', description: 'Started with a mission to make quality tech education accessible' },
  { year: '2021', title: 'First 1,000 Students', description: 'Launched our first 10 courses with incredible community response' },
  { year: '2022', title: 'Series A Funding', description: 'Raised $10M to expand course catalog and improve platform' },
  { year: '2023', title: '50,000 Learners', description: 'Reached major milestone with learners from 120+ countries' },
  { year: '2024', title: 'AI Assistant Launch', description: 'Introduced personalized AI learning companion for all students' },
];

export function AboutPage() {
  return (
    <>
      <SEO title="About Us" description="Learn about NextEra's mission, vision, and the team behind our learning platform." canonical="/about" />
      <StructuredData schemas={[
        webPageSchema({ name: 'About Us', description: 'Learn about NextEra\'s mission, vision, and the team behind our learning platform.', path: '/about' }),
        breadcrumbListSchema([
          { name: 'Home', path: '/' },
          { name: 'About', path: '/about' },
        ]),
      ]} />
      <div className="min-h-screen">
      {/* Hero */}
      <Section size="xl" background="gradient" id="hero">
        <Container>
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                Our Story
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-display-xl font-display font-bold tracking-tight text-foreground text-balance"
            >
              Empowering Learners{' '}
              <span className="text-primary">Worldwide</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-body-lg text-muted-foreground max-w-2xl mx-auto text-balance"
            >
              Founded in 2020, NextEra was born from a simple belief: everyone deserves 
              access to high-quality, practical education that transforms careers and lives.
            </motion.p>
          </div>
        </Container>
      </Section>

      {/* Mission */}
      <Section size="lg" id="mission">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Our Mission</span>
              <h2 className="text-heading-lg font-semibold text-foreground">
                Making Quality Education Accessible to Everyone
              </h2>
              <div className="space-y-4 text-body text-muted-foreground">
                <p>
                  Traditional education is expensive, rigid, and often outdated. We saw millions of 
                  talented people unable to access the skills they needed to thrive in the digital economy.
                </p>
                <p>
                  NextEra bridges this gap by partnering with industry experts to create practical, 
                  up-to-date courses that teach real-world skills—at a fraction of the cost of traditional education.
                </p>
                <p>
                  But we're more than just courses. We're a global community of learners, mentors, 
                  and industry professionals supporting each other's growth every step of the way.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center p-8">
                    <Rocket className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                    <h3 className="text-heading-md font-semibold mb-2">Platform Preview</h3>
                    <p className="text-muted-foreground">Interactive learning experience coming soon</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 sm:-bottom-8 sm:-right-8 p-6 rounded-2xl bg-card border shadow-xl max-w-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">4.9/5</p>
                    <p className="text-sm text-muted-foreground">Student Satisfaction</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold">95%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Values */}
      <Section size="lg" background="muted" id="values">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
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
          <FeatureGrid features={values} />
        </Container>
      </Section>

      {/* Stats */}
      <Section size="lg" id="impact">
        <Container>
          <StatsBar stats={stats} />
        </Container>
      </Section>

      {/* Journey */}
      <Section size="lg" id="journey">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
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

          <div className="relative">
            <motion.div
              className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            />
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.year}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={index % 2 === 0 ? 'flex' : 'flex flex-row-reverse'}
                >
                  <div className={index % 2 === 0 ? 'flex-1 max-w-md pr-8' : 'flex-1 max-w-md pl-8'}>
                    <div className={index % 2 === 0 ? 'flex justify-end' : ''}>
                      <span className="absolute top-1/2 -translate-y-1/2 right-[-8px] w-4 h-4 rounded-full bg-primary border-4 border-background z-10" />
                      <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg ${index % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                        {milestone.year}
                      </span>
                    </div>
                    <div className={`mt-4 p-6 rounded-2xl bg-card border ${index % 2 === 0 ? 'mr-4' : 'ml-4'}`}>
                      <h3 className="font-semibold text-foreground">{milestone.title}</h3>
                      <p className="mt-2 text-muted-foreground">{milestone.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Team */}
      <Section size="lg" background="muted" id="team">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
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
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
          >
            {team.map((member, index) => (
              <TeamMember key={member.name} {...member} />
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