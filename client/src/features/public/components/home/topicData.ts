import {
  Atom,
  Binary,
  BrainCircuit,
  Cloud,
  Code2,
  Coffee,
  Cpu,
  LayoutGrid,
  Shield,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface HeroTopic {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  courses: number;
  students: number;
}

export const HERO_TOPICS: HeroTopic[] = [
  {
    id: 'full-stack-development',
    name: 'Full Stack Development',
    description: 'Learn React, Node.js and MongoDB to ship complete products end-to-end.',
    icon: Code2,
    gradient: 'from-sky-500 to-blue-600',
    courses: 120,
    students: 50000,
  },
  {
    id: 'data-structures-algorithms',
    name: 'Data Structures & Algorithms',
    description: 'Master the patterns that power interviews at top product companies.',
    icon: Binary,
    gradient: 'from-emerald-500 to-teal-600',
    courses: 85,
    students: 40000,
  },
  {
    id: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    description: 'Build intelligent systems with modern AI frameworks and tools.',
    icon: BrainCircuit,
    gradient: 'from-violet-500 to-purple-600',
    courses: 64,
    students: 32000,
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    description: 'Go from raw data to models — regression, classification and deep learning.',
    icon: Cpu,
    gradient: 'from-fuchsia-500 to-pink-600',
    courses: 90,
    students: 45000,
  },
  {
    id: 'cloud-computing',
    name: 'Cloud Computing',
    description: 'Design, deploy and scale applications on AWS, Azure and GCP.',
    icon: Cloud,
    gradient: 'from-cyan-500 to-sky-600',
    courses: 72,
    students: 28000,
  },
  {
    id: 'cyber-security',
    name: 'Cyber Security',
    description: 'Protect systems and networks with hands-on security labs and drills.',
    icon: Shield,
    gradient: 'from-rose-500 to-red-600',
    courses: 58,
    students: 21000,
  },
  {
    id: 'java-programming',
    name: 'Java Programming',
    description: 'Object-oriented foundations to advanced Spring and microservices.',
    icon: Coffee,
    gradient: 'from-amber-500 to-orange-600',
    courses: 66,
    students: 26000,
  },
  {
    id: 'react-development',
    name: 'React Development',
    description: 'Component-driven UIs with React, TypeScript and modern tooling.',
    icon: Atom,
    gradient: 'from-sky-500 to-indigo-600',
    courses: 110,
    students: 55000,
  },
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Architect scalable, reliable systems for real-world production loads.',
    icon: LayoutGrid,
    gradient: 'from-teal-500 to-emerald-600',
    courses: 42,
    students: 18000,
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'Automate delivery with CI/CD, Docker, Kubernetes and infrastructure as code.',
    icon: Workflow,
    gradient: 'from-indigo-500 to-violet-600',
    courses: 55,
    students: 23000,
  },
];
