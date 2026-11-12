import { describe, expect, it } from 'vitest';

import { telegramUrl, viberUrl } from './urls';

describe('telegramUrl', () => {
  it.each([
    ['example_tutor', 'https://t.me/example_tutor'],
    ['@example_tutor', 'https://t.me/example_tutor'],
    ['  example_tutor  ', 'https://t.me/example_tutor'],
    ['https://t.me/example_tutor', 'https://t.me/example_tutor'],
    ['http://t.me/example_tutor/', 'https://t.me/example_tutor'],
    ['t.me/example_tutor?start=1', 'https://t.me/example_tutor'],
    ['https://telegram.me/example_tutor', 'https://t.me/example_tutor'],
  ])('%s → %s', (value, url) => {
    expect(telegramUrl(value)).toBe(url);
  });
});

describe('viberUrl', () => {
  it.each([
    ['+375 29 000-00-00', 'viber://chat?number=%2B375290000000'],
    ['375290000000', 'viber://chat?number=%2B375290000000'],
    ['+375 (29) 000-00-00', 'viber://chat?number=%2B375290000000'],
  ])('%s → %s', (phone, url) => {
    expect(viberUrl(phone)).toBe(url);
  });
});
