# PuzzleUp – сайт репетиторов

Общий сайт двух независимых репетиторов математики (Андрей – 5–9 класс, Максим – 5–11 класс) в Беларуси. Родитель выбирает репетитора, оставляет заявку на бесплатное пробное занятие на странице этого репетитора, заявка сохраняется в базе и приходит в общий Telegram-чат. PuzzleUp – не организация: это важно для всех текстов сайта.

Уровень проекта – production, рассчитан на рост до центра с наймом и новыми предметами. Решения – современные и масштабируемые, но без лишней сложности.

## Источники правды

Порядок приоритета при расхождениях:

1. `docs/spec/home.md` и `docs/spec/tutor-page.md` – ТЗ. Тексты, юридические формулировки и поведение берутся отсюда дословно.
2. `docs/design-system.md` – токены, типографика, компоненты.
3. `docs/design/` – макеты (HTML-выгрузка холста Claude Design), только визуал. Тексты в макетах местами устарели. **Перед вёрсткой любого блока открой его файлы `D-*`/`M-*` или `T-*`/`TM-*`** – см. `docs/design/README.md`.
4. `docs/architecture.md`, `docs/data-model.md`, `docs/decisions.md` – как устроен код и почему.
5. `docs/roadmap.md` – порядок фич и Definition of Done.

Если ТЗ молчит или противоречит само себе – не угадывай, спроси. Принятое решение запиши в `docs/decisions.md`.

## Жёсткие правила

**Тексты сайта (юридически значимо, см. ТЗ главной, раздел 1):**
- Сайт не говорит от лица организации: нет слов «мы», «наш», «команда», «центр», «школа», «компания», «подберём», «© PuzzleUp», нигде – в текстах, метатегах, alt, JSON-LD. Безличная форма («Репетитор находит…») или первое лицо репетитора.
- Нет гарантий результата («с первого раза», «гарантируем»), нет слов «педагог», «опытный преподаватель».
- Раскрытие «PuzzleUp – общий сайт независимых репетиторов. Не является организацией, юридическим лицом или ИП» есть на каждой странице, не мельче 14 px.
- Типографика текстов: тире – «–» (en dash) с пробелами, кавычки – «ёлочки», буква «ё» где нужна.
- Нет разметки Organization / EducationalOrganization, нет Review/Rating в JSON-LD.

**Персональные данные:**
- Имя, телефон, комментарий родителя никогда не попадают в логи, ошибки, аналитику, Google Таблицу, URL и тестовые фикстуры с реальными данными.
- Данные формы не сохраняются в браузере (никакого localStorage/sessionStorage для полей формы). UTM в sessionStorage – можно.
- Репозиторий публичный: никаких `.env`, ключей, токенов, дампов. Перед коммитом работает gitleaks.

**Интерфейс:**
- Mobile-first, базовая ширина 360 px. Ничего мельче 14 px, поля ввода на телефоне – от 16 px.
- Страницы работают без JavaScript: навигация – якоря, FAQ – `<details>`, форма – обычный POST (Server Action с прогрессивным улучшением), меню – `<dialog>`.
- Контраст WCAG 2.2 AA, видимый фокус (`focus` 2 px с отступом 2 px), `prefers-reduced-motion`, кликабельные зоны от 44×44 px.
- Анимации только `transform` и `opacity`.
- Без UI-библиотек и CSS-in-JS. Только Tailwind 4 и свои компоненты.
- Lighthouse на телефоне – не ниже 90 по всем четырём категориям.

**Контент:**
- Весь контент – данные в `content/` (MDX, JSON) с Zod-схемами. Новый репетитор, предмет, отзыв или вопрос FAQ – это запись в файл, без правки компонентов.
- Блок без данных не выводится вообще.
- Тексты не привязаны к «математике» и к «двум репетиторам»: всё считается из данных.

## Стек (кратко)

Node.js 26 LTS · pnpm · TypeScript 6 strict · Next.js 16.4 (App Router, React 19.3, Cache Components, `output: 'standalone'`) · Tailwind CSS 4.3 · Content Collections + MDX · Zod 4 · Conform · PostgreSQL 18 + Drizzle ORM · grammY · Google Sheets API · Vitest 5 · Testcontainers · Playwright · Docker Compose + Caddy на одном VPS.

Подробно – `docs/architecture.md`.

**Next.js 16 отличается от того, что ты мог видеть раньше:** `middleware.ts` переименован в `proxy.ts`, `params`/`searchParams` асинхронные, Cache Components (`'use cache'`, `cacheTag`, `cacheLife`, `updateTag`, `revalidateTag`), `next lint` удалён. Перед использованием API, в котором не уверен, сверяйся с документацией: https://nextjs.org/docs (индекс для агентов – https://nextjs.org/docs/llms.txt). То же для Tailwind 4 (конфиг в CSS через `@theme`, без `tailwind.config.js`), Zod 4, Vitest 5 и ESLint 10.

## Команды

```bash
pnpm dev              # Next.js dev-сервер
pnpm worker:dev       # воркер outbox и cron (нужна база)
pnpm db:up            # Postgres в Docker для разработки
pnpm db:generate      # сгенерировать миграцию из схемы Drizzle
pnpm db:migrate       # применить миграции
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest: юнит и компоненты
pnpm test:int         # Vitest: интеграционные с Testcontainers (нужен Docker)
pnpm e2e              # Playwright
pnpm content:check    # проверка контента (схемы + ссылки между файлами)
pnpm build            # production-сборка
```

Если команды ещё нет в `package.json` – она создаётся в фиче, где впервые нужна (см. `docs/roadmap.md`).

## Как работать

- **Git flow.** `main` – production, `develop` – staging. Работа – только в `feature/<kebab-name>` от `develop`. Релиз – `release/x.y.z` от `develop` → merge в `main` с тегом `vx.y.z` → back-merge в `develop`. Срочные правки – `hotfix/<name>` от `main`.
- Никогда не коммить и не пушить напрямую в `main` и `develop`. Не делай force push в общие ветки.
- **Коммиты** – Conventional Commits на английском, повелительное наклонение, до 72 символов в заголовке: `feat(leads): add phone validation for BY mobile codes`. Типы: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`, `build`, `perf`, `style`. Скоупы – имена модулей: `ui`, `layout`, `home`, `tutor-page`, `content`, `lead-form`, `leads`, `outbox`, `bot`, `sheets`, `availability`, `db`, `seo`, `legal`, `analytics`, `infra`, `deps`, плюс `decisions` для журнала решений. Список проверяет commitlint (`commitlint.config.ts`).
- Коммиты маленькие и атомарные: одна логическая правка – один коммит. Перед коммитом: `pnpm lint && pnpm typecheck && pnpm test`.
- PR в `develop` – squash merge, описание по шаблону из `docs/conventions.md`.
- Перед началом фичи: прочитай нужные разделы ТЗ, составь план, назови файлы, которые затронешь. После – проверь Definition of Done из `docs/roadmap.md`.
- Новая зависимость – только с причиной в описании PR. Предпочтение – платформе и уже выбранному стеку.

Подробности по стилю кода, тестам и PR – `docs/conventions.md`.

## Команды и агенты

- `/feature <пункт> [auto]` – полный цикл пункта роадмапа: ветка → план (без `auto` – остановка на согласование) → реализация с коммитами → проверка агентами → push → PR в `develop`. PR не мёрджится.
- `/review` – независимая проверка текущей ветки агентами со сводным отчётом. Запускать в новой сессии.
- `/handoff` – сохранить прогресс в описание PR перед `/clear`. Продолжение – тем же `/feature <пункт>`.

Агенты (`.claude/agents/`) код приложения не правят. Тесты пишет основная сессия, полный прогон проверок – CI:

| Агент | Когда |
|---|---|
| `spec-reviewer` | после реализации, всегда – соответствие ТЗ, архитектуре, DoD, ПД |
| `copy-checker` | менялись тексты, контент, метатеги, тексты бота |
| `design-reviewer` | только при изменении внешнего вида (новый блок, раскладка, стили, токены) – скриншоты макета и реализации на 390/1280, адаптив 360–1440 |

## Где что лежит

```
content/            контент сайта: tutors/*.mdx, reviews.json, subjects.json, situations.json, faq.json, site.json, legal/*.mdx
docs/               ТЗ (spec/), макеты (design/), архитектура, модель данных, дизайн-система, решения, план
src/app/            маршруты Next.js (страницы, Route Handlers, sitemap, robots, OG)
src/components/     ui/ – базовые компоненты ДС, layout/ – шапка, подвал, меню, панель, cookie-баннер
src/features/       блоки страниц и клиентская логика по фичам (home, tutor-page, lead-form)
src/server/         серверный код: db, leads, outbox, bot, sheets, availability (только с 'server-only')
src/lib/            чистые утилиты без побочных эффектов: время по Минску, телефон, UTM, URL-билдеры
src/styles/         globals.css с @theme-токенами и утилитами бумаги
worker/             точка входа процесса воркера (outbox + cron)
tests/e2e/          Playwright
docker/             Dockerfile, compose.*.yml, Caddyfile
```

## Тесты – что обязательно

Обязательно покрыто тестами: схемы контента и ссылки между файлами, валидация формы, сервис заявок (транзакция заявка + согласие + outbox), воркер outbox (повторы, backoff, dead letter), форматирование сообщений бота, команды бота, маппинг строки Google Таблицы (порядок столбцов A–Q), логика времени по Минску (часы ответа, напоминания, текст «Спасибо»), удаление по сроку хранения, сортировка репетиторов по статусу, сборка бейджа H1 из данных. E2E: отправка формы с JS и без JS, ошибки формы, 429, фильтр, переходы, 404, axe без нарушений.
