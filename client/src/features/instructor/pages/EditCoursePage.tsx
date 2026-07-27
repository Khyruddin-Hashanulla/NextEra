import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { instructorApi } from '@/api/endpoints/instructor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/features/admin/components/ConfirmDialog';
import { useToast } from '@/providers/ToastProvider';
import {
  Loader2, Plus, Trash2, ChevronDown, ChevronUp, FileVideo, FileText, FileCheck,
  Edit3, GripVertical, Globe, Lock, Play, HelpCircle, Copy
} from 'lucide-react';

const typeIcons: Record<string, any> = {
  video: FileVideo, article: FileText, assignment: FileCheck, quiz: HelpCircle,
};

type LectureData = {
  _id?: string; title: string; type: string; duration: number; description: string;
  isFree: boolean; videoSource: any; videoUrl: any; articleContent: string;
  resources: any[]; attachments: any[]; sourceCode: any; practiceFiles: any[];
  notes: string; assignment: any; quiz: any; seoTitle: string; seoDescription: string;
};

const emptyLecture = (): LectureData => ({
  title: '', type: 'video', duration: 0, description: '', isFree: false,
  videoSource: { source: 'none', url: '', videoId: '', provider: '', thumbnailUrl: '', playbackRate: 1, qualities: [] },
  videoUrl: { url: '', publicId: '' }, articleContent: '', resources: [], attachments: [],
  sourceCode: { url: '', publicId: '', name: '', size: 0 }, practiceFiles: [], notes: '',
  assignment: { question: '', instructions: '', totalMarks: 100, passingMarks: 60, allowLateSubmission: false, lateSubmissionDays: 7, penaltyPercent: 10 },
  quiz: { timeLimit: 0, passingScore: 60, maxAttempts: 3, showResults: true, randomizeQuestions: false, questions: [] },
  seoTitle: '', seoDescription: '',
});

function updateQuizQuestion(form: LectureData, qi: number, updater: (q: any) => any) {
  const copy = [...(form.quiz?.questions || [])];
  copy[qi] = updater(copy[qi]);
  return { ...form, quiz: { ...form.quiz, questions: copy } };
}

function removeQuizQuestion(form: LectureData, qi: number) {
  const filtered = form.quiz?.questions?.filter((_: any, i: number) => i !== qi) || [];
  return { ...form, quiz: { ...form.quiz, questions: filtered } };
}

function addQuizOption(form: LectureData, qi: number) {
  const copy = [...(form.quiz?.questions || [])];
  copy[qi] = { ...copy[qi], options: [...copy[qi].options, ''] };
  return { ...form, quiz: { ...form.quiz, questions: copy } };
}

function removeQuizOption(form: LectureData, qi: number, oi: number) {
  const copy = [...(form.quiz?.questions || [])];
  copy[qi] = { ...copy[qi], options: copy[qi].options.filter((_: any, i: number) => i !== oi) };
  return { ...form, quiz: { ...form.quiz, questions: copy } };
}

export function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [deleteLectureId, setDeleteLectureId] = useState<string | null>(null);
  const [editingLecture, setEditingLecture] = useState<{ sectionId: string; lecture: LectureData } | null>(null);

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
    const colors: Record<string, string> = { draft: 'bg-gray-100 text-gray-700', review: 'bg-yellow-100 text-yellow-700', published: 'bg-green-100 text-green-700', archived: 'bg-red-100 text-red-700' };
    return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(s && colors[s]) || ''}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{course?.title || 'Edit Course'}</h1>
          {statusBadge(course?.status)}
          {course?.visibility === 'public' ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex gap-2">
          {course?.status === 'draft' && (
            <>
              <Button variant="outline" size="sm" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
                Submit for Review
              </Button>
              <Button size="sm" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
                <Play className="mr-1 h-4 w-4" /> Publish
              </Button>
            </>
          )}
          {course?.status === 'review' && (
            <Button variant="outline" size="sm" disabled>Pending Review</Button>
          )}
          {course?.status === 'published' && (
            <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()}>Archive</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/instructor/courses')}>Back</Button>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Curriculum</TabsTrigger>
          <TabsTrigger value="details">Course Details</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* ─── Curriculum Tab ─── */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Course Curriculum</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(curriculum || []).map((section: any) => (
                <div key={section._id} className="rounded-lg border">
                  <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
                    <button onClick={() => toggleSection(section._id)} className="flex items-center gap-2 font-medium">
                      {expandedSections.has(section._id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span>{section.title}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{section.lectures?.length || 0} lectures</Badge>
                      {section.totalDuration > 0 && <span className="text-xs text-muted-foreground">{Math.round(section.totalDuration / 60)}m</span>}
                    </button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteSectionId(section._id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  {expandedSections.has(section._id) && (
                    <div className="divide-y px-4 py-2">
                      {(section.lectures || []).map((lecture: any) => {
                        const Icon = typeIcons[lecture.type] || FileVideo;
                        return (
                          <div key={lecture._id} className="flex items-center justify-between py-2 group">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <button onClick={() => setEditingLecture({ sectionId: section._id, lecture: { ...lecture } })} className="text-sm hover:text-primary truncate text-left">
                                {lecture.title}
                              </button>
                              {lecture.isFree && <Badge variant="secondary" className="text-xs">Free</Badge>}
                              {lecture.duration > 0 && <span className="text-xs text-muted-foreground shrink-0">{Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}</span>}
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => setEditingLecture({ sectionId: section._id, lecture: { ...lecture } })}>
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteLectureId(lecture._id)}>
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <button onClick={() => setEditingLecture({ sectionId: section._id, lecture: emptyLecture() })} className="mt-2 text-sm text-primary hover:underline">
                        + Add lecture
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <div className="space-y-2 rounded-lg border p-4">
                <h3 className="text-sm font-medium">Add New Section</h3>
                <div className="flex gap-2">
                  <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section title" className="max-w-xs" />
                  <Input value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} placeholder="Description (optional)" className="max-w-sm" />
                  <Button onClick={() => { if (sectionTitle.trim()) { createSectionMutation.mutate({ title: sectionTitle, description: sectionDescription }); setSectionTitle(''); setSectionDescription(''); } }}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Course Details Tab ─── */}
        <TabsContent value="details">
          <Card>
            <CardHeader><CardTitle className="text-lg">Course Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Input value={courseForm.category?.name || courseForm.category || ''} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="all">All Levels</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Input value={courseForm.language} onChange={(e) => setCourseForm({ ...courseForm, language: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge</Label>
                      <Input value={courseForm.badge || ''} onChange={(e) => setCourseForm({ ...courseForm, badge: e.target.value })} placeholder="e.g. Bestseller, New" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea value={courseForm.shortDescription || ''} onChange={(e) => setCourseForm({ ...courseForm, shortDescription: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Full Description</Label>
                    <Textarea value={courseForm.description || ''} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} rows={6} />
                  </div>
                  <div className="space-y-2">
                    <Label>Welcome Message</Label>
                    <Textarea value={courseForm.welcomeMessage || ''} onChange={(e) => setCourseForm({ ...courseForm, welcomeMessage: e.target.value })} rows={2} placeholder="Message shown to students when they start the course" />
                  </div>
                  <div className="space-y-2">
                    <Label>Congratulation Message</Label>
                    <Textarea value={courseForm.congratulationMessage || ''} onChange={(e) => setCourseForm({ ...courseForm, congratulationMessage: e.target.value })} rows={2} placeholder="Message shown when students complete the course" />
                  </div>
                  <div className="space-y-2">
                    <Label>Prerequisites</Label>
                    <Textarea value={courseForm.prerequisites || ''} onChange={(e) => setCourseForm({ ...courseForm, prerequisites: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Benefits</Label>
                    <Textarea value={courseForm.benefits || ''} onChange={(e) => setCourseForm({ ...courseForm, benefits: e.target.value })} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>What You Will Learn (one per line)</Label>
                    <Textarea value={Array.isArray(courseForm.whatYouWillLearn) ? courseForm.whatYouWillLearn.join('\n') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, whatYouWillLearn: e.target.value.split('\n').filter(Boolean) })} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input value={Array.isArray(courseForm.tags) ? courseForm.tags.join(', ') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} />
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Pricing Tab ─── */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader><CardTitle className="text-lg">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <Label>Course Type</Label>
                    <select value={courseForm.courseType} onChange={(e) => setCourseForm({ ...courseForm, courseType: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="draft">Draft</option>
                      <option value="free">Free</option>
                      <option value="paid">Paid</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Visibility</Label>
                    <select value={courseForm.visibility} onChange={(e) => setCourseForm({ ...courseForm, visibility: e.target.value })}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="public">Public</option>
                      <option value="private">Private (invite only)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input type="number" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })} min={0} />
                    </div>
                    <div className="space-y-2">
                      <Label>Original Price (for discount)</Label>
                      <Input type="number" value={courseForm.pricing?.originalPrice || 0}
                        onChange={(e) => setCourseForm({ ...courseForm, pricing: { ...courseForm.pricing, originalPrice: Number(e.target.value), hasDiscount: Number(e.target.value) > courseForm.price } })} min={0} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GST Percent</Label>
                      <Input type="number" value={courseForm.pricing?.gstPercent || 0}
                        onChange={(e) => setCourseForm({ ...courseForm, pricing: { ...courseForm.pricing, gstPercent: Number(e.target.value) } })} min={0} max={100} />
                    </div>
                    <div className="space-y-2">
                      <Label>Certificate</Label>
                      <select value={courseForm.certificateSettings?.enabled ? 'yes' : 'no'}
                        onChange={(e) => setCourseForm({ ...courseForm, certificateSettings: { ...courseForm.certificateSettings, enabled: e.target.value === 'yes' } })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                        <option value="yes">Certificate on completion</option>
                        <option value="no">No certificate</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Pricing'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SEO Tab ─── */}
        <TabsContent value="seo">
          <Card>
            <CardHeader><CardTitle className="text-lg">SEO Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {courseForm && (
                <>
                  <div className="space-y-2">
                    <Label>SEO Title</Label>
                    <Input value={courseForm.meta?.seoTitle || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoTitle: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Description</Label>
                    <Textarea value={courseForm.meta?.seoDescription || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoDescription: e.target.value } })} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>SEO Keywords (comma-separated)</Label>
                    <Input value={Array.isArray(courseForm.meta?.seoKeywords) ? courseForm.meta.seoKeywords.join(', ') : ''}
                      onChange={(e) => setCourseForm({ ...courseForm, meta: { ...courseForm.meta, seoKeywords: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) } })} />
                  </div>
                  <Button onClick={() => updateMutation.mutate(courseForm)} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save SEO'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── Lecture Editor Modal ─── */}
      {editingLecture && (
        <LectureEditor
          lecture={editingLecture.lecture}
          onSave={(data) => saveLectureMutation.mutate({ lectureId: editingLecture.lecture._id, data })}
          onClose={() => setEditingLecture(null)}
          isSaving={saveLectureMutation.isPending}
        />
      )}

      <ConfirmDialog open={!!deleteSectionId} onOpenChange={() => setDeleteSectionId(null)}
        onConfirm={() => deleteSectionId && deleteSectionMutation.mutate(deleteSectionId)}
        title="Delete Section" description="This will delete the section and all its lectures." confirmText="Delete" variant="destructive" />
      <ConfirmDialog open={!!deleteLectureId} onOpenChange={() => setDeleteLectureId(null)}
        onConfirm={() => deleteLectureId && deleteLectureMutation.mutate(deleteLectureId)}
        title="Delete Lecture" description="Are you sure?" confirmText="Delete" variant="destructive" />
    </div>
  );
}

// ─── Lecture Editor Dialog ──────────────────────────────────────
function LectureEditor({ lecture, onSave, onClose, isSaving }: {
  lecture: LectureData; onSave: (data: any) => void; onClose: () => void; isSaving: boolean;
}) {
  const [form, setForm] = useState<LectureData>(lecture);
  const [newOption, setNewOption] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', options: ['', ''], correctAnswer: '', explanation: '', marks: 1 });

  const update = (key: string, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const isEditing = !!lecture._id;

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
      <div className="w-full max-w-3xl rounded-lg border bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isEditing ? 'Edit Lecture' : 'Add Lecture'}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Lecture title" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => update('type', e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Input type="number" value={form.duration} onChange={(e) => update('duration', Number(e.target.value))} min={0} />
            </div>
            <div className="flex items-end space-y-2">
              <label className="flex items-center gap-2 pb-2 cursor-pointer">
                <input type="checkbox" checked={form.isFree} onChange={(e) => update('isFree', e.target.checked)} />
                <span className="text-sm">Free preview</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={2} />
          </div>

          {/* ─── Video Source ─── */}
          {form.type === 'video' && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Video Source</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <select value={form.videoSource?.source || 'none'}
                    onChange={(e) => update('videoSource', { ...form.videoSource, source: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    {videoSources.map((vs) => <option key={vs.value} value={vs.value}>{vs.label}</option>)}
                  </select>
                </div>
                {(form.videoSource?.source === 'youtube' || form.videoSource?.source === 'vimeo') && (
                  <div className="space-y-2">
                    <Label>Video ID</Label>
                    <Input value={form.videoSource?.videoId || ''}
                      onChange={(e) => update('videoSource', { ...form.videoSource, videoId: e.target.value })}
                      placeholder={form.videoSource?.source === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'e.g. 123456789'} />
                  </div>
                )}
                {form.videoSource?.source === 'direct' && (
                  <div className="space-y-2">
                    <Label>Video URL</Label>
                    <Input value={form.videoSource?.url || ''}
                      onChange={(e) => update('videoSource', { ...form.videoSource, url: e.target.value })} />
                  </div>
                )}
                {form.videoSource?.source === 'bunny' && (
                  <div className="space-y-2">
                    <Label>Bunny CDN URL</Label>
                    <Input value={form.videoSource?.url || ''}
                      onChange={(e) => update('videoSource', { ...form.videoSource, url: e.target.value })} />
                  </div>
                )}
                {form.videoSource?.source === 's3' && (
                  <div className="space-y-2">
                    <Label>S3 Object Key</Label>
                    <Input value={form.videoSource?.videoId || ''}
                      onChange={(e) => update('videoSource', { ...form.videoSource, videoId: e.target.value })} />
                  </div>
                )}
              </div>
              {form.videoSource?.source !== 'none' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Thumbnail URL</Label>
                    <Input value={form.videoSource?.thumbnailUrl || ''}
                      onChange={(e) => update('videoSource', { ...form.videoSource, thumbnailUrl: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Playback Rate</Label>
                    <Input type="number" step="0.25" value={form.videoSource?.playbackRate || 1}
                      onChange={(e) => update('videoSource', { ...form.videoSource, playbackRate: Number(e.target.value) })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Article Content ─── */}
          {form.type === 'article' && (
            <div className="space-y-2">
              <Label>Article Content</Label>
              <Textarea value={form.articleContent} onChange={(e) => update('articleContent', e.target.value)} rows={10} />
            </div>
          )}

          {/* ─── Quiz Editor ─── */}
          {form.type === 'quiz' && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Quiz Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Time Limit (min)</Label>
                  <Input type="number" value={form.quiz?.timeLimit || 0}
                    onChange={(e) => update('quiz', { ...form.quiz, timeLimit: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Passing Score %</Label>
                  <Input type="number" value={form.quiz?.passingScore || 60}
                    onChange={(e) => update('quiz', { ...form.quiz, passingScore: Number(e.target.value) })} min={0} max={100} />
                </div>
                <div className="space-y-2">
                  <Label>Max Attempts</Label>
                  <Input type="number" value={form.quiz?.maxAttempts || 3}
                    onChange={(e) => update('quiz', { ...form.quiz, maxAttempts: Number(e.target.value) })} min={1} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.quiz?.showResults || false}
                    onChange={(e) => update('quiz', { ...form.quiz, showResults: e.target.checked })} />
                  <span className="text-sm">Show results</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.quiz?.randomizeQuestions || false}
                    onChange={(e) => update('quiz', { ...form.quiz, randomizeQuestions: e.target.checked })} />
                  <span className="text-sm">Randomize questions</span>
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Questions ({(form.quiz?.questions || []).length})</h4>
                </div>
                {(form.quiz?.questions || []).map((q: any, qi: number) => (
                  <div key={qi} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Input value={q.question}
                        onChange={(e) => setForm(updateQuizQuestion(form, qi, (qq: any) => ({ ...qq, question: e.target.value })))}
                        placeholder="Question" className="flex-1" />
                      <Input type="number" value={q.marks}
                        onChange={(e) => setForm(updateQuizQuestion(form, qi, (qq: any) => ({ ...qq, marks: Number(e.target.value) })))}
                        className="w-16" placeholder="Marks" />
                      <Button variant="ghost" size="sm" onClick={() => setForm(removeQuizQuestion(form, qi))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    {q.options.map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`q-${qi}`} checked={q.correctAnswer === opt}
                          onChange={() => setForm(updateQuizQuestion(form, qi, (qq: any) => ({ ...qq, correctAnswer: opt })))} />
                        <Input value={opt}
                          onChange={(e) => setForm(updateQuizQuestion(form, qi, (qq: any) => ({
                            ...qq, options: qq.options.map((o: string, ooi: number) => ooi === oi ? e.target.value : o)
                          })))}
                          placeholder={`Option ${oi + 1}`} className="flex-1" />
                        {q.options.length > 2 && (
                          <Button variant="ghost" size="sm" onClick={() => setForm(removeQuizOption(form, qi, oi))}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setForm(addQuizOption(form, qi))}>+ Add option</Button>
                    <Input value={q.explanation}
                      onChange={(e) => setForm(updateQuizQuestion(form, qi, (qq: any) => ({ ...qq, explanation: e.target.value })))}
                      placeholder="Explanation (shown after answering)" />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => {
                  const existing = form.quiz?.questions || [];
                  setForm({ ...form, quiz: { ...form.quiz, questions: [...existing, { question: '', options: ['', ''], correctAnswer: '', explanation: '', marks: 1 }] } });
                }}><Plus className="mr-1 h-3 w-3" /> Add Question</Button>
              </div>
            </div>
          )}

          {/* ─── Assignment Editor ─── */}
          {form.type === 'assignment' && (
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Assignment Details</h3>
              <div className="space-y-2">
                <Label>Question / Prompt</Label>
                <Textarea value={form.assignment?.question || ''}
                  onChange={(e) => update('assignment', { ...form.assignment, question: e.target.value })} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea value={form.assignment?.instructions || ''}
                  onChange={(e) => update('assignment', { ...form.assignment, instructions: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Marks</Label>
                  <Input type="number" value={form.assignment?.totalMarks || 100}
                    onChange={(e) => update('assignment', { ...form.assignment, totalMarks: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Passing Marks</Label>
                  <Input type="number" value={form.assignment?.passingMarks || 60}
                    onChange={(e) => update('assignment', { ...form.assignment, passingMarks: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={form.assignment?.dueDate?.split('T')[0] || ''}
                    onChange={(e) => update('assignment', { ...form.assignment, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.assignment?.allowLateSubmission || false}
                  onChange={(e) => update('assignment', { ...form.assignment, allowLateSubmission: e.target.checked })} id="lateSub" />
                <Label htmlFor="lateSub">Allow late submission</Label>
              </div>
              {form.assignment?.allowLateSubmission && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Late submission days</Label>
                    <Input type="number" value={form.assignment?.lateSubmissionDays || 7}
                      onChange={(e) => update('assignment', { ...form.assignment, lateSubmissionDays: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Penalty % per day</Label>
                    <Input type="number" value={form.assignment?.penaltyPercent || 10}
                      onChange={(e) => update('assignment', { ...form.assignment, penaltyPercent: Number(e.target.value) })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Resources ─── */}
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Resources & Attachments</h3>
            {(form.resources || []).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={r.name} onChange={(e) => {
                  const rs = [...form.resources]; rs[i] = { ...rs[i], name: e.target.value }; update('resources', rs);
                }} placeholder="File name" className="flex-1" />
                <Input value={r.url} onChange={(e) => {
                  const rs = [...form.resources]; rs[i] = { ...rs[i], url: e.target.value }; update('resources', rs);
                }} placeholder="URL" className="flex-[2]" />
                <Button variant="ghost" size="sm" onClick={() => update('resources', form.resources.filter((_, j) => j !== i))}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => update('resources', [...form.resources, { url: '', publicId: '', name: '', type: '', size: 0 }])}>
              <Plus className="mr-1 h-3 w-3" /> Add Resource
            </Button>
          </div>

          {/* ─── Notes ─── */}
          <div className="space-y-2">
            <Label>Instructor Notes</Label>
            <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} placeholder="Notes visible to students" />
          </div>

          {/* ─── SEO ─── */}
          <div className="space-y-3 rounded-lg border p-4">
            <h3 className="text-sm font-medium">Lecture SEO</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SEO Title</Label>
                <Input value={form.seoTitle || ''} onChange={(e) => update('seoTitle', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SEO Description</Label>
                <Input value={form.seoDescription || ''} onChange={(e) => update('seoDescription', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => {
            const data: any = { ...form };
            if (!data._id) delete data._id;
            onSave(data);
          }} disabled={!form.title || isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : isEditing ? 'Update Lecture' : 'Add Lecture'}
          </Button>
        </div>
      </div>
    </div>
  );
}
