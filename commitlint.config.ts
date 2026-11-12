import type { UserConfig } from '@commitlint/types';

// Типы и скоупы – docs/conventions.md, раздел «Коммиты».
const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'refactor',
        'perf',
        'test',
        'docs',
        'style',
        'chore',
        'build',
        'ci',
        'revert',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'ui',
        'layout',
        'home',
        'tutor-page',
        'content',
        'lead-form',
        'leads',
        'outbox',
        'bot',
        'sheets',
        'availability',
        'db',
        'seo',
        'legal',
        'analytics',
        'infra',
        'deps',
        'decisions',
      ],
    ],
  },
};

export default config;
