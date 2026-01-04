import React from 'react';
import {
  Users, Activity, FileText, BrainCircuit, Menu, X, ChevronRight, Smile, Zap, Lock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import ColorBends from '../../ColorBends';

interface TestimonialProps {
  name: string;
  role: string;
  text: string;
  initials: string;
}

interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

const data = [
  { name: 'Mon', stress: 65, engagement: 40 },
  { name: 'Tue', stress: 55, engagement: 50 },
  { name: 'Wed', stress: 45, engagement: 60 },
  { name: 'Thu', stress: 30, engagement: 75 },
  { name: 'Fri', stress: 25, engagement: 80 },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  return (
    <nav className="absolute top-0 left-0 w-full z-50 px-6 py-8 bg-gradient-to-b from-black/80 to-transparent">
      <div className="max-w-7xl mx-auto flex items-center relative">
        <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter group z-10 mr-12 cursor-pointer">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-lg opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <img
              src="https://i.pinimg.com/736x/c6/5d/e7/c65de7404240bcbc3e45c162551bc009.jpg"
              alt="Prism Logo"
              className="w-10 h-10 relative z-10 rounded-lg"
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            Prism
          </span>
        </div>

        <div className="hidden md:flex gap-8 text-sm font-medium text-white z-10">
          <a href="#how-it-works" className="hover:text-cyan-400 transition-colors duration-300">Как это работает</a>
          <a href="#benefits" className="hover:text-purple-400 transition-colors duration-300">Преимущества</a>
          <a href="#reviews" className="hover:text-pink-400 transition-colors duration-300">Отзывы</a>
        </div>

        <div className="hidden md:flex items-center gap-4 z-10 ml-auto">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-500/30 transition-all text-white text-sm font-semibold backdrop-blur-md"
          >
            Вход для учителей
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-slate-200 transition-all text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transform hover:-translate-y-0.5"
          >
            Вход для учеников
          </button>
        </div>

        <button
          className="md:hidden text-white z-10 ml-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-black/95 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-6 text-white md:hidden border-b border-white/10">
          <a href="#how-it-works" onClick={() => setIsOpen(false)} className="text-lg">Как это работает</a>
          <a href="#benefits" onClick={() => setIsOpen(false)} className="text-lg">Преимущества</a>
          <a href="#reviews" onClick={() => setIsOpen(false)} className="text-lg">Отзывы</a>
          <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-white/10">
            <button onClick={() => navigate('/login')} className="w-full px-6 py-3 rounded-full bg-white text-black font-bold">
              Вход для учеников
            </button>
            <button onClick={() => navigate('/login')} className="w-full px-6 py-3 rounded-full bg-white/10 border border-white/10 text-white font-semibold">
              Вход для учителей
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <ColorBends
          colors={["#ff5c7a", "#8a5cff", "#00ffd1"]}
          rotation={0}
          speed={0.5}
          scale={1.5}
          frequency={1.0}
          warpStrength={1.2}
          mouseInfluence={0}
          parallax={0}
          noise={0.15}
          transparent={false}
        />
      </div>

      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_90%)] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center pt-20">
        <div className="text-white space-y-8 text-center lg:text-left">
          <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
            Будущее <br />
            <span className="text-white">школьной психологии</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0">
            Искусственный интеллект и аналитика данных для мониторинга эмоционального климата класса в реальном времени.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Начать бесплатно
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-transparent border border-white/10 rounded-full font-semibold hover:bg-white/5 hover:border-white/30 transition-all text-white flex items-center justify-center backdrop-blur-sm">
              Как это работает
            </button>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="absolute -top-10 -right-10 w-20 h-20 bg-pink-500 rounded-full blur-[60px] opacity-40 animate-pulse"></div>
          <div className="absolute bottom-10 -left-10 w-32 h-32 bg-cyan-500 rounded-full blur-[60px] opacity-40 animate-pulse animation-delay-2000"></div>

          <div className="bg-black/40 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 opacity-70"></div>

            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-bold text-xl text-white">9 "А" Класс</h3>
                <p className="text-sm text-slate-400">Индекс благополучия</p>
              </div>
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-bold shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                Норма
              </div>
            </div>

            <div className="h-56 w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8a5cff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8a5cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#000000', borderRadius: '12px', border: '1px solid rgba(138,92,255,0.2)', boxShadow: '0 0 20px rgba(138,92,255,0.1)' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="stress" stroke="#8a5cff" fillOpacity={1} fill="url(#colorStress)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="text-2xl font-bold text-white mb-1">24</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Ученика</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                <div className="text-2xl font-bold text-white mb-1">4.8</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Средний балл</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const StepCard: React.FC<StepProps> = ({ number, title, description, icon: Icon }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/5 hover:border-purple-500/30 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-purple-400 font-bold text-xl mb-6 border border-white/10 group-hover:border-purple-500/30 group-hover:text-cyan-400 transition-colors relative z-10">
      {number}
    </div>
    <h3 className="text-xl font-bold text-white mb-3 relative z-10 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-300 group-hover:to-cyan-300 transition-all">{title}</h3>
    <p className="text-slate-400 leading-relaxed relative z-10">{description}</p>
  </div>
);

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-32 bg-black border-t border-white/5 relative">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white tracking-tight">Как работает <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Prism</span>?</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Полная автоматизация процессов диагностики и аналитики.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <StepCard
            number="01"
            title="Интеграция"
            description="Учитель создает цифровой класс за 30 секунд. Ученики подключаются через QR-код."
            icon={Users}
          />
          <StepCard
            number="02"
            title="Сбор данных"
            description="Геймифицированные чек-ины занимают меньше минуты. Система работает фоном."
            icon={Activity}
          />
          <StepCard
            number="03"
            title="Инсайты"
            description="ИИ анализирует паттерны и подсвечивает учеников, которым нужна помощь."
            icon={BrainCircuit}
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard: React.FC<FeatureProps> = ({ title, description, icon: Icon }) => (
  <div className="flex flex-col items-start p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-cyan-500/20 transition-all duration-300 backdrop-blur-sm group">
    <div className="p-3 bg-white/5 rounded-lg text-cyan-400 mb-4 ring-1 ring-white/10 group-hover:text-pink-400 group-hover:ring-pink-500/30 transition-all">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-32 bg-black relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Экосистема безопасности
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Инструменты профессионального уровня для современной школы.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            title="Анти-стресс"
            description="Проактивное выявление признаков выгорания и тревожности у учащихся перед экзаменами."
            icon={Smile}
          />
          <FeatureCard
            title="Ранняя диагностика"
            description="Алгоритмы замечают изменения в поведении, которые могут указывать на буллинг или конфликты."
            icon={Zap}
          />
          <FeatureCard
            title="Умная отчетность"
            description="Генерация профессиональных отчетов для администрации и психологов в один клик."
            icon={FileText}
          />
          <FeatureCard
            title="Приватность"
            description="Сквозное шифрование и анонимизация данных. Соответствие стандартам безопасности."
            icon={Lock}
          />
        </div>
      </div>
    </section>
  );
};

const TestimonialCard: React.FC<TestimonialProps> = ({ name, role, text, initials }) => (
  <div className="bg-white/5 p-8 rounded-2xl border border-white/10 relative hover:border-pink-500/30 transition-colors backdrop-blur-sm">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-white/10">
        {initials}
      </div>
      <div>
        <h4 className="text-white font-bold">{name}</h4>
        <p className="text-purple-400 text-xs uppercase tracking-wide font-semibold">{role}</p>
      </div>
    </div>
    <p className="text-slate-300 text-sm leading-relaxed">
      "{text}"
    </p>
  </div>
);

const ReviewsSection = () => {
  return (
    <section id="reviews" className="py-32 bg-black border-t border-white/5 relative">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center">
          Опыт внедрения
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <TestimonialCard
            initials="АВ"
            name="Анна Васильевна"
            role="Классный руководитель"
            text="Prism изменил мой подход к классу. Я больше не гадаю, почему дети уставшие — я вижу данные и корректирую нагрузку. Это работает."
          />
          <TestimonialCard
            initials="ЕС"
            name="Ержан С."
            role="Школьный психолог"
            text="С помощью платформы я смог выявить двух учеников в группе риска, которые внешне казались совершенно спокойными. Это бесценно."
          />
          <TestimonialCard
            initials="МК"
            name="Марина К."
            role="Завуч"
            text="Администрация в восторге от автоматических отчетов. Мы видим реальную картину по школе, а не просто цифры успеваемости."
          />
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-black text-slate-500 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-white text-xl">
            <img
              src="https://i.pinimg.com/736x/c6/5d/e7/c65de7404240bcbc3e45c162551bc009.jpg"
              alt="Prism Logo"
              className="w-8 h-8 rounded-md"
            />
            <span>Prism</span>
          </div>

          <div className="flex gap-8 text-sm font-medium">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Contact</a>
          </div>

          <div className="text-sm">
            © {new Date().getFullYear()} Prism Analytics.
          </div>
        </div>
      </div>
    </footer>
  );
};

const Landing = () => {
  return (
    <div className="min-h-screen font-sans selection:bg-pink-500 selection:text-white bg-black text-white">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <BenefitsSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
};

export default Landing;
