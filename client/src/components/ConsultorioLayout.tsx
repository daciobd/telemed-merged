import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Home,
  Menu,
  X,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';

interface ConsultorioLayoutProps {
  children: React.ReactNode;
}

export default function ConsultorioLayout({ children }: ConsultorioLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingCart },
    { href: '/minhas-consultas', label: 'Minhas Consultas', icon: FileText },
    { href: '/agenda', label: 'Agenda', icon: Calendar },
    { href: '/settings', label: 'Configurações', icon: Settings },
  ];

  const externalLinks = [
    { href: '/dashboard/index.html', label: 'Painel Analítico', icon: BarChart3, external: true },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
                  <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">T</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                    Consultório Virtual
                  </span>
                </div>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      data-testid={`nav-${item.href.replace('/', '')}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
              {externalLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    data-testid="nav-painel-analitico"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'doctor' ? 'Médico' : 'Paciente'}
                </p>
              </div>

              <a 
                href="/" 
                className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                data-testid="link-classic"
              >
                <Home className="h-4 w-4" />
                <span>Plataforma Clássica</span>
              </a>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="hidden sm:flex"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>

              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <button
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-100'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </button>
                    </Link>
                  );
                })}
                
                <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                  <a
                    href="/dashboard/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                    data-testid="mobile-nav-painel-analitico"
                  >
                    <BarChart3 className="h-5 w-5" />
                    Painel Analítico
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </a>
                  <a 
                    href="/" 
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    <Home className="h-5 w-5" />
                    Plataforma Clássica
                  </a>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <LogOut className="h-5 w-5" />
                    Sair
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
