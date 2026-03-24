# Prism

<div align="center">

**AI-assisted school wellbeing platform** for psychologists and students.

[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Expo 54](https://img.shields.io/badge/Expo-54-000000?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Phosphor Icons](https://img.shields.io/badge/Icons-Phosphor-111111?style=for-the-badge)](https://phosphoricons.com/)

[Product Video](https://youtu.be/O-wGndqLzEQ) • [Web Demo](https://prism-psi-seven.vercel.app)

</div>

## What Prism does

Prism is built for school wellbeing monitoring, not for clinical diagnosis.

- Students complete short check-ins about mood, sleep, energy, and optional notes.
- Psychologists review class-level and student-level trends in a structured dashboard.
- The AI layer summarizes repeated data, highlights patterns, and supports follow-up decisions.
- Access is controlled through authenticated roles and database-level policies.

The core idea is simple: move schools from isolated observation to repeated, structured, and earlier support.

## Main product areas

### Web

- Landing and product pages
- Student dashboard
- Psychologist dashboard
- Resource hub
- AI mentor / psychologist assistant

### Mobile

- Student check-ins
- Student classes and dashboard
- Psychologist classes and student review
- AI mentor / psychologist assistant

### Backend

- Supabase Auth
- PostgreSQL database
- Row Level Security policies
- Edge Functions for AI requests

## Tech stack

### Web

| Area | Stack |
|---|---|
| Framework | React 19 |
| Build | Vite 6 |
| Language | TypeScript |
| UI | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Icons | `@phosphor-icons/react` |

### Mobile

| Area | Stack |
|---|---|
| Runtime | Expo 54 |
| Framework | React Native 0.81 |
| Routing | Expo Router 6 |
| Language | TypeScript |
| Icons | `phosphor-react-native` |

### Backend and AI

| Area | Stack |
|---|---|
| Auth / DB | Supabase + PostgreSQL |
| Server logic | Supabase Edge Functions |
| AI transport | `chat-ai` function |
| Default app model | `openai/gpt-oss-120b` |

## Repository structure

```text
/
├── src/                    # Web application
│   ├── components/         # Shared UI and chat components
│   ├── lib/                # Web Supabase and AI helpers
│   └── pages/              # Landing, dashboards, auth, resources
│
├── prism-mobile/           # Expo mobile application
│   ├── app/                # Student and teacher routes
│   ├── src/components/     # Native chat and UI components
│   ├── src/context/        # Theme and auth state
│   └── src/lib/            # Mobile Supabase and OAuth helpers
│
└── supabase/               # Backend logic
    ├── functions/          # Edge Functions
    └── migrations/         # Schema and RLS changes
```

## Local development

### 1. Web

```powershell
npm install
npm run dev
```

Build check:

```powershell
npm run build
```

### 2. Mobile

```powershell
cd prism-mobile
npm install
npx expo start
```

Type check:

```powershell
npx tsc --noEmit
```

## Environment and configuration

### Web env

The web app expects:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Mobile config

The mobile app currently uses a demo Supabase configuration in code. If you want to move it to a different Supabase project, update:

- `prism-mobile/src/lib/supabase.ts`
- related OAuth redirect settings in Supabase and Expo

## Authentication

### Supported flows

- Email/password sign-in
- Student Google OAuth
- Role-based access for student and psychologist flows

### Known limitation

Google OAuth on mobile is sensitive to the runtime environment.

- Web auth works normally.
- Mobile Google auth is not reliable in plain Expo Go.
- For stable mobile OAuth testing, use a dev build instead of relying on Expo Go callback behavior.

This is an environment limitation around deep linking and OAuth return flow, not just a UI issue.

## Security model

- Supabase authentication is required for protected flows.
- Row Level Security is used to restrict access to class and student data.
- AI requests are sent through the backend instead of exposing provider keys in the client.
- Prism is intended as a decision-support tool for psychologists, not as an autonomous diagnostic system.

## Current status

The repository currently contains:

- working web build
- working mobile TypeScript build
- Phosphor icon migration for web and mobile
- AI assistant flow through Supabase Edge Functions
- class management, check-ins, dashboard analytics, and resource features

## Notes for contributors / second machine setup

After pulling updates on another machine:

```powershell
git pull origin main
npm install
cd prism-mobile
npm install
```

If local env files are not present, restore them manually before running the apps.
