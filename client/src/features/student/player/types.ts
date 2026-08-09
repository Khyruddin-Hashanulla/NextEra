export interface PlayerInstructor {
  _id: string;
  name: string;
  email: string;
  avatar?: { url: string; publicId?: string };
  bio?: string;
}

export interface PlayerResource {
  url: string;
  publicId: string;
  name: string;
  type: string;
  size: number;
}

export interface PlayerLectureLink {
  id: string;
  label: string;
  url: string;
}

export interface PlayerAssignment {
  question?: string;
  instructions?: string;
  dueDate?: string;
  totalMarks?: number;
  passingMarks?: number;
  allowLateSubmission?: boolean;
  lateSubmissionDays?: number;
  penaltyPercent?: number;
  title?: string;
  description?: string;
}

export interface PlayerQuiz {
  timeLimit?: number;
  passingScore?: number;
  maxAttempts?: number;
  showResults?: boolean;
  randomizeQuestions?: boolean;
  negativeMarking?: boolean;
  partialMarking?: boolean;
  attemptCooldownMinutes?: number;
  allowResume?: boolean;
  shuffleOptions?: boolean;
  scoringPolicy?: string;
  questions?: {
    question: string;
    options?: string[];
    correctAnswer?: string;
    type?: string;
    marks?: number;
    explanation?: string;
  }[];
}

export interface PlayerLecture {
  _id: string;
  title: string;
  type: 'video' | 'article' | 'quiz' | 'assignment';
  duration?: number;
  order?: number;
  isFree?: boolean;
  description?: string;
  videoSource?: {
    source?: string;
    videoId?: string;
    url?: string;
    thumbnailUrl?: string;
  };
  videoUrl?: { url?: string; publicId?: string };
  articleContent?: string;
  resources?: PlayerResource[];
  links?: PlayerLectureLink[];
  attachments?: PlayerResource[];
  notes?: string;
  quiz?: PlayerQuiz;
  assignment?: PlayerAssignment;
}

export interface PlayerSection {
  _id: string;
  title: string;
  totalDuration?: number;
  lectures: PlayerLecture[];
}

export interface PlayerEnrollment {
  completedLectures?: string[];
  completionPercentage?: number;
}

export interface PlayerCourse {
  _id: string;
  title: string;
  thumbnail?: { url: string; publicId: string };
  instructor?: PlayerInstructor;
  totalDuration?: number;
  totalLectures?: number;
}

export interface PlayerCourseDetail {
  course?: PlayerCourse;
  curriculum?: PlayerSection[];
  isEnrolled?: boolean;
  enrollment?: PlayerEnrollment;
}