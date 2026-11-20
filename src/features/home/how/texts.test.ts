import { describe, expect, it } from 'vitest';

import { howSteps } from './texts';

describe('howSteps', () => {
  const steps = howSteps({
    responseHours: { from: '09:00', to: '22:00' },
    platforms: ['Google Meet', 'Miro'],
  });

  it('has five steps with the trial highlighted', () => {
    expect(steps.map((step) => step.title)).toEqual([
      'Выбираете репетитора',
      'Репетитор пишет вам',
      'Пробное занятие',
      'Итог и план',
      'Занятия',
    ]);
    expect(steps.filter((step) => step.highlight).map((step) => step.title)).toEqual([
      'Пробное занятие',
    ]);
  });

  it('takes the response hours and platforms from the data', () => {
    expect(steps[1]?.text).toContain('обычно с 9:00 до 22:00.');
    expect(steps[2]?.text).toContain('Онлайн в Google Meet и Miro.');

    const other = howSteps({ responseHours: { from: '10:00', to: '21:00' }, platforms: ['Zoom'] });
    expect(other[1]?.text).toContain('обычно с 10:00 до 21:00.');
    expect(other[2]?.text).toContain('Онлайн в Zoom.');
  });
});
