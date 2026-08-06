import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '@/api/endpoints/student';
import { liveClassApi } from '@/api/endpoints/liveClass';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/providers/ToastProvider';
import { CoursePlayerSkeleton } from '@/components/skeletons/CourseDetailSkeleton';
import { ResourceNotFound } from '@/components/common/ResourceNotFound';
import { ErrorState } from '@/components/common/ErrorState';
import { categorizeError } from '@/lib/error-utils';
import { Loader2, ChevronLeft, ChevronRight, PlayCircle, CheckCircle, Bookmark, StickyNote, MessageSquare, FileQuestion, FileCheck, FileText, ArrowLeft, Download, Play, Video } from 'lucide-react';

export function CoursePlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['student', 'course-player', courseId],
    queryFn: () => studentApi.getCourseDetail(courseId!).then((r: any) => r.data.data),
    enabled: !!courseId,
  });

  const progressMutation = useMutation({
    mutationFn: (data: { lectureId: string; position?: number; completed?: boolean }) =>
      studentApi.updateProgress(courseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'course-player', courseId] });
    },
  });

  const [currentLecture, setCurrentLecture] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('content');

  const allLectures = data?.curriculum?.flatMap((s: any) => s.lectures || []) || [];
  const currentIdx = currentLecture ? allLectures.findIndex((l: any) => l._id === currentLecture._id) : -1;

  const handleLectureSelect = (lecture: any) => {
    setCurrentLecture(lecture);
    setActiveTab('content');
    progressMutation.mutate({ lectureId: lecture._id, completed: false });
  };

  const handleComplete = () => {
    if (currentLecture) {
      progressMutation.mutate({ lectureId: currentLecture._id, completed: true });
      addToast({ title: 'Lecture marked as complete', variant: 'success' });
    }
  };

  const handleNext = () => {
    if (currentIdx >= 0 && currentIdx < allLectures.length - 1) {
      handleLectureSelect(allLectures[currentIdx + 1]);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      handleLectureSelect(allLectures[currentIdx - 1]);
    }
  };

  if (isLoading) {
    return <CoursePlayerSkeleton />;
  }

  if (error || !data?.course) {
    if (!data?.course && (!error || categorizeError(error) === 'not-found')) {
      return <ResourceNotFound resourceType="course" />;
    }
    const category = categorizeError(error);
    if (category === 'network') {
      return (
        <ErrorState
          title="Connection Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return (
      <ErrorState
        title="Course Not Found"
        message="This course doesn't exist or has been removed."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!data?.isEnrolled) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">You are not enrolled in this course.</p>
        <Link to={`/courses/${courseId}`}><Button>View Course</Button></Link>
      </div>
    );
  }

  const completedLectureIds = new Set(data.enrollment?.completedLectures?.map((id: string) => id.toString()) || []);

  return (
    <div className="flex gap-6">
      <div className="w-80 shrink-0 space-y-2">
        <Link to="/student/my-courses" className="mb-2 flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to My Courses
        </Link>
        <h2 className="truncate font-semibold">{data.course?.title}</h2>
        <div className="mb-2 h-2 rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${data.enrollment?.completionPercentage || 0}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">{data.enrollment?.completionPercentage || 0}% complete</p>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          {data.curriculum?.map((section: any) => (
            <div key={section._id} className="mb-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">{section.title}</p>
              <div className="space-y-1">
                {(section.lectures || []).map((lecture: any) => {
                  const isActive = currentLecture?._id === lecture._id;
                  const isCompleted = completedLectureIds.has(lecture._id);
                  return (
                    <button
                      key={lecture._id}
                      onClick={() => handleLectureSelect(lecture)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors ${
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                      ) : (
                        <PlayCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate">{lecture.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        {currentLecture ? (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg bg-black">
              {currentLecture.type === 'video' && currentLecture.videoUrl?.url ? (
                <video
                  key={currentLecture._id}
                  src={currentLecture.videoUrl.url}
                  controls
                  className="h-full w-full rounded-lg"
                  onTimeUpdate={(e) => {
                    const video = e.currentTarget;
                    if (Math.floor(video.currentTime) % 15 === 0 && video.currentTime > 0) {
                      progressMutation.mutate({ lectureId: currentLecture._id, position: Math.floor(video.currentTime) });
                    }
                  }}
                  onEnded={() => progressMutation.mutate({ lectureId: currentLecture._id, completed: true })}
                />
              ) : currentLecture.type === 'article' ? (
                <div className="flex h-full items-center justify-center text-white">
                  <div className="max-w-xl space-y-4 p-8 text-center">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="text-lg font-medium">Article Content</p>
                    <p className="text-sm text-gray-400">{currentLecture.articleContent}</p>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-white">
                  <div className="text-center">
                    <FileCheck className="mx-auto h-12 w-12" />
                    <p className="mt-2 text-lg font-medium">Assignment / Quiz</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIdx <= 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleComplete}>
                  <CheckCircle className="mr-1 h-4 w-4" /> Mark Complete
                </Button>
                <Button size="sm" onClick={handleNext} disabled={currentIdx >= allLectures.length - 1}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <h2 className="text-xl font-semibold">{currentLecture.title}</h2>
            {currentLecture.description && <p className="text-muted-foreground">{currentLecture.description}</p>}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="notes"><StickyNote className="mr-1 h-4 w-4" /> Notes</TabsTrigger>
                <TabsTrigger value="discussion"><MessageSquare className="mr-1 h-4 w-4" /> Discussion</TabsTrigger>
                <TabsTrigger value="resources"><Download className="mr-1 h-4 w-4" /> Resources</TabsTrigger>
                {currentLecture.type === 'assignment' && (
                  <>
                    <TabsTrigger value="quiz"><FileQuestion className="mr-1 h-4 w-4" /> Quiz</TabsTrigger>
                    <TabsTrigger value="assignment"><FileCheck className="mr-1 h-4 w-4" /> Assignment</TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="notes">
                <NotesTab courseId={courseId!} lectureId={currentLecture._id} />
              </TabsContent>
              <TabsContent value="discussion">
                <DiscussionTab courseId={courseId!} lectureId={currentLecture._id} />
              </TabsContent>
              <TabsContent value="resources">
                <ResourcesTab courseId={courseId!} lectureId={currentLecture._id} />
              </TabsContent>
              {currentLecture.type === 'assignment' && (
                <>
                  <TabsContent value="quiz">
                    <QuizTab courseId={courseId!} lectureId={currentLecture._id} assignment={currentLecture.assignment} />
                  </TabsContent>
                  <TabsContent value="assignment">
                    <AssignmentTab courseId={courseId!} lectureId={currentLecture._id} />
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center text-muted-foreground">
              <PlayCircle className="mx-auto h-12 w-12" />
              <p className="mt-2">Select a lecture to start learning</p>
            </div>
          </div>
        )}

        <LiveRecordingsSection courseId={courseId!} />
      </div>
    </div>
  );
}

function NotesTab({ courseId, lectureId }: { courseId: string; lectureId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [newNote, setNewNote] = useState('');

  const { data: notes } = useQuery({
    queryKey: ['student', 'notes', lectureId],
    queryFn: () => studentApi.listNotes({ courseId, lectureId }).then((r: any) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => studentApi.createNote({ courseId, lectureId, content: newNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notes', lectureId] });
      setNewNote('');
      addToast({ title: 'Note added', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentApi.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'notes', lectureId] });
      addToast({ title: 'Note deleted', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <div className="flex gap-2">
          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Write a note..." rows={3} />
          <Button onClick={() => createMutation.mutate()} disabled={!newNote.trim()} className="shrink-0">Add</Button>
        </div>
        {notes?.map((note: any) => (
          <div key={note._id} className="rounded-lg border p-3">
            <p className="text-sm">{note.content}</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleString()}</span>
              <button onClick={() => deleteMutation.mutate(note._id)} className="text-xs text-destructive hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DiscussionTab({ courseId, lectureId }: { courseId: string; lectureId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const { data: discussions } = useQuery({
    queryKey: ['student', 'discussions', lectureId],
    queryFn: () => studentApi.listDiscussions(courseId, { lectureId }).then((r: any) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => studentApi.createDiscussion({ courseId, lectureId, title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'discussions', lectureId] });
      setTitle('');
      setContent('');
      addToast({ title: 'Question posted', variant: 'success' });
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => studentApi.replyToDiscussion(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'discussions', lectureId] });
      setReplyContent({});
      addToast({ title: 'Reply posted', variant: 'success' });
    },
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2 rounded-lg border p-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Question title" />
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your question..." rows={3} />
          <Button onClick={() => createMutation.mutate()} disabled={!title.trim() || !content.trim()}>Post Question</Button>
        </div>
        {discussions?.discussions?.map((d: any) => (
          <div key={d._id} className="rounded-lg border p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-medium">{d.user?.name || 'Anonymous'}</span>
              <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm font-medium">{d.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d.content}</p>
            {(d.replies || []).map((reply: any, i: number) => (
              <div key={i} className="ml-4 mt-2 border-l-2 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{reply.user?.name || 'Anonymous'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(reply.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{reply.content}</p>
              </div>
            ))}
            <div className="mt-2 flex gap-2">
              <Input
                value={replyContent[d._id] || ''}
                onChange={(e) => setReplyContent({ ...replyContent, [d._id]: e.target.value })}
                placeholder="Write a reply..."
                className="flex-1"
              />
              <Button size="sm" onClick={() => {
                if (replyContent[d._id]?.trim()) {
                  replyMutation.mutate({ id: d._id, content: replyContent[d._id] });
                }
              }}>Reply</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuizTab({ courseId, lectureId, assignment }: { courseId: string; lectureId: string; assignment: any }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  let questions: { question: string; options: string[]; correctAnswer: string }[] = [];
  try {
    if (assignment?.question) questions = JSON.parse(assignment.question);
  } catch {}

  const { data: attempts } = useQuery({
    queryKey: ['student', 'quiz-attempts', lectureId],
    queryFn: () => studentApi.getQuizAttempts(lectureId).then((r: any) => r.data.data),
  });

  const submitMutation = useMutation({
    mutationFn: () => {
      const formattedAnswers = questions.map((q) => ({ question: q.question, selectedAnswer: answers[q.question] || '' }));
      return studentApi.submitQuiz({ courseId, lectureId, answers: formattedAnswers }).then((r: any) => r.data.data);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['student', 'quiz-attempts', lectureId] });
      addToast({
        title: result.passed ? 'Quiz Passed!' : 'Quiz Failed',
        description: `Score: ${result.score}/${result.totalQuestions}`,
        variant: result.passed ? 'success' : 'error',
      });
    },
  });

  if (!questions.length) return <p className="text-muted-foreground">No quiz questions available.</p>;

  const lastAttempt = attempts?.[0];

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {lastAttempt && (
          <div className={`rounded-lg p-3 text-sm ${lastAttempt.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            Last attempt: {lastAttempt.score}/{lastAttempt.totalQuestions} ({lastAttempt.passed ? 'Passed' : 'Failed'})
          </div>
        )}
        {questions.map((q, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm font-medium">{i + 1}. {q.question}</p>
            <div className="space-y-1">
              {q.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 rounded border p-2 text-sm cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name={`q-${i}`}
                    value={opt}
                    checked={answers[q.question] === opt}
                    onChange={() => setAnswers({ ...answers, [q.question]: opt })}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || Object.keys(answers).length < questions.length}>
          {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </CardContent>
    </Card>
  );
}

function AssignmentTab({ courseId, lectureId }: { courseId: string; lectureId: string }) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<{ url: string; publicId: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const { data: detail } = useQuery({
    queryKey: ['student', 'assignment', lectureId],
    queryFn: () => studentApi.getAssignmentDetail(lectureId).then((r: any) => r.data.data),
    enabled: !!lectureId,
  });

  const submission = detail?.submission || null;
  const canSubmit = detail?.canSubmit;

  const submitMutation = useMutation({
    mutationFn: () => studentApi.submitAssignment({ courseId, lectureId, content, files: files.length ? files : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'assignment', lectureId] });
      queryClient.invalidateQueries({ queryKey: ['student', 'assignments', 'overview'] });
      setContent('');
      setFiles([]);
      addToast({ title: 'Assignment submitted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to submit assignment', variant: 'error' }),
  });

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await studentApi.uploadAssignmentFile(file);
      setFiles((prev) => [...prev.slice(-4), res.data.data]);
      addToast({ title: 'File uploaded', variant: 'success' });
    } catch {
      addToast({ title: 'File upload failed', variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (submission) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-4">
          <div className="rounded-lg p-3 bg-muted/40">
            <p className="text-sm font-medium">Status: {submission.status.replace(/_/g, ' ')}</p>
            {(submission.grade !== undefined || submission.letterGrade) && (
              <p className="text-sm">
                Grade: {submission.letterGrade || `${submission.grade}/${submission.maxMarks || 100}`}
                {submission.percentage !== undefined && ` (${submission.percentage}%)`}
              </p>
            )}
            {submission.passFail && (
              <p className={`text-sm font-medium ${submission.passFail === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                {submission.passFail === 'pass' ? 'Passed' : 'Failed'}
              </p>
            )}
            {submission.feedback && <p className="text-sm">Feedback: {submission.feedback}</p>}
            {submission.lateSubmission && submission.penaltyPercent > 0 && (
              <p className="text-xs text-orange-600">Late submission · {submission.penaltyPercent}% penalty</p>
            )}
          </div>
          {submission.content && <p className="whitespace-pre-line text-sm">{submission.content}</p>}
          {submission.files?.length > 0 && (
            <div className="space-y-2">
              {submission.files.map((f: any) => (
                <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm">{f.name}</span>
                  </div>
                  <a href={f.url} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="ghost" size="sm"><Download className="h-3 w-3" /></Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!canSubmit) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Submission not available.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-4">
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your assignment answer..." rows={6} />
        <FileUpload
          accept=".pdf,.doc,.docx,.zip,.rar,.txt,.md,.c,.cpp,.js,.jsx,.ts,.tsx,.py,.java,.jpeg,.jpg,.png,.webp"
          maxSize={25 * 1024 * 1024}
          label="Upload assignment files (max 5)"
          value={pendingFile}
          onChange={(f) => { setPendingFile(f); if (f) handleUpload(f); }}
          disabled={uploading || files.length >= 5}
        />
        {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.publicId} className="flex items-center justify-between rounded-lg border p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm">{f.name}</span>
                </div>
                <button onClick={() => setFiles((prev) => prev.filter((x) => x.publicId !== f.publicId))} className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
        <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || (!content.trim() && files.length === 0)}>
          {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit Assignment
        </Button>
      </CardContent>
    </Card>
  );
}

function ResourcesTab({ courseId, lectureId }: { courseId: string; lectureId: string }) {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['student', 'resources', lectureId],
    queryFn: () => studentApi.getLectureResources(lectureId, courseId).then((r: any) => r.data.data),
    enabled: !!lectureId,
  });

  if (isLoading) {
    return <Card><CardContent className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></CardContent></Card>;
  }

  if (!resources?.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Download className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">No resources available for this lecture.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-4">
        {resources.map((resource: any, i: number) => (
          <div key={i} className="flex items-center justify-between rounded-lg border p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{resource.name || 'Resource ' + (i + 1)}</p>
              <p className="text-xs text-muted-foreground capitalize">{resource.type || 'Unknown'}</p>
            </div>
            <a href={resource.url} target="_blank" rel="noopener noreferrer" download>
              <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> Download</Button>
            </a>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LiveRecordingsSection({ courseId }: { courseId: string }) {
  const { data: recordingsData, isLoading } = useQuery({
    queryKey: ['student', 'course-recordings', courseId],
    queryFn: ({ signal }) => liveClassApi.listStudentRecordings({ courseId, page: 1, limit: 20 }, signal).then((r) => r.data.data),
    enabled: !!courseId,
  });

  const recordings = recordingsData?.recordings || [];

  const recordView = (rec: any) => {
    if (rec._id) liveClassApi.incrementRecordingView(rec._id).catch(() => {});
  };

  return (
    <div className="mt-6">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        <Video className="h-4 w-4 text-primary" /> Live Recordings
      </h3>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : recordings.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            <Video className="mx-auto mb-2 h-8 w-8" />
            <p>No live recordings available for this course yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recordings.map((rec: any) => {
            const mins = Math.floor((rec.duration || 0) / 60);
            const secs = (rec.duration || 0) % 60;
            return (
              <Card key={rec._id}>
                <CardContent className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{rec.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {mins}:{secs.toString().padStart(2, '0')} · {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {rec.url && (
                    <a href={rec.url} target="_blank" rel="noreferrer" onClick={() => recordView(rec)}>
                      <Button size="sm"><Play className="mr-1 h-3 w-3" /> Watch</Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

