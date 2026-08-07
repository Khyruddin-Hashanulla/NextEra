import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppLayout } from '@/App';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { InstructorLayout } from '@/features/instructor/InstructorLayout';
import { StudentLayout } from '@/features/student/StudentLayout';
import { RouteLoader } from '@/components/common/RouteLoader';

// Auth pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const OAuthCallbackPage = lazy(() => import('@/features/auth/pages/OAuthCallbackPage').then(m => ({ default: m.OAuthCallbackPage })));

// Public pages
const HomePage = lazy(() => import('@/features/public/pages/HomePage').then(m => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('@/features/public/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('@/features/public/pages/ContactPage').then(m => ({ default: m.ContactPage })));
const PublicFAQPage = lazy(() => import('@/features/public/pages/FAQPage').then(m => ({ default: m.FAQPage })));
const PrivacyPage = lazy(() => import('@/features/public/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('@/features/public/pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PublicCoursesPage = lazy(() => import('@/features/public/pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const CourseDetailPage = lazy(() => import('@/features/public/pages/CourseDetailPage').then(m => ({ default: m.CourseDetailPage })));
const PublicInstructorsPage = lazy(() => import('@/features/public/pages/InstructorsPage').then(m => ({ default: m.InstructorsPage })));
const InstructorProfilePage = lazy(() => import('@/features/public/pages/InstructorProfilePage').then(m => ({ default: m.InstructorProfilePage })));
const PublicBlogListPage = lazy(() => import('@/features/public/pages/BlogListPage').then(m => ({ default: m.BlogListPage })));
const PublicBlogDetailPage = lazy(() => import('@/features/public/pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));
const NotFoundPage = lazy(() => import('@/features/public/pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

// Blog pages (separate feature folder)
const BlogListPage = lazy(() => import('@/features/blog/pages/BlogListPage').then(m => ({ default: m.BlogListPage })));
const BlogDetailPage = lazy(() => import('@/features/blog/pages/BlogDetailPage').then(m => ({ default: m.BlogDetailPage })));

// Certificate pages
const CertificateVerifyPage = lazy(() => import('@/features/certificates/pages/CertificateVerifyPage').then(m => ({ default: m.CertificateVerifyPage })));

// AI Assistant
const AiAssistantPage = lazy(() => import('@/features/ai/pages/AiAssistantPage').then(m => ({ default: m.AiAssistantPage })));

// Admin pages
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AnalyticsPage = lazy(() => import('@/features/admin/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const RevenueDashboardPage = lazy(() => import('@/features/admin/pages/RevenueDashboardPage').then(m => ({ default: m.RevenueDashboardPage })));
const InstructorSubscriptionPlansPage = lazy(() => import('@/features/admin/pages/InstructorSubscriptionPlansPage').then(m => ({ default: m.InstructorSubscriptionPlansPage })));
const AffiliatesPage = lazy(() => import('@/features/admin/pages/AffiliatesPage').then(m => ({ default: m.AffiliatesPage })));
const FeaturedPromotionsPage = lazy(() => import('@/features/admin/pages/FeaturedPromotionsPage').then(m => ({ default: m.FeaturedPromotionsPage })));
const UsersPage = lazy(() => import('@/features/admin/pages/UsersPage').then(m => ({ default: m.UsersPage })));
const InstructorsPage = lazy(() => import('@/features/admin/pages/InstructorsPage').then(m => ({ default: m.InstructorsPage })));
const CategoriesPage = lazy(() => import('@/features/admin/pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const BlogPage = lazy(() => import('@/features/admin/pages/BlogPage').then(m => ({ default: m.BlogPage })));
const CouponsPage = lazy(() => import('@/features/admin/pages/CouponsPage').then(m => ({ default: m.CouponsPage })));
const NotificationsPage = lazy(() => import('@/features/admin/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/features/admin/pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const WalletPage = lazy(() => import('@/features/admin/pages/WalletPage').then(m => ({ default: m.WalletPage })));
const AdminPayoutsPage = lazy(() => import('@/features/admin/pages/PayoutsPage').then(m => ({ default: m.PayoutsPage })));
const CourseManagementPage = lazy(() => import('@/features/admin/pages/CourseManagementPage').then(m => ({ default: m.CourseManagementPage })));
const CourseReviewPage = lazy(() => import('@/features/admin/pages/CourseReviewPage').then(m => ({ default: m.CourseReviewPage })));
const SubscriptionPlansPage = lazy(() => import('@/features/admin/pages/SubscriptionPlansPage').then(m => ({ default: m.SubscriptionPlansPage })));
const ReviewsModerationPage = lazy(() => import('@/features/admin/pages/ReviewsModerationPage').then(m => ({ default: m.ReviewsModerationPage })));
const BannerManagementPage = lazy(() => import('@/features/admin/pages/BannerManagementPage').then(m => ({ default: m.BannerManagementPage })));
const RefundManagementPage = lazy(() => import('@/features/admin/pages/RefundManagementPage').then(m => ({ default: m.RefundManagementPage })));
const SupportTicketsPage = lazy(() => import('@/features/admin/pages/SupportTicketsPage').then(m => ({ default: m.SupportTicketsPage })));
const CertificatesManagementPage = lazy(() => import('@/features/admin/pages/CertificatesManagementPage').then(m => ({ default: m.CertificatesManagementPage })));
const AdminAssignmentsPage = lazy(() => import('@/features/admin/pages/AssignmentsPage').then(m => ({ default: m.AssignmentsPage })));
const AdminAssignmentDetailPage = lazy(() => import('@/features/admin/pages/AssignmentDetailPage').then(m => ({ default: m.AssignmentDetailPage })));
const AdminGradingLogsPage = lazy(() => import('@/features/admin/pages/GradingLogsPage').then(m => ({ default: m.GradingLogsPage })));
const RecordingManagementPage = lazy(() => import('@/features/admin/pages/RecordingManagementPage').then(m => ({ default: m.RecordingManagementPage })));
const AdminFAQPage = lazy(() => import('@/features/admin/pages/FAQPage').then(m => ({ default: m.FAQPage })));
const EmailTemplatesPage = lazy(() => import('@/features/admin/pages/EmailTemplatesPage').then(m => ({ default: m.EmailTemplatesPage })));
const AuditLogsPage = lazy(() => import('@/features/admin/pages/AuditLogsPage').then(m => ({ default: m.AuditLogsPage })));
const SecurityLogsPage = lazy(() => import('@/features/admin/pages/SecurityLogsPage').then(m => ({ default: m.SecurityLogsPage })));
const BackupRestorePage = lazy(() => import('@/features/admin/pages/BackupRestorePage').then(m => ({ default: m.BackupRestorePage })));
const FeatureTogglesPage = lazy(() => import('@/features/admin/pages/FeatureTogglesPage').then(m => ({ default: m.FeatureTogglesPage })));
const CMSPagesPage = lazy(() => import('@/features/admin/pages/CMSPagesPage').then(m => ({ default: m.CMSPagesPage })));
const RolePermissionsPage = lazy(() => import('@/features/admin/pages/RolePermissionsPage').then(m => ({ default: m.RolePermissionsPage })));
const PaymentManagementPage = lazy(() => import('@/features/admin/pages/PaymentManagementPage').then(m => ({ default: m.PaymentManagementPage })));
const StudentManagementPage = lazy(() => import('@/features/admin/pages/StudentManagementPage').then(m => ({ default: m.StudentManagementPage })));
const WithdrawRequestsPage = lazy(() => import('@/features/admin/pages/WithdrawRequestsPage').then(m => ({ default: m.WithdrawRequestsPage })));

// Instructor pages
const InstructorDashboardPage = lazy(() => import('@/features/instructor/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CoursesListPage = lazy(() => import('@/features/instructor/pages/CoursesListPage').then(m => ({ default: m.CoursesListPage })));
const CreateCoursePage = lazy(() => import('@/features/instructor/pages/CreateCoursePage').then(m => ({ default: m.CreateCoursePage })));
const EditCoursePage = lazy(() => import('@/features/instructor/pages/EditCoursePage').then(m => ({ default: m.EditCoursePage })));
const RevenuePage = lazy(() => import('@/features/instructor/pages/RevenuePage').then(m => ({ default: m.RevenuePage })));
const ApplyPage = lazy(() => import('@/features/instructor/pages/ApplyPage').then(m => ({ default: m.ApplyPage })));
const InstructorPayoutsPage = lazy(() => import('@/features/instructor/pages/PayoutsPage').then(m => ({ default: m.InstructorPayoutsPage })));
const InstructorAnalyticsPage = lazy(() => import('@/features/instructor/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const InstructorStudentPage = lazy(() => import('@/features/instructor/pages/StudentManagementPage').then(m => ({ default: m.StudentManagementPage })));
const InstructorCouponsPage = lazy(() => import('@/features/instructor/pages/CouponsPage').then(m => ({ default: m.CouponsPage })));
const InstructorReviewsPage = lazy(() => import('@/features/instructor/pages/ReviewsPage').then(m => ({ default: m.ReviewsPage })));
const AnnouncementsPage = lazy(() => import('@/features/instructor/pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const InstructorEditProfilePage = lazy(() => import('@/features/instructor/pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const InstructorCertificatesPage = lazy(() => import('@/features/instructor/pages/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const InstructorSubscriptionPage = lazy(() => import('@/features/instructor/pages/InstructorSubscriptionPage').then(m => ({ default: m.InstructorSubscriptionPage })));
const InstructorLiveClassesPage = lazy(() => import('@/features/instructor/pages/LiveClassesPage').then(m => ({ default: m.LiveClassesPage })));
const InstructorAssignmentsPage = lazy(() => import('@/features/instructor/pages/AssignmentsPage').then(m => ({ default: m.AssignmentsPage })));
const InstructorSubmissionsPage = lazy(() => import('@/features/instructor/pages/SubmissionsPage').then(m => ({ default: m.SubmissionsPage })));
const InstructorSubmissionDetailPage = lazy(() => import('@/features/instructor/pages/SubmissionDetailPage').then(m => ({ default: m.SubmissionDetailPage })));

// Student pages
const StudentDashboardPage = lazy(() => import('@/features/student/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MyCoursesPage = lazy(() => import('@/features/student/pages/MyCoursesPage').then(m => ({ default: m.MyCoursesPage })));
const CoursePlayerPage = lazy(() => import('@/features/student/pages/CoursePlayerPage').then(m => ({ default: m.CoursePlayerPage })));
const CoursesPage = lazy(() => import('@/features/student/pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const NotesPage = lazy(() => import('@/features/student/pages/NotesPage').then(m => ({ default: m.NotesPage })));
const QuizzesPage = lazy(() => import('@/features/student/pages/QuizzesPage').then(m => ({ default: m.QuizzesPage })));
const AssignmentsPage = lazy(() => import('@/features/student/pages/AssignmentsPage').then(m => ({ default: m.AssignmentsPage })));
const StudentAssignmentDetailPage = lazy(() => import('@/features/student/pages/AssignmentDetailPage').then(m => ({ default: m.AssignmentDetailPage })));
const StudentCertificatesPage = lazy(() => import('@/features/student/pages/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const WishlistPage = lazy(() => import('@/features/student/pages/WishlistPage').then(m => ({ default: m.WishlistPage })));
const OrderHistoryPage = lazy(() => import('@/features/student/pages/OrderHistoryPage').then(m => ({ default: m.OrderHistoryPage })));
const StudentNotificationsPage = lazy(() => import('@/features/student/pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const StudentEditProfilePage = lazy(() => import('@/features/student/pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })));
const BundlesListPage = lazy(() => import('@/features/student/pages/BundlesListPage').then(m => ({ default: m.BundlesListPage })));
const BundleDetailPage = lazy(() => import('@/features/student/pages/BundleDetailPage').then(m => ({ default: m.BundleDetailPage })));
const SubscriptionsPage = lazy(() => import('@/features/student/pages/SubscriptionsPage').then(m => ({ default: m.SubscriptionsPage })));
const StudentLiveClassesPage = lazy(() => import('@/features/student/pages/LiveClassesPage').then(m => ({ default: m.LiveClassesPage })));
const StudyRemindersPage = lazy(() => import('@/features/student/pages/StudyRemindersPage').then(m => ({ default: m.StudyRemindersPage })));
const CodingProblemsPage = lazy(() => import('@/features/student/pages/CodingProblemsPage').then(m => ({ default: m.CodingProblemsPage })));
const CodingProblemSolvePage = lazy(() => import('@/features/student/pages/CodingProblemSolvePage').then(m => ({ default: m.CodingProblemSolvePage })));

function SuspendedPage({ Component }: { Component: React.LazyExoticComponent<any> }) {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <AppLayout />,
    children: [
      { index: true, element: <SuspendedPage Component={HomePage} /> },
      { path: ROUTES.LOGIN, element: <SuspendedPage Component={LoginPage} /> },
      { path: ROUTES.REGISTER, element: <SuspendedPage Component={RegisterPage} /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <SuspendedPage Component={ForgotPasswordPage} /> },
      { path: ROUTES.RESET_PASSWORD, element: <SuspendedPage Component={ResetPasswordPage} /> },
      { path: ROUTES.VERIFY_EMAIL, element: <SuspendedPage Component={VerifyEmailPage} /> },
      { path: ROUTES.OAUTH_CALLBACK, element: <SuspendedPage Component={OAuthCallbackPage} /> },
      { path: ROUTES.ABOUT, element: <SuspendedPage Component={AboutPage} /> },
      { path: ROUTES.CONTACT, element: <SuspendedPage Component={ContactPage} /> },
      { path: ROUTES.FAQ, element: <SuspendedPage Component={PublicFAQPage} /> },
      { path: ROUTES.PRIVACY, element: <SuspendedPage Component={PrivacyPage} /> },
      { path: ROUTES.TERMS, element: <SuspendedPage Component={TermsPage} /> },
      { path: ROUTES.COURSES, element: <SuspendedPage Component={PublicCoursesPage} /> },
      { path: ROUTES.COURSE_DETAIL(':id'), element: <SuspendedPage Component={CourseDetailPage} /> },
      { path: ROUTES.BUNDLES, element: <SuspendedPage Component={BundlesListPage} /> },
      { path: ROUTES.BUNDLE_DETAIL(':id'), element: <SuspendedPage Component={BundleDetailPage} /> },
      { path: '/instructors', element: <SuspendedPage Component={PublicInstructorsPage} /> },
      { path: '/instructors/:id', element: <SuspendedPage Component={InstructorProfilePage} /> },
      { path: '/blog', element: <SuspendedPage Component={PublicBlogListPage} /> },
      { path: '/blog/:slug', element: <SuspendedPage Component={PublicBlogDetailPage} /> },
      { path: '/certificates/verify/:certificateId', element: <SuspendedPage Component={CertificateVerifyPage} /> },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <StudentDashboardPage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: '/instructor/apply',
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <ApplyPage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: '/coding/problems',
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <CodingProblemsPage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: '/coding/problems/:slug',
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <CodingProblemSolvePage />
            </Suspense>
          </AuthGuard>
        ),
      },
      {
        path: '/ai/assistant',
        element: (
          <AuthGuard>
            <Suspense fallback={<RouteLoader />}>
              <AiAssistantPage />
            </Suspense>
          </AuthGuard>
        ),
      },
      { path: '*', element: <SuspendedPage Component={NotFoundPage} /> },
    ],
  },
  {
    path: '/admin',
    element: (
      <AuthGuard allowedRoles={['admin']}>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspendedPage Component={AdminDashboardPage} /> },
      { path: 'analytics', element: <SuspendedPage Component={AnalyticsPage} /> },
      { path: 'revenue', element: <SuspendedPage Component={RevenueDashboardPage} /> },
      { path: 'instructor-plans', element: <SuspendedPage Component={InstructorSubscriptionPlansPage} /> },
      { path: 'affiliates', element: <SuspendedPage Component={AffiliatesPage} /> },
      { path: 'promotions', element: <SuspendedPage Component={FeaturedPromotionsPage} /> },
      { path: 'users', element: <SuspendedPage Component={UsersPage} /> },
      { path: 'students', element: <SuspendedPage Component={StudentManagementPage} /> },
      { path: 'instructors', element: <SuspendedPage Component={InstructorsPage} /> },
      { path: 'courses', element: <SuspendedPage Component={CourseManagementPage} /> },
      { path: 'courses/:id', element: <SuspendedPage Component={CourseReviewPage} /> },
      { path: 'categories', element: <SuspendedPage Component={CategoriesPage} /> },
      { path: 'subscriptions', element: <SuspendedPage Component={SubscriptionPlansPage} /> },
      { path: 'blog', element: <SuspendedPage Component={BlogPage} /> },
      { path: 'coupons', element: <SuspendedPage Component={CouponsPage} /> },
      { path: 'payments', element: <SuspendedPage Component={PaymentManagementPage} /> },
      { path: 'wallet', element: <SuspendedPage Component={WalletPage} /> },
      { path: 'payouts', element: <SuspendedPage Component={AdminPayoutsPage} /> },
      { path: 'withdraw-requests', element: <SuspendedPage Component={WithdrawRequestsPage} /> },
      { path: 'refunds', element: <SuspendedPage Component={RefundManagementPage} /> },
      { path: 'reviews', element: <SuspendedPage Component={ReviewsModerationPage} /> },
      { path: 'tickets', element: <SuspendedPage Component={SupportTicketsPage} /> },
      { path: 'assignments', element: <SuspendedPage Component={AdminAssignmentsPage} /> },
      { path: 'assignments/:id', element: <SuspendedPage Component={AdminAssignmentDetailPage} /> },
      { path: 'assignments/grading-log', element: <SuspendedPage Component={AdminGradingLogsPage} /> },
      { path: 'recordings', element: <SuspendedPage Component={RecordingManagementPage} /> },
      { path: 'certificates', element: <SuspendedPage Component={CertificatesManagementPage} /> },
      { path: 'banners', element: <SuspendedPage Component={BannerManagementPage} /> },
      { path: 'faq', element: <SuspendedPage Component={AdminFAQPage} /> },
      { path: 'email-templates', element: <SuspendedPage Component={EmailTemplatesPage} /> },
      { path: 'cms-pages', element: <SuspendedPage Component={CMSPagesPage} /> },
      { path: 'role-permissions', element: <SuspendedPage Component={RolePermissionsPage} /> },
      { path: 'notifications', element: <SuspendedPage Component={NotificationsPage} /> },
      { path: 'settings', element: <SuspendedPage Component={SettingsPage} /> },
      { path: 'feature-toggles', element: <SuspendedPage Component={FeatureTogglesPage} /> },
      { path: 'audit-logs', element: <SuspendedPage Component={AuditLogsPage} /> },
      { path: 'security-logs', element: <SuspendedPage Component={SecurityLogsPage} /> },
      { path: 'backups', element: <SuspendedPage Component={BackupRestorePage} /> },
    ],
  },
  {
    path: '/instructor',
    element: (
      <AuthGuard allowedRoles={['instructor', 'admin']}>
        <InstructorLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspendedPage Component={InstructorDashboardPage} /> },
      { path: 'courses', element: <SuspendedPage Component={CoursesListPage} /> },
      { path: 'courses/create', element: <SuspendedPage Component={CreateCoursePage} /> },
      { path: 'courses/:id/edit', element: <SuspendedPage Component={EditCoursePage} /> },
      { path: 'live-classes', element: <SuspendedPage Component={InstructorLiveClassesPage} /> },
      { path: 'assignments', element: <SuspendedPage Component={InstructorAssignmentsPage} /> },
      { path: 'assignments/:lectureId/submissions', element: <SuspendedPage Component={InstructorSubmissionsPage} /> },
      { path: 'assignments/submissions/:submissionId', element: <SuspendedPage Component={InstructorSubmissionDetailPage} /> },
      { path: 'analytics', element: <SuspendedPage Component={InstructorAnalyticsPage} /> },
      { path: 'students', element: <SuspendedPage Component={InstructorStudentPage} /> },
      { path: 'revenue', element: <SuspendedPage Component={RevenuePage} /> },
      { path: 'payouts', element: <SuspendedPage Component={InstructorPayoutsPage} /> },
      { path: 'coupons', element: <SuspendedPage Component={InstructorCouponsPage} /> },
      { path: 'reviews', element: <SuspendedPage Component={InstructorReviewsPage} /> },
      { path: 'announcements', element: <SuspendedPage Component={AnnouncementsPage} /> },
      { path: 'profile', element: <SuspendedPage Component={InstructorEditProfilePage} /> },
      { path: 'subscription', element: <SuspendedPage Component={InstructorSubscriptionPage} /> },
      { path: 'certificates', element: <SuspendedPage Component={InstructorCertificatesPage} /> },
    ],
  },
  {
    path: '/student',
    element: (
      <AuthGuard>
        <StudentLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <SuspendedPage Component={StudentDashboardPage} /> },
      { path: 'live-classes', element: <SuspendedPage Component={StudentLiveClassesPage} /> },
      { path: 'my-courses', element: <SuspendedPage Component={MyCoursesPage} /> },
      { path: 'courses/:courseId/learn', element: <SuspendedPage Component={CoursePlayerPage} /> },
      { path: 'notes', element: <SuspendedPage Component={NotesPage} /> },
      { path: 'quizzes', element: <SuspendedPage Component={QuizzesPage} /> },
      { path: 'assignments', element: <SuspendedPage Component={AssignmentsPage} /> },
      { path: 'assignments/:lectureId', element: <SuspendedPage Component={StudentAssignmentDetailPage} /> },
      { path: 'wishlist', element: <SuspendedPage Component={WishlistPage} /> },
      { path: 'orders', element: <SuspendedPage Component={OrderHistoryPage} /> },
      { path: 'notifications', element: <SuspendedPage Component={StudentNotificationsPage} /> },
      { path: 'study-reminders', element: <SuspendedPage Component={StudyRemindersPage} /> },
      { path: 'profile', element: <SuspendedPage Component={StudentEditProfilePage} /> },
      { path: 'certificates', element: <SuspendedPage Component={StudentCertificatesPage} /> },
      { path: 'bundles', element: <SuspendedPage Component={BundlesListPage} /> },
      { path: 'bundles/:id', element: <SuspendedPage Component={BundleDetailPage} /> },
      { path: 'subscriptions', element: <SuspendedPage Component={SubscriptionsPage} /> },
    ],
  },
]);
