import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { codingApi } from '@/api/endpoints/coding';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/skeletons/ListSkeleton';
import { Search, Code2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Difficulty } from '@/types/coding';

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

export function CodingProblemsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['coding-problems', page, search, difficulty],
    queryFn: () =>
      codingApi.listProblems({ page, limit: 20, search, difficulty: difficulty || undefined }).then((r) => r.data),
  });

  const problems = data?.problems || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Coding Problems</h1>
        <p className="text-muted-foreground">Practice coding with interactive problems</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {['', 'easy', 'medium', 'hard'].map((d) => (
          <Button
            key={d}
            variant={difficulty === d ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDifficulty(d);
              setPage(1);
            }}
          >
            {d ? d.charAt(0).toUpperCase() + d.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : problems.length === 0 ? (
        <div className="rounded-lg border p-12 text-center text-muted-foreground">
          <Code2 className="mx-auto h-8 w-8 mb-2" />
          <p>No problems found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem: any) => (
            <Link key={problem._id} to={`/coding/problems/${problem.slug}`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{problem.title}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs ${difficultyColors[problem.difficulty as Difficulty] || ''}`}
                      >
                        {problem.difficulty}
                      </Badge>
                    </div>
                    {problem.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {problem.tags.slice(0, 4).map((tag: string) => (
                          <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground ml-4 shrink-0">
                    <div>
                      {problem.acceptedSubmissions || 0} / {problem.totalSubmissions || 0}
                    </div>
                    <div className="text-xs">solved</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
