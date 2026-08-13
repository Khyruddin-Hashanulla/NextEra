import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  FolderTree,
  FileText,
  Percent,
  Bell,
  Settings,
  ChevronLeft,
  Wallet,
  Banknote,
  BookOpen,
  CreditCard,
  Star,
  Image,
  RotateCcw,
  Ticket,
  Award,
  HelpCircle,
  Mail,
  ClipboardList,
  Shield,
  Download,
  File,
  ShieldCheck,
  DollarSign,
  GraduationCap,
  Crown,
  ExternalLink,
  TrendingUp,
  ToggleLeft,
  ClipboardCheck,
  History,
  Video,
} from 'lucide-react';
import { useState } from 'react';
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/revenue', label: 'Revenue Dashboard', icon: TrendingUp },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/students', label: 'Students', icon: GraduationCap },
  { href: '/admin/instructors', label: 'Instructors', icon: UserCheck },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { href: '/admin/instructor-plans', label: 'Instructor Plans', icon: Crown },
  { href: '/admin/coupons', label: 'Coupons', icon: Percent },
  { href: '/admin/affiliates', label: 'Affiliates', icon: ExternalLink },
  { href: '/admin/payments', label: 'Payments', icon: DollarSign },
  { href: '/admin/wallet', label: 'Wallet', icon: Wallet },
  { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
  { href: '/admin/withdraw-requests', label: 'Withdrawals', icon: Banknote },
  { href: '/admin/refunds', label: 'Refunds', icon: RotateCcw },
  { href: '/admin/promotions', label: 'Promotions', icon: Star },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { href: '/admin/assignments', label: 'Assignments', icon: ClipboardCheck },
  { href: '/admin/assignments/grading-log', label: 'Grading Logs', icon: History },
  { href: '/admin/recordings', label: 'Recordings', icon: Video },
  { href: '/admin/certificates', label: 'Certificates', icon: Award },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/faq', label: 'FAQ', icon: HelpCircle },
  { href: '/admin/blog', label: 'Blog', icon: FileText },
  { href: '/admin/email-templates', label: 'Email Templates', icon: Mail },
  { href: '/admin/cms-pages', label: 'CMS Pages', icon: File },
  { href: '/admin/role-permissions', label: 'Roles & Permissions', icon: ShieldCheck },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
  { href: '/admin/feature-toggles', label: 'Feature Toggles', icon: ToggleLeft },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { href: '/admin/security-logs', label: 'Security Logs', icon: Shield },
  { href: '/admin/backups', label: 'Backups', icon: Download },
];

export function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-background transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
      </button>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 pt-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <SidebarLogoutButton collapsed={collapsed} />
      </div>
    </aside>
  );
}
