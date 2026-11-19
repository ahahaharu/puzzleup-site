/**
 * Атрибуты Invoker Commands (`commandfor`, `command`): кнопка открывает и закрывает `<dialog>` без
 * JavaScript. React 19.3 их не знает, а строчные атрибуты передаёт в DOM как есть.
 */
export function invoker(target: string, command: 'show-modal' | 'close'): Record<string, string> {
  return { commandfor: target, command };
}
