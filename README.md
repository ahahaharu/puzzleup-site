# PuzzleUp

[![CI](https://github.com/ahahaharu/puzzleup-site/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/ahahaharu/puzzleup-site/actions/workflows/ci.yml)

Сайт независимых онлайн-репетиторов по математике для 5–11 классов в Беларуси: https://puzzle-up.by

PuzzleUp – общий сайт независимых репетиторов. Не является организацией, юридическим лицом или ИП.

## Быстрый старт

Требования:

- Node.js 26 (версия в `.nvmrc`: `nvm use`);
- pnpm 10 – точная версия зафиксирована в `packageManager`, pnpm переключится на неё сам;
- [gitleaks](https://github.com/gitleaks/gitleaks) – проверка секретов в хуке `pre-commit` (`brew install gitleaks`);
- Docker – для базы и интеграционных тестов (с этапа 3);
- GitHub CLI (`gh auth login`) – нужен для создания PR из Claude Code.

```bash
pnpm install                   # заодно ставит git-хуки (lefthook)
pnpm exec playwright install   # браузеры для E2E
cp .env.example .env.local     # заполнить значения
pnpm dev                       # http://localhost:3000
```

## Команды

```bash
pnpm dev            # dev-сервер
pnpm build          # production-сборка (output: standalone)
pnpm start          # запуск собранного standalone-сервера
pnpm lint           # ESLint
pnpm format         # Prettier
pnpm typecheck      # типы маршрутов + tsc --noEmit
pnpm test           # Vitest: юнит-тесты
pnpm e2e            # Playwright: собирает и запускает приложение сам
```

Остальные команды из `CLAUDE.md` появляются в фичах, где они впервые нужны (`docs/roadmap.md`).

CI (`.github/workflows/ci.yml`) на каждый PR в `develop` и `main`: Prettier, ESLint, типы, юнит-тесты, сборка, Playwright, gitleaks по всей истории и `pnpm audit`. Без зелёных `checks` и `build-e2e` PR не сливается.

Git-хуки: `pre-commit` – gitleaks, ESLint и Prettier по изменённым файлам; `commit-msg` – commitlint (Conventional Commits, `docs/conventions.md`); `pre-push` – typecheck и тесты.

## Документация

- [CLAUDE.md](CLAUDE.md) – правила проекта (для людей и Claude Code)
- [docs/spec/home.md](docs/spec/home.md) – ТЗ главной страницы
- [docs/spec/tutor-page.md](docs/spec/tutor-page.md) – ТЗ страницы репетитора
- [docs/architecture.md](docs/architecture.md) – архитектура и инфраструктура
- [docs/data-model.md](docs/data-model.md) – контент, база, Google Таблица
- [docs/design-system.md](docs/design-system.md) – дизайн-система «Тетрадь»
- [docs/design/](docs/design/README.md) – макеты (HTML-выгрузка холста)
- [docs/conventions.md](docs/conventions.md) – git flow, коммиты, код, тесты
- [docs/roadmap.md](docs/roadmap.md) – план фич
- [docs/decisions.md](docs/decisions.md) – журнал решений

## Лицензия

Код – по лицензии из `LICENSE` (выбрать перед публикацией). Контент в `content/` (тексты, фото репетиторов) не лицензируется для повторного использования.
