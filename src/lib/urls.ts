/**
 * Ссылки на личные чаты репетитора (docs/data-model.md: поля `telegram` и `viber`).
 * Формат значений проверяет схема контента; здесь – только сборка ссылки.
 */

const TELEGRAM_LINK = /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(.+)$/i;

/** Ник без @, `@ник` или ссылка t.me → `https://t.me/<ник>`. */
export function telegramUrl(value: string): string {
  const trimmed = value.trim();
  const fromLink = TELEGRAM_LINK.exec(trimmed)?.[1];
  const nick = (fromLink ?? trimmed).replace(/^@/, '').replace(/[/?#].*$/, '');
  return `https://t.me/${encodeURIComponent(nick)}`;
}

/** Номер в любом написании (`+375 29 000-00-00`) → `viber://chat?number=%2B375290000000`. */
export function viberUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `viber://chat?number=${encodeURIComponent(`+${digits}`)}`;
}
