import React, { useState } from 'react';
import {
    Users, Activity, FileText, Menu, X, ChevronRight, Smile, Zap, Lock, Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EvervaultCard, Icon } from '../components/ui/evervault-card';
import { PricingSection } from '../components/ui/pricing';

const PLANS = [
    {
        name: 'Trial',
        info: 'Бесплатный пробный период',
        price: {
            monthly: 0,
            yearly: 0,
        },
        features: [
            { text: 'Полный доступ к платформе' },
            { text: '7 дней бесплатно' },
            { text: 'AI-мониторинг эмоций', tooltip: 'Анализ эмоционального состояния учеников в реальном времени' },
            { text: 'Базовая аналитика' },
        ],
        btn: {
            text: 'Подать заявку',
            href: '/login',
        },
    },
    {
        highlighted: true,
        name: 'Standard',
        info: 'До 100 учеников',
        price: {
            monthly: 75000,
            yearly: 75000,
        },
        features: [
            { text: 'Охват до 100 учеников', tooltip: 'Примерно одна параллель или 3–4 класса' },
            { text: 'Полный AI-мониторинг' },
            { text: 'Расширенная аналитика' },
            { text: 'Приоритетная поддержка', tooltip: 'Ответ в течение 24 часов' },
            { text: 'Стоимость 750₸ на ученика' },
        ],
        btn: {
            text: 'Выбрать тариф',
            href: '/login',
        },
    },
    {
        name: 'Ultra',
        info: 'На всю школу',
        price: {
            monthly: 155000,
            yearly: 155000,
        },
        features: [
            { text: 'До 500–1000 учеников' },
            { text: 'Полный AI-мониторинг' },
            { text: 'Продвинутая аналитика', tooltip: 'Детальные отчёты по классам и параллелям' },
            { text: 'Персональный менеджер' },
            { text: 'Школьная интеграция', tooltip: 'Интеграция с системами школьного учёта' },
        ],
        btn: {
            text: 'Выбрать тариф',
            href: '/login',
        },
    },
];


interface FeatureProps {
    title: string;
    description: string;
    icon: React.ElementType;
}

const EvervaultFeatureCard: React.FC<FeatureProps> = ({ title, description, icon: IconComponent }) => (
    <div className="border border-slate-200 flex flex-col items-center text-center p-8 relative rounded-2xl bg-white hover:shadow-lg transition-shadow">
        <Icon className="absolute h-7 w-7 -top-3.5 -left-3.5 text-slate-200" />
        <Icon className="absolute h-7 w-7 -bottom-3.5 -left-3.5 text-slate-200" />
        <Icon className="absolute h-7 w-7 -top-3.5 -right-3.5 text-slate-200" />
        <Icon className="absolute h-7 w-7 -bottom-3.5 -right-3.5 text-slate-200" />

        {/* Evervault area */}
        <div className="h-44 w-full flex items-center justify-center mb-5">
            <EvervaultCard text={title} />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
            <div className="p-2 rounded-xl bg-slate-100">
                <IconComponent className="w-6 h-6 text-slate-600" />
            </div>
            <h3 className="text-slate-900 text-lg font-semibold">
                {title}
            </h3>
        </div>

        {/* Description */}
        <p className="text-base text-slate-500 font-light leading-relaxed">
            {description}
        </p>
    </div>
);

const PricingWithToggle = () => {
    const [isYearly, setIsYearly] = useState(false);

    const prices = {
        standard: isYearly ? 75000 * 12 : 75000,
        ultra: isYearly ? 155000 * 12 : 155000,
    };

    const formatPrice = (price: number) => {
        return price.toLocaleString('ru-RU').replace(/,/g, ' ');
    };

    return (
        <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-5xl md:text-6xl font-bold text-white text-center mb-8 drop-shadow-2xl">
                Выберите свой тариф
            </h2>

            {/* Toggle */}
            <div className="flex justify-center mb-12">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-1.5 flex gap-1">
                    <button
                        onClick={() => setIsYearly(false)}
                        className={`px-8 py-3 rounded-full font-medium text-lg transition-all ${!isYearly
                            ? 'bg-white text-slate-900 shadow-lg'
                            : 'text-white hover:bg-white/10'
                            }`}
                    >
                        Месяц
                    </button>
                    <button
                        onClick={() => setIsYearly(true)}
                        className={`px-8 py-3 rounded-full font-medium text-lg transition-all ${isYearly
                            ? 'bg-white text-slate-900 shadow-lg'
                            : 'text-white hover:bg-white/10'
                            }`}
                    >
                        Год
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Trial */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col">
                    <div className="mb-6">
                        <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">Пробный</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-3">Trial</h3>
                    <div className="mb-5">
                        <span className="text-5xl font-bold text-slate-900">Бесплатно</span>
                        <span className="text-slate-500 ml-2 text-lg">/ 7 дней</span>
                    </div>
                    <p className="text-lg text-slate-600 mb-8 flex-grow leading-relaxed">
                        Попробуйте все возможности Prism бесплатно. Идеально для знакомства с платформой.
                    </p>
                    <a
                        href="https://mail.google.com/mail/?view=cm&to=Wifiskeleton300@gmail.com&su=Заявка на тариф Trial"
                        className="w-full py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all text-center text-lg"
                    >
                        Подать заявку
                    </a>
                </div>

                {/* Standard */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col border-2 border-indigo-500 relative">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="text-sm font-medium text-white bg-indigo-500 px-5 py-2 rounded-full shadow-lg">Популярный</span>
                    </div>
                    <div className="mb-6">
                        <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">До 100 учеников</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-3">Standard</h3>
                    <div className="mb-5">
                        <span className="text-5xl font-bold text-slate-900">{formatPrice(prices.standard)} ₸</span>
                        <span className="text-slate-500 ml-2 text-lg">/ {isYearly ? 'год' : 'мес'}</span>
                    </div>
                    <p className="text-lg text-slate-600 mb-8 flex-grow leading-relaxed">
                        Охват до 100 учеников — одна параллель или 3–4 класса. Стоимость всего 750₸ на ученика.
                    </p>
                    <a
                        href="https://mail.google.com/mail/?view=cm&to=Wifiskeleton300@gmail.com&su=Заявка на тариф Standard"
                        className="w-full py-4 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all text-center text-lg shadow-lg"
                    >
                        Подать заявку
                    </a>
                </div>

                {/* Ultra */}
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col">
                    <div className="mb-6">
                        <span className="text-sm font-medium text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full">До 385 учеников</span>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-3">Ultra</h3>
                    <div className="mb-5">
                        <span className="text-5xl font-bold text-slate-900">{formatPrice(prices.ultra)} ₸</span>
                        <span className="text-slate-500 ml-2 text-lg">/ {isYearly ? 'год' : 'мес'}</span>
                    </div>
                    <p className="text-lg text-slate-600 mb-8 flex-grow leading-relaxed">
                        School-wide тариф: до 385 учеников. Один платёж за всю школу — проще и выгоднее.
                    </p>
                    <a
                        href="https://mail.google.com/mail/?view=cm&to=Wifiskeleton300@gmail.com&su=Заявка на тариф Ultra"
                        className="w-full py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all text-center text-lg"
                    >
                        Подать заявку
                    </a>
                </div>
            </div>
        </div>
    );
};

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <nav className="absolute top-0 left-0 w-full z-50 py-6 bg-transparent">
            <div className="flex items-center justify-between w-full px-10 md:px-20 lg:px-32">
                <div
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2.5 group z-10 cursor-pointer ml-10 lg:ml-40"
                >
                    <img
                        src="/logo.png"
                        alt="Prism Logo"
                        className="h-12 w-auto object-contain"
                    />
                    <span className="text-2xl font-semibold text-white">Prism</span>
                </div>

                <div className="hidden md:flex items-center gap-5 z-10">
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full border border-white/30 hover:bg-white/10 transition-all text-white text-sm font-medium backdrop-blur-sm"
                    >
                        Вход для учителей
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full bg-white text-slate-900 hover:bg-white/90 transition-all text-sm font-medium shadow-lg"
                    >
                        Вход для учеников
                    </button>
                </div>

                <button
                    className="md:hidden text-white z-10"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X /> : <Menu />}
                </button>
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-xl p-6 flex flex-col gap-4 md:hidden border-b border-slate-100">
                    <button onClick={() => navigate('/login')} className="w-full px-6 py-3 rounded-full bg-slate-900 text-white font-medium">
                        Вход для учеников
                    </button>
                    <button onClick={() => navigate('/login')} className="w-full px-6 py-3 rounded-full border border-slate-200 text-slate-700 font-medium">
                        Вход для учителей
                    </button>
                </div>
            )}
        </nav>
    );
};

const HeroSection = () => {
    const navigate = useNavigate();
    return (
        <section className="relative h-screen w-full overflow-hidden">
            {/* Full-screen Background Image */}
            <img
                src="/hero-samurai.png"
                alt="Samurai meditating"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Content Overlay - Right Side */}
            <div className="relative z-10 h-full flex items-center justify-end">
                <div className="max-w-2xl mr-8 md:mr-20 lg:mr-32 space-y-8 text-right">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-light leading-tight tracking-tight text-white drop-shadow-lg">
                        Технологии, которые<br />чувствуют и понимают.
                    </h1>
                    <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-light drop-shadow-md">
                        Доказываем, что искусственный интеллект может быть эмпатичным помощником. Prism анализирует эмоциональный фон школы в реальном времени, помогая сохранить ментальное здоровье каждого ребенка.
                    </p>
                    <div className="flex justify-end">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-5 bg-white text-slate-900 rounded-full text-lg font-medium hover:bg-slate-100 transition-all flex items-center gap-2 group shadow-xl border border-slate-200"
                        >
                            Присоединиться
                            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

const ForTeachersSection = () => {
    return (
        <section className="py-40 bg-white relative">
            <div className="max-w-[90rem] mx-auto px-8">
                <div className="mb-24">
                    <span className="text-slate-400 font-medium tracking-wider uppercase text-sm">Для учителей</span>
                    <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mt-5 mb-10">
                        Управляйте климатом <br />
                        в классе
                    </h2>
                    <p className="text-slate-500 max-w-2xl text-xl font-light">
                        Всё, что нужно для понимания состояния учеников и эффективной работы.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                    <EvervaultFeatureCard
                        title="AI Аналитика"
                        description="Глубокий AI-анализ настроения и уровня стресса класса в реальном времени. Автоматическое выявление учеников в зоне риска и персональные рекомендации для каждого."
                        icon={Activity}
                    />
                    <EvervaultFeatureCard
                        title="Умный Календарь"
                        description="Планирование СОР, СОЧ и контрольных работ с умным распределением нагрузки. Ученики видят расписание сразу в своем приложении и получают напоминания."
                        icon={FileText}
                    />
                    <EvervaultFeatureCard
                        title="Ментор-Ассистент"
                        description="Встроенный AI-помощник на базе Gemini, который дает педагогические советы и рекомендации на основе данных о состоянии каждого ученика."
                        icon={Bot}
                    />
                    <EvervaultFeatureCard
                        title="Управление Классом"
                        description="Легкое создание классов, добавление учеников через уникальный код и полный контроль над составом. Исключение неактивных и управление доступом."
                        icon={Users}
                    />
                </div>
            </div>
        </section>
    );
};

const ForStudentsSection = () => {
    return (
        <section className="py-40 bg-slate-50 relative border-t border-slate-100">
            <div className="max-w-[90rem] mx-auto px-8">
                <div className="mb-24 text-right">
                    <span className="text-slate-400 font-medium tracking-wider uppercase text-sm">Для учеников</span>
                    <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mt-5 mb-10">
                        Твоё пространство <br />
                        спокойствия
                    </h2>
                    <p className="text-slate-500 max-w-2xl text-xl ml-auto font-light">
                        Инструменты для самопознания и поддержки ментального здоровья.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                    <EvervaultFeatureCard
                        title="Дейли Чек-ины"
                        description="Ежедневно отмечай своё настроение, качество сна и уровень энергии. Анализируй свою статистику за неделю, месяц или весь учебный год."
                        icon={Smile}
                    />
                    <EvervaultFeatureCard
                        title="Ресурсный Хаб"
                        description="Дыхательные практики, медитации и полезные статьи для снижения стресса. Готовься к экзаменам спокойно с нашими ресурсами."
                        icon={Zap}
                    />
                    <EvervaultFeatureCard
                        title="Мои Задания"
                        description="Выполняй задания от учителя и рефлексируй в удобном формате прямо в приложении. Отслеживай свой прогресс и достижения."
                        icon={Lock}
                    />
                    <EvervaultFeatureCard
                        title="Персональный Профиль"
                        description="Настраивай аватар, следи за своим прогрессом и достижениями. Получай персональные рекомендации на основе твоих данных."
                        icon={Users}
                    />
                </div>
            </div>
        </section>
    );
};

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="relative min-h-[500px] flex items-start">
            {/* Background Image */}
            <img
                src="/Gemini_Generated_Image_tk6hzwtk6hzwtk6h.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative w-full max-w-7xl mx-auto px-8 py-16">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Prism Logo"
                            className="w-10 h-10"
                        />
                        <span className="text-white font-bold text-2xl drop-shadow-lg">Prism</span>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 drop-shadow-lg">Resources</h4>
                        <ul className="space-y-2">
                            <li>
                                <button
                                    onClick={() => navigate('/changelog')}
                                    className="text-white font-medium hover:text-white/80 transition-colors text-sm drop-shadow"
                                >
                                    Changelog
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => navigate('/blog')}
                                    className="text-white font-medium hover:text-white/80 transition-colors text-sm drop-shadow"
                                >
                                    Blog
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Соцсети */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 drop-shadow-lg">Соцсети</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://x.com/wifiskeleton300"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white font-medium hover:text-white/80 transition-colors text-sm drop-shadow"
                                >
                                    X
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.instagram.com/kindamewsp/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white font-medium hover:text-white/80 transition-colors text-sm drop-shadow"
                                >
                                    Instagram
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Контакты */}
                    <div>
                        <h4 className="text-white font-semibold mb-4 drop-shadow-lg">Контакты</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://mail.google.com/mail/?view=cm&to=Wifiskeleton300@gmail.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-white font-medium hover:text-white/80 transition-colors text-sm drop-shadow"
                                >
                                    Wifiskeleton300@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-white font-medium text-sm drop-shadow">
                        © 2026 Prism. Все права защищены.
                    </p>
                    <p className="text-white font-medium text-xs drop-shadow">
                        Сделано в РФМШ г.Астана
                    </p>
                </div>
            </div>
        </footer>
    );
};

const testimonials = [
    {
        quote: "Проект Prism представляет собой тщательно разработанное исследование с высокой научной и образовательной ценностью. Демонстрирует глубокое понимание проблемы и высокий уровень самостоятельности.",
        name: "Шүкірбаев Нұржан Д.",
        role: "Научный руководитель",
        type: "professional"
    },
    {
        quote: "Проект оценивается как актуальный продукт с высокой психолого-педагогической ценностью. При грамотном внедрении он способен улучшить психологический климат в школе.",
        name: "Икимова Д.Т.",
        role: "Педагог-психолог",
        type: "professional"
    },
    {
        quote: "Честно, раньше было сложно говорить о своих переживаниях. А тут просто отмечаешь настроение каждый день, и это реально помогает понять себя лучше. Плюс ИИ-ментор всегда на связи.",
        name: "Аружан К.",
        role: "Ученица 10F класса, РФМШ",
        type: "student"
    },
    {
        quote: "Pixel Year — это топ! Когда видишь весь год в цветах, понимаешь, что на самом деле хороших дней больше, чем казалось. Советую всем попробовать.",
        name: "Даниял М.",
        role: "Ученик 10F класса, РФМШ",
        type: "student"
    },
    {
        quote: "Мне нравится, что всё анонимно. Можно честно писать о своих чувствах, и никто не осудит. ИИ-ментор помог мне справиться со стрессом перед олимпиадой.",
        name: "Амина Б.",
        role: "Ученица 10F класса, РФМШ",
        type: "student"
    },
    {
        quote: "Prism — это как личный дневник, только умнее. Трекер настроения прикольный, заполняю каждый день. Рекомендую всем одноклассникам!",
        name: "Арсен Т.",
        role: "Ученик 10F класса, РФМШ",
        type: "student"
    }
];

const TestimonialsSection = () => {
    return (
        <section className="py-28 bg-white">
            <div className="max-w-7xl mx-auto px-8">
                {/* Header */}
                <div className="mb-16">
                    <p className="text-sm font-medium text-slate-400 tracking-widest mb-4">[ ОТЗЫВЫ ]</p>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 max-w-2xl leading-tight">
                        Узнайте, что говорят о <span className="text-slate-900" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '0.7em' }}>Prism</span>
                    </h2>
                    <p className="text-lg text-slate-500 mt-4 max-w-xl">
                        Реальные отзывы от педагогов, психологов и учеников РФМШ г. Астана.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow flex flex-col"
                        >
                            {/* Quote mark */}
                            <div className="text-5xl text-slate-200 font-serif leading-none mb-4">"</div>

                            {/* Quote text */}
                            <p className="text-slate-600 leading-relaxed flex-grow mb-6">
                                {item.quote}
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                                    {item.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{item.name}</p>
                                    <p className="text-slate-400 text-xs">{item.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const Landing = () => {
    return (
        <div className="min-h-screen font-geist selection:bg-slate-200 selection:text-slate-900 bg-white text-slate-900">
            <Navbar />
            <HeroSection />
            <ForTeachersSection />
            <div className="w-full relative">
                <img
                    src="/Gemini_Generated_Image_v2lcmov2lcmov2lc.png"
                    alt="Abstract Prism Design"
                    className="w-full h-[1100px] object-cover object-bottom"
                />
                <div className="absolute inset-0 flex items-center justify-center py-12">
                    <PricingWithToggle />
                </div>
            </div>
            <ForStudentsSection />
            <TestimonialsSection />
            <Footer />
        </div>
    );
};

export default Landing;
