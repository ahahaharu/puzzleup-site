// Проверка `content/` (docs/data-model.md, «Перекрёстные проверки»): `pnpm content:check`.
// `--strict` – перед релизом: заглушки `[…]` и черновой объём «О себе» тоже ошибки.
// В отличие от загрузчика ловит то, что Content Collections молча пропускает: битый YAML
// и синтаксис MDX, – и проверяет, что указанные фото лежат в public/tutors/.
import { EventEmitter } from 'node:events';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createBuilder } from '@content-collections/core';

const strict = process.argv.includes('--strict');

// Файлы читаются уже внутри createBuilder(), до подписки через builder.on(), поэтому ошибки
// собирает свой emitter, переданный в сборщик.
const buildErrors: string[] = [];
const emitter = new EventEmitter();
const builder = await createBuilder(resolve('content-collections.ts'), undefined, {
  on: (key: string, listener: (event: unknown) => void) => emitter.on(key, listener),
  emit: (key: string, event: unknown) => {
    if (
      event !== null &&
      typeof event === 'object' &&
      'error' in event &&
      event.error instanceof Error
    ) {
      const where =
        'filePath' in event && typeof event.filePath === 'string' ? `${event.filePath}: ` : '';
      buildErrors.push(`${where}${event.error.message}`);
    }
    emitter.emit(key, event);
  },
});
await builder.build();

// Сгенерированные модули появляются только после сборки – поэтому импорт динамический.
const { readContent } = await import('../src/content/raw');
const { formatIssues, validateContent } = await import('../src/content/check');

const result = validateContent(readContent().raw, {
  strict,
  photoExists: (fileName) => existsSync(resolve('public/tutors', fileName)),
});

const problems = [...buildErrors, ...(result.ok ? [] : [formatIssues(result.issues)])];
if (problems.length > 0) {
  console.error(`Content check failed${strict ? ' (strict)' : ''}:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`Content is valid${strict ? ' (strict)' : ''}.`);
