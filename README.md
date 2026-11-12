# PuzzleUp

Сайт независимых онлайн-репетиторов по математике для 5–11 классов в Беларуси: https://puzzle-up.by

PuzzleUp – общий сайт независимых репетиторов. Не является организацией, юридическим лицом или ИП.

## Быстрый старт

Требования: Node.js 26, pnpm, Docker, GitHub CLI (`gh auth login`) – нужен для создания PR из Claude Code.

```bash
pnpm install
cp .env.example .env.local     # заполнить значения
pnpm db:up && pnpm db:migrate
pnpm dev                       # http://localhost:3000
pnpm worker:dev                # в отдельном терминале, если нужны уведомления
```

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
