import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, Heart, Award, FileQuestion,
  ShoppingBag, Bell, User, ChevronLeft, Menu, X, GraduationCap,
  ClipboardList, ArrowLeft,
} from 'lucide-react';
import { useState, useEffect, useCallback, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ElementType } from 'react';
import { SidebarLogoutButton } from '@/components/layout/SidebarLogoutButton';
import { ROUTES } from '@/lib/constants';

interface NavItem {
  href: string;
  label: string;
  icon: ElementType;
}

const navItems: NavItem[] = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/my-courses', label: 'My Learning', icon: BookOpen },
  { href: '/student/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/student/quizzes', label: 'Quiz History', icon: FileQuestion },
  { href: '/student/assignments', label: 'Assignments', icon: ClipboardList },
  { href: '/student/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/student/certificates', label: 'Certificates', icon: Award },
  { href: '/student/notifications', label: 'Notifications', icon: Bell },
  { href: '/student/profile', label: 'Profile', icon: User },
];

const sidebarVariants = {
  open: { x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
  closed: { x: '-100%', transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
};

export function StudentLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuId = useId();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && mobileOpen) {
      setMobileOpen(false);
    }
  }, [mobileOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const activeItem = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')
  );

  return (
    <div className="flex min-h-screen">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-hidden="true"
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
            <SidebarContent navItems={navItems} collapsed={false} onClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'hidden border-r bg-background transition-all duration-300 lg:sticky lg:top-0 lg:block lg:h-screen',
          collapsed ? 'w-16' : 'w-60'
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col">
          <div className={cn('flex items-center border-b px-4 py-3', collapsed && 'justify-center')}>
            {!collapsed && (
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                collapsed && 'mx-auto'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} aria-hidden="true" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Student navigation">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-primary/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="relative z-10 h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="relative z-10">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
          <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
            <Link
              to="/"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {!collapsed && 'Back to site'}
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
  );
}

function SidebarContent({ navItems: items, collapsed, onClose }: { navItems: NavItem[]; collapsed: boolean; onClose?: () => void }) {
  const location = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
        {onClose && (
          <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Close menu">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Mobile student navigation">
        {items.map((item) => {
          const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {!collapsed && <span>{item.label}</span>}
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
        <SidebarLogoutButton collapsed={collapsed} />
      </div>
    </div>
  );
}
