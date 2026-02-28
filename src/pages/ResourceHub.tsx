import React, { useState, useEffect } from 'react';
import { Wind, BookOpen, Music, Play, Pause, RotateCcw, ChevronRight, X } from 'lucide-react';
import DOMPurify from 'dompurify';

const BreathingWidget = () => {
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
    const [timeLeft, setTimeLeft] = useState(4);
    const [isActive, setIsActive] = useState(false);
    const [cycleCount, setCycleCount] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev === 1) {
                        if (phase === 'inhale') {
                            setPhase('hold');
                            return 7;
                        } else if (phase === 'hold') {
                            setPhase('exhale');
                            return 8;
                        } else {
                            setPhase('inhale');
                            setCycleCount(c => c + 1);
                            return 4;
                        }
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [isActive, phase]);

    const handleReset = () => {
        setIsActive(false);
        setPhase('inhale');
        setTimeLeft(4);
        setCycleCount(0);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Wind className="w-5 h-5 text-cyan-400" />
                Дыхание 4-7-8
            </h3>

            {/* Breathing Visualizer */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-8">
                <div className={`absolute inset-0 rounded-full border-4 border-white/10 transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'scale-100 border-cyan-400' : phase === 'hold' ? 'scale-110 border-indigo-400' : 'scale-75 border-purple-400'}`}></div>
                <div className={`absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl transition-all duration-[4000ms] ease-in-out ${phase === 'inhale' ? 'scale-100 opacity-50' : phase === 'hold' ? 'scale-110 opacity-30' : 'scale-50 opacity-10'}`}></div>

                <div className="text-center z-10">
                    <div className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-1">
                        {phase === 'inhale' && "Вдох"}
                        {phase === 'hold' && "Задержка"}
                        {phase === 'exhale' && "Выдох"}
                        {!isActive && "Готов?"}
                    </div>
                    <div className="text-5xl font-bold tabular-nums">
                        {timeLeft}
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setIsActive(!isActive)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
                >
                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isActive ? "Пауза" : "Начать"}
                </button>
                <button
                    onClick={handleReset}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            <div className="mt-6 text-xs text-slate-500 font-mono">
                Циклов: {cycleCount}
            </div>
        </div>
    );
};

const ResourceHub = ({ onClose }: { onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState('articles');
    const [selectedArticle, setSelectedArticle] = useState<any>(null);
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);

    const articles = [
        {
            id: 1, title: "Энергия — как её сохранить на весь день", tag: "Энергия",
            content: `
            <h3>Почему устаём так быстро?</h3>
            <p>У школьников энергия уходит на уроки, домашку, ЕНТ, соцсети и игры. К вечеру сил нет даже на любимое дело. Хорошая новость: энергию можно тренировать, как мышцы.</p>

            <h3>5 простых правил энергии:</h3>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong>Правило 90 минут:</strong> Мозг работает циклами по 90 минут. После каждого цикла — 5-10 минут перерыва: встань, пройдись, посмотри в окно. Не сиди в телефоне — это крадёт энергию.</li>
                <li><strong>Ешь для энергии, а не для голода:</strong>
                    <ul class="list-circle pl-5 mt-1 text-sm text-slate-300">
                        <li>Утром: овсянка, яйца, банан (медленные углеводы).</li>
                        <li>Днём: курица/рыба + овощи + гречка/рис.</li>
                        <li>Избегай: газировка, чипсы, сладости до 16:00 (резкий скачок сахара → обвал сил).</li>
                    </ul>
                </li>
                <li><strong>Дыхание для быстрого заряда:</strong> Когда чувствуешь усталость: 1 минута дыхания 4-7-8 (Вдох 4с, Задержка 7с, Выдох 8с). Повтори 4 раза.</li>
                <li><strong>Ходи 10 000 шагов:</strong> Не спортзал, а просто ходьба. Шаги = свежая кровь = энергия.</li>
                <li><strong>Сон = главный источник:</strong> 7-9 часов сна важнее всего. Ложись до 23:00.</li>
            </ul>
            <div class="bg-indigo-900/30 p-4 rounded-xl mt-4 border-l-4 border-indigo-500">
                <strong>Быстрый тест:</strong> Если после обеда хочется спать — проблема в еде или сне. Если утром нет сил — проверь режим дня.
            </div>`
        },
        {
            id: 2, title: "Сон — суперсила для мозга и оценок", tag: "Здоровье",
            content: `
            <h3>Сон не для лентяев — это твоя суперсила.</h3>
            <p>Во сне мозг перерабатывает информацию дня и закрепляет знания.</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li>Каждый час сна = +10% к концентрации на уроках.</li>
                <li>Сон 7-9 часов = мозг работает как у чемпиона.</li>
            </ul>
            
            <h3>Идеальный режим:</h3>
            <p>22:00-23:00 — отбой, 6:00-7:00 — подъём.</p>

            <h3>Что делать, если не спится:</h3>
            <ul class="list-disc pl-5 mt-2">
                <li>Ритуал перед сном (30 минут): Без гаджетов, горячий душ, чтение.</li>
                <li>Если не спится 20 минут — встань, почитай книгу, вернись.</li>
                <li>Темные шторы и прохлада (18-20°C).</li>
            </ul>`
        },
        {
            id: 3, title: "Настроение — как им управлять", tag: "Психология",
            content: `
            <h3>Настроение можно настроить, как радио.</h3>
            <p>5 приёмов смены настроения за 5 минут:</p>
            <ol class="list-decimal pl-5 space-y-2 mt-2">
                <li><strong>Дыхание 4-4-4:</strong> Вдох 4с, задержка 4с, выдох 4с. 2 минуты перезагрузки.</li>
                <li><strong>Смена позы:</strong> Выпрями спину, расправь плечи. +20% уверенности.</li>
                <li><strong>Звук природы:</strong> Шум дождя или леса.</li>
                <li><strong>Движение:</strong> 10 приседаний или танец.</li>
                <li><strong>Благодарность:</strong> Запиши 3 вещи, за которые благодарен.</li>
            </ol>`
        },
        {
            id: 4, title: "Учеба без выгорания", tag: "Учеба",
            content: `
            <h3>80% школьников выгорают к концу четверти.</h3>
            <p>Анти-выгорание план:</p>
            <ul class="list-disc pl-5 space-y-2 mt-2">
                <li><strong>Правило 52/17:</strong> 52 мин работы, 17 мин отдыха.</li>
                <li><strong>Таймблокинг:</strong> Математика 17:00-17:52, Английский 18:10-19:02.</li>
                <li><strong>Награда:</strong> После блока учебы — 10 минут отдыха (TikTok и т.д.).</li>
                <li><strong>Выходной:</strong> Один полный день без учебников.</li>
            </ul>`
        },
        {
            id: 5, title: "Соцсети — как не тонуть в скролле", tag: "Цифровой Детокс",
            content: `
            <h3>Соцсети крадут 3+ часа в день.</h3>
            <p>План освобождения:</p>
            <ul class="list-disc pl-5 space-y-2">
                <li>Таймер на приложения (30 мин/день).</li>
                <li>Утро без телефона до 9:00.</li>
                <li>"Дофаминовый детокс" — 1 день в неделю без соцсетей.</li>
                <li>Убери подписки, которые не вдохновляют.</li>
            </ul>`
        },
        {
            id: 6, title: "Друзья и конфликты", tag: "Отношения",
            content: `
            <h3>5 шагов разрешения конфликтов:</h3>
            <ol class="list-decimal pl-5 space-y-2">
                <li><strong>Пауза 24 часа:</strong> Остынь, не пиши сгоряча.</li>
                <li><strong>Я-высказывания:</strong> "Мне грустно, когда...", а не "Ты всегда...".</li>
                <li><strong>Слушай 2 минуты:</strong> Не перебивай.</li>
                <li><strong>Общая цель:</strong> "Давай не ссориться из-за ерунды".</li>
                <li><strong>Обнимашки:</strong> Восстанавливают связь.</li>
            </ol>`
        },
        {
            id: 7, title: "Физика тела — как тело влияет на мозг", tag: "Биохакинг",
            content: `
            <h3>Тело управляет настроением.</h3>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong>Поза силы (2 мин):</strong> Руки на бока, грудь вперед. Тестостерон +, Кортизол -.</li>
                <li><strong>Холодный душ:</strong> Заряд эндорфинов.</li>
                <li><strong>Жевание жвачки:</strong> +40% крови к мозгу.</li>
            </ul>`
        },
        {
            id: 8, title: "ЕНТ без паники", tag: "Экзамены",
            content: `
            <h3>ЕНТ — не конец света.</h3>
            <ul class="list-disc pl-5 space-y-2">
                <li><strong>Правило 80/20:</strong> Учи "золотые темы".</li>
                <li><strong>Тренировки по таймеру:</strong> 25 мин тест → 5 мин отдых.</li>
                <li><strong>Метод "Двоечника":</strong> Сначала 70% легких заданий, трудные в конце.</li>
                <li><strong>Сон > Зубрёжка:</strong> Перед экзаменом спи 8 часов.</li>
            </ul>`
        },
        {
            id: 9, title: "Прокрастинация — как начать", tag: "Продуктивность",
            content: `
             <h3>5 приёмов:</h3>
             <ul class="list-disc pl-5 space-y-2">
                 <li><strong>Правило 5 секунд:</strong> 5-4-3-2-1 → ВСТАВАЙ!</li>
                 <li><strong>2 минуты:</strong> Скажи себе "сделаю только 2 минуты".</li>
                 <li><strong>Съешь лягушку:</strong> Самое сложное — первым делом утром.</li>
             </ul>`
        },
        {
            id: 10, title: "Тревога перед контрольной", tag: "Психология",
            content: `
            <h3>Анти-тревожный протокол (10 мин):</h3>
            <p>1 мин — Дыхание 4-7-8.<br/>
            2 мин — Поза силы.<br/>
            3 мин — Запиши 3 факта "Я знаю материал".<br/>
            2 мин — Жвачка.</p>`
        },
        {
            id: 11, title: "Мотивация — где её взять", tag: "Мотивация",
            content: `
            <h3>Как создать мотивацию:</h3>
            <ul class="list-disc pl-5">
                <li><strong>Доска визуализации:</strong> Фото вуза мечты.</li>
                <li><strong>"Почему" лист:</strong> 5 причин зачем тебе это.</li>
                <li><strong>Микро-победы:</strong> 5 задач = +1% к цели.</li>
            </ul>`
        },
        {
            id: 12, title: "Фокус — концентрация на 2 часа", tag: "Учеба",
            content: `
            <h3>Тренировка внимания:</h3>
            <p>Телефон в другой комнате. Одна вкладка браузера. Фоновая музыка без слов (Lo-fi).</p>`
        }
    ];

    const videos = [
        { id: 'stress1', title: "Психология для старшеклассников: Стресс", author: "Диана Старунская", url: "https://www.youtube.com/embed/OpUN63HAmSo", category: "Стресс" },
        { id: 'stress2', title: "Как побороть 'школьный' стресс?", author: "Психология", url: "https://www.youtube.com/embed/g5cuGaRbt3k", category: "Стресс" },
        { id: 'mot1', title: "МОТИВАЦИЯ НА УЧЕБУ ЗА 9 МИНУТ", author: "Блогер", url: "https://www.youtube.com/embed/8J6iZkUCmiI", category: "Мотивация" },
        { id: 'mot2', title: "КАК ЗАСТАВИТЬ СЕБЯ УЧИТЬСЯ?", author: "Советы", url: "https://www.youtube.com/embed/g67tmlv9k4s", category: "Мотивация" },
        { id: 'mot3', title: "Как Смотивировать Себя На Учёбу", author: "Back to School", url: "https://www.youtube.com/embed/VsYH0rB8nq8", category: "Мотивация" },
        { id: 'sleep', title: "Здоровый сон подростка", author: "Врач-сомнолог", url: "https://www.youtube.com/embed/HqGjWYaWX1Y", category: "Здоровье" },
        { id: 'proc', title: "Прокрастинация. Что делать?", author: "Психолог", url: "https://www.youtube.com/embed/QaZFayzPoVg", category: "Учеба" },
        { id: 'gen', title: "8 Советов Подросткам до 18 лет", author: "Психология", url: "https://www.youtube.com/embed/6HbzQT111-k", category: "Общее" },
    ];

    const meditations = [
        { id: 'm1', title: "5-минутная медитация от стресса", author: "Заземление", url: "https://www.youtube.com/embed/Nc4AXkNTfCs", time: "5 мин" },
        { id: 'm2', title: "Медитация для детей на каждый день", author: "Спокойствие", url: "https://www.youtube.com/embed/FRNXuYg-dxU", time: "5 мин" },
        { id: 'm3', title: "Медитация на ночь (Голос)", author: "Сон", url: "https://www.youtube.com/embed/elNw_BOE2Rg", time: "10 мин" },
        { id: 'm4', title: "Дыхательная гимнастика", author: "Для перемен", url: "https://www.youtube.com/embed/W6nFGRliGKM", time: "5 мин" }
    ];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[60] flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <header className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-purple-400" />
                    <h2 className="text-xl font-bold">Библиотека Ресурсов</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                </button>
            </header>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar / Tabs */}
                <aside className="w-full md:w-64 p-4 border-r border-white/10 bg-black/20 overflow-x-auto md:overflow-visible flex md:flex-col gap-2 shrink-0">
                    {[
                        { id: 'articles', icon: BookOpen, label: 'Статьи' },
                        { id: 'videos', icon: Play, label: 'Видео-советы' },
                        { id: 'meditation', icon: Music, label: 'Медитации' },
                        { id: 'breathing', icon: Wind, label: 'Дыхание' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setSelectedArticle(null); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-left font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">

                    {/* BREATHING */}
                    {activeTab === 'breathing' && (
                        <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center">
                            <BreathingWidget />
                            <div className="mt-8 text-center text-slate-400 max-w-lg mx-auto">
                                <h4 className="font-bold text-white mb-2">О технике 4-7-8</h4>
                                <p className="text-sm">
                                    Вдох через нос (4 сек) → Задержка (7 сек) → Выдох ртом (8 сек).
                                    Эффективно снижает уровень кортизола и успокаивает нервную систему перед экзаменом или сном.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* VIDEOS */}
                    {activeTab === 'videos' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {videos.map(video => (
                                <div key={video.id} onClick={() => setPlayingVideo(video.url)} className="group cursor-pointer">
                                    <div className="aspect-video bg-slate-900 rounded-xl mb-3 overflow-hidden border border-white/10 relative">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Play className="w-5 h-5 text-white fill-white" />
                                            </div>
                                        </div>
                                        <img
                                            src={`https://img.youtube.com/vi/${video.url.split('/').pop()}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{video.category}</span>
                                    <h3 className="font-bold text-white leading-tight mt-1 group-hover:text-indigo-300 transition-colors">{video.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{video.author}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* MEDITATIONS */}
                    {activeTab === 'meditation' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                            {meditations.map(m => (
                                <div key={m.id} onClick={() => setPlayingVideo(m.url)} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 cursor-pointer transition-colors group">
                                    <div className="w-16 h-16 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
                                        <Music className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{m.title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                            <span>{m.time}</span>
                                            <span>•</span>
                                            <span>{m.author}</span>
                                        </div>
                                    </div>
                                    <div className="ml-auto p-2 bg-white/5 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                        <Play className="w-4 h-4" fill="currentColor" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ARTICLES */}
                    {activeTab === 'articles' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
                            {selectedArticle ? (
                                <div className="col-span-12 lg:col-span-12 animate-in fade-in slide-in-from-right-4">
                                    <button
                                        onClick={() => setSelectedArticle(null)}
                                        className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium text-sm"
                                    >
                                        <RotateCcw className="w-4 h-4" /> Назад к списку
                                    </button>
                                    <div className="max-w-3xl mx-auto">
                                        <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-500/20">
                                            {selectedArticle.tag}
                                        </span>
                                        <h1 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">{selectedArticle.title}</h1>
                                        <div
                                            className="prose prose-invert prose-lg max-w-none text-slate-300 font-light leading-relaxed space-y-4"
                                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedArticle.content) }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {articles.map((article) => (
                                        <div
                                            key={article.id}
                                            onClick={() => setSelectedArticle(article)}
                                            className="bg-[#111] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-[#151515] transition-all cursor-pointer group flex flex-col"
                                        >
                                            <div className="flex-1">
                                                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">{article.tag}</div>
                                                <h3 className="text-lg font-bold group-hover:text-purple-200 transition-colors mb-2">{article.title}</h3>
                                                <p className="text-sm text-slate-500 line-clamp-3">
                                                    {article.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                                </p>
                                            </div>
                                            <div className="mt-4 flex items-center text-xs text-slate-400 group-hover:text-white transition-colors gap-2">
                                                <span>Читать статью</span>
                                                <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* VIDEO PLAYER MODAL */}
            {playingVideo && (
                <div className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <button
                        onClick={() => setPlayingVideo(null)}
                        className="absolute top-4 right-4 p-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`${playingVideo}?autoplay=1`}
                            title="Video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceHub;
