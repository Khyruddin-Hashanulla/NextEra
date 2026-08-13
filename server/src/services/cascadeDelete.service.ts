import mongoose from 'mongoose';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { Lecture } from '../models/lecture.model';
import { Enrollment } from '../models/enrollment.model';
import { Review } from '../models/review.model';
import { Note } from '../models/note.model';
import { QuizAttempt } from '../models/quizAttempt.model';
import { AssignmentSubmission } from '../models/assignmentSubmission.model';
import { Certificate } from '../models/certificate.model';
import { Wishlist } from '../models/wishlist.model';
import { Bookmark } from '../models/bookmark.model';
import { Discussion } from '../models/discussion.model';
import { Notification } from '../models/notification.model';
import { Announcement } from '../models/announcement.model';
import { LiveClass } from '../models/liveClass.model';
import { LiveClassRecording } from '../models/liveClassRecording.model';
import { CodingProblem } from '../models/codingProblem.model';
import { CodingSubmission } from '../models/codingSubmission.model';
import { Coupon } from '../models/coupon.model';
import { FeaturedPromotion } from '../models/featuredPromotion.model';
import { StudyReminder } from '../models/studyReminder.model';
import { Payment } from '../models/payment.model';
import { Refund } from '../models/refund.model';
import { Bundle } from '../models/bundle.model';
import { Payout } from '../models/payout.model';
import { Affiliate } from '../models/affiliate.model';
import { InstructorApplication } from '../models/instructorApplication.model';
import { SupportTicket } from '../models/supportTicket.model';
import { BlogComment } from '../models/blogComment.model';
import { BlogBookmark } from '../models/blogBookmark.model';
import { Session } from '../models/session.model';
import { RevokedToken } from '../models/revokedToken.model';
import { SubscriptionEnrollment } from '../models/subscriptionEnrollment.model';
import { InstructorSubscription } from '../models/instructorSubscription.model';
import { User } from '../models/user.model';
import { uploadService } from './upload.service';

export class CascadeDeleteService {
  async deleteCourse(courseId: string, session: mongoose.ClientSession): Promise<void> {
    const [lectures, codingProblems] = await Promise.all([
      Lecture.find({ course: courseId })
        .select(
          '_id videoUrl.publicId resources.publicId attachments.publicId sourceCode.publicId practiceFiles.publicId'
        )
        .lean(),
      CodingProblem.find({ course: courseId }).select('_id').lean(),
    ]);

    const codingProblemIds = codingProblems.map((cp) => cp._id);

    await Promise.all([
      Section.deleteMany({ course: courseId }, { session }),
      Lecture.deleteMany({ course: courseId }, { session }),
      Enrollment.deleteMany({ course: courseId }, { session }),
      Review.deleteMany({ course: courseId }, { session }),
      Note.deleteMany({ course: courseId }, { session }),
      QuizAttempt.deleteMany({ course: courseId }, { session }),
      AssignmentSubmission.deleteMany({ course: courseId }, { session }),
      Certificate.deleteMany({ course: courseId }, { session }),
      Wishlist.deleteMany({ course: courseId }, { session }),
      Bookmark.deleteMany({ course: courseId }, { session }),
      Discussion.deleteMany({ course: courseId }, { session }),
      Notification.deleteMany({ course: courseId }, { session }),
      Announcement.deleteMany({ course: courseId }, { session }),
      LiveClass.deleteMany({ course: courseId }, { session }),
      LiveClassRecording.deleteMany({ course: courseId }, { session }),
      codingProblemIds.length > 0
        ? CodingSubmission.deleteMany({ problem: { $in: codingProblemIds } }, { session })
        : Promise.resolve(),
      CodingProblem.deleteMany({ course: courseId }, { session }),
      Coupon.deleteMany({ course: courseId }, { session }),
      FeaturedPromotion.deleteMany({ course: courseId }, { session }),
      StudyReminder.deleteMany({ course: courseId }, { session }),
      Payment.updateMany({ course: courseId }, { $set: { course: null } }, { session }),
      Refund.updateMany({ course: courseId }, { $set: { course: null } }, { session }),
      Bundle.updateMany({ courses: courseId }, { $pull: { courses: courseId } }, { session }),
    ]);

    this.collectCloudinaryCleanup(lectures).catch(() => {});
  }

  async deleteSection(sectionId: string, courseId: string, session: mongoose.ClientSession): Promise<void> {
    const lectures = await Lecture.find({ section: sectionId })
      .select(
        '_id videoUrl.publicId resources.publicId attachments.publicId sourceCode.publicId practiceFiles.publicId'
      )
      .lean();

    const lectureIds = lectures.map((l) => l._id);

    await Lecture.deleteMany({ section: sectionId }, { session });

    if (lectureIds.length > 0) {
      await Promise.all([
        QuizAttempt.deleteMany({ lecture: { $in: lectureIds } }, { session }),
        AssignmentSubmission.deleteMany({ lecture: { $in: lectureIds } }, { session }),
        Bookmark.deleteMany({ lecture: { $in: lectureIds } }, { session }),
        Note.deleteMany({ lecture: { $in: lectureIds } }, { session }),
        Discussion.deleteMany({ lecture: { $in: lectureIds } }, { session }),
      ]);
    }

    this.collectCloudinaryCleanup(lectures).catch(() => {});
  }

  async deleteLecture(lectureId: string, courseId: string, session: mongoose.ClientSession): Promise<void> {
    const lecture = await Lecture.findOneAndDelete({ _id: lectureId, course: courseId }, { session });
    if (!lecture) return;

    await Promise.all([
      QuizAttempt.deleteMany({ lecture: lectureId }, { session }),
      AssignmentSubmission.deleteMany({ lecture: lectureId }, { session }),
      Bookmark.deleteMany({ lecture: lectureId }, { session }),
      Note.deleteMany({ lecture: lectureId }, { session }),
      Discussion.deleteMany({ lecture: lectureId }, { session }),
      Enrollment.updateMany(
        { course: courseId },
        { $pull: { completedLectures: lectureId, watchHistory: { lecture: lectureId } } },
        { session }
      ),
    ]);

    this.collectCloudinaryCleanup([lecture]).catch(() => {});
  }

  async deleteUser(userId: string, deletedBy: string, session: mongoose.ClientSession): Promise<void> {
    const user = await User.findById(userId).session(session);
    if (!user) return;

    const anonymizedEmail = `deleted_${userId.toString().slice(-8)}@deleted.localhost`;

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: 'Deleted User',
          email: anonymizedEmail,
          phone: '',
          address: '',
          bio: '',
          avatar: { url: '', publicId: '' },
          socialLinks: { youtube: '', twitter: '', linkedin: '', github: '', portfolio: '', website: '' },
          googleId: undefined,
          isActive: false,
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: deletedBy as any,
          failedLoginAttempts: 0,
          accountLockedUntil: undefined,
          lockLevel: 0,
          lastFailedLogin: undefined,
          lastFailedLoginIp: '',
          resetPasswordToken: undefined,
          resetPasswordExpire: undefined,
          instructorProfile: {
            qualification: '',
            experience: '',
            expertise: [],
            resume: { url: '', publicId: '' },
            identityProof: { url: '', publicId: '' },
            demoVideo: { url: '', publicId: '' },
            taxDetails: { pan: '', gst: '' },
            bankDetails: {
              accountHolderName: '',
              accountNumber: '',
              ifscCode: '',
              bankName: '',
              branch: '',
              upiId: '',
            },
            teachingCategories: [],
            completedCourses: 0,
            totalStudents: 0,
            totalEarnings: 0,
            rating: 0,
            subscriptionStatus: 'none',
            subscriptionExpiry: undefined,
          },
        },
      },
      { session }
    );

    const userObjectId = user._id as mongoose.Types.ObjectId;

    const userCodingProblems = await CodingProblem.find({ createdBy: userObjectId }).select('_id').lean();
    const userCodingProblemIds = userCodingProblems.map((cp) => cp._id);

    await Promise.all([
      Session.deleteMany({ userId: userObjectId }, { session }),
      RevokedToken.deleteMany({ userId: userObjectId }, { session }),
      Enrollment.deleteMany({ user: userObjectId }, { session }),
      Notification.deleteMany({ user: userObjectId }, { session }),
      Bookmark.deleteMany({ user: userObjectId }, { session }),
      Wishlist.deleteMany({ user: userObjectId }, { session }),
      Note.deleteMany({ user: userObjectId }, { session }),
      QuizAttempt.deleteMany({ user: userObjectId }, { session }),
      StudyReminder.deleteMany({ user: userObjectId }, { session }),
      BlogBookmark.deleteMany({ user: userObjectId }, { session }),
      SubscriptionEnrollment.deleteMany({ user: userObjectId }, { session }),
      Affiliate.deleteMany({ user: userObjectId }, { session }),
      InstructorApplication.deleteMany({ user: userObjectId }, { session }),
      CodingSubmission.deleteMany({ user: userObjectId }, { session }),
      userCodingProblemIds.length > 0
        ? CodingSubmission.deleteMany({ problem: { $in: userCodingProblemIds } }, { session })
        : Promise.resolve(),
      Review.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      Discussion.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      Discussion.updateMany(
        { 'replies.user': userObjectId },
        { $set: { 'replies.$[].user': userObjectId } },
        { session }
      ),
      SupportTicket.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      SupportTicket.updateMany({ assignedTo: userObjectId }, { $set: { assignedTo: null } }, { session }),
      SupportTicket.updateMany(
        { 'messages.sender': userObjectId },
        { $set: { 'messages.$[].sender': userObjectId } },
        { session }
      ),
      BlogComment.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      BlogComment.updateMany({ likes: userObjectId }, { $pull: { likes: userObjectId } }, { session }),
      Certificate.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      AssignmentSubmission.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      AssignmentSubmission.updateMany({ gradedBy: userObjectId }, { $set: { gradedBy: null } }, { session }),
      LiveClass.updateMany({ instructor: userObjectId }, { $set: { instructor: userObjectId } }, { session }),
      LiveClassRecording.updateMany({ instructor: userObjectId }, { $set: { instructor: userObjectId } }, { session }),
      Announcement.updateMany({ instructor: userObjectId }, { $set: { instructor: userObjectId } }, { session }),
      Coupon.deleteMany({ createdBy: userObjectId }, { session }),
      CodingProblem.deleteMany({ createdBy: userObjectId }, { session }),
      FeaturedPromotion.updateMany({ instructor: userObjectId }, { $set: { instructor: null } }, { session }),
      Payment.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      Payment.updateMany(
        { 'commissionSplits.instructor': userObjectId },
        { $set: { 'commissionSplits.$[].instructor': userObjectId } },
        { session }
      ),
      Payout.updateMany({ instructor: userObjectId }, { $set: { instructor: userObjectId } }, { session }),
      Refund.updateMany({ user: userObjectId }, { $set: { user: userObjectId } }, { session }),
      Refund.updateMany({ processedBy: userObjectId }, { $set: { processedBy: null } }, { session }),
      InstructorSubscription.updateMany(
        { instructor: userObjectId },
        { $set: { instructor: userObjectId } },
        { session }
      ),
    ]);

    const courses = await Course.find({ instructor: userObjectId }).select('_id').lean();
    for (const course of courses) {
      await this.deleteCourse(course._id.toString(), session);
    }
  }

  private async collectCloudinaryCleanup(lectures: any[]): Promise<void> {
    const publicIds: { publicId: string; resourceType: 'image' | 'video' | 'raw' }[] = [];

    for (const lecture of lectures) {
      if (lecture.videoUrl?.publicId) {
        publicIds.push({ publicId: lecture.videoUrl.publicId, resourceType: 'video' });
      }
      for (const resource of lecture.resources || []) {
        if (resource.publicId) publicIds.push({ publicId: resource.publicId, resourceType: 'raw' });
      }
      for (const attachment of lecture.attachments || []) {
        if (attachment.publicId) publicIds.push({ publicId: attachment.publicId, resourceType: 'image' });
      }
      if (lecture.sourceCode?.publicId) {
        publicIds.push({ publicId: lecture.sourceCode.publicId, resourceType: 'raw' });
      }
      for (const pf of lecture.practiceFiles || []) {
        if (pf.publicId) publicIds.push({ publicId: pf.publicId, resourceType: 'raw' });
      }
    }

    await Promise.allSettled(
      publicIds.map(({ publicId, resourceType }) => uploadService.deleteFile(publicId, resourceType))
    );
  }
}

export const cascadeDeleteService = new CascadeDeleteService();
