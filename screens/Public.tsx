import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Button, Card, Input, Accordion, Logo } from '../components/UI';
import { UserRole } from '../types';
import { Heart, Users, Calendar, ShieldCheck, ArrowRight, UserPlus, HelpCircle, CheckCircle, Target, HandHeart, Info, Phone, QrCode } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface PublicProps {
  onLogin: (role: UserRole) => void;
  view: 'home' | 'login';
}

export const PublicHome: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { t } = useTheme();

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8 py-10 md:py-20">
        <div className="flex justify-center mb-6">
          <Logo className="h-40 md:h-56 w-auto drop-shadow-sm" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-brand-700 tracking-tight">
          {t('hero.title_prefix')} <span className="text-brand-600">{t('hero.title_suffix')}</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
          <span className="font-bold block text-brand-700 mb-2">{t('hero.subtitle')}</span>
          {t('hero.desc')}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" onClick={() => onNavigate('login')}>{t('btn.get_assistance')}</Button>
          <Button size="lg" variant="dark" onClick={() => onNavigate('login')}>{t('btn.join_volunteer')}</Button>
        </div>
      </div>

      {/* How it Works */}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Users, title: t('feature.assist'), text: t('feature.assist_text') },
          { icon: ShieldCheck, title: t('feature.safe'), text: t('feature.safe_text') },
          { icon: Heart, title: t('feature.community'), text: t('feature.community_text') },
        ].map((feature, i) => (
          <Card key={i} className="text-center p-8 border-t-4 border-t-brand-500 hover:shadow-md transition-shadow">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-brand-50 rounded-full text-brand-600">
                <feature.icon size={32} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-600 leading-relaxed">{feature.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const AboutPage: React.FC<{ openContact?: boolean }> = ({ openContact }) => {
  const { t } = useTheme();
  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-700">{t('about.title')}</h1>
        <p className="text-xl text-slate-600">{t('about.subtitle')}</p>
      </div>

      <Card>
        <div className="space-y-1">
          <Accordion title={t('about.mission_title')} defaultOpen={!openContact} icon={<Target size={20} />}>
            <p className="mb-4">{t('about.mission_text_1')}</p>
            <p>{t('about.mission_text_2')}</p>
          </Accordion>

          <Accordion title={t('about.what_we_do_title')} icon={<HandHeart size={20} />}>
            <p className="mb-4">{t('about.what_we_do_intro')}</p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>{t('about.service_rides')}</li>
              <li>{t('about.service_grocery')}</li>
              <li>{t('about.service_visits')}</li>
              <li>{t('about.service_walk')}</li>
              <li>{t('about.service_home_help')}</li>
              <li>{t('about.service_yard')}</li>
              <li>{t('about.service_small_tasks')}</li>
              <li>{t('about.service_holiday')}</li>
              <li>{t('about.service_group_events')}</li>
            </ul>
            <p>{t('about.what_we_do_footer')}</p>
          </Accordion>

          <Accordion title={t('about.why_matters_title')} icon={<Heart size={20} />}>
            <p className="mb-4">{t('about.why_matters_intro')}</p>
            <ul className="list-disc pl-6 space-y-2 mb-4 font-medium text-slate-700">
              <li>{t('about.why_safe')}</li>
              <li>{t('about.why_connected')}</li>
              <li>{t('about.why_independent')}</li>
              <li>{t('about.why_engaged')}</li>
            </ul>
            <p>{t('about.why_matters_footer')}</p>
          </Accordion>

          <Accordion title={t('about.how_works_title')} icon={<Info size={20} />}>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900">{t('about.step_1_title')}</h4>
                <p>{t('about.step_1_text')}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('about.step_2_title')}</h4>
                <p>{t('about.step_2_text')}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('about.step_3_title')}</h4>
                <p>{t('about.step_3_text')}</p>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{t('about.step_4_title')}</h4>
                <p>{t('about.step_4_text')}</p>
              </div>
            </div>
          </Accordion>

          <Accordion title={t('about.safety_title')} icon={<ShieldCheck size={20} />}>
            <p className="mb-4">{t('about.safety_intro')}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('about.safety_checks')}</li>
              <li>{t('about.safety_training')}</li>
              <li>{t('about.safety_boundaries')}</li>
              <li>{t('about.safety_reporting')}</li>
              <li>{t('about.safety_logs')}</li>
              <li>{t('about.safety_oversight')}</li>
            </ul>
          </Accordion>

          <Accordion title={t('about.who_serve_title')} icon={<Users size={20} />}>
            <p className="mb-4">{t('about.who_serve_intro')}</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>{t('about.serve_older')}</li>
              <li>{t('about.serve_disability')}</li>
              <li>{t('about.serve_recovery')}</li>
              <li>{t('about.serve_isolated')}</li>
            </ul>
            <p className="mt-4 italic">{t('about.serve_footer')}</p>
          </Accordion>

          <Accordion title={t('about.contact_title')} defaultOpen={openContact} id="contact-us-section" icon={<Phone size={20} />}>
            <div className="space-y-6">
              <div className="bg-brand-50 p-6 rounded-lg border border-brand-100">
                <h4 className="font-bold text-brand-900 text-lg mb-3">{t('about.npvn_name')}</h4>
                <div className="text-slate-700 space-y-2">
                  <p className="flex items-center gap-2"><strong>{t('about.email_label')}</strong> npvolunteernetwork@gmail.com</p>
                  <p className="flex items-center gap-2"><strong>{t('about.phone_label')}</strong> 971-712-3845</p>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                <h4 className="font-bold text-slate-900 text-lg mb-3">{t('about.npsc_name')}</h4>
                <div className="text-slate-700 space-y-2">
                  <p>31450 NW Commercial St</p>
                  <p>North Plains, OR 97133</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="flex items-center gap-2"><strong>{t('about.email_label')}</strong> northplainssc@gmail.com</p>
                    <p className="flex items-center gap-2"><strong>{t('about.phone_label')}</strong> (503) 647-5666</p>
                  </div>
                </div>
              </div>
            </div>
          </Accordion>
        </div>
      </Card>
    </div>
  );
};

export const DonatePage: React.FC = () => {
  const { t } = useTheme();
  const PAYPAL_LINK = 'https://www.paypal.com/ncp/payment/NYUF3RCCR3ZQS';

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-brand-700">{t('donate.title')}</h1>
        <p className="text-xl text-slate-600">{t('donate.subtitle')}</p>
      </div>

      <Card>
        <div className="text-center py-6 space-y-8">
          <div className="bg-brand-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-brand-600">
            <Heart size={40} />
          </div>
          <p className="text-slate-600 px-4">
            {t('donate.p1')}
          </p>

          {/* Donation Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <Button variant="outline" onClick={() => window.open(PAYPAL_LINK, '_blank')}>$25</Button>
              <Button variant="outline" onClick={() => window.open(PAYPAL_LINK, '_blank')}>$50</Button>
              <Button variant="outline" onClick={() => window.open(PAYPAL_LINK, '_blank')}>$100</Button>
              <Button variant="outline" onClick={() => window.open(PAYPAL_LINK, '_blank')}>{t('common.other')}</Button>
            </div>

            <Button
              size="lg"
              className="w-full max-w-sm font-bold shadow-md hover:shadow-lg transition-all"
              onClick={() => window.open(PAYPAL_LINK, '_blank')}
            >
              {t('donate.paypal_btn')}
            </Button>
          </div>

          {/* QR Code Section */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-sm mx-auto mt-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-center gap-2">
              <QrCode size={18} /> {t('donate.scan_title')}
            </h3>
            <div className="bg-white p-2 rounded-lg border border-slate-200 inline-block shadow-sm">
              <img
                src="./qrcode.png"
                alt="PayPal QR Code"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/200?text=Upload+qrcode.png";
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-3">{t('donate.scan_desc')}</p>
          </div>

          <div className="pt-6 border-t mt-6">
            <p className="font-bold text-slate-800">{t('donate.check_title')}</p>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {t('donate.check_text')}<br />
              <span className="font-medium text-slate-700">North Plains Senior Center</span><br />
              {t('donate.check_memo')}<br />
              31450 NW Commercial St<br />
              North Plains, OR 97133
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const LoginScreen: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { t } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { debugLogin } = useAuth(); // Destructure debugLogin
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    let loginEmail = identifier.trim();

    // Check if input is a phone number (digits only or basic phone format)
    const isPhone = /^\+?[\d\s-()]{7,}$/.test(loginEmail) && !loginEmail.includes('@');

    if (isPhone) {
      // Look up email by phone number using our secure RPC function
      const { data, error: lookupError } = await supabase.rpc('get_email_by_phone', {
        phone_input: loginEmail
      });

      if (lookupError || !data) {
        setLoading(false);
        setError('Phone number not found. Please try again or use your email.');
        return;
      }

      loginEmail = data; // Use the found email for login
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Navigation is handled by App.tsx reacting to user state change
    }
  };

  return (
    <div className="max-w-md mx-auto py-10">
      <Card title={t('signin_title')}>
        <div className="space-y-6">
          <p className="text-sm text-slate-600 mb-4">
            {t('welcome_back')}
          </p>

          {/* MOCK LOGIN CONTROLS */}
          <div className="bg-amber-50 p-4 rounded text-xs text-amber-800 border border-amber-200 mb-4">
            <strong>{t('demo_mode')}</strong> {t('demo_instruction')}
            <div className="grid gap-2 mt-2">
              <button onClick={() => debugLogin(UserRole.CLIENT)} className="underline text-left">{t('login_client')}</button>
              <button onClick={() => debugLogin(UserRole.VOLUNTEER)} className="underline text-left">{t('login_volunteer')}</button>
              <button onClick={() => debugLogin(UserRole.ADMIN)} className="underline text-left">{t('login_admin')}</button>
              <button onClick={() => debugLogin(UserRole.CLIENT_VOLUNTEER)} className="underline text-left">{t('login_dual')}</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              {error}
            </div>
          )}

          <Input
            label={t('email_label') + ' / Phone Number'}
            type="text"
            placeholder="Email or Phone Number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <Input
            label={t('password_label')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : t('signin_btn')}
          </Button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">{t('new_to_npvn')}</span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={() => onNavigate('register')}>
            {t('create_account')}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export const RegisterScreen: React.FC<{ onNavigate: (p: string) => void }> = ({ onNavigate }) => {
  const { t } = useTheme();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  // Success State for Email Verification
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!selectedRole || loading) return; // Prevent double-submit
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name,
          role: selectedRole,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      if (error.message.includes('security purposes')) {
        setError("Please wait a minute before trying to register again (Security limit).");
      } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setError("This email is already registered. Please log in instead.");
      } else {
        setError(error.message);
      }
      return;
    }

    // Check if user already exists (Supabase sometimes returns success for existing users)
    if (!data.user) {
      setLoading(false);
      setError("Registration failed. Please try again or log in if you already have an account.");
      return;
    }

    // Create profile in database
    const { createUserProfile } = await import('../services/userService');
    const profile = await createUserProfile(
      data.user.id,
      form.email,
      form.name,
      selectedRole
    );

    if (!profile) {
      setLoading(false);
      setError("Failed to create user profile. This email may already be registered. Please try logging in instead.");
      return;
    }

    // Check if session was created (Auto-login) or if email confirmation is needed
    if (data.session) {
      // User is logged in, App.tsx will handle redirect to onboarding
      setLoading(false);
    } else {
      // Email confirmation required, but profile is created
      // User can log in after confirming email
      setLoading(false);
      setSuccessMsg("Account created successfully! Please check your email to verify your account, then log in to complete your intake process.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      {step === 1 && (
        <div className="space-y-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">{t('register.join_title')}</h1>
          <p className="text-slate-600 text-lg">{t('register.join_subtitle')}</p>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              onClick={() => handleRoleSelect(UserRole.CLIENT)}
              className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-brand-500 hover:shadow-lg cursor-pointer transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-brand-50 rounded-full text-brand-600 mb-4">
                <Users size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('register.client_title')}</h3>
              <p className="text-sm text-slate-500">{t('register.client_desc')}</p>
            </div>

            <div
              onClick={() => handleRoleSelect(UserRole.VOLUNTEER)}
              className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-nature-500 hover:shadow-lg cursor-pointer transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-nature-50 rounded-full text-nature-500 mb-4">
                <Heart size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('register.volunteer_title')}</h3>
              <p className="text-sm text-slate-500">{t('register.volunteer_desc')}</p>
            </div>

            <div
              onClick={() => handleRoleSelect(UserRole.CLIENT_VOLUNTEER)}
              className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-lg cursor-pointer transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-purple-50 rounded-full text-purple-600 mb-4">
                <UserPlus size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">{t('register.dual_title')}</h3>
              <p className="text-sm text-slate-500">{t('register.dual_desc')}</p>
            </div>

            <div
              onClick={() => handleRoleSelect(UserRole.ADMIN)}
              className="bg-white p-6 rounded-xl border-2 border-slate-200 hover:border-slate-800 hover:shadow-lg cursor-pointer transition-all flex flex-col items-center"
            >
              <div className="p-4 bg-slate-100 rounded-full text-slate-800 mb-4">
                <ShieldCheck size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Admin</h3>
              <p className="text-sm text-slate-500">Staff & Management</p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && selectedRole && (
        <div className="max-w-md mx-auto">
          <Card title={
            selectedRole === UserRole.ADMIN ? 'Create Admin Account' :
              selectedRole === UserRole.CLIENT_VOLUNTEER ? t('register.create_dual') :
                selectedRole === UserRole.CLIENT ? t('register.create_client') : t('register.create_volunteer')
          }>
            <div className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="bg-green-50 text-green-700 p-4 rounded text-sm border border-green-200">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle size={18} /> Success!
                  </div>
                  {successMsg}
                  <Button className="w-full mt-4" variant="outline" onClick={() => onNavigate('login')}>Go to Login</Button>
                </div>
              )}
              <Input label={t('register.full_name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" />
              <Input label={t('email_label')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
              <Input label={t('register.create_password')} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <div className="pt-4">
                <Button className="w-full" onClick={handleRegister} disabled={loading}>{loading ? 'Creating Account...' : t('register.create_account_btn')}</Button>
                <button onClick={() => setStep(1)} className="w-full mt-4 text-sm text-slate-500 hover:text-slate-800">{t('register.back_role')}</button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};