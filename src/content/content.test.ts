import { existsSync } from 'node:fs';
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

  it('has a page for every tutor file', () => {
    expect(raw.tutors.map((source) => source.file).sort()).toEqual([
      'content/tutors/andrei.mdx',
      'content/tutors/maxim.mdx',
    ]);
  });
});
