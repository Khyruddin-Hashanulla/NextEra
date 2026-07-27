import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-bold">
              <span className="text-primary">Next</span>Era
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn to code with structured courses, practice, and real-world projects.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Quick Links</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
              <Link to="/practice" className="hover:text-foreground transition-colors">Practice</Link>
              <Link to="/articles" className="hover:text-foreground transition-colors">Articles</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Support</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link>
              <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
              <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold">Legal</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="/refund" className="hover:text-foreground transition-colors">Refund Policy</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} NextEra LMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
