# Архитектура PuzzleUp

Состояние на 11 ноября 2026. Почему выбрано именно так – в `docs/decisions.md`.

## 1. Обзор

Сайт – почти полностью статический Next.js: главная, страницы репетиторов, политики и 404 собираются при сборке. Динамика – только в трёх местах:

1. **Отправка формы** – Server Action пишет заявку в PostgreSQL.
2. **Статус занятости репетитора** – хранится в базе, отображается через кэшируемый компонент и обновляется по команде боту.
3. **Telegram webhook** – Route Handler `POST /api/telegram`.

Всё остальное (уведомления в Telegram, синхронизация с Google Таблицей, напоминания, удаление по сроку) делает отдельный процесс-воркер, который читает таблицу `outbox` и выполняет задания по расписанию.

```
 Родитель ──► Next.js (app) ──► PostgreSQL ◄── worker ──► Telegram (общий чат)
                 ▲   │             ▲  outbox          └──► Google Sheets (обезличенно)
 Репетитор ──► Telegram ──webhook──┘
               (кнопки статусов, /add, /status)
```

Процессы на VPS (Docker Compose): `caddy`, `app`, `worker`, `app-staging`, `worker-staging`, `postgres` (базы `puzzleup`, `puzzleup_staging`, `umami`), `umami`.

## 2. Стек и версии

| Слой | Выбор | Примечание |
|---|---|---|
| Среда | Node.js 26 LTS, pnpm | Temporal API для времени по Минску |
| Фреймворк | Next.js 16.4, React 19.3, TypeScript 6.0 strict | App Router, Cache Components, `output: 'standalone'` |
| Стили | Tailwind CSS 4.3 | Токены в `@theme` (`src/styles/globals.css`), без JS-конфига |
| Шрифты | `next/font/google` | Unbounded 500/700, Golos Text 400/500/600, Spectral Italic 400/500; latin + cyrillic; preload только Unbounded 700 и Golos 400 |
| Контент | Content Collections + `@content-collections/mdx` | Zod-схемы, сборка падает на ошибке контента |
| Формы | Server Actions + `useActionState`, Zod 4, Conform | Одна схема на клиенте и сервере, работает без JS |
| БД | PostgreSQL 18, Drizzle ORM + drizzle-kit | Миграции в репозитории |
| Очередь | Своя таблица `outbox`, `FOR UPDATE SKIP LOCKED` | Без Redis и внешних брокеров |
| Бот | grammY, webhook | Один бот, общий чат репетиторов |
| Таблица | Google Sheets API v4, сервисный аккаунт | Только обезличенные строки |
| Защита формы | honeypot, `rate-limiter-flexible` (memory), проверка Origin | Один инстанс на окружение |
| Аналитика | Umami self-hosted (без cookie), Яндекс Метрика после согласия | |
| Качество | ESLint 10 (flat, `eslint-config-next`, `jsx-a11y`), Prettier + `@ianvs/prettier-plugin-sort-imports` + `prettier-plugin-tailwindcss` | |
| Тесты | Vitest 5, Testing Library, Testcontainers, Playwright, `@axe-core/playwright`, Lighthouse CI | |
| Хуки | lefthook, commitlint, gitleaks | |
| CI/CD | GitHub Actions → GHCR → SSH-деплой | |
| Инфраструктура | VPS cloudvps.by, Ubuntu 24.04, Docker Compose, Caddy | |

## 3. Структура репозитория

```
.
├─ content/
│  ├─ tutors/andrei.mdx, maxim.mdx
│  ├─ reviews.json, subjects.json, situations.json, faq.json, site.json
│  └─ legal/privacy.mdx, cookies.mdx
├─ public/tutors/              исходники фото (оптимизирует next/image)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            шрифты, globals.css, аналитика, cookie-баннер
│  │  ├─ page.tsx              главная
│  │  ├─ tutors/[slug]/page.tsx
│  │  ├─ tutors/[slug]/opengraph-image.tsx
│  │  ├─ privacy/page.tsx, cookies/page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ api/telegram/route.ts webhook бота
│  │  ├─ api/health/route.ts    проверка живости для Caddy и деплоя
│  │  ├─ sitemap.ts, robots.ts
│  │  └─ opengraph-image.tsx
│  ├─ components/
│  │  ├─ ui/                   Button, Chip, ChoiceChip, Field, Checkbox, Badge, Sheet, PuzzlePiece, PuzzleStep, Doodle, SectionHead, Logo, Icon
│  │  └─ layout/               Header, MobileMenu, Footer, BottomBar, CookieBanner, Disclosure
│  ├─ features/
│  │  ├─ home/                 блоки главной: Hero, Tutors (+ фильтр), Situations, How, Subjects, Reviews, Prices, Faq, About
│  │  ├─ tutor-page/           Profile, About, Outside, Reviews, HowToStart, More, статусы
│  │  ├─ lead-form/            LeadForm (клиент), schema.ts (Zod), action.ts (Server Action), Thanks
│  │  └─ tutors/               TutorCard, сортировка, availability
│  ├─ content/                 загрузчики и селекторы поверх Content Collections, cross-reference проверки
│  ├─ server/                  только серверный код, каждый index.ts начинается с import 'server-only'
│  │  ├─ db/                   client.ts, schema/*.ts, migrations/
│  │  ├─ leads/                domain.ts (типы, статусы), service.ts, repository.ts
│  │  ├─ outbox/               enqueue.ts, worker.ts, handlers/*.ts, backoff.ts
│  │  ├─ bot/                  bot.ts, commands/*.ts, keyboards.ts, format.ts, auth.ts
│  │  ├─ sheets/               client.ts, row.ts (маппинг A–Q)
│  │  ├─ availability/         repository.ts, cache.ts (cacheTag)
│  │  ├─ jobs/                 reminders.ts, retention.ts, scheduler.ts
│  │  └─ rate-limit.ts
│  ├─ lib/                     env.ts, time.ts (Минск, Temporal), phone.ts, utm.ts, urls.ts, plural.ts, text.ts
│  └─ styles/globals.css
├─ worker/index.ts             запускает outbox-цикл и планировщик
├─ tests/e2e/
├─ docker/Dockerfile, compose.dev.yml, compose.prod.yml, Caddyfile
├─ .github/workflows/ci.yml, deploy.yml
├─ content-collections.ts
├─ drizzle.config.ts
└─ CLAUDE.md
```

Правила зависимостей между слоями:

- `src/lib` – чистые функции, ни от чего не зависит.
- `src/server/*` не импортирует из `src/features` и `src/components`.
- `src/features` и `src/components` обращаются к серверу только через Server Actions и серверные компоненты; клиентские компоненты не импортируют `src/server`.
- Внешние сервисы (Telegram, Google Sheets, часы) – за интерфейсами, чтобы в тестах подставлять фейки.

ESLint-правило `no-restricted-imports` следит за этими границами.

## 4. Рендеринг и кэш

- В `next.config.ts` включены `cacheComponents: true` и `output: 'standalone'`.
- Главная и `/tutors/[slug]` должны оставаться статическими. Проверять через `ensureStatic` (Next 16.4) и вывод `next build`.
- `/tutors/[slug]`: `generateStaticParams` по всем файлам `content/tutors`, включая ушедших; `dynamicParams = false`.
- Фильтр по предметам на главной – клиентский компонент, который читает `?subject=` через `useSearchParams` внутри `<Suspense>`. Статическая оболочка показывает всех репетиторов, так что без JS виден полный список.
- **Статус занятости.** Читается функцией с `'use cache'`, `cacheTag('availability')` и `cacheLife('max')`. Бот после `/status` вызывает инвалидацию тега. Открытый момент, который решается прототипом в первой же фиче про статус:
  - при сборке в CI базы нет – функция должна вернуть начальное значение из `availability` в MDX;
  - после деплоя тег нужно сбросить (шаг `post-deploy` вызывает внутренний защищённый эндпоинт);
  - выбрать между `updateTag` (только Server Actions) и `revalidateTag` с немедленным истечением (Route Handler вебхука). Решение – в `docs/decisions.md`.
- Кэш Next.js – встроенный, на диске контейнера. Инстанс один на окружение, поэтому внешний cache handler не нужен.
- Фото: `next/image`, AVIF/WebP, фото профиля на первом экране – `priority`, остальные – lazy.

## 5. Заявка: путь от формы до чата

1. `LeadForm` (клиентский компонент с Conform) рендерится в серверном компоненте страницы репетитора. Скрытые поля: `tutorId`, `entry`, `utm_*`, `landing`, honeypot `website`. UTM при первом заходе сохраняются в `sessionStorage` (`src/lib/utm.ts`) и подставляются в форму на любой странице. Без JS UTM теряются – это допустимо.
2. Server Action `submitLead` (`src/features/lead-form/action.ts`):
   1. Проверка Origin.
   2. Rate limit по IP: 5 заявок за 10 минут. IP берётся из `X-Forwarded-For`, который выставляет Caddy. Превышение – ошибка 429 с текстом из ТЗ.
   3. Заполненный honeypot – тихий «успех» без записи.
   4. Валидация той же Zod-схемой, что на клиенте.
   5. `leadService.create()` – одна транзакция: `leads` + `consents` + `outbox(telegram.lead_created)` + `outbox(sheets.upsert)`. Если у репетитора `full` – статус заявки сразу `waitlist`.
   6. Ответ: номер заявки и данные для экрана «Спасибо» (дневной или ночной текст по времени Минска, способ связи).
3. Воркер (`worker/index.ts`) крутит цикл выборки:
   ```sql
   SELECT … FROM outbox
   WHERE status = 'pending' AND run_at <= now()
   ORDER BY id LIMIT 10
   FOR UPDATE SKIP LOCKED
   ```
   - Для каждого задания вызывается обработчик по `type`.
   - Ошибка – `attempts + 1`, `run_at = now() + backoff`: экспонента 10 с, 30 с, 1 мин, 5 мин, 15 мин, 1 ч и дальше по часу, до 10 попыток.
   - После последней попытки – `dead` и задание `telegram.alert` Андрею.
   - Чтобы не ждать опроса, используется `LISTEN/NOTIFY`, опрос раз в 5 с – страховка.
4. Обработчики:
   - `telegram.lead_created`: отправка сообщения в общий чат с кнопками статусов, сохранение `telegram_message_id`.
   - `telegram.lead_updated`: редактирование того же сообщения (новый статус, кто поменял).
   - `sheets.upsert`: строка по номеру заявки – найти и обновить, иначе дописать. Столбцы A–Q строго по `docs/data-model.md`.
   - `telegram.reminder` – напоминание; `telegram.alert` – предупреждение Андрею в личку.
5. В payload задания лежит только `leadId`. Обработчик читает заявку из базы, поэтому персональные данные не дублируются в outbox.

## 6. Telegram-бот

- Один бот, режим webhook: `POST /api/telegram`, проверка заголовка `X-Telegram-Bot-Api-Secret-Token`. Регистрация вебхука – скрипт `pnpm bot:set-webhook` для каждого окружения.
- Работает только в общем чате (`TELEGRAM_LEADS_CHAT_ID`) и в личке с репетиторами. Апдейты от пользователей, которых нет в `TELEGRAM_TUTORS`, игнорируются.
- Кнопки под заявкой меняют статус. Бот записывает, кто нажал (Telegram ID → tutorId), и порождает `telegram.lead_updated` + `sheets.upsert`. На «Отказ» бот спрашивает причину кнопками.
- `/add` – ручная заявка (родитель написал напрямую). Пошаговый диалог кнопками: способ обращения, класс, предмет, цель, откуда узнали. Имени и контакта нет. Состояние диалога – в таблице `bot_dialogs`, без in-memory сессий.
- `/status` – выбор «Есть свободное время / Последние места / Мест нет» для себя. Запись в `tutor_availability` и инвалидация кэша.
- `/help` – список команд.
- Тексты сообщений бота – в `src/server/bot/format.ts`, покрыты snapshot-тестами.
- Бот не удаляет сообщения: Telegram не даёт удалять сообщения старше 48 часов. Чистка чата по сроку хранения – вручную, это указано в политике.

## 7. Фоновые задания (worker)

| Задание | Расписание | Что делает |
|---|---|---|
| outbox | постоянно (NOTIFY + опрос 5 с) | Выполняет задания очереди |
| reminders | каждую минуту | Заявки в статусе `new` старше 2 часов без `reminder_sent_at` → `telegram.reminder`. Только 9:00–22:00 по Минску; ночные ждут до 9:00 |
| retention | ежедневно в 03:30 по Минску | Удаляет заявки с `status_changed_at` старше 6 месяцев (каскадом – согласия и события). Строки в Таблице остаются |
| outbox-cleanup | ежедневно | Удаляет `done`-задания старше 30 дней |

Планировщик – простой цикл на Temporal внутри воркера, без внешнего cron. Задания идемпотентны.

## 8. Окружения и переменные

| Окружение | Ветка | Адрес | База | Бот и чат |
|---|---|---|---|---|
| local | любая | localhost:3000 | Docker `compose.dev.yml` | тестовый бот, тестовый чат или выключен |
| staging | `develop` | dev.puzzle-up.by (basic auth, `noindex`) | `puzzleup_staging` | отдельный тестовый бот и чат, отдельная тестовая Таблица |
| production | `main` (тег `v*`) | puzzle-up.by | `puzzleup` | боевой бот и общий чат репетиторов |

Переменные (схема и проверка – `src/lib/env.ts` на Zod, приложение не стартует при ошибке):

```
APP_ENV=local|staging|production
SITE_URL=https://puzzle-up.by
DATABASE_URL=postgres://…
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_LEADS_CHAT_ID=          # общий чат репетиторов
TELEGRAM_ALERT_CHAT_ID=          # личка Андрея для предупреждений
TELEGRAM_TUTORS=                 # JSON: {"123456789":"t-andrei","987654321":"t-maxim"}
GOOGLE_SHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=     # base64 ключа сервисного аккаунта
INTERNAL_API_SECRET=             # для post-deploy ревалидации
UMAMI_SCRIPT_URL=
UMAMI_WEBSITE_ID=
YANDEX_METRIKA_ID=
```

В репозитории – только `.env.example` без значений.

## 9. Сборка, деплой, инфраструктура

- **Dockerfile** многоступенчатый: `deps` → `build` (`next build` + сборка воркера через `tsup`) → `runner` (`node:26-slim`, непривилегированный пользователь, standalone-вывод + `worker.js`). Один образ, две команды запуска: `node server.js` и `node worker.js`.
- **CI** (`ci.yml`, на каждый PR и push): install → lint → typecheck → `content:check` → unit → integration (Testcontainers) → build → e2e (Playwright против собранного приложения + Postgres service) → Lighthouse CI для `/` и `/tutors/andrei`.
- **Deploy** (`deploy.yml`):
  - push в `develop` – образ `ghcr.io/<owner>/puzzleup:develop-<sha>` → staging;
  - тег `v*` на `main` – образ `:vX.Y.Z` → production.
  - На сервере по SSH: `docker compose pull` → `run --rm app pnpm db:migrate` → `up -d` → проверка `/api/health` → post-deploy ревалидация.
- **Caddy**: HTTPS (Let's Encrypt), сжатие, заголовки безопасности (CSP, HSTS, Referrer-Policy, Permissions-Policy), basic auth и `X-Robots-Tag: noindex` на staging, проксирование `X-Forwarded-For`.
- **Сервер**: минимум 2 vCPU, 2 ГБ RAM + 2 ГБ swap, 30 ГБ SSD; комфортно 4 ГБ. Ubuntu 24.04, UFW (22, 80, 443), вход по SSH-ключу, unattended-upgrades.
- **Бэкапы** на этапе запуска не делаются (решение от 11.11.2026). Тома Postgres именованные, чтобы бэкап можно было добавить без миграции данных.
- **Логи**: pino в JSON в stdout, ротация Docker (`max-size`). Поля с персональными данными вырезаются redact-списком. Sentry и другие внешние сборщики ошибок не используются.

## 10. Безопасность

- Server Action: проверка Origin, rate limit, Zod, лимиты длины полей, honeypot.
- Webhook: секрет в заголовке, белый список Telegram ID.
- CSP без `unsafe-inline` для скриптов, кроме nonce для Umami и Метрики; Метрика подключается только после согласия.
- Ключи – только в env на сервере. На CI – GitHub Secrets для деплоя (SSH-ключ, хост).
- Зависимости: Dependabot (еженедельно), CodeQL, `pnpm audit` в CI. Обновления Next.js по security-релизам ставятся сразу.
