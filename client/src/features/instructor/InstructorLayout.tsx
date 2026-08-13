import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  ChevronLeft,
  Menu,
  X,
  BarChart3,
  Users,
  DollarSign,
  Banknote,
  Tag,
  Star,
  Megaphone,
  UserCircle,
  Video,
  GraduationCap,
  ShieldCheck,
  ClipboardList,
  ArrowLeft,
  Bell,
} from 'lucide-react';
import { useState, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementType } from 'react';
import SubscriptionBadge from '@/components/instructor/SubscriptionBadge';
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton';
import { ROUTES } from '@/lib/constants';
import { PageContainer } from '@/components/layout/PageContainer';

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
}

const navItems: NavItem[] = [
  { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
  { href: '/instructor/courses/create', label: 'New Course', icon: PlusCircle },
  { href: '/instructor/live-classes', label: 'Live Classes', icon: Video },
  { href: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/instructor/students', label: 'Students', icon: Users },
  { href: '/instructor/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/instructor/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/instructor/payouts', label: 'Withdraw', icon: Banknote },
  { href: '/instructor/coupons', label: 'Coupons', icon: Tag },
  { href: '/instructor/reviews', label: 'Reviews', icon: Star },
  { href: '/instructor/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/instructor/notifications', label: 'Notifications', icon: Bell },
  { href: '/instructor/subscription', label: 'Subscription', icon: ShieldCheck },
  { href: '/instructor/profile', label: 'Profile', icon: UserCircle },
];

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

export function InstructorLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activeItem = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  );

  return (
    <PageContainer variant="dashboard">
      <div className="flex min-h-screen">
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobileOpen && (
            <motion.aside
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              id={mobileMenuId}
              className="fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <MobileSidebarContent items={navItems} onClose={() => setMobileOpen(false)} />
            </motion.aside>
          )}
        </AnimatePresence>

        <aside
          className={cn(
            'hidden border-r bg-background transition-all duration-300 lg:sticky lg:top-0 lg:block lg:h-screen',
            collapsed ? 'w-16' : 'w-60'
          )}
        >
          <div className="flex h-full flex-col">
            <div className={cn('flex items-center border-b px-4 py-3', collapsed && 'justify-center')}>
              {!collapsed && (
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent',
                  collapsed && 'mx-auto'
                )}
                aria-label={collapsed ? 'Expand' : 'Collapse'}
              >
                <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-primary/10"
                        transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                      />
                    )}
                    <item.icon className="relative z-10 h-5 w-5 shrink-0" />
                    {!collapsed && <span className="relative z-10">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
            {!collapsed && (
              <div className="border-t px-3 py-2">
                <Link
                  to="/instructor/subscription"
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Subscription</span>
                  <span className="ml-auto">
                    <SubscriptionBadge />
                  </span>
                </Link>
              </div>
            )}
            <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
              <Link
                to="/"
                className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <GraduationCap className="h-4 w-4" />
                {!collapsed && <span>Back to site</span>}
              </Link>
            </div>
            <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
              <SidebarLogoutButton collapsed={collapsed} />
            </div>
          </div>
        </aside>

        <div className={cn('flex flex-1 flex-col', 'lg:pl-0')}>
          <div className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-sm lg:hidden">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              aria-haspopup="dialog"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-semibold leading-none">{activeItem?.label || 'Dashboard'}</h2>
            </div>
          </div>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function MobileSidebarContent({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
        <button
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
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
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t p-3">
        <Link
          to={ROUTES.HOME}
          onClick={onClose}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          Back to Website
        </Link>
        <SidebarLogoutButton />
      </div>
    </div>
  );
}
