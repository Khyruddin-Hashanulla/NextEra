import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { categoryApi } from '@/api/endpoints/category';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { QUERY_KEYS } from '@/lib/constants';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

interface FormState {
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  prerequisites: string;
  benefits: string;
  tags: string;
  whatYouWillLearn: string;
}

const initialForm: FormState = {
  title: '',
  shortDescription: '',
  description: '',
  price: 0,
  category: '',
  level: 'beginner',
  language: 'English',
  prerequisites: '',
  benefits: '',
  tags: '',
  whatYouWillLearn: '',
};

function deriveSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: categories, isLoading: catsLoading, isError: catsError, refetch: refetchCategories } = useQuery({
    queryKey: QUERY_KEYS.categories.list(),
    queryFn: ({ signal }) => categoryApi.listCategories(signal).then((r) => r.data.data),
  });

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 5) next.title = 'Title must be at least 5 characters';
    if (categories?.length && !form.category) next.category = 'Please select a category';
    if (form.shortDescription.length > 300) next.shortDescription = 'Short description cannot exceed 300 characters';
    if (Number.isNaN(form.price) || form.price < 0) next.price = 'Price must be 0 or more';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => instructorApi.createCourse({
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      price: form.price,
      category: form.category || undefined,
      level: form.level,
      language: form.language.trim() || 'English',
      prerequisites: form.prerequisites.trim(),
      benefits: form.benefits.trim(),
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      whatYouWillLearn: form.whatYouWillLearn.split('\n').map((l: string) => l.trim()).filter(Boolean),
    }),
    onSuccess: (res) => {
      addToast({ title: 'Draft saved', variant: 'success' });
      navigate(`/instructor/courses/${res.data.data._id}/edit`);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || 'Failed to create course';
      addToast({ title: message, variant: 'error' });
    },
  });

  const handleSubmit = () => {
    if (!validate()) return;
    mutation.mutate();
  };

  const slugPreview = deriveSlug(form.title);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-3xl space-y-6">
      <motion.div variants={item} className="flex items-center gap-4">
        <Link to="/instructor/courses" className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Course</h1>
          <p className="mt-1 text-muted-foreground">Fill in the details to create your course draft</p>
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
              <Input
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. Master React Development"
                aria-invalid={!!errors.title}
              />
              {form.title && (
                <p className="text-xs text-muted-foreground">Slug: {slugPreview || '-'}</p>
              )}
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Category *</label>
                {catsLoading ? (
                  <Skeleton className="h-10 w-full rounded-lg" />
                ) : catsError ? (
                  <div className="flex h-10 items-center justify-between rounded-lg border border-destructive/40 bg-destructive/5 px-3 text-sm text-destructive">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Could not load categories
                    </span>
                    <button type="button" onClick={() => refetchCategories()} className="flex items-center gap-1 text-xs font-medium underline underline-offset-2">
                      <RefreshCw className="h-3 w-3" /> Retry
                    </button>
                  </div>
                ) : !categories?.length ? (
                  <div className="flex h-10 items-center rounded-lg border border-dashed px-3 text-sm text-muted-foreground">
                    No categories available yet. Contact an admin to create categories.
                  </div>
                ) : (
                  <>
                    <select
                      value={form.category}
                      onChange={(e) => setField('category', e.target.value)}
                      aria-invalid={!!errors.category}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select category</option>
                      {(categories || []).map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                  </>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Level</label>
                <select value={form.level} onChange={(e) => setField('level', e.target.value as FormState['level'])}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="all">All Levels</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Price (₹)</label>
                <Input type="number" value={form.price} onChange={(e) => setField('price', Number(e.target.value))} min={0} aria-invalid={!!errors.price} />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Language</label>
                <Input value={form.language} onChange={(e) => setField('language', e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Short Description</label>
              <Input value={form.shortDescription} onChange={(e) => setField('shortDescription', e.target.value)} placeholder="Brief description (max 300 chars)" maxLength={300} aria-invalid={!!errors.shortDescription} />
              <p className="text-xs text-muted-foreground">{form.shortDescription.length}/300</p>
              {errors.shortDescription && <p className="text-sm text-destructive">{errors.shortDescription}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Description</label>
              <Textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={5} placeholder="Detailed course description" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Prerequisites</label>
              <Textarea value={form.prerequisites} onChange={(e) => setField('prerequisites', e.target.value)} placeholder="What students should know before taking this course" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Benefits (what students will gain)</label>
              <Textarea value={form.benefits} onChange={(e) => setField('benefits', e.target.value)} placeholder="What will students gain from this course?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What You Will Learn (one per line)</label>
              <Textarea value={form.whatYouWillLearn} onChange={(e) => setField('whatYouWillLearn', e.target.value)} rows={4} placeholder={'Build real-world applications\nMaster React hooks\nDeploy to production'} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tags (comma-separated)</label>
              <Input value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="react, javascript, frontend" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item} className="flex justify-end gap-3">
        <Button variant="outline" asChild>
          <Link to="/instructor/courses">Cancel</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={!form.title.trim() || mutation.isPending} loading={mutation.isPending} icon={<Save className="h-4 w-4" />}>
          Save Draft
        </Button>
      </motion.div>
    </motion.div>
  );
}
