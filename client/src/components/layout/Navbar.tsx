import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { ROUTES, ROLES } from '@/lib/constants';
import { Sun, Moon, Menu, X, LogOut, User, BookOpen, Settings } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <span className="text-xl font-bold">
            <span className="text-primary">Next</span>Era
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to={ROUTES.COURSES} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Courses
          </Link>
          {isAuthenticated && (
            <Link to={ROUTES.DASHBOARD} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          )}
          {user?.role === ROLES.INSTRUCTOR && (
            <Link to={ROUTES.INSTRUCTOR_DASHBOARD} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Instructor
            </Link>
          )}
          {user?.role === ROLES.ADMIN && (
            <Link to={ROUTES.ADMIN_DASHBOARD} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span>{user?.name}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" onClick={() => navigate(ROUTES.LOGIN)}>
                Login
              </Button>
              <Button onClick={() => navigate(ROUTES.REGISTER)}>
                Sign Up
              </Button>
            </div>
          )}

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t p-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to={ROUTES.COURSES} className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Courses
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={ROUTES.DASHBOARD} className="py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 py-2 text-sm font-medium text-destructive">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => { navigate(ROUTES.LOGIN); setMobileMenuOpen(false); }}>
                  Login
                </Button>
                <Button onClick={() => { navigate(ROUTES.REGISTER); setMobileMenuOpen(false); }}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
