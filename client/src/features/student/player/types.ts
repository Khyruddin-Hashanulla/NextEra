export interface PlayerInstructor {
  _id: string;
  name: string;
  email: string;
  avatar?: { url: string; publicId?: string };
  bio?: string;
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
  quiz?: {
    timeLimit?: number;
    passingScore?: number;
    maxAttempts?: number;
    questions?: {
      question: string;
      options?: string[];
      correctAnswer?: string;
      type?: string;
      marks?: number;
    }[];
  };
  assignment?: {
    question?: string;
    title?: string;
    description?: string;
  };
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