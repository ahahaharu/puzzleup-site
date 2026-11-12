/**
 * Шаблоны текстов из `content/` с плейсхолдерами `{key}` (docs/data-model.md, `faq.json`, `site.json`):
 * то, что зависит от списка репетиторов, собирается из данных, а не пишется руками.
 * Ключ – латиница и цифры, начинается с буквы: «{tutorsGrades}».
 */

const KEY = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/** Ключи плейсхолдеров в порядке появления, без повторов. */
export function templateKeys(template: string): string[] {
  return [...new Set(Array.from(template.matchAll(KEY), (match) => match[1] ?? ''))];
}

/** Подставляет значения. Ключ без значения – ошибка: недособранный текст не должен попасть на сайт. */
export function fillTemplate(template: string, values: Readonly<Record<string, string>>): string {
  return template.replace(KEY, (_, key: string) => {
    const value = values[key];
    if (value === undefined) {
      throw new Error(`Template value for {${key}} is missing`);
    }
    return value;
  });
}
