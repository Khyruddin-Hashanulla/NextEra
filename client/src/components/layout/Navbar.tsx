import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { ROUTES } from '@/lib/constants';
import { useToast } from '@/providers/ToastProvider';
import { Menu, X, Search, ChevronDown, LogOut, BookOpen, GraduationCap, Sun, Moon, Monitor } from 'lucide-react';
import { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Courses', path: ROUTES.COURSES },
  { label: 'About', path: ROUTES.ABOUT },
  { label: 'Contact', path: ROUTES.CONTACT },
  { label: 'FAQ', path: ROUTES.FAQ },
];

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
    return () => { document.body.style.overflow = ''; };
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
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">N</div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-primary">Next</span>
              <span className="text-foreground">Era</span>
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-1">
            <div className="relative" ref={exploreRef}>
              <button
                onClick={() => setExploreOpen(!exploreOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
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
                  className="absolute top-full left-0 mt-1 w-48 bg-popover rounded-xl shadow-lg border border-border py-2 animate-in fade-in slide-in-from-top-2"
                >
                  <Link
                    to={ROUTES.COURSES}
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
                    onClick={() => setExploreOpen(false)}
                  >
                    <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" /> All Courses
                  </Link>
                  <Link
                    to="/instructors"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
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
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all',
                  isActive(link.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden sm:block" ref={searchRef}>
              {searchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center" role="search">
                  <Input
                    id={searchInputId}
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48 lg:w-64 h-9 rounded-full border-border bg-muted text-sm pl-9 pr-4"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                  aria-label="Open search"
                  aria-expanded={searchOpen}
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Search</span>
                  <span className="hidden xl:inline text-xs text-muted-foreground/40 border border-border rounded px-1.5 py-0.5">Ctrl+K</span>
                </button>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} theme`}
            >
              <ThemeIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all"
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      user?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden lg:inline">{user?.name}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="text-sm font-medium rounded-full px-4"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.REGISTER)}
                  className="text-sm font-medium rounded-full px-5"
                >
                  Create Free Account
                </Button>
              </div>
            )}

            <button
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id={mobileMenuId}
          className="lg:hidden border-t border-border bg-background"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="px-4 py-3">
            <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} className="relative mb-3" role="search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-full border-border bg-muted text-sm pl-9"
              />
            </form>
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                    isActive(link.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/instructors" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
                Instructors
              </Link>
            </nav>
          </div>
          {isAuthenticated ? (
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">{user?.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTheme}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Switch to ${mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light'} theme`}
                >
                  <ThemeIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Sign out">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-border px-4 py-3 flex flex-col gap-2">
              <Button variant="ghost" onClick={() => { navigate(ROUTES.LOGIN); setMobileMenuOpen(false); }} className="w-full justify-center rounded-full text-sm">
                Sign In
              </Button>
              <Button onClick={() => { navigate(ROUTES.REGISTER); setMobileMenuOpen(false); }} className="w-full justify-center rounded-full text-sm">
                Create Free Account
              </Button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
