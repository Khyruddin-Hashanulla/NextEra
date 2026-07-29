import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Star, Users, Clock, BookOpen, Heart } from 'lucide-react';
import { useState } from 'react';
import type { MockCourse } from '@/mocks/types';

interface CourseCardProps {
  course: MockCourse;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export function CourseCard({ course, variant = 'default', className }: CourseCardProps) {
  const [favorited, setFavorited] = useState(false);

  const price = course.pricing?.originalPrice ?? course.price ?? 0;
  const discount = course.pricing?.discountPercent ?? 0;
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const thumbUrl = course.thumbnail?.url;
  const catName = course.category?.name;

  if (variant === 'compact') {
    return (
      <Link to={`/courses/${course._id}`} className={cn('group flex gap-3 rounded-xl bg-white p-3 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300', className)}>
        <div className="relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {thumbUrl ? (
            <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300"><BookOpen className="h-6 w-6" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{course.instructor?.name}</p>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" /> {course.totalDuration}h
            </div>
            <span className="text-xs font-semibold text-primary">
              {discountedPrice === 0 ? 'Free' : `$${discountedPrice.toFixed(0)}`}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link to={`/courses/${course._id}`} className={cn('group block rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden', className)}>
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {thumbUrl ? (
            <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300"><BookOpen className="h-10 w-10" /></div>
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{discount}% OFF</span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setFavorited(!favorited); }}
            className={cn('absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110', favorited && 'text-red-500')}
          >
            <Heart className={cn('h-4 w-4', favorited ? 'fill-current' : '')} />
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            {catName && <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{catName}</span>}
          </div>
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5 text-gray-400" /> {course.totalEnrollments ?? 0}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5 text-gray-400" /> {course.totalDuration}h
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">{course.averageRating?.toFixed(1) ?? '4.5'}</span>
            </div>
            <span className="text-sm font-bold text-primary">
              {discountedPrice === 0 ? 'Free' : `$${discountedPrice.toFixed(0)}`}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/courses/${course._id}`} className={cn('group block rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden', className)}>
      <div className="relative h-44 overflow-hidden bg-gray-100">
        {thumbUrl ? (
          <img src={thumbUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300"><BookOpen className="h-10 w-10" /></div>
        )}
        {course.level && (
          <span className={cn(
            'absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full',
            course.level === 'beginner' && 'bg-green-100 text-green-700',
            course.level === 'intermediate' && 'bg-yellow-100 text-yellow-700',
            course.level === 'advanced' && 'bg-red-100 text-red-700',
          )}>
            {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); setFavorited(!favorited); }}
          className={cn('absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition-all hover:scale-110 opacity-0 group-hover:opacity-100', favorited && 'opacity-100 text-red-500')}
        >
          <Heart className={cn('h-4 w-4', favorited ? 'fill-current' : '')} />
        </button>
      </div>
      <div className="p-5">
        {catName && <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full mb-2 inline-block">{catName}</span>}
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="text-sm text-gray-500 mt-1">{course.instructor?.name}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium text-gray-700">{course.averageRating?.toFixed(1) ?? '4.5'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="h-3.5 w-3.5" /> {course.totalEnrollments ?? 0}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="h-3.5 w-3.5" /> {course.totalDuration}h
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-gray-900">${discountedPrice.toFixed(0)}</span>
            {discount > 0 && (
              <span className="text-sm text-gray-400 line-through">${price.toFixed(0)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
