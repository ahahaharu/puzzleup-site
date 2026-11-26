# Архитектура PuzzleUp

Состояние на 12 ноября 2026. Почему выбрано именно так – в `docs/decisions.md`.

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
| Контент | Content Collections + `@content-collections/mdx` | MDX компилирует Content Collections, проверку схем и связей делает `src/content` – сборка падает на ошибке контента (ADR-033) |
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
├─ public/tutors/              исходники фото, JPEG или PNG (оптимизирует next/image)
├─ assets/fonts/               TTF с лицензиями OFL для OG-картинок: `next/og` не читает woff2 и `next/font`
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
│  │  └─ layout/               SiteShell (каркас страницы), SkipLink, Header, MobileMenu, Footer, BottomBar, CookieBanner
│  ├─ features/
│  │  ├─ home/                 блоки главной: Hero, Tutors (+ фильтр), Situations, How, Subjects, Reviews, Prices, Faq, About
│  │  ├─ tutor-page/           Profile, About, Outside, Reviews, HowToStart, More, статусы
│  │  ├─ lead-form/            LeadForm (клиент), schema.ts (Zod), action.ts (Server Action), Thanks
│  │  ├─ tutors/               TutorCard, сортировка, availability
│  │  └─ seo/                  метатеги (pageMetadata, главная), JSON-LD, sitemap, даты из git, шаблоны OG-картинок (og/)
│  ├─ content/                 загрузчик (index.ts, server-only), схемы, перекрёстные проверки и правила текстов
│  ├─ server/                  только серверный код, каждый index.ts начинается с import 'server-only'
│  │  ├─ db/                   client.ts, schema/*.ts, migrations/, migrate.ts (миграции + начальные статусы)
│  │  ├─ leads/                domain.ts (типы, статусы), service.ts, repository.ts
│  │  ├─ outbox/               enqueue.ts, worker.ts, handlers/*.ts, backoff.ts
│  │  ├─ bot/                  bot.ts (апдейты), update.ts (схема апдейта), deps.ts, webhook.ts, auth.ts, directory.ts (данные контента), callback.ts, format.ts (тексты и кнопки), port.ts + telegram-api.ts (grammY), dialogs.ts, commands/*.ts, fixtures.ts (тесты)
│  │  ├─ sheets/               port.ts, client.ts (токен сервисного аккаунта, fetch), google-sheets.ts (адаптер), row.ts (маппинг A–Q), upsert.ts, template.ts (шаблон Таблицы), fixtures.ts (тесты)
│  │  ├─ availability/         seed.ts, repository.ts, cache.ts (cacheTag, инвалидация), revalidate.ts (`POST /api/revalidate`)
│  │  ├─ jobs/                 reminders.ts, retention.ts, scheduler.ts
│  │  ├─ env.ts                проверенное окружение сервера
│  │  └─ rate-limit.ts
│  ├─ instrumentation.ts       проверка окружения при старте сервера
│  ├─ lib/                     env.ts (схема), goal.ts (Zod-тип цели), template.ts (плейсхолдеры `{key}`), time.ts (Минск, Temporal), phone.ts, utm.ts, urls.ts, plural.ts, text.ts, availability.ts (Zod-тип статуса занятости, подписи, `withAvailability`), entry.ts (Zod-тип `entry`), cn.ts (склейка классов)
│  └─ styles/globals.css
├─ worker/index.ts             запускает outbox-цикл и планировщик
├─ tests/e2e/                 сценарии Playwright
├─ tests/setup/               настройки Vitest, Testcontainers – db-global.ts, db.ts
├─ docker/Dockerfile, compose.dev.yml, compose.prod.yml, Caddyfile
├─ .github/workflows/ci.yml, deploy.yml
├─ content-collections.ts     только чтение и компиляция MDX
├─ scripts/content-check.ts   `pnpm content:check [--strict]`
├─ scripts/db-migrate.ts      `pnpm db:migrate`
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

- В `next.config.ts` включены `cacheComponents: true`, `partialPrefetching: true` (ADR-020), `output: 'standalone'` и `poweredByHeader: false`.
- Главная и `/tutors/[slug]` должны оставаться статическими. Проверять через `ensureStatic` (Next 16.4) и вывод `next build`.
- `/tutors/[slug]`: `generateStaticParams` по всем файлам `content/tutors`, включая ушедших; неизвестный slug – `notFound()`, `ensureStatic = 'navigation'` (ADR-045).
- Фильтр по предметам на главной – клиентский компонент, который читает `?subject=` через `useSearchParams` внутри `<Suspense>`. Статическая оболочка показывает всех репетиторов, так что без JS виден полный список.
- **Статус занятости** (ADR-053). `getAvailability()` с `'use cache'` и `cacheTag('availability')` читает `tutor_availability`; страницы накладывают статусы на начальные из MDX (`withAvailability`). Ответ базы живёт `cacheLife('max')`. Без базы – при сборке в CI и Docker или при её падении – ответ пустой: страницы показывают статусы из MDX, живут `cacheLife('minutes')` и через минуту спрашивают базу сами.
  - Сброс – `revalidateTag('availability', { expire: 0 })` (`updateTag` есть только в Server Actions): вебхук бота после `/status` и `POST /api/revalidate` с `Authorization: Bearer <INTERNAL_API_SECRET>` (без секрета – 404, чужой – 401).
  - Post-deploy – `pnpm cache:revalidate [адрес]`: страницы в образе собраны со статусами из MDX.
- Кэш Next.js – встроенный, на диске контейнера. Инстанс один на окружение, поэтому внешний cache handler не нужен.
- Фото: `next/image`, AVIF/WebP, фото профиля на первом экране – `priority`, остальные – lazy.

## 5. Заявка: путь от формы до чата

1. `LeadForm` (клиентский компонент с Conform) рендерится в серверном компоненте страницы репетитора. Скрытые поля: `tutorId`, `entry`, `landing`, honeypot `website`. UTM при первом заходе сохраняются в `sessionStorage` (`src/lib/utm.ts`, `UtmCapture` в `SiteShell`) на любой странице и добавляются к данным формы при отправке. Без JS сервер берёт `entry` и UTM из `Referer` своего сайта (ADR-049).
2. Server Action `submitLead` (`src/features/lead-form/action.ts`):
   1. Проверка Origin: совпадает с `SITE_URL`.
   2. Rate limit по IP: 5 заявок за 10 минут. IP берётся из `X-Forwarded-For`, который выставляет Caddy. Превышение – ошибка 429 с текстом из ТЗ.
   3. Заполненный honeypot – тихий «успех» без записи.
   4. Валидация той же Zod-схемой, что на клиенте.
   5. `leadService.create()` – одна транзакция: `leads` + `consents` + `outbox(telegram.lead_created)` + `outbox(sheets.upsert)`. Если у репетитора `full` – статус заявки сразу `waitlist`.
   6. Ответ: номер заявки и данные для экрана «Спасибо» (дневной или ночной текст по времени Минска, способ связи).
3. Воркер (`worker/index.ts`, цикл – `src/server/outbox/worker.ts`) захватывает задания одним запросом и отпускает строки сразу, до вызова обработчика:
   ```sql
   UPDATE outbox SET status = 'processing', locked_at = now(), attempts = attempts + 1
   WHERE id IN (
     SELECT id FROM outbox
     WHERE status = 'pending' AND run_at <= now() AND type = ANY(<типы с обработчиком>)
     ORDER BY id LIMIT 10
     FOR UPDATE SKIP LOCKED)
   RETURNING …
   ```
   - Для каждого задания по порядку `id` вызывается обработчик по `type`, тайм-аут – 30 с. Успех – `done` и `done_at`.
   - Ошибка – `run_at = now() + backoff`: экспонента 10 с, 30 с, 1 мин, 5 мин, 15 мин, 1 ч и дальше по часу, до 10 попыток. В `last_error` и лог – код ошибки (`OutboxJobError.code` или имя класса с SQLSTATE), без текста.
   - После последней попытки – `dead` и задание `telegram.alert` Андрею с `{ outboxId }`. О «мёртвом» `telegram.alert` – только лог.
   - Задание в `processing` дольше 15 минут (воркер упал посреди пачки) – неудачная попытка с кодом `lock_expired`.
   - Задания типа без обработчика воркер не берёт: они ждут, пока интеграция не включена.
   - Чтобы не ждать опроса, используется `LISTEN/NOTIFY` на отдельном соединении (переподключается само), опрос раз в 5 с – страховка. SIGTERM: текущее задание дорабатывает, новые не берутся.
4. Обработчики:
   - `telegram.lead_created`: отправка сообщения в общий чат с кнопками статусов, сохранение `telegram_message_id`.
   - `telegram.lead_updated`: редактирование того же сообщения (новый статус, кто поменял).
   - `sheets.upsert`: строка по номеру заявки – найти и обновить, иначе дописать. Столбцы A–Q строго по `docs/data-model.md`. Строка пишется ячейками через `batchUpdate` (`updateCells` / `appendCells`): текст – всегда `stringValue`, так что метка `=…` из адреса остаётся текстом; даты – числами дней по Минску с форматом в каждой ячейке. Номер встретился в двух строках – обновляются обе (ADR-052).
   - `telegram.reminder` – напоминание; `telegram.alert` – предупреждение Андрею в личку.
5. В payload задания – только идентификаторы: `leadId`, у `telegram.alert` – `outboxId`. Обработчик читает данные из базы, поэтому персональные данные не дублируются в outbox.

## 6. Telegram-бот

- Один бот, режим webhook: `POST /api/telegram`, проверка заголовка `X-Telegram-Bot-Api-Secret-Token` (без бота – 404, чужой запрос – 401). Апдейт обрабатывается до ответа; ошибка – код в лог, Telegram всё равно получает 200, чтобы не повторять апдейт. Регистрация вебхука и меню команд – `pnpm bot:set-webhook` для каждого окружения. Локально вместо вебхука – `pnpm bot:poll`: снимает вебхук и забирает апдейты long polling в тот же `handleUpdate`, без туннеля и https; работает только при `APP_ENV=local`, обратно к вебхуку – `pnpm bot:set-webhook`.
- Работает только в общем чате (`TELEGRAM_LEADS_CHAT_ID`) и в личке с репетиторами. Апдейты от пользователей, которых нет в `TELEGRAM_TUTORS` (или чей tutorId ушёл или не найден в контенте), игнорируются.
- Telegram – за портом `TelegramPort` (`src/server/bot/port.ts`), адаптер – клиент `Api` из `grammy/web`. Ошибки API наружу – `TelegramApiError` с кодом (`403`, `network`): в ошибках grammY лежит текст запроса с ПД.
- Сообщение заявки: «Заявка № 1024 → Андрею», у пришедшей при «Мест нет» – «· лист ожидания», статус и кто его поменял, данные родителя, откуда пришла. Под ним – кнопки всех статусов, текущий отмечен «✓».
- Кнопки меняют статус (`changeStatus` в `src/server/leads/service.ts`): строка блокируется, пишутся заявка, `lead_events` и задания `telegram.lead_updated` + `sheets.upsert`, кто нажал – по Telegram ID → tutorId. Сообщение правит воркер. На «Отказ» кнопки под сообщением сменяются причинами и «← Назад»; статус меняется только после выбора причины. Всё нужное – в `callback_data` (`st:1024:contacted`, `rr:1024:expensive`), состояния в базе у выбора причины нет.
- `/add` – ручная заявка (родитель написал напрямую). Пошаговый диалог кнопками в одном сообщении бота: способ обращения, класс, предмет (единственный выбирается сам), цель (или «Не указана»), откуда узнали. Имени и контакта нет. Заявка – от того, кто вызвал `/add`, со статусом «связался» (при «Мест нет» – «лист ожидания»), сообщение с кнопками появляется в общем чате из outbox. Состояние диалога – в `bot_dialogs`, без in-memory сессий; чужие кнопки и устаревший диалог отвечают подсказкой.
- `/status` – выбор «Есть свободное время / Последние места / Мест нет» для себя: сообщение с тремя кнопками, текущий отмечен «✓», в `callback_data` – id репетитора (`av:t-andrei:full`), чужие кнопки статус не меняют. Запись в `tutor_availability` и сброс кэша страниц – прямо в вебхуке; `bot:poll` просит сброс у `POST /api/revalidate` запущенного `pnpm dev`.
- `/help` и `/start` – что умеет бот.
- Тексты сообщений бота – в `src/server/bot/format.ts`, покрыты snapshot-тестами.
- Бот не удаляет сообщения: Telegram не даёт удалять сообщения старше 48 часов. Чистка чата по сроку хранения – вручную, это указано в политике.

## 7. Фоновые задания (worker)

| Задание | Расписание | Что делает |
|---|---|---|
| outbox | постоянно (NOTIFY + опрос 5 с) | Выполняет задания очереди |
| reminders | каждую минуту | Заявки в статусе `new` старше 2 часов без `reminder_sent_at` → `telegram.reminder` (ответом на сообщение заявки; если статус успели сменить – молчит). Только в часы ответа из `site.json` по Минску; ночные ждут до 9:00. Только при включённом боте |
| retention | при старте и ежедневно в 03:30 по Минску | Удаляет заявки с `status_changed_at` старше 6 календарных месяцев (каскадом – согласия и события), незавершённые задания outbox на них закрывает `done` с пометкой `lead_deleted`. Строки в Таблице остаются |
| outbox-cleanup | при старте и ежедневно в 03:30 по Минску | Удаляет `done`-задания старше 30 дней; `dead` остаются |

Планировщик – простой цикл внутри воркера (`src/server/jobs/scheduler.ts`), без внешнего cron: у каждого задания свой цикл «выполнить, подождать». Пауза – число или функция (`msUntilMinskTime('03:30', now)` для ежедневных). Первый запуск – сразу при старте воркера. Задания идемпотентны.

## 8. Окружения и переменные

| Окружение | Ветка | Адрес | База | Бот и чат |
|---|---|---|---|---|
| local | любая | localhost:3000 | Docker `compose.dev.yml` | тестовый бот, тестовый чат или выключен |
| staging | `develop` | dev.puzzle-up.by (basic auth, `noindex`) | `puzzleup_staging` | отдельный тестовый бот и чат, отдельная тестовая Таблица |
| production | `main` (тег `v*`) | puzzle-up.by | `puzzleup` | боевой бот и общий чат репетиторов |

Переменные: схема – чистая функция `parseEnv` в `src/lib/env.ts` на Zod, экземпляр – `src/server/env.ts` (`server-only`), проверка при старте – `register()` в `src/instrumentation.ts`: при ошибке процесс завершается с кодом 1. Переменные добавляются в схему в тех фичах, где они впервые нужны:

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

`TELEGRAM_*` задаются все вместе или ни одной: в staging и production обязательны, локально без них бот выключен – вебхук отвечает 404, задания Telegram ждут в outbox, напоминания не планируются. С `GOOGLE_*` так же: без них задания `sheets.upsert` ждут в outbox.

**Google Таблица окружения.** Таблицу создаёт человек и открывает на редактирование почте сервисного аккаунта (`client_email` из ключа). Затем `pnpm sheets:setup` с переменными этого окружения готовит листы по шаблону `src/server/sheets/template.ts`: «Заявки» (заголовки A–Q, форматы дат, защита с предупреждением), «Сводка», «Недели», «Ссылки» (генератор UTM), «Расходы», «Справочники», «Инструкция». Повторный запуск безопасен: в «Заявках», «Ссылках» и «Расходах» обновляются только заголовки и форматы, остальные листы пересоздаются целиком. Новый репетитор появляется в списке страниц «Ссылок» после повторного запуска.

В репозитории – только `.env.example` без значений.

## 9. Сборка, деплой, инфраструктура

- **Dockerfile** многоступенчатый: `deps` → `build` (`pnpm build` – он сначала запускает `content:check`, ADR-033, – и сборка воркера через `tsup`) → `runner` (`node:26-slim`, непривилегированный пользователь, standalone-вывод + `dist/worker.js` – один ESM-файл со всеми зависимостями, `tsup.config.ts`). Один образ, две команды запуска: `node server.js` и `node worker.js`. Сборке нужна история git (`fetch-depth: 0` и `.git` в контексте Docker): из неё `sitemap.xml` берёт `lastmod` (ADR-055); без git `lastmod` не выводится, а в неполном клоне у всех страниц была бы дата последнего коммита.
- **CI** (`ci.yml`, на каждый PR в `develop`/`main` и push в них): install → format:check → lint → typecheck → `content:check` → unit → integration (Testcontainers) → build → e2e (Playwright против собранного приложения + Postgres service) → Lighthouse CI для `/` и `/tutors/andrei`. Параллельно – gitleaks по всей истории и `pnpm audit` (не блокирует). Шаги добавляются в фичах, где появляется то, что они проверяют; job `checks` и `build-e2e` обязательны для слияния в `develop` и `main`. Actions закреплены по SHA (ADR-022), сборка – отдельный шаг перед Playwright (ADR-024).
- **Deploy** (`deploy.yml`):
  - push в `develop` – образ `ghcr.io/<owner>/puzzleup:develop-<sha>` → staging;
  - тег `v*` на `main` – образ `:vX.Y.Z` → production.
  - На сервере по SSH: `docker compose pull` → `run --rm app pnpm db:migrate` → `up -d` → проверка `/api/health` → post-deploy ревалидация (`pnpm cache:revalidate`, ADR-053).
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
