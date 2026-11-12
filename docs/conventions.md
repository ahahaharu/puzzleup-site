# Соглашения

## Git flow

| Ветка | Откуда | Куда | Слияние |
|---|---|---|---|
| `feature/<kebab-name>` | `develop` | `develop` | PR, squash merge |
| `release/<x.y.z>` | `develop` | `main` + back-merge в `develop` | PR, merge commit, тег `vX.Y.Z` на `main` |
| `hotfix/<kebab-name>` | `main` | `main` + `develop` | PR, merge commit, тег patch-версии |

- `main` и `develop` защищены: только через PR, обязательный зелёный CI, без force push.
- Одна фича – одна ветка – один PR. Если PR получается больше ~400 строк без учёта тестов и контента, его нужно делить.
- Имена веток: `feature/lead-form`, `feature/home-hero`, `fix/phone-mask-ios`, `chore/bootstrap`. Для фикса внутри `develop` используется `feature/`-подобная ветка с префиксом `fix/`.
- Версии – SemVer: `0.x` до запуска рекламы, `1.0.0` – первый публичный запуск.

## Коммиты

Conventional Commits, английский, повелительное наклонение, заголовок до 72 символов, без точки в конце.

```
<type>(<scope>): <subject>

<body: зачем, а не что; по желанию>

<footer: BREAKING CHANGE, Refs #12>
```

- **Типы:** `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `build`, `ci`, `revert`.
- **Скоупы:** `ui`, `layout`, `home`, `tutor-page`, `content`, `lead-form`, `leads`, `outbox`, `bot`, `sheets`, `availability`, `db`, `seo`, `legal`, `analytics`, `infra`, `deps`.

Примеры:

```
feat(lead-form): validate BY mobile codes 25/29/33/44
fix(bot): ignore callbacks from unknown Telegram users
test(sheets): cover column order A–Q in row mapper
chore(deps): bump next to 16.4.2
```

Проверяет commitlint в хуке `commit-msg` (lefthook).

## Pull request

Шаблон `.github/pull_request_template.md`:

```
## Что сделано
## Как проверить
## Скриншоты (360 и 1280 px, если менялся UI)
## Чек-лист
- [ ] Тексты сверены с ТЗ дословно, правила формулировок соблюдены
- [ ] Работает без JavaScript (если затронута страница)
- [ ] Тесты добавлены, `pnpm lint && pnpm typecheck && pnpm test` зелёные
- [ ] Нет ПД в логах, фикстурах, URL
- [ ] Новые зависимости обоснованы
- [ ] docs/ обновлены, если менялось поведение или решение
```

## Код

- **TypeScript.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. `any` и `as` без комментария-обоснования запрещены. Типы домена выводятся из Zod (`z.infer`) или схемы Drizzle, а не дублируются вручную.
- **Компоненты.** Серверные по умолчанию; `'use client'` – только там, где нужны состояние, события или браузерные API, на самом нижнем уровне. Имена – PascalCase, один компонент на файл, именованный экспорт.
- **Файлы.** `kebab-case.ts` для модулей, `PascalCase.tsx` для компонентов. Тест – рядом: `phone.test.ts`. Интеграционный – `*.int.test.ts`.
- **Серверный код.** Каждый модуль в `src/server` начинается с `import 'server-only'`. Внешние сервисы – за интерфейсом (`TelegramPort`, `SheetsPort`, `Clock`), реализации передаются явно, без глобальных синглтонов в доменной логике.
- **Ошибки.** Доменные ошибки – типизированные (`Result` или классы ошибок). Пользователю – тексты из ТЗ, в логи – код ошибки и идентификаторы без ПД.
- **Время.** Только через `src/lib/time.ts` (Temporal, `Europe/Minsk`). Никакого `new Date()` в доменной логике: часы передаются как `Clock`.
- **Тексты интерфейса.** В контенте (`content/`) или рядом с компонентом константами. Без i18n-фреймворка: сайт одноязычный. Тире «–», кавычки «».
- **Стили.** Только классы Tailwind и токены из `@theme`. Произвольные значения (`[17px]`) – только если их нет в шкале ДС, с комментарием. Без inline `style`, кроме CSS-переменных для динамики (например, угол поворота).
- **Доступность.** Семантические теги, один H1 на страницу, `aria-*` только когда нет нативного аналога. Новый интерактивный компонент проверяется с клавиатуры.
- **Импорты.** Алиас `@/` → `src/`. Порядок упорядочивает Prettier-плагин `@ianvs/prettier-plugin-sort-imports` (ESLint `import/order` не работает с ESLint 10, ADR-019).

## Тесты

| Уровень | Инструмент | Что | Где |
|---|---|---|---|
| Юнит | Vitest (node) | `src/lib`, доменная логика, схемы, форматтеры, маппинг Таблицы | рядом с кодом |
| Компоненты | Vitest Browser Mode + `vitest-browser-react` | Form, ChoiceChip, MobileMenu, фильтр | рядом с кодом |
| Интеграционные | Vitest + Testcontainers (Postgres 18) | repository, leadService, outbox worker, retention | `*.int.test.ts` |
| E2E | Playwright (Chromium + WebKit mobile) | ключевые сценарии, без JS, axe | `tests/e2e` |
| Производительность | Lighthouse CI | `/`, `/tutors/andrei` на мобильном профиле, все ≥ 90 | CI |

- Покрытие `src/lib` и `src/server` – не ниже 80% строк и веток. Порог в `vitest.config.ts`.
- Внешние API в тестах не вызываются: Telegram и Google – фейки портов. Сеть в юнит-тестах запрещена.
- Фикстуры – только выдуманные данные: «Мария», `+375 29 000-00-00`.
- Тест на баг пишется до фикса.

## Definition of Done (для каждой фичи)

1. Поведение и тексты соответствуют ТЗ, визуал – холсту на 360, 768 (где есть) и 1280 px.
2. Работает без JavaScript там, где этого требует ТЗ.
3. Тесты из таблицы выше для затронутого уровня добавлены и зелёные. CI зелёный целиком.
4. Нет нарушений axe, клавиатурная навигация проверена.
5. Lighthouse на мобильном профиле не просел ниже 90.
6. `docs/` обновлены, если изменилось решение или модель данных.
7. Фича проверена на staging после слияния в `develop`.
