import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { getDashboardRoute, getProfileRoute, ROUTES } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import { UserMenu } from '@/components/layout/UserMenu';
import { Menu, X, Search, ChevronDown, LogOut, BookOpen, GraduationCap, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect, useId, useMemo } from 'react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [exploreOpen, setExploreOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const mobileMenuId = useId();
  const exploreMenuId = useId();
  const searchInputId = useId();

  const themeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
  const ThemeIcon = themeIcon;

  const navLinks = useMemo<{ label: string; path: string }[]>(() => {
    const links: { label: string; path: string }[] = [
      { label: 'Home', path: ROUTES.HOME },
      { label: 'Courses', path: ROUTES.COURSES },
      { label: 'Become an Instructor', path: ROUTES.INSTRUCTOR_APPLY },
    ];
    if (isAuthenticated) {
      links.push({ label: 'Dashboard', path: getDashboardRoute(user?.role) });
    }
    links.push(
      { label: 'Blog', path: ROUTES.BLOG },
      { label: 'About', path: ROUTES.ABOUT },
      { label: 'Contact', path: ROUTES.CONTACT },
      { label: 'FAQ', path: ROUTES.FAQ }
    );
    return links;
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (exploreRef.current && !exploreRef.current.contains(e.target as Node)) setExploreOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setExploreOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${ROUTES.COURSES}?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    addToast({ title: 'Logged out successfully', variant: 'success' });
    navigate(ROUTES.LOGIN);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 lg:h-[4.25rem]">
          {/* Brand */}
          <Link
            to={ROUTES.HOME}
            className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="NextEra home"
          >
            <span className="relative inline-flex">
              <span
                aria-hidden="true"
                className="absolute -inset-1 rounded-2xl bg-primary/25 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
              />
              <img
                src="/images/NextEra.png"
                alt=""
                className="relative h-9 w-9 rounded-xl object-cover shadow-lg shadow-primary/30 ring-1 ring-border transition-transform duration-300 group-hover:scale-105"
              />
            </span>
            <span className="text-xl font-bold tracking-tight font-display">
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Next</span>
              <span className="text-foreground">Era</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden items-center justify-center gap-0.5 lg:flex xl:gap-1"
          >
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-expanded={exploreOpen}
                aria-controls={exploreMenuId}
                aria-haspopup="true"
              >
                Explore <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              {exploreOpen && (
                <div
                  id={exploreMenuId}
                  role="menu"
                  className="absolute left-0 top-full mt-2 w-52 rounded-2xl border border-border bg-popover p-1.5 shadow-xl shadow-primary/10 animate-in fade-in slide-in-from-top-2"
                >
                  <Link
                    to={ROUTES.COURSES}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setExploreOpen(false)}
                  >
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> All Courses
                  </Link>
                  <Link
                    to="/instructors"
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setExploreOpen(false)}
                  >
                    <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" /> Instructors
                  </Link>
                </div>
              )}
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'rounded-full px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive(link.path)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 lg:gap-2">
            <div className="relative hidden sm:block" ref={searchRef}>
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center" role="search">
                  <Input
                    id={searchInputId}
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-48 rounded-full border-border bg-muted pl-9 pr-4 text-sm lg:w-56"
                    autoFocus
                  />
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open search"
                  aria-expanded={searchOpen}
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden xl:inline">Search</span>
                </button>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} theme`}
            >
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <UserMenu />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="rounded-full px-4 text-sm font-medium"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="rounded-full px-5 text-sm font-medium shadow-lg shadow-primary/25"
                >
                  Create Free Account
                </Button>
              </div>
            )}

            <button
              className="lg:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id={mobileMenuId}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border bg-background lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="px-4 py-3">
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setMobileMenuOpen(false);
              }}
              className="relative mb-3"
              role="search"
            >
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border-border bg-muted pl-9 text-sm"
              />
            </form>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                    isActive(link.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/instructors"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
              >
                Instructors
              </Link>
            </nav>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <Link
                to={getProfileRoute(user?.role)}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-violet-600 text-primary-foreground text-sm font-semibold">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="truncate text-sm font-medium text-foreground">{user?.name}</span>
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="rounded-full p-2 text-muted-foreground transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} theme`}
                >
                  <ThemeIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full p-2 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
              <Button
                variant="ghost"
                onClick={() => {
                  navigate(ROUTES.LOGIN);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center rounded-full text-sm"
              >
                Sign In
              </Button>
              <Button
                onClick={() => {
                  navigate(ROUTES.REGISTER);
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center rounded-full text-sm"
              >
                Create Free Account
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
