import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/providers/ToastProvider';
import { useCreateForumTopic } from '@/features/community/hooks/useCommunity';
import type { ForumCategory, ForumCategorySlug } from '@/types/community';

const createTopicSchema = z.object({
  category: z.string().min(1, 'Choose a category'),
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title is too long'),
  content: z.string().trim().min(3, 'Content must be at least 3 characters').max(5000, 'Content is too long'),
  tags: z.string().max(500, 'Too many tags'),
});

type CreateTopicForm = z.infer<typeof createTopicSchema>;

export function CreateTopicDialog({
  open,
  onOpenChange,
  categories,
  defaultCategory,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories?: ForumCategory[];
  defaultCategory?: ForumCategorySlug;
}) {
  const { addToast } = useToast();
  const createMutation = useCreateForumTopic();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTopicForm>({
    resolver: zodResolver(createTopicSchema),
    defaultValues: { category: defaultCategory ?? '', title: '', content: '', tags: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ category: defaultCategory ?? '', title: '', content: '', tags: '' });
    }
  }, [open, defaultCategory, reset]);

  const selectedCategory = watch('category');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync({
        category: values.category as ForumCategorySlug,
        title: values.title,
        content: values.content,
        tags: values.tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-'))
          .filter(Boolean)
          .slice(0, 8),
      });
      addToast({ title: 'Discussion published', description: 'Your question is now live in the community.', variant: 'success' });
      onOpenChange(false);
      reset();
    } catch {
      addToast({
        title: 'Could not publish',
        description: 'Something went wrong. Please try again.',
        variant: 'error',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Start a Discussion</DialogTitle>
          <DialogDescription>
            Ask a question, share an idea, or help others in the NextEra community.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="topic-category">Category</Label>
            <Select
              value={selectedCategory || undefined}
              onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
            >
              <SelectTrigger id="topic-category" aria-label="Category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p role="alert" className="text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              placeholder="What would you like to discuss?"
              {...register('title')}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <p role="alert" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-content">Description</Label>
            <Textarea
              id="topic-content"
              placeholder="Add some detail so others can help you…"
              rows={5}
              {...register('content')}
              aria-invalid={Boolean(errors.content)}
            />
            {errors.content && (
              <p role="alert" className="text-xs text-destructive">
                {errors.content.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic-tags">Tags (optional)</Label>
            <Input
              id="topic-tags"
              placeholder="e.g. react, mongodb, career"
              {...register('tags')}
              aria-invalid={Boolean(errors.tags)}
            />
            <p className="text-xs text-muted-foreground">Separate tags with commas. Up to 8 tags.</p>
            {errors.tags && (
              <p role="alert" className="text-xs text-destructive">
                {errors.tags.message}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!selectedCategory}>
              {isSubmitting ? 'Publishing…' : 'Publish Discussion'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}