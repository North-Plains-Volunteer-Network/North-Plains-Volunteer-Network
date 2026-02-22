import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { Menu, X, Home, User as UserIcon, LogOut, Settings, ClipboardList, ShieldAlert, BarChart3, Users, Gift, Heart, Type, Sun, Moon, Globe } from 'lucide-react';
import { Logo } from './UI';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children, user, onLogout, currentPage, onNavigate
}) => {
  const { textSize, setTextSize, highContrast, setHighContrast, language, setLanguage, t } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showA11yMenu, setShowA11yMenu] = useState(false);

  // Keyboard shortcut for language toggle (Alt + Shift + L)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        setLanguage(language === 'en' ? 'es' : 'en');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, setLanguage]);

  const getNavItems = () => {
    if (!user) {
      return [
        { id: 'home', label: t('nav.home'), icon: Home },
        { id: 'about', label: t('nav.about'), icon: Users },
        { id: 'donate', label: t('nav.donate'), icon: Gift },
        { id: 'login', label: t('nav.login'), icon: UserIcon },
      ];
    }

    const loggedInCommon = [
      { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
      { id: 'profile', label: t('nav.profile'), icon: UserIcon },
    ];

    if (user.role === UserRole.CLIENT) {
      return [
        ...loggedInCommon,
        { id: 'create-request', label: t('nav.new_request'), icon: ClipboardList },
        { id: 'resources', label: t('nav.resources'), icon: Users },
      ];
    }

    if (user.role === UserRole.VOLUNTEER) {
      const isPending = user.backgroundCheckStatus === 'PENDING' || user.backgroundCheckStatus === 'NOT_STARTED' || !user.trainingComplete;
      return [
        ...loggedInCommon,
        ...(isPending ? [] : [{ id: 'opportunities', label: t('nav.opportunities'), icon: ClipboardList }]),
        { id: 'history', label: t('nav.history'), icon: ClipboardList },
      ];
    }

    if (user.role === UserRole.CLIENT_VOLUNTEER) {
      const isPending = user.backgroundCheckStatus === 'PENDING' || user.backgroundCheckStatus === 'NOT_STARTED' || !user.trainingComplete;
      return [
        ...loggedInCommon,
        { id: 'create-request', label: t('nav.new_request'), icon: ClipboardList },
        ...(isPending ? [] : [{ id: 'opportunities', label: t('nav.opportunities'), icon: ClipboardList }]),
        { id: 'history', label: t('nav.history'), icon: ClipboardList },
      ];
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.COORDINATOR) {
      return [
        ...loggedInCommon,
        { id: 'my-assignments', label: t('admin.my_assignments'), icon: ClipboardList },
        { id: 'opportunities', label: t('nav.my_opps'), icon: Heart },
      ];
    }

    return loggedInCommon;
  };

  const navItems = getNavItems();

  // Check if user is in onboarding/intake process
  const isOnboarding = user && user.onboardingStep !== undefined && user.onboardingStep < 5;

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 transition-colors duration-200 ${highContrast ? 'bg-slate-900 border-white' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate(user ? 'dashboard' : 'home')}>
              <Logo className="h-10 w-auto mr-3" />
              <div>
                <h1 className={`text-xl font-bold leading-none ${highContrast ? 'text-yellow-400' : 'text-brand-700'}`}>{t('hero.title_prefix')}</h1>
                <p className={`text-xs font-medium tracking-wide ${highContrast ? 'text-white' : 'text-brand-600'}`}>{t('hero.title_suffix')}</p>
              </div>
            </div>

            {/* Desktop Nav - Hidden during onboarding */}
            {!isOnboarding && (
              <nav className="flex space-x-2 md:space-x-6 items-center">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`hidden md:flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === item.id
                      ? (highContrast ? 'text-black bg-yellow-400 font-bold' : 'text-brand-700 bg-brand-50')
                      : (highContrast ? 'text-white hover:text-yellow-400' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                      }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                ))}

                {user && (
                  <button
                    onClick={onLogout}
                    className={`hidden md:flex items-center px-3 py-2 text-sm font-medium rounded-md ml-2 ${highContrast ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:bg-rose-50'}`}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('nav.logout')}
                  </button>
                )}

                {/* Accessibility Controls */}
                <div className="relative ml-2 z-[100]">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowA11yMenu(!showA11yMenu);
                    }}
                    className={`hidden md:flex p-3 rounded-full transition-colors items-center gap-1.5 cursor-pointer min-w-[60px] ${highContrast ? 'text-yellow-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-brand-600'}`}
                    title={t('settings.title')}
                    type="button"
                  >
                    <Type size={20} className="pointer-events-none" />

                  </button>

                  {showA11yMenu && (
                    <div className={`fixed right-4 top-20 w-72 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 py-4 z-[9999] ${highContrast ? 'bg-slate-800 border border-white' : 'bg-white border border-slate-200'}`}>
                      <div className="px-4">
                        <div className="flex justify-between items-center mb-4">
                          <p className={`text-xs font-bold uppercase tracking-wider ${highContrast ? 'text-yellow-400' : 'text-slate-500'}`}>{t('settings.title')}</p>
                          <button onClick={() => setShowA11yMenu(false)} aria-label="Close Accessibility Menu" className="text-slate-400"><X size={16} /></button>
                        </div>



                        <div className="mb-4">
                          <p className={`text-sm font-medium mb-2 ${highContrast ? 'text-white' : 'text-slate-700'}`}>{t('settings.text_size')}</p>
                          <div className={`flex rounded-lg p-1 border ${highContrast ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                            <button onClick={() => setTextSize('normal')} className={`flex-1 py-1 text-xs rounded font-medium ${textSize === 'normal' ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-brand-700') : (highContrast ? 'text-white' : 'text-slate-500')}`}>A</button>
                            <button onClick={() => setTextSize('large')} className={`flex-1 py-1 text-sm rounded font-medium ${textSize === 'large' ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-brand-700') : (highContrast ? 'text-white' : 'text-slate-500')}`}>A+</button>
                            <button onClick={() => setTextSize('xl')} className={`flex-1 py-1 text-base rounded font-medium ${textSize === 'xl' ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-brand-700') : (highContrast ? 'text-white' : 'text-slate-500')}`}>A++</button>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className={`text-sm font-medium mb-2 ${highContrast ? 'text-white' : 'text-slate-700'}`}>{t('settings.language')}</p>
                          <div className={`flex rounded-lg p-1 border ${highContrast ? 'bg-slate-700 border-slate-600' : 'bg-slate-100 border-slate-200'}`}>
                            <button onClick={() => setLanguage('en')} className={`flex-1 py-1 text-xs rounded font-medium ${language === 'en' ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-brand-700') : (highContrast ? 'text-white' : 'text-slate-500')}`}>English</button>
                            <button onClick={() => setLanguage('es')} className={`flex-1 py-1 text-sm rounded font-medium ${language === 'es' ? (highContrast ? 'bg-yellow-400 text-black' : 'bg-white shadow text-brand-700') : (highContrast ? 'text-white' : 'text-slate-500')}`}>Español</button>
                          </div>
                        </div>


                      </div>
                    </div>
                  )}
                </div>
              </nav>
            )}

            {/* Mobile menu button - Hidden during onboarding */}
            {!isOnboarding && (
              <div className="flex items-center md:hidden gap-4">
                <button
                  onClick={() => setShowA11yMenu(!showA11yMenu)}
                  aria-label="Accessibility Settings"
                  className={`p-2 rounded-full ${highContrast ? 'text-yellow-400' : 'text-slate-500'}`}
                >
                  <Type size={24} />
                </button>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500
                     ${highContrast ? 'text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-500 hover:bg-slate-100'}
                  `}
                >
                  <span className="sr-only">Open main menu</span>
                  {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className={`md:hidden border-b ${highContrast ? 'bg-slate-900 border-white' : 'bg-white border-slate-200'}`}>
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-4 text-base font-medium rounded-md ${currentPage === item.id
                    ? (highContrast ? 'text-black bg-yellow-400' : 'text-brand-700 bg-brand-50')
                    : (highContrast ? 'text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50')
                    }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-3 py-4 text-base font-medium rounded-md ${highContrast ? 'text-rose-400' : 'text-rose-600 hover:bg-rose-50'}`}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  {t('nav.logout')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className={`border-t py-8 ${highContrast ? 'bg-slate-900 border-white text-white' : 'bg-white border-slate-200 text-slate-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-sm">
          <p>© 2024 North Plains Volunteer Network. {t('footer.rights')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <button onClick={() => onNavigate('contact')} className="hover:underline">{t('nav.contact')}</button>
            <button onClick={() => onNavigate('privacy-policy')} className="hover:underline">{t('footer.privacy')}</button>
            <button onClick={() => onNavigate('terms-of-service')} className="hover:underline">{t('footer.terms')}</button>
          </div>
        </div>
      </footer>
    </div>
  );
};