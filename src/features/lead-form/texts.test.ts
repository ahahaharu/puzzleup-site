import { describe, expect, it } from 'vitest';

import { errorCount, thanksDay, thanksNight } from './texts';

describe('thanks texts', () => {
  it('name the chosen messenger in the day text', () => {
    expect(thanksDay({ name: 'Анна', contactMethod: 'telegram' })).toBe(
      'Анна скоро напишет вам в Telegram.',
    );
    expect(thanksDay({ name: 'Анна', contactMethod: 'viber' })).toBe(
      'Анна скоро напишет вам в Viber.',
    );
    expect(thanksDay({ name: 'Анна', contactMethod: 'call' })).toBe('Анна скоро позвонит вам.');
  });

  it('promise contact after the start of the hours at night', () => {
    expect(thanksNight({ name: 'Анна', contactMethod: 'telegram', from: '9:00' })).toBe(
      'Сейчас Анна не на связи – напишет вам в Telegram после 9:00.',
    );
    expect(thanksNight({ name: 'Анна', contactMethod: 'call', from: '9:00' })).toBe(
      'Сейчас Анна не на связи – позвонит вам после 9:00.',
    );
  });
});

describe('errorCount', () => {
  it('agrees the word with the number', () => {
    expect(errorCount(1)).toBe('В форме 1 ошибка');
    expect(errorCount(3)).toBe('В форме 3 ошибки');
    expect(errorCount(5)).toBe('В форме 5 ошибок');
  });
});
