import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { categoryApi } from '@/api/endpoints/category';
import { QUERY_KEYS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { EditCourseSkeleton } from '@/components/skeletons/FormSkeleton';
import { CurriculumTab } from '@/features/instructor/components/course-editor/CurriculumTab';
import { LectureEditorDialog } from '@/features/instructor/components/course-editor/LectureEditorDialog';
import { ConfirmDialog } from '@/features/instructor/components/course-editor/ConfirmDialog';
import {
  buildCourseUpdatePayload,
  filterLectureData,
  getDefaultLectureData,
} from '@/features/instructor/components/course-editor/lectureData';
import { FileUploader } from '@/features/instructor/components/course-editor/FileUploader';
import { uploadApi } from '@/api/endpoints/upload';
import { Globe, Lock, Play, ArrowLeft, CheckCircle2, FileCheck2 } from 'lucide-react';

export function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const _navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [deleteLectureId, setDeleteLectureId] = useState<string | null>(null);
  const [editingLecture, setEditingLecture] = useState<{ sectionId: string; lecture: any } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveCount, setSaveCount] = useState(0);

  const blocker = useBlocker(useCallback(() => dirty, [dirty]));

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const curriculumQuery = useQuery({
    queryKey: ['instructor', 'curriculum', id],
    queryFn: ({ signal }) => instructorApi.getCurriculum(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });
  const curriculum = curriculumQuery.data || [];

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['instructor', 'course', id],
    queryFn: ({ signal }) => instructorApi.getCourse(id!, signal).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: QUERY_KEYS.categories.list(),
    queryFn: ({ signal }) => categoryApi.listCategories(signal).then((r) => r.data.data),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['instructor', 'curriculum', id] });

  // ─── Course-level mutations ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: any) => instructorApi.updateCourse(id!, buildCourseUpdatePayload(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      setSaveCount((c) => c + 1);
      addToast({ title: 'Course updated', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to update course', variant: 'error' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => instructorApi.submitForReview(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Submitted for review', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to submit for review', variant: 'error' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => instructorApi.publish(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course published', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to publish course', variant: 'error' });
    },
  });

  const finalizeContentMutation = useMutation({
    mutationFn: () => instructorApi.finalizeCourseContent(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course content finalized', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to finalize course content', variant: 'error' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => instructorApi.archive(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course archived', variant: 'success' });
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to archive course', variant: 'error' });
    },
  });

  // ─── Curriculum mutations ──────────────────────────────────────────
  const createSectionMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => instructorApi.createSection(id || '', data),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Section added', variant: 'success' });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, title }: { sectionId: string; title: string }) =>
      instructorApi.updateSection(id || '', sectionId, { title }),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Section renamed', variant: 'success' });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => instructorApi.deleteSection(id || '', sectionId),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Section deleted', variant: 'success' });
      setDeleteSectionId(null);
    },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: (lectureId: string) => instructorApi.deleteLecture(id!, lectureId),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Lecture deleted', variant: 'success' });
      setDeleteLectureId(null);
    },
  });

  const saveLectureMutation = useMutation({
    mutationFn: ({ lectureId, sectionId, data }: { lectureId?: string; sectionId?: string; data: any }) =>
      lectureId
        ? instructorApi.updateLecture(id || '', lectureId, data)
        : instructorApi.createLecture(id || '', sectionId!, data),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Lecture saved', variant: 'success' });
      setEditingLecture(null);
    },
    onError: (error: any) => {
      addToast({ title: error?.response?.data?.message || 'Failed to save lecture', variant: 'error' });
    },
  });

  const renameLectureMutation = useMutation({
    mutationFn: ({ lectureId, title }: { lectureId: string; title: string }) =>
      instructorApi.updateLecture(id || '', lectureId, { title }),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Lecture renamed', variant: 'success' });
    },
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: (sectionOrder: { sectionId: string; order: number }[]) =>
      instructorApi.reorderSections(id || '', sectionOrder),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Section order saved', variant: 'success' });
    },
    onError: () => {
      refresh();
      addToast({ title: 'Failed to reorder sections', variant: 'error' });
    },
  });

  const reorderLecturesMutation = useMutation({
    mutationFn: ({
      sectionId,
      lectureOrder,
    }: {
      sectionId: string;
      lectureOrder: { lectureId: string; order: number }[];
    }) => instructorApi.reorderLectures(id || '', sectionId, lectureOrder),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Lecture order saved', variant: 'success' });
    },
    onError: () => {
      refresh();
      addToast({ title: 'Failed to reorder lectures', variant: 'error' });
    },
  });

  const moveLectureMutation = useMutation({
    mutationFn: ({ lectureId, targetSectionId }: { lectureId: string; targetSectionId: string }) =>
      instructorApi.moveLecture(id || '', lectureId, targetSectionId),
    onSuccess: () => {
      refresh();
      addToast({ title: 'Lecture moved', variant: 'success' });
    },
    onError: (error: any) =>
      addToast({ title: error?.response?.data?.message || 'Failed to move lecture', variant: 'error' }),
  });

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleEditLecture = (sectionId: string, lecture: any) => {
    setEditingLecture({ sectionId, lecture: filterLectureData(lecture) });
  };

  const handleAddLecture = (sectionId: string) => {
    setEditingLecture({ sectionId, lecture: getDefaultLectureData('video') });
  };

  const handleSaveLecture = (data: any) => {
    if (!editingLecture) return;
    saveLectureMutation.mutate({
      lectureId: editingLecture.lecture._id,
      sectionId: editingLecture.sectionId,
      data,
    });
  };

  if (courseLoading) return <EditCourseSkeleton />;

  const statusBadge = (s: string | undefined) => {
    const colors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(s && colors[s]) || ''}`}>{s}</span>;
  };

  const contentStatusBadge = (s: string | undefined) => {
    const completed = s === 'COMPLETED';
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          completed
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}
      >
        {completed ? <CheckCircle2 className="h-3 w-3" /> : <FileCheck2 className="h-3 w-3" />}
        Content {completed ? 'Completed' : 'In Progress'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/instructor/courses"
            className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{course?.title || 'Edit Course'}</h1>
              {statusBadge(course?.status)}
              {contentStatusBadge(course?.contentStatus)}
              {course?.visibility === 'public' ? (
                <Globe className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {course?.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            >
              Submit for Review
            </Button>
          )}
          {course?.status === 'review' && (
            <Button variant="outline" size="sm" disabled>
              Pending Review
            </Button>
          )}
          {course?.status === 'approved' && (
            <Button size="sm" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
              <Play className="mr-1 h-4 w-4" /> Publish
            </Button>
          )}
          {course?.status === 'rejected' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => submitMutation.mutate()}
              loading={submitMutation.isPending}
            >
              Submit for Review
            </Button>
          )}
          {course?.status === 'published' && (
            <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()}>
              Archive
            </Button>
          )}
          {course?.contentStatus !== 'COMPLETED' &&
            ['review', 'approved', 'published'].includes(course?.status || '') && (
              <Button
                variant={course?.status === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => finalizeContentMutation.mutate()}
                loading={finalizeContentMutation.isPending}
              >
                <FileCheck2 className="mr-1 h-4 w-4" /> Mark Content Complete
              </Button>
            )}
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto sm:justify-center">
          <TabsTrigger value="content">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Curriculum</CardTitle>
            </CardHeader>
            <CardContent>
              <CurriculumTab
                curriculum={curriculum}
                onAddSection={(data) => createSectionMutation.mutate(data)}
                onRenameSection={(sectionId, title) => updateSectionMutation.mutate({ sectionId, title })}
                onDeleteSection={(sectionId) => setDeleteSectionId(sectionId)}
                onReorderSections={(order) => reorderSectionsMutation.mutate(order)}
                onEditLecture={handleEditLecture}
                onDeleteLecture={(lectureId) => setDeleteLectureId(lectureId)}
                onAddLecture={handleAddLecture}
                onReorderLectures={(sectionId, order) =>
                  reorderLecturesMutation.mutate({ sectionId, lectureOrder: order })
                }
                onRenameLecture={(lectureId, title) => renameLectureMutation.mutate({ lectureId, title })}
                onMoveLecture={(lectureId, targetSectionId) =>
                  moveLectureMutation.mutate({ lectureId, targetSectionId })
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course && (
                <CourseDetailsForm
                  course={course}
                  categories={categories || []}
                  catsLoading={!!catsLoading}
                  onSave={(form) => updateMutation.mutate(form)}
                  saving={updateMutation.isPending}
                  onDirtyChange={setDirty}
                  savedCount={saveCount}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="max-w-lg space-y-4">
              {course && (
                <PricingForm
                  course={course}
                  onSave={(form) => updateMutation.mutate(form)}
                  saving={updateMutation.isPending}
                  onDirtyChange={setDirty}
                  savedCount={saveCount}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="max-w-lg space-y-4">
              {course && (
                <SeoForm
                  course={course}
                  onSave={(form) => updateMutation.mutate(form)}
                  saving={updateMutation.isPending}
                  onDirtyChange={setDirty}
                  savedCount={saveCount}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {editingLecture && (
        <LectureEditorDialog
          lecture={editingLecture.lecture}
          onSave={handleSaveLecture}
          onClose={() => setEditingLecture(null)}
          isSaving={saveLectureMutation.isPending}
        />
      )}

      {deleteSectionId && (
        <ConfirmDialog
          open
          onClose={() => setDeleteSectionId(null)}
          onConfirm={() => deleteSectionMutation.mutate(deleteSectionId)}
          title="Delete Section"
          description="This will delete the section and all its lectures."
          loading={deleteSectionMutation.isPending}
        />
      )}
      {deleteLectureId && (
        <ConfirmDialog
          open
          onClose={() => setDeleteLectureId(null)}
          onConfirm={() => deleteLectureMutation.mutate(deleteLectureId)}
          title="Delete Lecture"
          description="Are you sure you want to delete this lecture?"
          loading={deleteLectureMutation.isPending}
        />
      )}

      {blocker.state === 'blocked' && (
        <ConfirmDialog
          open
          onClose={() => blocker.reset()}
          onConfirm={() => {
            setDirty(false);
            blocker.proceed();
          }}
          title="Unsaved changes"
          description="You have unsaved changes. Are you sure you want to leave? Changes will be lost."
          confirmLabel="Leave anyway"
        />
      )}
    </div>
  );
}

// ─── Course Details form ─────────────────────────────────────────────

function CourseDetailsForm({
  course,
  categories,
  catsLoading,
  onSave,
  saving,
  onDirtyChange,
  savedCount,
}: {
  course: any;
  categories: any[];
  catsLoading: boolean;
  onSave: (form: any) => void;
  saving: boolean;
  onDirtyChange: (dirty: boolean) => void;
  savedCount: number;
}) {
  const [form, setForm] = useState<any>(() => ({
    ...course,
    pricing: course.pricing || {
      originalPrice: 0,
      discountPercent: 0,
      hasDiscount: false,
      gstPercent: 0,
      gstInclusive: true,
    },
    certificateSettings: course.certificateSettings || {
      enabled: true,
      template: 'default',
      issueAutomatically: true,
      passingCriteria: 'completion',
      minimumQuizScore: 60,
    },
    meta: course.meta || { seoTitle: '', seoDescription: '', seoKeywords: [] },
  }));

  const snapshotRef = useRef(JSON.stringify(form));

  useEffect(() => {
    snapshotRef.current = JSON.stringify(form);
  }, [savedCount]);

  const dirty = JSON.stringify(form) !== snapshotRef.current;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="course-title" className="text-sm font-medium">
          Title *
        </label>
        <Input id="course-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Course Thumbnail</label>
        <FileUploader
          accept=".jpg,.jpeg,.png,.webp,.gif"
          maxSize={5 * 1024 * 1024}
          label="Upload course thumbnail"
          hint="Recommended 16:9, up to 5MB"
          value={
            form.thumbnail?.url
              ? { url: form.thumbnail.url, publicId: form.thumbnail.publicId, name: 'Course thumbnail' }
              : null
          }
          onChange={(file) =>
            setForm({
              ...form,
              thumbnail: file ? { url: file.url, publicId: file.publicId } : { url: '', publicId: '' },
            })
          }
          upload={uploadApi.image}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-category" className="text-sm font-medium">
            Category
          </label>
          {catsLoading ? (
            <Skeleton className="h-10 w-full rounded-lg" />
          ) : (
            <select
              id="course-category"
              value={typeof form.category === 'object' && form.category ? form.category._id : form.category || ''}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((cat: any) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="course-level" className="text-sm font-medium">
            Level
          </label>
          <select
            id="course-level"
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="all">All Levels</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-language" className="text-sm font-medium">
            Language
          </label>
          <Input
            id="course-language"
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="course-badge" className="text-sm font-medium">
            Badge
          </label>
          <Input
            id="course-badge"
            value={form.badge || ''}
            onChange={(e) => setForm({ ...form, badge: e.target.value })}
            placeholder="e.g. Bestseller"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="course-short-desc" className="text-sm font-medium">
          Short Description
        </label>
        <Textarea
          id="course-short-desc"
          value={form.shortDescription || ''}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-desc" className="text-sm font-medium">
          Full Description
        </label>
        <Textarea
          id="course-desc"
          value={form.description || ''}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={6}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-welcome" className="text-sm font-medium">
          Welcome Message
        </label>
        <Textarea
          id="course-welcome"
          value={form.welcomeMessage || ''}
          onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-congrats" className="text-sm font-medium">
          Congratulation Message
        </label>
        <Textarea
          id="course-congrats"
          value={form.congratulationMessage || ''}
          onChange={(e) => setForm({ ...form, congratulationMessage: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-prereq" className="text-sm font-medium">
          Prerequisites
        </label>
        <Textarea
          id="course-prereq"
          value={form.prerequisites || ''}
          onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-benefits" className="text-sm font-medium">
          Benefits
        </label>
        <Textarea
          id="course-benefits"
          value={form.benefits || ''}
          onChange={(e) => setForm({ ...form, benefits: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-wyl" className="text-sm font-medium">
          What You Will Learn (one per line)
        </label>
        <Textarea
          id="course-wyl"
          value={Array.isArray(form.whatYouWillLearn) ? form.whatYouWillLearn.join('\n') : ''}
          onChange={(e) => setForm({ ...form, whatYouWillLearn: e.target.value.split('\n').filter(Boolean) })}
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="course-tags" className="text-sm font-medium">
          Tags (comma-separated)
        </label>
        <Input
          id="course-tags"
          value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
          onChange={(e) =>
            setForm({
              ...form,
              tags: e.target.value
                .split(',')
                .map((t: string) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
      <Button onClick={() => onSave(form)} loading={saving}>
        Save Changes
      </Button>
    </div>
  );
}

// ─── Pricing form ────────────────────────────────────────────────────

function PricingForm({
  course,
  onSave,
  saving,
  onDirtyChange,
  savedCount,
}: {
  course: any;
  onSave: (form: any) => void;
  saving: boolean;
  onDirtyChange: (dirty: boolean) => void;
  savedCount: number;
}) {
  const [form, setForm] = useState<any>(() => ({
    ...course,
    pricing: course.pricing || {
      originalPrice: 0,
      discountPercent: 0,
      hasDiscount: false,
      gstPercent: 0,
      gstInclusive: true,
    },
    certificateSettings: course.certificateSettings || {
      enabled: true,
      template: 'default',
      issueAutomatically: true,
      passingCriteria: 'completion',
      minimumQuizScore: 60,
    },
    meta: course.meta || { seoTitle: '', seoDescription: '', seoKeywords: [] },
  }));

  const snapshotRef = useRef(JSON.stringify(form));

  useEffect(() => {
    snapshotRef.current = JSON.stringify(form);
  }, [savedCount]);

  const dirty = JSON.stringify(form) !== snapshotRef.current;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="course-type" className="text-sm font-medium">
          Course Type
        </label>
        <select
          id="course-type"
          value={form.courseType}
          onChange={(e) => setForm({ ...form, courseType: e.target.value })}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="private">Private</option>
        </select>
      </div>
      <div className="space-y-2">
        <label htmlFor="course-visibility" className="text-sm font-medium">
          Visibility
        </label>
        <select
          id="course-visibility"
          value={form.visibility}
          onChange={(e) => setForm({ ...form, visibility: e.target.value })}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="public">Public</option>
          <option value="private">Private (invite only)</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-price" className="text-sm font-medium">
            Price (₹)
          </label>
          <Input
            id="course-price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="course-orig-price" className="text-sm font-medium">
            Original Price (for discount)
          </label>
          <Input
            id="course-orig-price"
            type="number"
            value={form.pricing?.originalPrice || 0}
            onChange={(e) =>
              setForm({
                ...form,
                pricing: {
                  ...form.pricing,
                  originalPrice: Number(e.target.value),
                  hasDiscount: Number(e.target.value) > form.price,
                },
              })
            }
            min={0}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="course-gst" className="text-sm font-medium">
            GST Percent
          </label>
          <Input
            id="course-gst"
            type="number"
            value={form.pricing?.gstPercent || 0}
            onChange={(e) => setForm({ ...form, pricing: { ...form.pricing, gstPercent: Number(e.target.value) } })}
            min={0}
            max={100}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="course-cert" className="text-sm font-medium">
            Certificate
          </label>
          <select
            id="course-cert"
            value={form.certificateSettings?.enabled ? 'yes' : 'no'}
            onChange={(e) =>
              setForm({
                ...form,
                certificateSettings: { ...form.certificateSettings, enabled: e.target.value === 'yes' },
              })
            }
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="yes">Certificate on completion</option>
            <option value="no">No certificate</option>
          </select>
        </div>
      </div>
      <Button onClick={() => onSave(form)} loading={saving}>
        Save Pricing
      </Button>
    </div>
  );
}

// ─── SEO form ────────────────────────────────────────────────────────

function SeoForm({
  course,
  onSave,
  saving,
  onDirtyChange,
  savedCount,
}: {
  course: any;
  onSave: (form: any) => void;
  saving: boolean;
  onDirtyChange: (dirty: boolean) => void;
  savedCount: number;
}) {
  const [form, setForm] = useState<any>(() => ({
    ...course,
    pricing: course.pricing || {
      originalPrice: 0,
      discountPercent: 0,
      hasDiscount: false,
      gstPercent: 0,
      gstInclusive: true,
    },
    certificateSettings: course.certificateSettings || {
      enabled: true,
      template: 'default',
      issueAutomatically: true,
      passingCriteria: 'completion',
      minimumQuizScore: 60,
    },
    meta: course.meta || { seoTitle: '', seoDescription: '', seoKeywords: [] },
  }));

  const snapshotRef = useRef(JSON.stringify(form));

  useEffect(() => {
    snapshotRef.current = JSON.stringify(form);
  }, [savedCount]);

  const dirty = JSON.stringify(form) !== snapshotRef.current;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="seo-title" className="text-sm font-medium">
          SEO Title
        </label>
        <Input
          id="seo-title"
          value={form.meta?.seoTitle || ''}
          onChange={(e) => setForm({ ...form, meta: { ...form.meta, seoTitle: e.target.value } })}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="seo-desc" className="text-sm font-medium">
          SEO Description
        </label>
        <Textarea
          id="seo-desc"
          value={form.meta?.seoDescription || ''}
          onChange={(e) => setForm({ ...form, meta: { ...form.meta, seoDescription: e.target.value } })}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="seo-keywords" className="text-sm font-medium">
          SEO Keywords (comma-separated)
        </label>
        <Input
          id="seo-keywords"
          value={Array.isArray(form.meta?.seoKeywords) ? form.meta.seoKeywords.join(', ') : ''}
          onChange={(e) =>
            setForm({
              ...form,
              meta: {
                ...form.meta,
                seoKeywords: e.target.value
                  .split(',')
                  .map((t: string) => t.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </div>
      <Button onClick={() => onSave(form)} loading={saving}>
        Save SEO
      </Button>
    </div>
  );
}
