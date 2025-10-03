import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, BarChart3, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/entries', icon: FileText, label: 'Entries' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-elegant"
                : "hover:bg-accent text-muted-foreground hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          {/* App Logo */}
          <img src="/image-removebg-preview.png" alt="App Logo" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="h-full flex flex-col">
                  <div className="p-6 border-b flex items-center gap-2">
                    {/* App Logo in Sidebar */}
                    <img src="/image-removebg-preview.png" alt="App Logo" className="h-10 w-auto" />
                    <h1 className="text-2xl font-bold  bg-clip-text  ">
                      sm13
                    </h1>
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    <NavLinks />
                  </nav>
                  {/* Footer */}
                  <footer className="p-4 text-xs text-muted-foreground text-center border-t">
                    Created by Nayan Prajapati &copy;
                  </footer>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 border-r bg-card/50 backdrop-blur-sm">
        <div className="h-full flex flex-col">
          <div className="p-6 border-b flex items-center gap-2">
            {/* App Logo in Sidebar */}
            <img src="/image-removebg-preview.png" alt="App Logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-bold  bg-clip-text ">
              sm13
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavLinks />
          </nav>

          <div className="p-4 border-t">
            <ThemeToggle />
          </div>
          {/* Footer */}
          <footer className="p-4 text-xs text-muted-foreground text-center border-t">
            Created by Nayan Prajapati &copy;
          </footer>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
