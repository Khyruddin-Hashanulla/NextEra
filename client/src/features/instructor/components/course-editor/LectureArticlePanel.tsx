import { useState } from 'react';
import { Eye, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './RichTextEditor';

export function LectureArticlePanel({ articleContent, onChange }: { articleContent: string; onChange: (html: string) => void }) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Article Content</p>
        <Button variant="outline" size="sm" onClick={() => setPreview((p) => !p)}>
          {preview ? <PenLine className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
          {preview ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {preview ? (
        <div className="prose prose-sm max-w-none rounded-lg border p-4">
          {articleContent ? (
            <div dangerouslySetInnerHTML={{ __html: articleContent }} />
          ) : (
            <p className="text-sm text-muted-foreground">No content yet.</p>
          )}
        </div>
      ) : (
        <RichTextEditor
          value={articleContent || ''}
          onChange={onChange}
          placeholder="Write your article here. Use the toolbar for headings, lists, code blocks and links."
          minHeight="240px"
        />
      )}
    </div>
  );
}
