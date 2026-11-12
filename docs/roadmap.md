# План разработки

Фичи идут по порядку: каждая следующая опирается на предыдущие. Одна строка – одна ветка и один PR в `develop`. Цель – запуск к зимнему сезону.

## Этап 0. Каркас

| # | Ветка | Что входит | Готово, когда |
|---|---|---|---|
| 0.1 | `chore/bootstrap` | Next.js 16.4 (TS strict, App Router, `cacheComponents`, `output: 'standalone'`), pnpm, Node 26 в `.nvmrc` и `engines`, ESLint 10 + Prettier, Vitest 5, Playwright, lefthook + commitlint + gitleaks, `.editorconfig`, `.env.example`, `.gitignore` (включая `.env*`, `.design-review/`, `.claude/settings.local.json`), `tsx` для скриптов, `src/lib/env.ts`, шаблон PR, Dependabot, README | `pnpm lint/typecheck/test/build` проходят на пустой странице |
| 0.2 | `ci/github-actions` | `ci.yml`: install с кэшем, lint, typecheck, test, build, e2e-заглушка | CI зелёный на PR |
| 0.3 | `feature/design-tokens` | `globals.css` с `@theme`, шрифты через `next/font`, утилиты бумаги, контейнер и сетка, фокус-кольцо, reduced-motion | Страница-витрина `/dev/tokens` (только в dev) показывает цвета, шрифты, бумагу |

## Этап 1. Дизайн-система и контент

| # | Ветка | Что входит |
|---|---|---|
| 1.1 | `feature/ui-kit` | Button, MessengerButtons, Chip, ChoiceChip, Badge, Field, Checkbox, Sheet, PuzzlePiece, PuzzleStep, Doodle, SectionHead, Logo, PhotoTape, Icon. Компонентные тесты на состояния |
| 1.2 | `feature/content-layer` | Content Collections, Zod-схемы всех файлов `content/`, перекрёстные проверки, `pnpm content:check` (+ `--strict`), контент-заглушки для Андрея и Максима, тексты из ТЗ в `situations.json`, `faq.json`, `site.json` |
| 1.3 | `feature/layout` | Header (сжатие после 80 px, подсветка активного пункта), MobileMenu на `<dialog>`, Footer с раскрытием из `site.json`, BottomBar (правила показа из ТЗ), skip-link |

## Этап 2. Страницы

| # | Ветка | Что входит |
|---|---|---|
| 2.1 | `feature/home-hero` | Бейдж-H1 из данных, слоган, лид, кнопка, факты, иллюстрация из четырёх деталей (inline SVG), анимация детали |
| 2.2 | `feature/home-tutors` | TutorCard, раскладки для 1/2/3+ репетиторов, сортировка по статусу и `order`, фильтр-вкладки с `?subject=` на клиенте, лента на телефоне |
| 2.3 | `feature/home-sections` | Узнаёте ситуацию?, Как это работает (sticky-пример итога), Предметы (auto-fit), Отзывы по колонкам, Цены, FAQ на `<details>`, О сайте |
| 2.4 | `feature/tutor-page` | `/tutors/[slug]`: блоки 1–7, хлебные крошки, статусы `full` и `archived` (перестановка блоков, `noindex`), подсказка о классе другого репетитора |
| 2.5 | `feature/service-pages` | 404, `/privacy` и `/cookies` из MDX с оглавлением |

## Этап 3. Заявки

| # | Ветка | Что входит |
|---|---|---|
| 3.1 | `feature/db-setup` | `compose.dev.yml` с Postgres 18, Drizzle-схема из `docs/data-model.md`, миграции, `db:*` скрипты, Testcontainers-хелпер, seed `tutor_availability` |
| 3.2 | `feature/lead-form` | LeadForm (Conform + Zod 4), маска телефона, свёрнутые необязательные поля, подсказки, ошибки из ТЗ, Server Action, транзакция заявка + согласие + outbox, honeypot, rate limit, Origin, экран «Спасибо» (день/ночь по Минску), UTM в sessionStorage, E2E с JS и без JS |
| 3.3 | `feature/outbox-worker` | `worker/index.ts`, цикл с `SKIP LOCKED` и `LISTEN/NOTIFY`, backoff, dead letter + alert, сборка воркера (`tsup`), интеграционные тесты |
| 3.4 | `feature/telegram-bot` | Webhook Route Handler, белый список, сообщение о заявке с кнопками статусов, редактирование сообщения, причина отказа, `/add`, `/help`, напоминания, alert Андрею, `bot:set-webhook` |
| 3.5 | `feature/sheets-sync` | Порт и адаптер Google Sheets, маппинг A–Q, upsert по № заявки, шаблон Таблицы (заголовки, Справочники, Ссылки с генератором UTM, Сводка и Недели формулами, Инструкция) |
| 3.6 | `feature/availability` | `tutor_availability`, `/status` в боте, кэшируемое чтение с `cacheTag`, инвалидация, post-deploy ревалидация, спайк по сборке без БД (решение в `decisions.md`) |
| 3.7 | `feature/retention` | Ежедневное удаление по сроку, очистка outbox, тесты |

## Этап 4. Обвязка

| # | Ветка | Что входит |
|---|---|---|
| 4.1 | `feature/seo` | Metadata API и шаблоны title/description, canonical, `sitemap.ts`, `robots.ts`, JSON-LD Person, BreadcrumbList, FAQPage, OG-картинки через `next/og` |
| 4.2 | `feature/consent-analytics` | Cookie-баннер (две равные кнопки, повторное открытие из подвала), Umami всегда, Яндекс Метрика после «Принять», CSP с nonce |
| 4.3 | `feature/infra` | Dockerfile, `compose.prod.yml` (prod + staging + postgres + umami + caddy), Caddyfile, `deploy.yml`, `/api/health`, инструкция подготовки VPS в `docs/ops.md` |
| 4.4 | `ci/quality-gates` | Lighthouse CI, axe в E2E, пороги покрытия, CodeQL |

Инфраструктуру (4.3) имеет смысл поднять сразу после этапа 1, чтобы staging был с первых страниц. Порядок можно поменять, если VPS уже готов.

## Этап 5. Релиз 0.1.0 → 1.0.0

Перед запуском рекламы:

- [ ] Реальные данные репетиторов: ФИО, УНП, вуз, год начала стажа, фото, Telegram, Viber. `content:check --strict` зелёный
- [ ] Тексты политики и cookie-политики, проверка юристом согласия и политики
- [ ] Письменное соглашение между репетиторами (совместная обработка, поручение)
- [ ] Сверка формулировки о статусе ученика с Положением Минобразования, п. 71 Перечня № 457 для 10–11 классов
- [ ] Боевой бот, общий чат, Таблица с доступом только у двоих
- [ ] Прогон на реальных телефонах: iOS Safari, Android Chrome; форма без JS
- [ ] Lighthouse ≥ 90, axe без нарушений, все E2E зелёные
- [ ] `release/1.0.0` → `main`, тег `v1.0.0`

## После запуска (не в первой версии)

Каталог `/tutors` при 7+ репетиторах, видео-знакомство, результаты учеников, отзывы через форму, кабинет репетитора и CRM на NestJS, бэкапы, переход на ООО (отдельная версия ТЗ: центр с подбором и общей формой).
