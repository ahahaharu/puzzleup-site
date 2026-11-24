import 'server-only';

import { getSite, getSubjects, getTutors } from '@/content';
import type { Goal } from '@/lib/goal';

/** Репетитор глазами бота: имя для пометки «→ Андрею», его предметы и цели для `/add`. */
export type BotTutor = {
  id: string;
  name: string;
  nameDative: string;
  archived: boolean;
  subjects: readonly { id: string; from: number; to: number }[];
  goals: readonly Goal[];
};

/**
 * Данные из `content/`, нужные боту. Передаются параметром: тесты подставляют свои, а тексты
 * не привязаны к «математике» и двум репетиторам (CLAUDE.md, «Контент»).
 */
export type BotDirectory = {
  tutors: readonly BotTutor[];
  /** Название предмета по id: «математика». */
  subjects: Readonly<Record<string, string>>;
  /** Часы ответа по Минску – напоминания идут только в них. */
  responseHours: { from: string; to: string };
};

export function contentDirectory(): BotDirectory {
  return {
    tutors: getTutors().map((tutor) => ({
      id: tutor.id,
      name: tutor.name,
      nameDative: tutor.nameDative,
      archived: tutor.archived,
      subjects: tutor.subjects,
      goals: tutor.goals,
    })),
    subjects: Object.fromEntries(getSubjects().map((subject) => [subject.id, subject.name])),
    responseHours: getSite().responseHours,
  };
}

export const findTutor = (directory: BotDirectory, id: string) =>
  directory.tutors.find((tutor) => tutor.id === id);
