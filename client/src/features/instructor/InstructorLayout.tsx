import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, BookOpen, DollarSign, PlusCircle, ChevronLeft, Banknote,
  BarChart3, Users, Tag, Star, Megaphone, UserCircle, Crown, Award, Video,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/courses', label: 'My Courses', icon: BookOpen },
  { href: '/instructor/courses/create', label: 'New Course', icon: PlusCircle },
  { href: '/instructor/live-classes', label: 'Live Classes', icon: Video },
  { href: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/instructor/students', label: 'Students', icon: Users },
  { href: '/instructor/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/instructor/payouts', label: 'Payouts', icon: Banknote },
  { href: '/instructor/coupons', label: 'Coupons', icon: Tag },
  { href: '/instructor/reviews', label: 'Reviews', icon: Star },
  { href: '/instructor/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/instructor/profile', label: 'Edit Profile', icon: UserCircle },
  { href: '/instructor/subscription', label: 'Subscription', icon: Crown },
  { href: '/instructor/certificates', label: 'Certificates', icon: Award },
];

export function InstructorLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] overflow-y-auto border-r bg-background transition-all duration-300',
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
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
