import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, PlayCircle, StickyNote, Bookmark, FileQuestion, FileCheck, Award, Heart, ShoppingBag, Bell, User, ChevronLeft, Search, Package, Crown, Video, AlarmClock } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/courses', label: 'Browse Courses', icon: Search },
  { href: '/student/bundles', label: 'Bundles', icon: Package },
  { href: '/student/subscriptions', label: 'Subscriptions', icon: Crown },
  { href: '/student/my-courses', label: 'My Courses', icon: BookOpen },
  { href: '/student/live-classes', label: 'Live Classes', icon: Video },
  { href: '/student/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/student/orders', label: 'Order History', icon: ShoppingBag },
  { href: '/student/notes', label: 'Notes', icon: StickyNote },
  { href: '/student/quizzes', label: 'Quizzes', icon: FileQuestion },
  { href: '/student/assignments', label: 'Assignments', icon: FileCheck },
  { href: '/student/certificates', label: 'Certificates', icon: Award },
  { href: '/student/notifications', label: 'Notifications', icon: Bell },
  { href: '/student/study-reminders', label: 'Study Reminders', icon: AlarmClock },
  { href: '/student/profile', label: 'Edit Profile', icon: User },
];

export function StudentLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 overflow-y-auto',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm"
        >
          <ChevronLeft className={cn('h-3 w-3 transition-transform', collapsed && 'rotate-180')} />
        </button>
        <nav className="flex flex-col gap-1 p-3 pt-6">
          {navItems.map((item) => {
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
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 lg:pl-64">
        <div className="container py-6 px-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
