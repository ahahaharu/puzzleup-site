import { resolve } from 'node:path';

import { createBuilder } from '@content-collections/core';

/**
 * Собирает `content/` до юнит-тестов: тест реального контента импортирует
 * сгенерированный модуль `content-collections`, а в чистом клоне его ещё нет.
 */
export default async function setup() {
  const builder = await createBuilder(resolve('content-collections.ts'));
  await builder.build();
}
