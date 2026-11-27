import { describe, expect, it } from 'vitest';

import { wallLayout } from './wall-layout';

const wide = { width: 900, height: 410 };
const square = { width: 900, height: 900 };

describe('wallLayout', () => {
  it('places the tallest screenshots first and keeps the date order inside a column', () => {
    // Высоты с подписью: широкий – 0,71, квадратный – 1,25.
    expect(wallLayout([wide, wide, square, square, square], { columns: 3 }).columns).toEqual([
      [0, 2],
      [1, 3],
      [4],
    ]);
  });

  it('leaves the note to the column with room for it', () => {
    expect(wallLayout([wide, wide, square, square, square], { columns: 3 }).noteColumn).toBe(2);
    // Колонки ровные – записке места нет.
    expect(wallLayout([square, square, square], { columns: 3 }).noteColumn).toBeUndefined();
    expect(wallLayout([square], { columns: 3 }).noteColumn).toBeUndefined();
  });

  it('lays out the visible screenshots and appends the hidden ones', () => {
    const sizes = [square, square, square, wide, wide, wide, square, square];
    const collapsed = wallLayout(sizes, { columns: 3, visible: 6 });
    expect(collapsed.columns).toEqual([
      [0, 3, 6],
      [1, 4, 7],
      [2, 5],
    ]);
    expect(collapsed.noteColumn).toBeUndefined();
    expect(wallLayout(sizes, { columns: 3 }).noteColumn).toBe(1);
  });
});
