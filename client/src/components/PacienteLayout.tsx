import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Calendar, 
  LogOut, 
  Menu,
  X,
  Users,
  Heart,
  ShoppingBag
} from 'lucide-react';
import { useState } from 'react';

interface PacienteLayoutProps {
  children: React.ReactNode;
}

export default function PacienteLayout({ children }: PacienteLayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logout 100% frontend - funciona em modo demo sem depender de API
  const handleLogout = () => {
    try {
      localStorage.removeItem("demoPatient");
      localStorage.removeItem("demoUser");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore erros de localStorage
    }
    window.location.href = "/";
  };

  const navItems = [
    { href: '/paciente/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/paciente/consultas', label: 'Minhas Consultas', icon: Calendar },
    { href: '/paciente/pedidos', label: 'Meus Pedidos', icon: ShoppingBag },
    { href: '/paciente/medicos', label: 'Meus Médicos', icon: Users },
    { href: '/paciente/phr', label: 'Meu Registro de Saúde', icon: Heart },
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/paciente/dashboard">
                <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo-paciente">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">
                    Central do Paciente
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
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                      data-testid={`nav-paciente-${item.href.replace('/paciente/', '')}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paciente
                </p>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="hidden sm:flex"
                data-testid="button-logout-paciente"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>

              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu-paciente"
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
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100'
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
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
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
