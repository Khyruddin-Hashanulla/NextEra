import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { codingApi } from '@/api/endpoints/coding';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/providers/ToastProvider';
import { CodeEditor } from '@/features/student/components/CodeEditor';
import { CodingProblemSkeleton } from '@/components/skeletons/BlogDetailSkeleton';
import { Loader2, CheckCircle2, XCircle, Clock, Zap, ChevronLeft } from 'lucide-react';
import type { Difficulty, ProgrammingLanguage, TestResult } from '@/types/coding';

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

const statusIcons: Record<string, React.ReactNode> = {
  accepted: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  wrong_answer: <XCircle className="h-4 w-4 text-red-500" />,
  time_limit_exceeded: <Clock className="h-4 w-4 text-yellow-500" />,
  runtime_error: <Zap className="h-4 w-4 text-red-500" />,
  compilation_error: <XCircle className="h-4 w-4 text-orange-500" />,
};

export function CodingProblemSolvePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<ProgrammingLanguage>('javascript');
  const [activeTab, setActiveTab] = useState('description');
  const [lastSubmission, setLastSubmission] = useState<any>(null);

  const { data: problemData, isLoading } = useQuery({
    queryKey: ['coding-problem', slug],
    queryFn: () => codingApi.getProblemBySlug(slug!).then(r => r.data.data),
    enabled: !!slug,
  });

  const { data: submissionsData } = useQuery({
    queryKey: ['coding-submissions', problemData?._id],
    queryFn: () => codingApi.getUserSubmissions(problemData!._id, { limit: 5 }).then(r => r.data),
    enabled: !!problemData?._id,
  });

  useEffect(() => {
    if (problemData) {
      const template = problemData.solutionTemplate?.[language] || '';
      if (template) setCode(template);
    }
  }, [problemData, language]);

  const submitMutation = useMutation({
    mutationFn: () => codingApi.submitCode(problemData!._id, { code, language }),
    onSuccess: (res) => {
      setLastSubmission(res.data.data);
      setActiveTab('results');
      addToast({ title: 'Code submitted', variant: 'success' });
    },
    onError: () => addToast({ title: 'Submission failed', variant: 'error' }),
  });

  if (isLoading) {
    return <CodingProblemSkeleton />;
  }

  if (!problemData) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Problem not found
        <div className="mt-2"><Button variant="link" onClick={() => navigate('/coding/problems')}>Back to problems</Button></div>
      </div>
    );
  }

  const sampleCases = problemData.testCases?.filter(tc => tc.isSample) || [];
  const previousSubmissions = submissionsData?.submissions || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/coding/problems')}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{problemData.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs ${difficultyColors[problemData.difficulty as Difficulty] || ''}`}>
                      {problemData.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {problemData.acceptedSubmissions}/{problemData.totalSubmissions} solved
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="description">Description</TabsTrigger>
                  <TabsTrigger value="submissions">Submissions</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4 mt-4">
                  <div className="prose prose-sm max-w-none">
                    {problemData.description.split('\n').map((line: string, i: number) => (
                      <p key={i} className="text-sm text-muted-foreground">{line}</p>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>Time: {problemData.timeLimit}s</span>
                    <span>Memory: {problemData.memoryLimit}MB</span>
                    <span>Languages: {problemData.supportedLanguages.join(', ')}</span>
                  </div>

                  {problemData.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {problemData.tags.map((tag: string) => (
                        <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}

                  {sampleCases.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h4 className="text-sm font-medium">Sample Test Cases</h4>
                      {sampleCases.map((tc: any, i: number) => (
                        <div key={i} className="rounded border bg-muted/50 p-3 text-sm">
                          <div><span className="text-muted-foreground">Input:</span> <code className="text-xs bg-background px-1 rounded">{tc.input}</code></div>
                          <div><span className="text-muted-foreground">Output:</span> <code className="text-xs bg-background px-1 rounded">{tc.expectedOutput}</code></div>
                          {tc.explanation && <div className="text-xs text-muted-foreground mt-1">{tc.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="submissions" className="mt-4">
                  {previousSubmissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No submissions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {previousSubmissions.map((sub: any) => (
                        <div key={sub._id} className="flex items-center justify-between rounded border p-3 text-sm">
                          <div className="flex items-center gap-2">
                            {statusIcons[sub.status]}
                            <span className="font-medium capitalize">{sub.status.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="text-muted-foreground text-xs">
                            <span className="mr-3">Score: {sub.score}%</span>
                            <span>{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="mt-4">
                  {lastSubmission ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {statusIcons[lastSubmission.status]}
                        <span className="font-medium capitalize">{lastSubmission.status.replace(/_/g, ' ')}</span>
                        <Badge variant="secondary">{lastSubmission.score}%</Badge>
                      </div>
                      <div className="space-y-2">
                        {lastSubmission.testResults?.map((tr: TestResult, i: number) => (
                          <div key={i} className={`rounded border p-3 text-sm ${tr.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-center gap-2">
                              {tr.passed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                              <span className="font-medium">Test {i + 1}</span>
                              {tr.runtime && <span className="text-xs text-muted-foreground">~{tr.runtime}ms</span>}
                            </div>
                            {!tr.passed && tr.input && (
                              <div className="mt-1 text-xs">
                                <div>Input: <code className="bg-background px-1 rounded">{tr.input}</code></div>
                                <div>Expected: <code className="bg-background px-1 rounded">{tr.expectedOutput}</code></div>
                                <div>Got: <code className="bg-background px-1 rounded">{tr.actualOutput}</code></div>
                              </div>
                            )}
                            {tr.error && <p className="text-xs text-red-600 mt-1">{tr.error}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4">Submit your code to see results</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <CodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            supportedLanguages={problemData.supportedLanguages as ProgrammingLanguage[]}
          />

          <div className="flex gap-2">
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !code.trim()} className="flex-1">
              {submitMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</> : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
