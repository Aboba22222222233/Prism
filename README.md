# Prism — Платформа мониторинга психологического состояния школьников

<div align="center">

**Современная web-платформа для отслеживания эмоционального состояния учеников с AI-анализом рисков**

[![React](https://img.shields.io/badge/React-18.x-61dafb?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## Содержание

- [О проекте](#о-проекте)
- [Возможности](#возможности)
- [Технологический стек](#технологический-стек)
- [Архитектура](#архитектура)
- [Установка](#установка)
- [Настройка базы данных](#настройка-базы-данных)
- [Структура проекта](#структура-проекта)
- [Компоненты](#компоненты)
- [AI Система](#ai-система)
- [API](#api)

---

## О проекте

**Prism** — это инновационная платформа для школ, которая помогает учителям отслеживать психологическое состояние учеников. 

Ученики ежедневно записывают своё настроение, уровень энергии и сна, а система с помощью AI анализирует паттерны и выявляет учеников, которым может понадобиться поддержка.

### Проблема, которую мы решаем

- Учителя не всегда замечают, когда ученику плохо
- Нет системного подхода к мониторингу благополучия
- Реагирование часто происходит слишком поздно

### Наше решение

- Ежедневные чек-ины учеников
- AI-анализ паттернов за несколько дней
- Ранее выявление рисков
- Приватность и анонимность

---

## Возможности

### Для учеников

| Функция | Описание |
|---------|----------|
| **Ежедневный чек-ин** | Запись настроения (1-5), энергии, сна и факторов стресса |
| **AI Ментор** | Персональный чат-бот для поддержки |
| **Дневник** | История всех записей с визуализацией |
| **Выполнение заданий** | Задания от учителя |

### Для учителей

| Функция | Описание |
|---------|----------|
| **Дашборд класса** | Общая статистика, графики, список учеников |
| **AI Анализ риска** | Автоматическое определение рисков (0-10) |
| **Профили учеников** | Детальная информация по каждому ученику |
| **Режим анонимности** | Скрытие имён для приватности |
| **Задания** | Создание и отслеживание заданий |
| **Календарь** | СОР, СОЧ, контрольные работы |
| **AI Ассистент** | Чат-бот для учителя |

---

## Технологический стек

### Frontend

```
React 18          — UI библиотека
TypeScript 5      — Типизация
Vite 5            — Сборщик
TailwindCSS 3     — Стилизация
Recharts          — Графики
Lucide React      — Иконки
React Router 6    — Роутинг
```

### Backend

```
Supabase          — Backend-as-a-Service
PostgreSQL        — База данных
Row Level Security — Безопасность на уровне строк
Supabase Auth     — Аутентификация
```

### AI

```
OpenRouter API    — Маршрутизация AI моделей
Llama 3.3 70B     — Основная модель
DeepSeek R1       — Резервная модель
Nemotron          — Резервная модель с reasoning
```

---

## Архитектура

```
+-------------------------------------------------------------+
|                         FRONTEND                            |
|  +---------+  +---------+  +---------+  +-----------------+ |
|  | Login   |  | Student |  | Teacher |  | AI Mentor Chat  | |
|  | Page    |  |Dashboard|  |Dashboard|  | (Student/Teacher| |
|  +----+----+  +----+----+  +----+----+  +--------+--------+ |
|       |            |            |                 |          |
+-------+------------+------------+-----------------+----------+
        |            |            |                 |
        v            v            v                 v
+-------------------------------------------------------------+
|                      SUPABASE CLIENT                        |
|  +--------------+  +--------------+  +------------------+   |
|  |     Auth     |  |   Database   |  |   Realtime       |   |
|  | (JWT Tokens) |  |  (REST API)  |  |  (Subscriptions) |   |
|  +--------------+  +--------------+  +------------------+   |
+-------------------------------------------------------------+
        |            |            |                 
        v            v            v                 
+-------------------------------------------------------------+
|                       SUPABASE                              |
|  +------------------------------------------------------+   |
|  |                    PostgreSQL                         |   |
|  |  +---------+ +---------+ +---------+ +------------+  |   |
|  |  |profiles | | classes | |checkins | |ai_risk_    |  |   |
|  |  |         | |         | |         | |assessments |  |   |
|  |  +---------+ +---------+ +---------+ +------------+  |   |
|  +------------------------------------------------------+   |
|  +------------------------------------------------------+   |
|  |              Row Level Security (RLS)                 |   |
|  |  - Ученики видят только свои данные                  |   |
|  |  - Учителя видят данные своих классов                |   |
|  +------------------------------------------------------+   |
+-------------------------------------------------------------+
        |
        v
+-------------------------------------------------------------+
|                      OPENROUTER AI                          |
|  +--------------+  +--------------+  +------------------+   |
|  | Llama 3.3   |  |  DeepSeek    |  |    Nemotron      |   |
|  |   70B       |  |    R1        |  |   (reasoning)    |   |
|  +--------------+  +--------------+  +------------------+   |
+-------------------------------------------------------------+
```

---

## Установка

### Требования

- Node.js 18+
- npm или yarn
- Аккаунт Supabase

### Шаги

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-username/prism-classroom.git
cd prism-classroom

# 2. Установить зависимости
npm install

# 3. Создать файл .env (см. ниже)
cp .env.example .env

# 4. Запустить dev сервер
npm run dev
```

### Переменные окружения

Создайте файл `.env` с вашими ключами:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Настройка базы данных

Выполните следующие SQL скрипты в **Supabase SQL Editor**:

### 1. Таблица профилей

```sql
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('student', 'teacher')) DEFAULT 'student',
    class_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### 2. Таблица классов

```sql
CREATE TABLE classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    teacher_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own classes"
ON classes FOR ALL
USING (teacher_id = auth.uid());
```

### 3. Таблица участников классов

```sql
CREATE TABLE class_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- RLS
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view class members"
ON class_members FOR SELECT
USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    OR student_id = auth.uid()
);
```

### 4. Таблица чек-инов

```sql
CREATE TABLE checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    sleep_hours DECIMAL(3,1),
    factors TEXT[],
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own checkins"
ON checkins FOR ALL
USING (student_id = auth.uid());

CREATE POLICY "Teachers can view student checkins"
ON checkins FOR SELECT
USING (
    student_id IN (
        SELECT student_id FROM class_members
        WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
    )
);
```

### 5. Таблица AI оценок риска

```sql
CREATE TABLE ai_risk_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    risk_level INTEGER CHECK (risk_level >= 0 AND risk_level <= 10),
    status TEXT CHECK (status IN ('critical', 'warning', 'attention', 'normal')),
    reason TEXT,
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id)
);

-- RLS
ALTER TABLE ai_risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage assessments"
ON ai_risk_assessments FOR ALL
USING (
    class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);
```

### 6. Таблица заданий

```sql
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id),
    response TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Структура проекта

```
src/
├── components/           # Переиспользуемые компоненты
│   ├── MentorChat.tsx         # AI чат для учеников
│   └── TeacherMentorChat.tsx  # AI чат для учителей
│
├── lib/                  # Утилиты и сервисы
│   ├── supabase.ts           # Клиент Supabase
│   ├── gemini.ts             # AI функции (OpenRouter)
│   └── utils.ts              # Вспомогательные функции
│
├── pages/                # Страницы приложения
│   ├── Login.tsx             # Страница входа/регистрации
│   ├── StudentDashboard.tsx  # Дашборд ученика
│   ├── TeacherDashboard.tsx  # Дашборд учителя
│   └── ...
│
├── App.tsx               # Главный компонент с роутингом
├── main.tsx              # Точка входа
└── index.css             # Глобальные стили
```

---

## Компоненты

### StudentDashboard.tsx

Главная страница ученика с:

```tsx
// Состояния
const [currentView, setCurrentView] = useState<'courses' | 'dashboard'>('courses');
const [activeTab, setActiveTab] = useState('home'); // home, diary, stats, settings
const [showLogoutModal, setShowLogoutModal] = useState(false);

// Функции
const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
};

const submitCheckin = async () => {
    // Сохранение чек-ина в БД
    await supabase.from('checkins').insert({...});
};
```

**Вкладки:**
- `home` — Главная с чек-ином
- `diary` — Дневник записей
- `stats` — Статистика
- `settings` — Настройки

### TeacherDashboard.tsx

Главная страница учителя:

```tsx
// AI Risk Assessment
const runAIRiskAssessment = async () => {
    for (const student of students) {
        const assessment = await assessStudentRisk({
            name: student.name,
            checkins: student.checkins
        });
        // Сохранение в БД
        await supabase.from('ai_risk_assessments').upsert({...});
    }
};
```

**Компоненты:**
- Сайдбар с классами
- Таблица учеников
- Карточки статистики
- График динамики
- AI аналитик
- Модальное окно профиля ученика

### MentorChat.tsx

AI чат-бот для учеников:

```tsx
// Системный промпт
const systemPrompt = `Ты — доброжелательный AI-ментор для школьника.
Твоя задача — поддержать ученика, выслушать и дать совет.
НЕ давай медицинских рекомендаций.
Если ученик в кризисе — направь к взрослому.`;

// Отправка сообщения
const sendMessage = async (text: string) => {
    const response = await getChatResponse([
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: text }
    ]);
};
```

---

## AI Система

### Архитектура AI

```
+---------------------------------------------+
|              OpenRouter API                  |
|  +-------------------------------------+    |
|  |         Model Fallback Chain        |    |
|  |                                     |    |
|  |  1. Llama 3.3 70B (primary)        |    |
|  |         | (если ошибка)            |    |
|  |         v                          |    |
|  |  2. DeepSeek R1 (fallback)         |    |
|  |         | (если ошибка)            |    |
|  |         v                          |    |
|  |  3. Nemotron (last resort)         |    |
|  |                                     |    |
|  +-------------------------------------+    |
+---------------------------------------------+
```

### Функция оценки риска

Файл: `src/lib/gemini.ts`

```typescript
export async function assessStudentRisk(studentData: {
    name: string;
    checkins: Array<{
        date: string;
        mood: number;
        stress: number;
        sleep: number;
        energy: number;
        factors: string[];
        comment: string;
    }>;
}): Promise<{
    isRisk: boolean;
    riskLevel: number;  // 0-10
    status: 'critical' | 'warning' | 'attention' | 'normal';
    reason: string;
}>
```

### Критерии оценки риска

| Уровень | Баллы | Критерии |
|---------|-------|----------|
| Норма | 0-2 | Настроение 3-5, один-два плохих дня, обычная усталость |
| Внимание | 3-5 | Несколько плохих дней с хорошими, колебания |
| Риск | 6-7 | 4+ дней низкого настроения, серьёзные проблемы |
| Критично | 8-10 | Суицид, буллинг, насилие, 5+ дней настроения 1-2 |

### Пример промпта

```
Ты — доброжелательный школьный психолог-аналитик.

ДАННЫЕ УЧЕНИКА "Ученик 1":
[22.01] Настроение: 3/5, Сон: 7ч, Энергия: 6/10
[23.01] Настроение: 4/5, Сон: 8ч, Энергия: 7/10

ВАЖНО: Большинство учеников — в норме!

СТРОГИЕ ПРАВИЛА:
1. Настроение 3/5 — это НОРМА
2. Один-два плохих дня — НОРМАЛЬНО
3. Стресс из-за СОР/СОЧ — НОРМАЛЬНО

Ответь JSON:
{
  "riskLevel": 1,
  "status": "normal",
  "reason": "Стабильное состояние, небольшие колебания в норме."
}
```

---

## API

### Supabase Client

Файл: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Основные запросы

```typescript
// Получить чек-ины ученика
const { data } = await supabase
    .from('checkins')
    .select('*')
    .eq('student_id', userId)
    .order('created_at', { ascending: false });

// Создать чек-ин
await supabase.from('checkins').insert({
    student_id: userId,
    mood_score: 4,
    energy_level: 7,
    sleep_hours: 7.5,
    factors: ['exam'],
    comment: 'Готовлюсь к СОЧ'
});

// Получить учеников класса
const { data } = await supabase
    .from('class_members')
    .select(`
        student_id,
        profiles!inner(id, full_name, email)
    `)
    .eq('class_id', classId);

// Сохранить AI оценку
await supabase.from('ai_risk_assessments').upsert({
    student_id: studentId,
    class_id: classId,
    risk_level: 2,
    status: 'normal',
    reason: 'Стабильное состояние'
}, {
    onConflict: 'student_id,class_id'
});
```

---

## Безопасность

### Row Level Security (RLS)

Каждая таблица защищена политиками:

```sql
-- Ученики видят только свои чек-ины
CREATE POLICY "Students own checkins"
ON checkins FOR ALL
USING (student_id = auth.uid());

-- Учителя видят чек-ины своих классов
CREATE POLICY "Teachers view class checkins"
ON checkins FOR SELECT
USING (
    student_id IN (
        SELECT student_id FROM class_members
        WHERE class_id IN (
            SELECT id FROM classes WHERE teacher_id = auth.uid()
        )
    )
);
```

### Приватность

- Режим анонимности скрывает имена учеников
- Комментарии скрыты в анонимном режиме
- AI анализ доступен только учителям своих классов

---

## Деплой

### Vercel (рекомендуется)

```bash
# Установить Vercel CLI
npm i -g vercel

# Деплой
vercel

# Добавить env переменные в Vercel Dashboard
```

### Netlify

```bash
# Build
npm run build

# Загрузить dist/ на Netlify
```

---

## Лицензия

MIT License — см. файл [LICENSE](LICENSE)

---

## Команда

Разработано для улучшения благополучия школьников

---

<div align="center">

**[Наверх](#prism--платформа-мониторинга-психологического-состояния-школьников)**

</div>
