export interface CoursePricingInput {
  courseType?: string;
  price?: number;
  pricing?: {
    originalPrice?: number;
    discountPercent?: number;
    hasDiscount?: boolean;
  };
}

export interface CoursePricing {
  isFree: boolean;
  price: number;
  originalPrice: number;
  discountPercent: number;
  hasDiscount: boolean;
}

/**
 * Single source of truth for course pricing across the entire app.
 *
 * Business rule: a course is FREE when its type is 'free' or its charged price
 * is not greater than zero. FREE courses never display a price, original price,
 * discount, or strike-through — they always render "FREE".
 */
export function isFreeCourse(course?: CoursePricingInput | null): boolean {
  if (!course) return true;
  return course.courseType === 'free' || !(course.price ?? 0 > 0);
}

export function getCoursePricing(course?: CoursePricingInput | null): CoursePricing {
  const isFree = isFreeCourse(course);
  const price = isFree ? 0 : course?.price || 0;
  const originalPrice = isFree ? 0 : course?.pricing?.originalPrice || 0;
  const discountPercent = isFree ? 0 : course?.pricing?.discountPercent || 0;
  const hasDiscount = !isFree && !!course?.pricing?.hasDiscount && discountPercent > 0 && originalPrice > price;
  return { isFree, price, originalPrice, discountPercent, hasDiscount };
}
