# JobBoard — Платформа поиска работы

> Аналог HeadHunter: соискатели публикуют резюме, работодатели — вакансии, всё с Telegram-авторизацией и 2FA.

**Живой сайт:** https://jobboard-beryl.vercel.app

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5-2d3748?style=flat-square&logo=prisma)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)
![Tests](https://img.shields.io/badge/Tests-45%20passed-brightgreen?style=flat-square&logo=vitest)

---

## Стек технологий

| Слой | Технология |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Стили | Tailwind CSS v4 |
| Backend | Next.js API Routes (Route Handlers) |
| ORM | Prisma v5 |
| База данных | PostgreSQL (Neon — serverless) |
| Аутентификация | JWT (httpOnly cookies) + bcryptjs |
| Telegram | Login Widget (OAuth) + Bot API (OTP 2FA) |
| Деплой | Vercel (Hobby) |

---

## Функциональность

### Роли пользователей

- **SEEKER** (соискатель) — создаёт резюме, ищет вакансии, откликается
- **EMPLOYER** (работодатель) — создаёт вакансии, просматривает резюме, обрабатывает отклики
- **ADMIN** — управляет всеми пользователями через панель `/admin`

### Аутентификация

- Регистрация по email + пароль (bcrypt-хеширование)
- Вход по логину/паролю → JWT в httpOnly cookie
- **Telegram Login Widget** — вход в один клик через аккаунт Telegram
- **2FA через Telegram-бот** — после включения 2FA при каждом входе бот присылает одноразовый OTP-код
- Привязка Telegram к существующему аккаунту через уникальную ссылку

### Вакансии

- Создание с полями: название, компания, описание, требования, зарплатная вилка, город, тип занятости
- Список со страницей фильтрации
- Страница детального просмотра
- Управление своими вакансиями в личном кабинете

### Резюме

- Создание с полями: должность, о себе, навыки (теги), опыт работы, образование, желаемая зарплата, город
- Публичный каталог резюме
- Страница детального просмотра

### Отклики

- Соискатель откликается на вакансию, прикрепляя резюме
- Работодатель видит все отклики в личном кабинете
- Статусы: `PENDING` → `ACCEPTED` / `REJECTED`
- Защита от дублирующих откликов (уникальная пара user+vacancy)

### Личный кабинет

- Соискатель: список своих резюме + статусы всех откликов
- Работодатель: список своих вакансий + входящие отклики с кнопками принять/отклонить
- Настройки Telegram: привязка аккаунта и включение 2FA

### Панель администратора `/admin`

- Список всех пользователей
- Смена роли (SEEKER ↔ EMPLOYER ↔ ADMIN)
- Удаление пользователей

---

## Архитектура

```
jobboard/
├── prisma/
│   └── schema.prisma          # Схема БД: User, Resume, Vacancy, Application
│
├── src/
│   ├── app/
│   │   ├── page.tsx           # Главная (статистика платформы)
│   │   ├── layout.tsx         # Общий layout + Navbar
│   │   │
│   │   ├── auth/
│   │   │   ├── login/         # Форма входа + Telegram Login Widget
│   │   │   └── register/      # Форма регистрации
│   │   │
│   │   ├── vacancies/
│   │   │   ├── page.tsx       # Каталог вакансий с фильтрами
│   │   │   ├── [id]/          # Страница вакансии + кнопка отклика
│   │   │   └── new/           # Форма создания вакансии
│   │   │
│   │   ├── resumes/
│   │   │   ├── page.tsx       # Каталог резюме
│   │   │   ├── [id]/          # Страница резюме
│   │   │   └── new/           # Форма создания резюме
│   │   │
│   │   ├── dashboard/         # Личный кабинет (SEEKER / EMPLOYER)
│   │   ├── admin/             # Панель администратора
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/       # POST: создание аккаунта
│   │       │   ├── login/          # POST: вход, запуск OTP если 2FA
│   │       │   ├── logout/         # POST: сброс cookie
│   │       │   ├── me/             # GET: текущий пользователь
│   │       │   ├── profile/        # PATCH: редактирование профиля
│   │       │   ├── telegram-login/ # POST: вход через Telegram Widget
│   │       │   ├── telegram-link/  # POST: привязка Telegram к аккаунту
│   │       │   ├── toggle-2fa/     # POST: включить/выключить 2FA
│   │       │   └── verify-otp/     # POST: проверка OTP-кода
│   │       │
│   │       ├── vacancies/          # GET (список), POST (создать)
│   │       ├── vacancies/[id]/     # GET, PATCH, DELETE
│   │       ├── vacancies/my/       # GET: вакансии текущего работодателя
│   │       │
│   │       ├── resumes/            # GET (список), POST (создать)
│   │       ├── resumes/[id]/       # GET, PATCH, DELETE
│   │       ├── resumes/my/         # GET: резюме текущего соискателя
│   │       │
│   │       ├── applications/       # POST (отклик), GET (список)
│   │       ├── applications/[id]/  # PATCH (сменить статус)
│   │       └── admin/users/        # GET (все юзеры), PATCH (роль), DELETE
│   │
│   ├── components/
│   │   ├── TelegramLoginButton.tsx # Виджет Telegram Login
│   │   ├── TelegramSettings.tsx    # Привязка Telegram + 2FA настройки
│   │   └── layout/Navbar.tsx       # Навигация
│   │
│   ├── lib/
│   │   ├── auth.ts            # JWT sign/verify, bcrypt, getCurrentUser
│   │   ├── prisma.ts          # Prisma Client singleton
│   │   └── telegram.ts        # Bot API: sendMessage, generateOTP, generateLinkCode
│   │
│   └── bot.ts                 # Telegram-бот (polling): обработка /start, OTP 2FA
```

### Схема базы данных

```
User
├── id, name, email, password (bcrypt), role
├── phone?
├── telegramChatId?, telegramLinked, twoFAEnabled
├── linkCode? (для привязки Telegram)
├── otpCode?, otpExpiry? (для 2FA)
├── resumes[]    → Resume
├── vacancies[]  → Vacancy
└── applications[] → Application

Resume
├── id, userId, title, summary?
├── skills (JSON), experience (JSON)
├── education?, salary?, city?
├── isPublished
└── applications[] → Application

Vacancy
├── id, userId, companyName, title, description
├── requirements?, salaryFrom?, salaryTo?
├── city?, type (FULL_TIME / PART_TIME / REMOTE / CONTRACT)
├── isPublished
└── applications[] → Application

Application
├── id, userId, resumeId, vacancyId
├── status (PENDING / ACCEPTED / REJECTED)
├── message?
└── @@unique([userId, vacancyId])
```

### Поток аутентификации

```
Обычный вход:
  POST /api/auth/login → bcrypt.compare → JWT → httpOnly cookie

Вход с 2FA:
  POST /api/auth/login → {requireOTP: true} → бот шлёт OTP в Telegram
  POST /api/auth/verify-otp → проверка кода → JWT → cookie

Telegram Login Widget:
  Telegram CDN → callback onTelegramAuth(user) →
  POST /api/auth/telegram-login → HMAC-SHA256 проверка подписи →
  найти/создать User → JWT → cookie

Привязка Telegram к аккаунту:
  GET /api/auth/telegram-link → уникальный linkCode →
  пользователь пишет /start <linkCode> боту →
  бот через polling связывает chatId с аккаунтом
```

---

## Testing

```bash
npm test           # run all tests once
npm run test:watch # watch mode
```

**45 tests across 5 suites:**

| Suite | Coverage |
|---|---|
| `src/lib/auth.test.ts` | `signToken` / `verifyToken` (valid payload, SEEKER/EMPLOYER roles, tampered, invalid, empty), `hashPassword` / `comparePassword` (correct, wrong, plaintext not stored, salt uniqueness) |
| `src/app/api/auth/login/route.test.ts` | 400 on missing fields, 401 on unknown user, 401 on wrong password, 200 + cookie on success, 2FA flow: returns `requireOTP` and no cookie when Telegram 2FA is enabled |
| `src/app/api/auth/register/route.test.ts` | 400 on missing fields, 400 on invalid role, 409 on duplicate email, 200 on success, password not exposed in response, httpOnly cookie set |
| `src/app/api/vacancies/route.test.ts` | GET: returns list with total and pages, empty list on no match, correct pagination; POST: 403 for unauthenticated, 403 for SEEKER, 400 on missing fields, 201 for EMPLOYER |
| `src/app/api/applications/route.test.ts` | GET: 401 for unauthenticated, returns list for SEEKER and EMPLOYER; POST: 403 for unauthenticated, 403 for EMPLOYER, 400 on missing fields, 404 on resume ownership mismatch, 409 on duplicate application, 201 on success |

**Stack:** Vitest + Testing Library + jsdom

---

## Локальный запуск

```bash
# 1. Клонировать
git clone https://github.com/subrosa5/jobboard.git
cd jobboard

# 2. Установить зависимости
npm install

# 3. Создать .env
cp .env.example .env
# Заполнить DATABASE_URL, JWT_SECRET, TELEGRAM_BOT_TOKEN, NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

# 4. Применить миграции
npx prisma migrate dev

# 5. Запустить сайт
npm run dev

# 6. (Опционально) Запустить Telegram-бот для 2FA
npm run bot
```

### Переменные окружения

| Переменная | Описание |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon или локальный) |
| `DIRECT_URL` | Прямой URL для Prisma migrations |
| `JWT_SECRET` | Секрет для подписи JWT-токенов |
| `TELEGRAM_BOT_TOKEN` | Токен бота от @BotFather |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Username бота (без @) |

---

## Деплой

Проект задеплоен на **Vercel** (Hobby план, бесплатно).
База данных — **Neon** (serverless PostgreSQL, бесплатный tier).

При деплое на Vercel нужно добавить все переменные окружения в настройках проекта и установить домен сайта в @BotFather (`/setdomain`) для работы Telegram Login Widget.
