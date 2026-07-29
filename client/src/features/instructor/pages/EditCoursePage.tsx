import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { motion } from 'framer-motion';
import {
  Loader2, Plus, Trash2, ChevronDown, ChevronUp, FileVideo, FileText, FileCheck,
  Edit3, Globe, Lock, Play, HelpCircle, ArrowLeft,
} from 'lucide-react';

const typeIcons: Record<string, any> = {
  video: FileVideo, article: FileText, assignment: FileCheck, quiz: HelpCircle,
};

export function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [deleteLectureId, setDeleteLectureId] = useState<string | null>(null);
  const [editingLecture, setEditingLecture] = useState<{ sectionId: string; lecture: any } | null>(null);

  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ['instructor', 'course', id],
    queryFn: () => instructorApi.getCourse(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: curriculum, isLoading: curriculumLoading } = useQuery({
    queryKey: ['instructor', 'curriculum', id],
    queryFn: () => instructorApi.getCurriculum(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => instructorApi.updateCourse(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course updated', variant: 'success' });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => instructorApi.submitForReview(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Submitted for review', variant: 'success' });
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => instructorApi.publish(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course published', variant: 'success' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => instructorApi.archive(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'course', id] });
      addToast({ title: 'Course archived', variant: 'success' });
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) => instructorApi.createSection(id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'curriculum', id] });
      addToast({ title: 'Section added', variant: 'success' });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: string) => instructorApi.deleteSection(id || '', sectionId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor', 'curriculum', id] }); addToast({ title: 'Section deleted', variant: 'success' }); setDeleteSectionId(null); },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: (lectureId: string) => instructorApi.deleteLecture(id!, lectureId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['instructor', 'curriculum', id] }); addToast({ title: 'Lecture deleted', variant: 'success' }); setDeleteLectureId(null); },
  });

  const saveLectureMutation = useMutation({
    mutationFn: ({ lectureId, data }: { lectureId?: string; data: any }) =>
      lectureId ? instructorApi.updateLecture(id || '', lectureId, data) : instructorApi.createLecture(id || '', editingLecture!.sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor', 'curriculum', id] });
      addToast({ title: 'Lecture saved', variant: 'success' });
      setEditingLecture(null);
    },
  });

  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => { const n = new Set(prev); n.has(sectionId) ? n.delete(sectionId) : n.add(sectionId); return n; });
  };

  const [courseForm, setCourseForm] = useState<any>(null);
  if (course && !courseForm) {
    setCourseForm({
      ...course,
      pricing: course.pricing || { originalPrice: 0, discountPercent: 0, hasDiscount: false, gstPercent: 0, gstInclusive: true },
      certificateSettings: course.certificateSettings || { enabled: true, template: 'default', issueAutomatically: true, passingCriteria: 'completion', minimumQuizScore: 60 },
      meta: course.meta || { seoTitle: '', seoDescription: '', seoKeywords: [] },
    });
  }

  if (courseLoading || curriculumLoading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const statusBadge = (s: string | undefined) => {
    const colors: Record<string, string> = { draft: 'bg-muted text-muted-foreground', review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', archived: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(s && colors[s]) || ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/instructor/courses" className="flex h-9 w-9 items-center justify-center rounded-lg border text-muted-foreground transition-colors hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{course?.title || 'Edit Course'}</h1>
              {statusBadge(course?.status)}
              {course?.visibility === 'public' ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {course?.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={() => submitMutation.mutate()} loading={submitMutation.isPending}>Submit for Review</Button>
              <Button size="sm" onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}><Play className="mr-1 h-4 w-4" /> Publish</Button>
            </>
          )}
          {course?.status === 'review' && <Button variant="outline" size="sm" disabled>Pending Review</Button>}
          {course?.status === 'published' && <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()}>Archive</Button>}
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Course Curriculum</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(curriculum || []).map((section: any) => (
                <div key={section._id} className="rounded-xl border">
                  <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
                    <button onClick={() => toggleSection(section._id)} className="flex items-center gap-2 font-medium">
                      {expandedSections.has(section._id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span>{section.title}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{section.lectures?.length || 0} lectures</span>
                      {section.totalDuration > 0 && <span className="text-xs text-muted-foreground">{Math.round(section.totalDuration / 60)}m</span>}
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteSectionId(section._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  {expandedSections.has(section._id) && (
                    <div className="divide-y px-4 py-2">
                      {(section.lectures || []).map((lecture: any) => {
                        const Icon = typeIcons[lecture.type] || FileVideo;
                        return (
                          <div key={lecture._id} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <button onClick={() => setEditingLecture({ sectionId: section._id, lecture: { ...lecture } })} className="text-sm hover:text-primary truncate text-left">
                                {lecture.title}
                              </button>
                              {lecture.isFree && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Free</span>}
                              {lecture.duration > 0 && <span className="text-xs text-muted-foreground shrink-0">{Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}</span>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => setEditingLecture({ sectionId: section._id, lecture: { ...lecture } })}><Edit3 className="h-3 w-3" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteLectureId(lecture._id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => setEditingLecture({ sectionId: section._id, lecture: { title: '', type: 'video', duration: 0, description: '', isFree: false, videoSource: { source: 'none', url: '', videoId: '' }, articleContent: '', quiz: { timeLimit: 0, passingScore: 60, maxAttempts: 3, showResults: true, randomizeQuestions: false, questions: [] }, assignment: { question: '', instructions: '', totalMarks: 100, passingMarks: 60 }, seoTitle: '', seoDescription: '', resources: [], attachments: [], notes: '', sourceCode: null, practiceFiles: [] } })} className="mt-2 text-sm font-medium text-primary hover:underline">+ Add lecture</button>
                    </div>
                  )}
                </div>
              ))}

              <div className="rounded-xl border p-4">
                <h3 className="text-sm font-medium mb-3">Add New Section</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section title" className="sm:max-w-xs" />
                  <Input value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} placeholder="Description (optional)" className="sm:max-w-sm" />
                  <Button onClick={() => { if (sectionTitle.trim()) { createSectionMutation.mutate({ title: sectionTitle, description: sectionDescription }); setSectionTitle(''); setSectionDescription(''); } }}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle className="text-lg">Course Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title *</label>
                    <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input value={courseForm.category?.name || courseForm.category || ''} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Level</label>
                      <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="all">All Levels</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Language</label>
                      <Input value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Badge</label>
                      <Input value={courseForm.badge || ''} onChange={(e) => setCourseForm({ ...courseForm, badge: e.target.value })} placeholder="e.g. Bestseller" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Short Description</label>
                    <Textarea value={courseForm.shortDescription || ''} onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Description</label>
                    <Textarea value={courseForm.description || ''} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={6} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Welcome Message</label>
                    <Textarea value={courseForm.welcomeMessage || ''} onChange={(e) => setCourseForm({ ...courseForm, welcomeMessage: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Congratulation Message</label>
                    <Textarea value={courseForm.congratulationMessage || ''} onChange={(e) => setCourseForm({ ...courseForm, congratulationMessage: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Prerequisites</label>
                    <Textarea value={courseForm.prerequisites || ''} onChange={(e) => setCourseForm({ ...courseForm, prerequisites: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Benefits</label>
                    <Textarea value={courseForm.benefits || ''} onChange={(e) => setCourseForm({ ...courseForm, benefits: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">What You Will Learn (one per line)</label>
                    <Textarea value={Array.isArray(courseForm.whatYouWillLearn) ? courseForm.whatYouWillLearn.join('\n') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, whatYouWillLearn: e.target.value.split('\n').filter(Boolean) })} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags (comma-separated)</label>
                    <Input value={Array.isArray(courseForm.tags) ? courseForm.tags.join(', ') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} />
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} loading={updateMutation.isPending}>Save Changes</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
            <CardContent className="max-w-lg space-y-4">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course Type</label>
                    <select value={courseForm.courseType} onChange={(e) => setCourseForm({ ...courseForm, courseType: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="draft">Draft</option>
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Visibility</label>
                    <select value={courseForm.visibility} onChange={(e) => setCourseForm({ ...courseForm, visibility: e.target.value })}
                      className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                      <option value="public">Public</option>
                      <option value="private">Private (invite only)</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price (₹)</label>
                      <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} min={0} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Original Price (for discount)</label>
                      <Input type="number" value={courseForm.pricing?.originalPrice || 0}
                        onChange={(e) => setCourseForm({ ...courseForm, pricing: { ...courseForm.pricing, originalPrice: Number(e.target.value), hasDiscount: Number(e.target.value) > courseForm.price } })} min={0} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">GST Percent</label>
                      <Input type="number" value={courseForm.pricing?.gstPercent || 0}
                        onChange={(e) => setCourseForm({ ...courseForm, pricing: { ...courseForm.pricing, gstPercent: Number(e.target.value) } })} min={0} max={100} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Certificate</label>
                      <select value={courseForm.certificateSettings?.enabled ? 'yes' : 'no'}
                        onChange={(e) => setCourseForm({ ...courseForm, certificateSettings: { ...courseForm.certificateSettings, enabled: e.target.value === 'yes' } })}
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                        <option value="yes">Certificate on completion</option>
                        <option value="no">No certificate</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} loading={updateMutation.isPending}>Save Pricing</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle className="text-lg">SEO Settings</CardTitle></CardHeader>
            <CardContent className="max-w-lg space-y-4">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SEO Title</label>
                    <Input value={courseForm.meta?.seoTitle || ''} onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoTitle: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SEO Description</label>
                    <Textarea value={courseForm.meta?.seoDescription || ''} onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoDescription: e.target.value } })} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">SEO Keywords (comma-separated)</label>
                    <Input value={Array.isArray(courseForm.meta?.seoKeywords) ? courseForm.meta.seoKeywords.join(', ') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoKeywords: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) } })} />
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} loading={updateMutation.isPending}>Save SEO</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lecture Editor Modal */}
      {editingLecture && (
        <LectureEditor
          lecture={editingLecture.lecture}
          onSave={(data) => saveLectureMutation.mutate({ lectureId: editingLecture.lecture._id, data })}
          onClose={() => setEditingLecture(null)}
          isSaving={saveLectureMutation.isPending}
        />
      )}

      {deleteSectionId && <ConfirmDialog open onClose={() => setDeleteSectionId(null)} onConfirm={() => deleteSectionMutation.mutate(deleteSectionId)} title="Delete Section" description="This will delete the section and all its lectures." loading={deleteSectionMutation.isPending} />}
      {deleteLectureId && <ConfirmDialog open onClose={() => setDeleteLectureId(null)} onConfirm={() => deleteLectureMutation.mutate(deleteLectureId)} title="Delete Lecture" description="Are you sure?" loading={deleteLectureMutation.isPending} />}
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, description, loading }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; loading?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

function LectureEditor({ lecture, onSave, onClose, isSaving }: { lecture: any; onSave: (data: any) => void; onClose: () => void; isSaving: boolean }) {
  const [form, setForm] = useState<any>(lecture);
  const videoSources = [
    { value: 'none', label: 'No Video' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'vimeo', label: 'Vimeo' },
    { value: 'bunny', label: 'Bunny CDN' },
    { value: 's3', label: 'AWS S3' },
    { value: 'direct', label: 'Direct Upload' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10 pb-10">
      <div className="w-full max-w-3xl rounded-xl border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{lecture._id ? 'Edit Lecture' : 'Add Lecture'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title *</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lecture title" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} min={0} />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree} onChange={(e) => setForm({ ...form, isFree: e.target.checked })} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Free preview</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>

          {form.type === 'video' && (
            <div className="space-y-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Video Source</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <select value={form.videoSource?.source || 'none'}
                    onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, source: e.target.value } })}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                    {videoSources.map((vs) => <option key={vs.value} value={vs.value}>{vs.label}</option>)}
                  </select>
                </div>
                {(form.videoSource?.source === 'youtube' || form.videoSource?.source === 'vimeo') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video ID</label>
                    <Input value={form.videoSource?.videoId || ''}
                      onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, videoId: e.target.value } })}
                      placeholder={form.videoSource?.source === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'e.g. 123456789'} />
                  </div>
                )}
                {(form.videoSource?.source === 'direct' || form.videoSource?.source === 'bunny') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Video URL</label>
                    <Input value={form.videoSource?.url || ''}
                      onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, url: e.target.value } })} />
                  </div>
                )}
                {form.videoSource?.source === 's3' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">S3 Object Key</label>
                    <Input value={form.videoSource?.videoId || ''}
                      onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, videoId: e.target.value } })} />
                  </div>
                )}
              </div>
              {form.videoSource?.source !== 'none' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Thumbnail URL</label>
                    <Input value={form.videoSource?.thumbnailUrl || ''}
                      onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, thumbnailUrl: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Playback Rate</label>
                    <Input type="number" step="0.25" value={form.videoSource?.playbackRate || 1}
                      onChange={(e) => setForm({ ...form, videoSource: { ...form.videoSource, playbackRate: Number(e.target.value) } })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {form.type === 'article' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Article Content</label>
              <Textarea value={form.articleContent} onChange={(e) => setForm({ ...form, articleContent: e.target.value })} rows={10} />
            </div>
          )}

          {form.type === 'quiz' && (
            <div className="space-y-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Quiz Settings</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Limit (min)</label>
                  <Input type="number" value={form.quiz?.timeLimit || 0} onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, timeLimit: Number(e.target.value) } })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passing Score %</label>
                  <Input type="number" value={form.quiz?.passingScore || 60} onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, passingScore: Number(e.target.value) } })} min={0} max={100} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Attempts</label>
                  <Input type="number" value={form.quiz?.maxAttempts || 3} onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, maxAttempts: Number(e.target.value) } })} min={1} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.quiz?.showResults ?? true} onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, showResults: e.target.checked } })} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm font-medium">Show results after submission</span>
              </label>
            </div>
          )}

          {form.type === 'assignment' && (
            <div className="space-y-4 rounded-xl border p-4">
              <h3 className="text-sm font-semibold">Assignment</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Question / Instructions</label>
                <Textarea value={form.assignment?.question || ''} onChange={(e) => setForm({ ...form, assignment: { ...form.assignment, question: e.target.value } })} rows={4} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total Marks</label>
                  <Input type="number" value={form.assignment?.totalMarks || 100} onChange={(e) => setForm({ ...form, assignment: { ...form.assignment, totalMarks: Number(e.target.value) } })} min={0} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passing Marks</label>
                  <Input type="number" value={form.assignment?.passingMarks || 60} onChange={(e) => setForm({ ...form, assignment: { ...form.assignment, passingMarks: Number(e.target.value) } })} min={0} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form)} loading={isSaving} disabled={!form.title}>
            {lecture._id ? 'Update Lecture' : 'Add Lecture'}
          </Button>
        </div>
      </div>
    </div>
  );
}
