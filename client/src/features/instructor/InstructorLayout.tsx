import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, PlusCircle, ChevronLeft, Menu, X,
  BarChart3, Users, DollarSign, Banknote, Tag, Star, Megaphone,
  UserCircle, Video, GraduationCap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementType } from 'react';

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
  { href: '/instructor/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/instructor/payouts', label: 'Withdraw', icon: Banknote },
  { href: '/instructor/coupons', label: 'Coupons', icon: Tag },
  { href: '/instructor/reviews', label: 'Reviews', icon: Star },
  { href: '/instructor/announcements', label: 'Announcements', icon: Megaphone },
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const activeItem = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
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
            className="fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r bg-background lg:hidden"
          >
            <MobileSidebarContent items={navItems} onClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden border-r bg-background transition-all duration-300 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]',
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
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <GraduationCap className="h-4 w-4" />
              {!collapsed && <span>Back to site</span>}
            </Link>
          </div>
        </div>
      </aside>

      <div className={cn('flex flex-1 flex-col', 'lg:pl-0')}>
        <div className="sticky top-16 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-sm font-semibold">{activeItem?.label || 'Dashboard'}</h2>
          </div>
        </div>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function MobileSidebarContent({ items, onClose }: { items: NavItem[]; onClose: () => void }) {
  const location = useLocation();
  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
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
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
