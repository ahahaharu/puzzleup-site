---
name: review
description: Независимая проверка текущей ветки агентами spec-reviewer, copy-checker и design-reviewer со сводным отчётом. Запуск вручную - /review, лучше в новой сессии.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(gh pr view *) Bash(gh pr comment *) Bash(pnpm *)
---

Проверь текущую ветку относительно `develop`. Код не правь.

1. `git branch --show-current`, `git diff develop...HEAD --stat`. Определи пункт роадмапа.
2. Запусти агентов: `spec-reviewer`; `copy-checker`, если менялись тексты; `design-reviewer`, только если менялся внешний вид (вёрстка, стили, компоненты). Результаты CI – `gh pr checks`, если PR уже открыт.
3. Собери сводку:

```
## Ревью <ветка>: ГОТОВО К МЁРДЖУ / НУЖНЫ ПРАВКИ

### Блокеры
### Замечания
### Что проверить человеку руками
```

4. Если для ветки есть открытый PR и `$ARGUMENTS` содержит `comment` – опубликуй сводку комментарием: `gh pr comment --body-file -`.
