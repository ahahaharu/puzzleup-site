'use client';

import { useSyncExternalStore } from 'react';

// Выбор в cookie-баннере (ТЗ главной, «Глобальные элементы»): «Принять» – `accepted`,
// «Отклонить» – `declined`. Хранится в localStorage этого браузера: на сервер не нужен,
// страницы статические (ADR-056). Баннер и кнопка «Настройки cookie» в подвале – разные деревья
// React, поэтому состояние общее, вне компонентов.

export type ConsentChoice = 'accepted' | 'declined';

export type ConsentState = {
  /** `false` – на сервере и до гидратации: выбор ещё не прочитан, баннер не показывается. */
  ready: boolean;
  choice: ConsentChoice | undefined;
  /** Баннер открыт заново из подвала. */
  reopened: boolean;
};

export const CONSENT_KEY = 'puzzleup:cookie-consent';

const SERVER_STATE: ConsentState = { ready: false, choice: undefined, reopened: false };

let state: ConsentState | undefined;
const listeners = new Set<() => void>();

/** localStorage недоступен в части приватных режимов – обращение к нему бросает исключение. */
function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function read(): ConsentChoice | undefined {
  try {
    const value = storage()?.getItem(CONSENT_KEY);
    return value === 'accepted' || value === 'declined' ? value : undefined;
  } catch {
    return undefined;
  }
}

function getSnapshot(): ConsentState {
  state ??= { ready: true, choice: read(), reopened: false };
  return state;
}

function set(next: Partial<ConsentState>) {
  state = { ...getSnapshot(), ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Без доступа к хранилищу выбор действует до перезагрузки страницы. */
export function choose(choice: ConsentChoice) {
  try {
    storage()?.setItem(CONSENT_KEY, choice);
  } catch {
    // Квота или запрет записи: выбор всё равно применяется к этой странице.
  }
  set({ choice, reopened: false });
}

export function reopenBanner() {
  set({ reopened: true });
}

/** Баннер виден, пока выбора нет или пока его открыли заново. */
export function bannerVisible({ ready, choice, reopened }: ConsentState): boolean {
  return ready && (choice === undefined || reopened);
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_STATE);
}

/** Для тестов: забыть прочитанный выбор. */
export function resetConsentForTests() {
  state = undefined;
  for (const listener of listeners) listener();
}
