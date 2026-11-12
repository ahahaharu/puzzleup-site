// Вызывается один раз при старте сервера Next.js, до первого запроса.
// Неверное окружение останавливает процесс, а не превращает каждый ответ в 500
// (docs/architecture.md, раздел 8).
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  try {
    await import('@/server/env');
  } catch (error) {
    // В сообщении EnvError только имена переменных, без значений.
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
