import {
  Code2,
  Database,
  Briefcase,
  Palette,
  BrainCircuit,
  Shield,
  Cloud,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

interface CategoryMeta {
  icon: LucideIcon;
  description: string;
}

const CATEGORY_META: { keywords: string[]; meta: CategoryMeta }[] = [
  {
    keywords: ['development', 'programming', 'web', 'react', 'javascript', 'typescript', 'node', 'python', 'java', 'coding', 'full stack', 'terminal'],
    meta: { icon: Code2, description: 'Programming and software development' },
  },
  {
    keywords: ['data', 'science', 'analytics', 'sql', 'database', 'visualization'],
    meta: { icon: Database, description: 'Data science, analytics and databases' },
  },
  {
    keywords: ['business', 'product', 'marketing', 'management', 'finance', 'entrepreneur'],
    meta: { icon: Briefcase, description: 'Business, product and management' },
  },
  {
    keywords: ['design', 'ui', 'ux', 'creative', 'graphic', 'visual'],
    meta: { icon: Palette, description: 'Design, UI/UX and creative skills' },
  },
  {
    keywords: ['ai', 'machine', 'intelligence', 'deep', 'ml'],
    meta: { icon: BrainCircuit, description: 'Artificial intelligence and machine learning' },
  },
  {
    keywords: ['security', 'cyber', 'hacking'],
    meta: { icon: Shield, description: 'Cybersecurity and information security' },
  },
  {
    keywords: ['cloud', 'devops', 'aws', 'infrastructure', 'kubernetes'],
    meta: { icon: Cloud, description: 'Cloud computing and infrastructure' },
  },
];

export function getCategoryMeta(name: string): CategoryMeta {
  const normalized = name.toLowerCase();
  for (const entry of CATEGORY_META) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) return entry.meta;
  }
  return { icon: FolderOpen, description: `Explore courses in ${name}` };
}