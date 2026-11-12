import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { validateContent } from './check';
import { readContent } from './raw';

// Настоящий `content/` (собирает tests/setup/content.ts).
describe('content/', () => {
  const { raw } = readContent();
  const photoExists = (fileName: string) => existsSync(resolve('public/tutors', fileName));

  it('passes the regular check', () => {
    expect(validateContent(raw, { photoExists }).issues).toEqual([]);
  });

  it('fails the strict check only on placeholders left for the release', () => {
    const { issues } = validateContent(raw, { strict: true, photoExists });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.filter((issue) => !issue.message.startsWith('placeholder '))).toEqual([]);
  });

  // Content Collections молча выбрасывает файл с битым YAML – репетитор не должен пропасть.
  it('loads every tutor file', () => {
    const files = readdirSync('content/tutors').filter((name) => name.endsWith('.mdx'));
    expect(raw.tutors.map((source) => source.file).sort()).toEqual(
      files.map((name) => `content/tutors/${name}`).sort(),
    );
  });
});
