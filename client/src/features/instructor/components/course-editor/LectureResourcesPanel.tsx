import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from './FileUploader';
import { uploadApi } from '@/api/endpoints/upload';
import { Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Resource {
  url: string;
  publicId: string;
  name: string;
  type: string;
  size: number;
}

interface ResourceLink {
  id: string;
  label: string;
  url: string;
}

interface ResourceData {
  resources?: Resource[];
  links?: ResourceLink[];
  notes?: string;
}

export function LectureResourcesPanel({
  value,
  onChange,
}: {
  value: ResourceData;
  onChange: (v: ResourceData) => void;
}) {
  const resources = value.resources || [];
  const links = value.links || [];

  const addLink = () => {
    onChange({ ...value, links: [...links, { id: crypto.randomUUID(), label: '', url: '' }] });
  };

  const updateLink = (id: string, patch: Partial<ResourceLink>) => {
    onChange({ ...value, links: links.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  };

  const removeLink = (id: string) => {
    onChange({ ...value, links: links.filter((l) => l.id !== id) });
  };

  const removeResource = (index: number) => {
    onChange({ ...value, resources: resources.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Resource Files (PDF, ZIP, images…)</label>
        <FileUploader
          accept=".pdf,.zip,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.mp4,.csv"
          maxSize={100 * 1024 * 1024}
          label="Upload a resource file"
          hint="Max 100MB"
          value={null}
          onChange={(r) => {
            if (r) {
              onChange({
                ...value,
                resources: [...resources, { url: r.url, publicId: r.publicId, name: r.name || 'Resource', type: 'file', size: 0 }],
              });
            }
          }}
          upload={uploadApi.document}
        />
        {resources.length > 0 && (
          <div className="space-y-2">
            {resources.map((r, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.name}</p>
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">View file</a>
                </div>
                <button type="button" onClick={() => removeResource(i)} className="rounded p-1 text-destructive hover:bg-muted" aria-label={`Remove ${r.name}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Useful Links</label>
          <Button variant="ghost" size="sm" onClick={addLink}>
            <Plus className="mr-1 h-3 w-3" /> Add link
          </Button>
        </div>
        {links.length === 0 && <p className="text-xs text-muted-foreground">No links added yet.</p>}
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })} placeholder="Label" className="flex-1" />
            <Input value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })} placeholder="https://…" className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => removeLink(l.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <label htmlFor="lecture-notes" className="text-sm font-medium">Notes for students</label>
        <Textarea
          id="lecture-notes"
          value={value.notes || ''}
          onChange={(e) => onChange({ ...value, notes: e.target.value })}
          rows={3}
          placeholder="Optional notes displayed alongside this lecture"
        />
      </div>
    </div>
  );
}
