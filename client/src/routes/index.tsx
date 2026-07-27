import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppLayout } from '@/App';
import { AdminLayout } from '@/features/admin/AdminLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { VerifyEmailPage } from '@/features/auth/pages/VerifyEmailPage';
import { OAuthCallbackPage } from '@/features/auth/pages/OAuthCallbackPage';
import { DashboardPage } from '@/features/admin/pages/DashboardPage';
import { AnalyticsPage } from '@/features/admin/pages/AnalyticsPage';
import { RevenueDashboardPage } from '@/features/admin/pages/RevenueDashboardPage';
import { InstructorSubscriptionPlansPage } from '@/features/admin/pages/InstructorSubscriptionPlansPage';
import { AffiliatesPage } from '@/features/admin/pages/AffiliatesPage';
import { FeaturedPromotionsPage } from '@/features/admin/pages/FeaturedPromotionsPage';
import { UsersPage } from '@/features/admin/pages/UsersPage';
import { InstructorsPage } from '@/features/admin/pages/InstructorsPage';
import { CategoriesPage } from '@/features/admin/pages/CategoriesPage';
import { BlogPage } from '@/features/admin/pages/BlogPage';
import { CouponsPage } from '@/features/admin/pages/CouponsPage';
import { NotificationsPage } from '@/features/admin/pages/NotificationsPage';
import { SettingsPage } from '@/features/admin/pages/SettingsPage';
import { WalletPage } from '@/features/admin/pages/WalletPage';
import { PayoutsPage as AdminPayoutsPage } from '@/features/admin/pages/PayoutsPage';
import { CourseManagementPage } from '@/features/admin/pages/CourseManagementPage';
import { SubscriptionPlansPage } from '@/features/admin/pages/SubscriptionPlansPage';
import { ReviewsModerationPage } from '@/features/admin/pages/ReviewsModerationPage';
import { BannerManagementPage } from '@/features/admin/pages/BannerManagementPage';
import { RefundManagementPage } from '@/features/admin/pages/RefundManagementPage';
import { SupportTicketsPage } from '@/features/admin/pages/SupportTicketsPage';
import { CertificatesManagementPage } from '@/features/admin/pages/CertificatesManagementPage';
import { FAQPage } from '@/features/admin/pages/FAQPage';
import { EmailTemplatesPage } from '@/features/admin/pages/EmailTemplatesPage';
import { AuditLogsPage } from '@/features/admin/pages/AuditLogsPage';
import { SecurityLogsPage } from '@/features/admin/pages/SecurityLogsPage';
import { BackupRestorePage } from '@/features/admin/pages/BackupRestorePage';
import { FeatureTogglesPage } from '@/features/admin/pages/FeatureTogglesPage';
import { CMSPagesPage } from '@/features/admin/pages/CMSPagesPage';
import { RolePermissionsPage } from '@/features/admin/pages/RolePermissionsPage';
import { PaymentManagementPage } from '@/features/admin/pages/PaymentManagementPage';
import { StudentManagementPage } from '@/features/admin/pages/StudentManagementPage';
import { WithdrawRequestsPage } from '@/features/admin/pages/WithdrawRequestsPage';
import { InstructorLayout } from '@/features/instructor/InstructorLayout';
import { DashboardPage as InstructorDashboardPage } from '@/features/instructor/pages/DashboardPage';
import { CoursesListPage } from '@/features/instructor/pages/CoursesListPage';
import { CreateCoursePage } from '@/features/instructor/pages/CreateCoursePage';
import { EditCoursePage } from '@/features/instructor/pages/EditCoursePage';
import { RevenuePage } from '@/features/instructor/pages/RevenuePage';
import { ApplyPage } from '@/features/instructor/pages/ApplyPage';
import { InstructorPayoutsPage } from '@/features/instructor/pages/PayoutsPage';
import { AnalyticsPage as InstructorAnalyticsPage } from '@/features/instructor/pages/AnalyticsPage';
import { StudentManagementPage as InstructorStudentPage } from '@/features/instructor/pages/StudentManagementPage';
import { CouponsPage as InstructorCouponsPage } from '@/features/instructor/pages/CouponsPage';
import { ReviewsPage as InstructorReviewsPage } from '@/features/instructor/pages/ReviewsPage';
import { AnnouncementsPage } from '@/features/instructor/pages/AnnouncementsPage';
import { EditProfilePage as InstructorEditProfilePage } from '@/features/instructor/pages/EditProfilePage';
import { CertificatesPage as InstructorCertificatesPage } from '@/features/instructor/pages/CertificatesPage';
import { InstructorSubscriptionPage } from '@/features/instructor/pages/InstructorSubscriptionPage';
import { LiveClassesPage as InstructorLiveClassesPage } from '@/features/instructor/pages/LiveClassesPage';
import { LiveClassesPage as StudentLiveClassesPage } from '@/features/student/pages/LiveClassesPage';
import { StudyRemindersPage } from '@/features/student/pages/StudyRemindersPage';
import { CodingProblemsPage } from '@/features/student/pages/CodingProblemsPage';
import { CodingProblemSolvePage } from '@/features/student/pages/CodingProblemSolvePage';
import { BlogListPage } from '@/features/blog/pages/BlogListPage';
import { BlogDetailPage } from '@/features/blog/pages/BlogDetailPage';
import { CertificateVerifyPage } from '@/features/certificates/pages/CertificateVerifyPage';
import { AiAssistantPage } from '@/features/ai/pages/AiAssistantPage';
import { StudentLayout } from '@/features/student/StudentLayout';
import { DashboardPage as StudentDashboardPage } from '@/features/student/pages/DashboardPage';
import { MyCoursesPage } from '@/features/student/pages/MyCoursesPage';
import { CoursePlayerPage } from '@/features/student/pages/CoursePlayerPage';
import { CoursesPage } from '@/features/student/pages/CoursesPage';
import { NotesPage } from '@/features/student/pages/NotesPage';
import { QuizzesPage } from '@/features/student/pages/QuizzesPage';
import { AssignmentsPage } from '@/features/student/pages/AssignmentsPage';
import { CertificatesPage } from '@/features/student/pages/CertificatesPage';
import { WishlistPage } from '@/features/student/pages/WishlistPage';
import { OrderHistoryPage } from '@/features/student/pages/OrderHistoryPage';
import { NotificationsPage as StudentNotificationsPage } from '@/features/student/pages/NotificationsPage';
import { EditProfilePage } from '@/features/student/pages/EditProfilePage';
import { BundlesListPage } from '@/features/student/pages/BundlesListPage';
import { BundleDetailPage } from '@/features/student/pages/BundleDetailPage';
import { SubscriptionsPage } from '@/features/student/pages/SubscriptionsPage';

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <AppLayout />,
    children: [
      { index: true, element: <div>Home Page</div> },
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
      { path: ROUTES.FORGOT_PASSWORD, element: <ForgotPasswordPage /> },
      { path: ROUTES.RESET_PASSWORD, element: <ResetPasswordPage /> },
      { path: ROUTES.VERIFY_EMAIL, element: <VerifyEmailPage /> },
      { path: ROUTES.OAUTH_CALLBACK, element: <OAuthCallbackPage /> },
      {
        path: ROUTES.DASHBOARD,
        element: (
          <AuthGuard>
            <StudentDashboardPage />
          </AuthGuard>
        ),
      },
      {
        path: ROUTES.COURSES,
        element: <CoursesPage />,
      },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:slug', element: <BlogDetailPage /> },
      { path: '/certificates/verify/:certificateId', element: <CertificateVerifyPage /> },
      {
        path: '/instructor/apply',
        element: (
          <AuthGuard>
            <ApplyPage />
          </AuthGuard>
        ),
      },
      {
        path: '/coding/problems',
        element: (
          <AuthGuard>
            <CodingProblemsPage />
          </AuthGuard>
        ),
      },
      {
        path: '/coding/problems/:slug',
        element: (
          <AuthGuard>
            <CodingProblemSolvePage />
          </AuthGuard>
        ),
      },
      {
        path: '/ai/assistant',
        element: (
          <AuthGuard>
            <AiAssistantPage />
          </AuthGuard>
        ),
      },
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
      { index: true, element: <DashboardPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'revenue', element: <RevenueDashboardPage /> },
      { path: 'instructor-plans', element: <InstructorSubscriptionPlansPage /> },
      { path: 'affiliates', element: <AffiliatesPage /> },
      { path: 'promotions', element: <FeaturedPromotionsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'students', element: <StudentManagementPage /> },
      { path: 'instructors', element: <InstructorsPage /> },
      { path: 'courses', element: <CourseManagementPage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'subscriptions', element: <SubscriptionPlansPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'coupons', element: <CouponsPage /> },
      { path: 'payments', element: <PaymentManagementPage /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'payouts', element: <AdminPayoutsPage /> },
      { path: 'withdraw-requests', element: <WithdrawRequestsPage /> },
      { path: 'refunds', element: <RefundManagementPage /> },
      { path: 'reviews', element: <ReviewsModerationPage /> },
      { path: 'tickets', element: <SupportTicketsPage /> },
      { path: 'certificates', element: <CertificatesManagementPage /> },
      { path: 'banners', element: <BannerManagementPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'email-templates', element: <EmailTemplatesPage /> },
      { path: 'cms-pages', element: <CMSPagesPage /> },
      { path: 'role-permissions', element: <RolePermissionsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'feature-toggles', element: <FeatureTogglesPage /> },
      { path: 'audit-logs', element: <AuditLogsPage /> },
      { path: 'security-logs', element: <SecurityLogsPage /> },
      { path: 'backups', element: <BackupRestorePage /> },
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
      { index: true, element: <InstructorDashboardPage /> },
      { path: 'courses', element: <CoursesListPage /> },
      { path: 'courses/create', element: <CreateCoursePage /> },
      { path: 'courses/:id/edit', element: <EditCoursePage /> },
      { path: 'live-classes', element: <InstructorLiveClassesPage /> },
      { path: 'analytics', element: <InstructorAnalyticsPage /> },
      { path: 'students', element: <InstructorStudentPage /> },
      { path: 'revenue', element: <RevenuePage /> },
      { path: 'payouts', element: <InstructorPayoutsPage /> },
      { path: 'coupons', element: <InstructorCouponsPage /> },
      { path: 'reviews', element: <InstructorReviewsPage /> },
      { path: 'announcements', element: <AnnouncementsPage /> },
      { path: 'profile', element: <InstructorEditProfilePage /> },
      { path: 'subscription', element: <InstructorSubscriptionPage /> },
      { path: 'certificates', element: <InstructorCertificatesPage /> },
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
      { index: true, element: <StudentDashboardPage /> },
      { path: 'live-classes', element: <StudentLiveClassesPage /> },
      { path: 'my-courses', element: <MyCoursesPage /> },
      { path: 'courses/:courseId/learn', element: <CoursePlayerPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'quizzes', element: <QuizzesPage /> },
      { path: 'assignments', element: <AssignmentsPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'orders', element: <OrderHistoryPage /> },
      { path: 'notifications', element: <StudentNotificationsPage /> },
      { path: 'study-reminders', element: <StudyRemindersPage /> },
      { path: 'profile', element: <EditProfilePage /> },
      { path: 'certificates', element: <CertificatesPage /> },
      { path: 'bundles', element: <BundlesListPage /> },
      { path: 'bundles/:id', element: <BundleDetailPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
    ],
  },
]);
