import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { instructorApi } from '@/api/endpoints/instructor';
import { adminApi } from '@/api/endpoints/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/providers/ToastProvider';
import { Loader2 } from 'lucide-react';

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { data: categories } = useQuery({
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
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Course Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Master React Development" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select category</option>
                {(categories || []).map((cat: any) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value as any })}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Input value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Short Description</Label>
            <Input value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} placeholder="Brief description (max 200 chars)" />
          </div>

          <div className="space-y-2">
            <Label>Full Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Detailed course description" />
          </div>

          <div className="space-y-2">
            <Label>Prerequisites</Label>
            <Textarea value={form.prerequisites} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} placeholder="What students should know before taking this course" />
          </div>

          <div className="space-y-2">
            <Label>Benefits (what students will gain)</Label>
            <Textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="What will students gain from this course?" />
          </div>

          <div className="space-y-2">
            <Label>What You Will Learn (one per line)</Label>
            <Textarea value={form.whatYouWillLearn} onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value })} rows={4} placeholder="Build real-world applications&#10;Master React hooks&#10;Deploy to production" />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, javascript, frontend" />
          </div>

          <Button className="w-full" onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Course'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
