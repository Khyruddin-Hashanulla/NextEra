import { IUser } from '../interfaces/IUser';
import { IInstructorApplication } from '../models/instructorApplication.model';

/**
 * Copies the profile fields submitted in an instructor application onto the
 * User's live instructor profile. This is what makes an approved application's
 * data visible on the public Instructor Details page (the page reads the User,
 * not the application).
 *
 * Idempotent: non-empty application values win, existing user values are kept
 * when the application did not provide one.
 */
export function mergeInstructorApplicationIntoUser(user: IUser, application: Partial<IInstructorApplication>): void {
  if (application.fullName) user.name = application.fullName;
  if (application.phone) user.phone = application.phone;
  if (application.address) user.address = application.address;
  if (application.photo?.url) user.avatar = application.photo;
  if (application.bio) user.bio = application.bio;

  user.socialLinks = {
    youtube: user.socialLinks?.youtube || '',
    twitter: user.socialLinks?.twitter || '',
    linkedin: application.linkedin || user.socialLinks?.linkedin || '',
    github: application.github || user.socialLinks?.github || '',
    portfolio: application.portfolio || user.socialLinks?.portfolio || '',
    website: application.website || user.socialLinks?.website || '',
  };

  const current = user.instructorProfile;
  user.instructorProfile = {
    qualification: application.qualification || current?.qualification || '',
    experience: application.experience || current?.experience || '',
    expertise: current?.expertise || [],
    resume: application.resume || current?.resume,
    identityProof: application.identityProof || current?.identityProof,
    demoVideo: application.demoVideo || current?.demoVideo,
    taxDetails: application.taxDetails || current?.taxDetails,
    bankDetails: application.bankDetails || current?.bankDetails,
    teachingCategories:
      application.teachingCategories && application.teachingCategories.length > 0
        ? application.teachingCategories
        : current?.teachingCategories || [],
    completedCourses: current?.completedCourses ?? 0,
    totalStudents: current?.totalStudents ?? 0,
    totalEarnings: current?.totalEarnings ?? 0,
    rating: current?.rating ?? 0,
    subscriptionStatus: current?.subscriptionStatus ?? 'none',
    subscriptionExpiry: current?.subscriptionExpiry,
  };
}
