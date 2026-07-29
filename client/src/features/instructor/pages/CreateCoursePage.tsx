import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => adminApi.listCategories().then((r) => r.data.data),
  });

  const [form, setForm] = useState({
    title: '', shortDescription: '', description: '', price: 0,
    category: '', level: 'beginner' as const, language: 'English',
    prerequisites: '', benefits: '', tags: '', whatYouWillLearn: '',
  });

  const mutation = useMutation({
    mutationFn: () => instructorApi.createCourse({
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      price: form.price,
      category: form.category,
      level: form.level,
      language: form.language,
      prerequisites: form.prerequisites,
      benefits: form.benefits,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      whatYouWillLearn: form.whatYouWillLearn.split('\n').map((l: string) => l.trim()).filter(Boolean),
    }),
    onSuccess: (res) => {
      addToast({ title: 'Course created', variant: 'success' });
      navigate(`/instructor/courses/${res.data.data._id}/edit`);
    },
    onError: () => addToast({ title: 'Failed to create', variant: 'error' }),
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-6">
      <motion.div variants={item} className="flex items-center gap-4">
        <Link to="/instructor/courses" className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
          <p className="mt-1 text-muted-foreground">Fill in the details to create your course</p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Course Title *</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Master React Development" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="">Select category</option>
                  {(categories || []).map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Level</label>
                <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Price (₹)</label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Language</label>
                <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Short Description</label>
              <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Brief description (max 200 chars)" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Description</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Detailed course description" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prerequisites</label>
              <Textarea value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="What students should know before taking this course" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Benefits (what students will gain)</label>
              <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="What will students gain from this course?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What You Will Learn (one per line)</label>
              <Textarea value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} rows={4} placeholder="Build real-world applications&#10;Master React hooks&#10;Deploy to production" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, javascript, frontend" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link to="/instructor/courses">Cancel</Link>
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending} loading={mutation.isPending} icon={<Save className="h-4 w-4" />}>
          Create Course
        </Button>
      </motion.div>
    </motion.div>
  );
}
