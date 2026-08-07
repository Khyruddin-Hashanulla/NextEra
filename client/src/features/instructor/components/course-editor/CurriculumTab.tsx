import { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Plus, Trash2, ChevronDown, ChevronUp, FileVideo, FileText, FileCheck,
  Edit3, GripVertical, MoreVertical, ArrowRightLeft,
} from 'lucide-react';
import { EmptyCurriculumState } from './EmptyCurriculumState';

const typeIcons: Record<string, any> = {
  video: FileVideo, article: FileText, assignment: FileCheck, quiz: FileText,
};

function lectureStatus(lecture: any): 'ready' | 'draft' {
  const hasTitle = !!lecture.title?.trim();
  if (!hasTitle) return 'draft';
  if (lecture.type === 'video') {
    return lecture.videoSource?.url || lecture.videoSource?.videoId ? 'ready' : 'draft';
  }
  if (lecture.type === 'article') return lecture.articleContent?.trim() ? 'ready' : 'draft';
  if (lecture.type === 'quiz') return lecture.quiz?.questions?.length > 0 ? 'ready' : 'draft';
  if (lecture.type === 'assignment') return lecture.assignment?.question?.trim() ? 'ready' : 'draft';
  return 'draft';
}

// ─── Inline rename input ─────────────────────────────────────────────

function InlineRename({ initial, onCommit, onCancel, className }: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  className?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => onCommit(value.trim())}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(value.trim());
        if (e.key === 'Escape') onCancel();
      }}
      onClick={(e) => e.stopPropagation()}
      className={`h-7 ${className || ''}`}
    />
  );
}

// ─── Section (sortable) ──────────────────────────────────────────────

function SectionCard({
  section,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onRename,
  onAddLecture,
  onMoveLecture,
  onDeleteLecture,
  onRenameLecture,
  onReorderLectures,
  sections,
}: {
  section: any;
  expanded: boolean;
  onToggle: () => void;
  onEdit: (lecture: any) => void;
  onDelete: () => void;
  onRename: (title: string) => void;
  onAddLecture: () => void;
  onMoveLecture: (lecture: any, targetSectionId: string) => void;
  onDeleteLecture: (lectureId: string) => void;
  onRenameLecture: (lectureId: string, title: string) => void;
  onReorderLectures: (lectureOrder: { lectureId: string; order: number }[]) => void;
  sections: any[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section._id });
  const [renaming, setRenaming] = useState(false);
  const [lectureOrder, setLectureOrder] = useState<string[]>(section.lectures?.map((l: any) => l._id) || []);

  const style = { transform: CSS.Transform.toString(transform), transition };
  const lectures = section.lectures || [];

  const onLectureDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lectureOrder.indexOf(String(active.id));
      const newIndex = lectureOrder.indexOf(String(over.id));
      const next = arrayMove(lectureOrder, oldIndex, newIndex);
      setLectureOrder(next);
      onReorderLectures(next.map((id, i) => ({ lectureId: id, order: i })));
    }
  }, [lectureOrder, onReorderLectures]);

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground" aria-label="Drag to reorder section">
            <GripVertical className="h-4 w-4" />
          </button>
          <button onClick={onToggle} className="flex items-center gap-2 font-medium">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {renaming ? (
              <InlineRename
                initial={section.title}
                onCommit={(v) => { if (v) onRename(v); setRenaming(false); }}
                onCancel={() => setRenaming(false)}
                className="w-48"
              />
            ) : (
              <span
                className="truncate hover:text-primary"
                onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); }}
                title="Double-click to rename"
              >
                {section.title}
              </span>
            )}
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{lectures.length} lectures</span>
            {section.totalDuration > 0 && <span className="text-xs text-muted-foreground">{Math.round(section.totalDuration / 60)}m</span>}
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      {expanded && (
        <div className="px-4 py-2">
          <LectureSortableList
            lectures={lectures}
            sections={sections}
            onEdit={onEdit}
            onDelete={onDeleteLecture}
            onMove={onMoveLecture}
            onRename={onRenameLecture}
            onOrderChange={(order) => { setLectureOrder(order); onReorderLectures(order.map((id, i) => ({ lectureId: id, order: i }))); }}
          />
          <button onClick={onAddLecture} className="mt-2 text-sm font-medium text-primary hover:underline">+ Add lecture</button>
        </div>
      )}
    </div>
  );
}

function LectureSortableList({ lectures, sections, onEdit, onDelete, onMove, onRename, onOrderChange }: {
  lectures: any[];
  sections: any[];
  onEdit: (lecture: any) => void;
  onDelete: (lectureId: string) => void;
  onMove: (lecture: any, targetSectionId: string) => void;
  onRename: (lectureId: string, title: string) => void;
  onOrderChange: (order: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [order, setOrder] = useState<string[]>(lectures.map((l) => l._id));

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(String(active.id));
      const newIndex = order.indexOf(String(over.id));
      const next = arrayMove(order, oldIndex, newIndex);
      setOrder(next);
      onOrderChange(next);
    }
  }, [order, onOrderChange]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <div className="divide-y">
          {lectures.map((lecture: any) => (
            <LectureRow
              key={lecture._id}
              lecture={lecture}
              sections={sections}
              onEdit={() => onEdit(lecture)}
              onDelete={() => onDelete(lecture._id)}
              onMove={(targetSectionId) => onMove(lecture, targetSectionId)}
              onRename={(title) => onRename(lecture._id, title)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function LectureRow({
  lecture,
  sections,
  onEdit,
  onDelete,
  onMove,
  onRename,
}: {
  lecture: any;
  sections: any[];
  onEdit: () => void;
  onDelete: () => void;
  onMove: (targetSectionId: string) => void;
  onRename: (title: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lecture._id });
  const [renaming, setRenaming] = useState(false);
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = typeIcons[lecture.type] || FileVideo;
  const status = lectureStatus(lecture);

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between py-2 group ${isDragging ? 'opacity-50' : ''}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground" aria-label="Drag to reorder lecture">
          <GripVertical className="h-4 w-4" />
        </button>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        {renaming ? (
          <InlineRename
            initial={lecture.title}
            onCommit={(v) => { if (v) onRename(v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
            className="w-48"
          />
        ) : (
          <button onClick={onEdit} onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); }} className="truncate text-left text-sm hover:text-primary">
            {lecture.title}
          </button>
        )}
        {status === 'ready' ? (
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Ready</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Draft</span>
        )}
        {lecture.isFree && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Free</span>}
        {lecture.duration > 0 && <span className="shrink-0 text-xs text-muted-foreground">{Math.floor(lecture.duration / 60)}:{(lecture.duration % 60).toString().padStart(2, '0')}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit3 className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenaming(true)}><Edit3 className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
            <DropdownMenuSeparator />
            {sections.filter((s) => s._id !== lecture.section).map((s) => (
              <DropdownMenuItem key={s._id} onClick={() => onMove(s._id)}>
                <ArrowRightLeft className="mr-2 h-4 w-4" /> Move to “{s.title}”
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── Main curriculum tab ─────────────────────────────────────────────

export function CurriculumTab({
  curriculum,
  onAddSection,
  onRenameSection,
  onDeleteSection,
  onReorderSections,
  onEditLecture,
  onDeleteLecture,
  onAddLecture,
  onReorderLectures,
  onRenameLecture,
  onMoveLecture,
}: {
  curriculum: any[];
  onAddSection: (data: { title: string; description?: string }) => void;
  onRenameSection: (sectionId: string, title: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (sectionOrder: { sectionId: string; order: number }[]) => void;
  onEditLecture: (sectionId: string, lecture: any) => void;
  onDeleteLecture: (lectureId: string) => void;
  onAddLecture: (sectionId: string) => void;
  onReorderLectures: (sectionId: string, lectureOrder: { lectureId: string; order: number }[]) => void;
  onRenameLecture: (lectureId: string, title: string) => void;
  onMoveLecture: (lectureId: string, targetSectionId: string) => void;
}) {
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionDescription, setSectionDescription] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [sectionOrder, setSectionOrder] = useState<string[]>(curriculum.map((s) => s._id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onSectionDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sectionOrder.indexOf(String(active.id));
      const newIndex = sectionOrder.indexOf(String(over.id));
      const next = arrayMove(sectionOrder, oldIndex, newIndex);
      setSectionOrder(next);
      onReorderSections(next.map((id, i) => ({ sectionId: id, order: i })));
    }
  }, [sectionOrder, onReorderSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => { const n = new Set(prev); n.has(sectionId) ? n.delete(sectionId) : n.add(sectionId); return n; });
  };

  const addSection = () => {
    if (sectionTitle.trim()) {
      onAddSection({ title: sectionTitle, description: sectionDescription });
      setSectionTitle('');
      setSectionDescription('');
    }
  };

  if (curriculum.length === 0) {
    return (
      <div className="space-y-4">
        <EmptyCurriculumState onCreate={() => document.getElementById('section-title-input')?.focus()} />
        <div className="rounded-xl border p-4">
          <h3 className="mb-3 text-sm font-medium">Add New Section</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="section-title-input" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section title" className="sm:max-w-xs" />
            <Input value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} placeholder="Description (optional)" className="sm:max-w-sm" />
            <Button onClick={addSection}><Plus className="h-4 w-4" /> Add</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onSectionDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {curriculum.map((section) => (
              <SectionCard
                key={section._id}
                section={section}
                expanded={expandedSections.has(section._id)}
                onToggle={() => toggleSection(section._id)}
                onEdit={(lecture) => onEditLecture(section._id, lecture)}
                onDelete={() => onDeleteSection(section._id)}
                onRename={(title) => onRenameSection(section._id, title)}
                onAddLecture={() => onAddLecture(section._id)}
                onMoveLecture={(lecture, targetSectionId) => onMoveLecture(lecture._id, targetSectionId)}
                onDeleteLecture={onDeleteLecture}
                onRenameLecture={onRenameLecture}
                onReorderLectures={(order) => onReorderLectures(section._id, order)}
                sections={curriculum}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="rounded-xl border p-4">
        <h3 className="mb-3 text-sm font-medium">Add New Section</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Section title" className="sm:max-w-xs" />
          <Input value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} placeholder="Description (optional)" className="sm:max-w-sm" />
          <Button onClick={addSection}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </div>
    </div>
  );
}
