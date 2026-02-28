import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ChevronRight, AlertCircle, Mail, ArrowLeft, Chrome, User } from 'lucide-react';
import ColorBends from '../components/ColorBends';
import { supabase } from '../lib/supabase';

const Login = () => {
  const navigate = useNavigate();

  // Role check logic
  const [isTeacher, setIsTeacher] = useState(false);
  const [teacherVerified, setTeacherVerified] = useState(false); // New state for code gate

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [verificationSent, setVerificationSent] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (role: boolean) => {
    setIsTeacher(role);
    setError(null);
    setVerificationSent(false); // Reset on role change
    if (!role) {
      setTeacherVerified(false);
      setSecretCode('');
    } else {
      // Reset verification when switching TO teacher to force re-entry? 
      // Or keep it if they already entered it once in this session?
      // Let's force re-entry for security or if they switch back and forth.
      // Actually, let's keep it simple: switching to teacher requires code again.
      setTeacherVerified(false);
      setSecretCode('');
    }
  };

  const verifyTeacherCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('verify_teacher_code', { input_code: secretCode });

      if (error || !data) {
        setError('Неверный код доступа учителя');
      } else {
        setTeacherVerified(true);
        setError(null);

        // If already logged in, the backend RPC upgraded the profile, so check and redirect
        const { data: authData } = await supabase.auth.getUser();
        if (authData.user) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Ошибка проверки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + (isTeacher ? '/dashboard' : '/student-dashboard'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Double check logic: if trying to login as teacher, ensure profile is teacher
        checkRoleAndRedirect(data.user.id);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRoleAndRedirect = async (userId: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    console.log('Профиль из БД:', profile, 'Ошибка:', profileError?.message);

    // Определяем роль: сначала из profiles, потом из user_metadata
    let role = profile?.role;
    if (!role) {
      const { data: { user } } = await supabase.auth.getUser();
      role = user?.user_metadata?.role;
      console.log('Роль из user_metadata:', role);
      // alert(`DEBUG: Role from metadata: ${role}`); 
    }

    console.log('Итоговая роль:', role);
    // ВРЕМЕННАЯ ОТЛАДКА: Показываем алерт с ролью
    // alert(`DEBUG: Detected Role: ${role}\nProfile: ${JSON.stringify(profile)}\nError: ${profileError?.message}`);

    if (role === 'teacher') {
      navigate('/dashboard');
    } else {
      if (isTeacher) {
        // User wants to log in as a teacher but doesn't have the role yet.
        // We stay on the page (don't navigate) so the code input screen shows up.
        setTeacherVerified(false);
      } else {
        navigate('/student-dashboard');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) throw new Error("Заполните все поля");
      if (password.length < 6) throw new Error("Пароль должен быть не менее 6 символов");

      await performSignUp('student'); // All new accounts start as students. Teacher role is gained via code.
    } catch (err: any) {
      // If error contains "security policy", it's likely the RLS on profile creation.
      // But if we are here, performSignUp threw it.
      // We'll fix performSignUp to handle it.
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const performSignUp = async (role: 'teacher' | 'student') => {
    // 1. Sign Up
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
          role: isTeacher && teacherVerified ? 'teacher' : 'student' // Grant teacher role if verified
        }
      }
    });

    if (signUpError) throw signUpError;

    if (isTeacher) {
      navigate('/dashboard');
    } else {
      navigate('/student-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-40">
        <ColorBends
          colors={["#000000", "#1a0b2e", "#4c1d95"]}
          scale={2}
          speed={0.2}
        />
      </div>

      <div className="w-full max-w-md p-8 relative z-10">

        {/* Toggle Role - hide if verification sent */}
        {!verificationSent && (
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 p-1 rounded-full flex relative">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-full transition-all duration-300 ${isTeacher ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
              <button
                onClick={() => handleRoleChange(true)}
                className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${isTeacher ? 'text-black' : 'text-slate-400'}`}
              >
                Учитель
              </button>
              <button
                onClick={() => handleRoleChange(false)}
                className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-colors ${!isTeacher ? 'text-black' : 'text-slate-400'}`}
              >
                Ученик
              </button>
            </div>
          </div>
        )}

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-70"></div>

          {verificationSent ? (
            <div className="text-center animate-in fade-in py-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400 border border-green-500/30">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Подтвердите Email</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Ссылка для подтверждения отправлена на <strong>{email}</strong>.<br />
                Пожалуйста, проверьте почту и перейдите по ссылке для завершения регистрации.
              </p>
              <button
                onClick={() => { setVerificationSent(false); setMode('login'); }}
                className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Вернуться ко входу
              </button>
            </div>
          ) : isTeacher && !teacherVerified ? (
            <form onSubmit={verifyTeacherCode} className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  <Lock className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold">Доступ ограничен</h2>
                <p className="text-slate-400 text-sm mt-2">Введите корпоративный код доступа для входа в учительскую панель.</p>
              </div>

              <div className="space-y-2">
                <input
                  type="password"
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all text-center tracking-widest text-lg"
                  placeholder="CODE"
                  autoFocus
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/10 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20"
              >
                Подтвердить
              </button>
            </form>
          ) : (
            /* MAIN LOGIN FORM (Student OR Verified Teacher) */
            <div className="animate-in fade-in slide-in-from-right duration-300">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">{mode === 'login' ? 'С возвращением!' : 'Создать аккаунт'}</h2>
                <p className="text-slate-400 text-sm">
                  {isTeacher ? 'Вход в учительскую панель' : 'Вход в личный кабинет ученика'}
                </p>
              </div>

              {!isTeacher && (
                <div className="mb-6">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-lg"
                  >
                    <div className="w-5 h-5 flex items-center justify-center"><Chrome className="w-4 h-4" /></div>
                    Войти через Google
                  </button>
                  <div className="mt-6 flex items-center gap-4 text-slate-500 text-xs uppercase font-bold tracking-widest">
                    <div className="h-px bg-white/10 flex-1"></div>
                    ИЛИ
                    <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                </div>
              )}

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    placeholder={isTeacher ? "teacher@school.kz" : "student@school.kz"}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Пароль</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/10 text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-white text-black rounded-xl font-bold text-base hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:-translate-y-0.5"
                >
                  {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
