import { Request, Response, NextFunction } from 'express';
import { subscriptionPermissionService } from '../services/subscriptionPermission.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';

export const requireProPlan = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(req.currentUser!.userId);
  if (!subscriptionPermissionService.isActive(planInfo) || !planInfo.features.unlimitedCourses) {
    return next(createSubscriptionError('Pro'));
  }
  req.instructorPlan = planInfo;
  next();
});

export const requirePremiumPlan = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(req.currentUser!.userId);
  if (!subscriptionPermissionService.isActive(planInfo) || !planInfo.features.featuredInstructor) {
    return next(createSubscriptionError('Premium'));
  }
  req.instructorPlan = planInfo;
  next();
});

export const requireSubscription = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(req.currentUser!.userId);
  if (!subscriptionPermissionService.isActive(planInfo)) {
    return next(
      createSubscriptionError('Pro', 'You need an active subscription plan. Upgrade to access this feature.')
    );
  }
  req.instructorPlan = planInfo;
  next();
});

export const requireFeaturePermission = (
  featureCheck: (info: import('../services/subscriptionPermission.service').InstructorPlanInfo) => boolean,
  featureName: string,
  upgradePlan: string
) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const planInfo = await subscriptionPermissionService.getInstructorPlanInfo(req.currentUser!.userId);
    if (!featureCheck(planInfo)) {
      return next(
        createSubscriptionError(
          upgradePlan,
          `${featureName} is available on the ${upgradePlan} plan. Upgrade to access this feature.`
        )
      );
    }
    req.instructorPlan = planInfo;
    next();
  });

function createSubscriptionError(requiredPlan: string, message?: string): ApiError {
  const err = ApiError.forbidden(
    message || `${requiredPlan} subscription required. Please upgrade your plan.`,
    'SUBSCRIPTION_REQUIRED'
  );
  (err as any).requiredPlan = requiredPlan;
  return err;
}
