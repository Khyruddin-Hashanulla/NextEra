import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Star, Users, Award, BookOpen } from 'lucide-react';
import { OptimizedImage } from '@/components/common/OptimizedImage';

interface Instructor {
  _id: string;
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
  specialties?: string[];
  rating?: number;
  studentsCount?: number;
  coursesCount?: number;
}

interface InstructorCardProps {
  instructor: Instructor;
  className?: string;
}

export function InstructorCard({ instructor, className }: InstructorCardProps) {
  const initials = instructor.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';

  return (
    <Link
      to={`/instructors/${instructor._id}`}
      className={cn(
        'group block rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 text-center',
        className
      )}
    >
      <div className="relative mx-auto w-20 h-20 mb-4">
        {instructor.avatar ? (
          <OptimizedImage src={instructor.avatar} alt={`Profile photo of ${instructor.name}`} placeholderType="avatar" className="rounded-full object-cover" lazy />
        ) : (
          <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
            {initials}
          </div>
        )}
        {instructor.rating && (
          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-white rounded-full px-2 py-0.5 shadow-sm border border-gray-100 text-xs font-semibold text-yellow-600">
            <Star className="h-3 w-3 fill-yellow-400" /> {instructor.rating}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
        {instructor.name}
      </h3>
      {instructor.title && (
        <p className="text-sm text-gray-500 mt-0.5">{instructor.title}</p>
      )}
      {instructor.bio && (
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{instructor.bio}</p>
      )}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> {instructor.coursesCount ?? 0} courses
        </div>
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {instructor.studentsCount ?? 0} students
        </div>
      </div>
      {instructor.specialties && instructor.specialties.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-4">
          {instructor.specialties.slice(0, 3).map((specialty) => (
            <span key={specialty} className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
              {specialty}
            </span>
          ))}
          {instructor.specialties.length > 3 && (
            <span className="text-xs text-gray-400">+{instructor.specialties.length - 3} more</span>
          )}
        </div>
      )}
    </Link>
  );
}
