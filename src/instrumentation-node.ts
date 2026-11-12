/**
 * Проверка окружения при старте сервера на Node.js: неверное окружение
 * останавливает процесс, а не превращает каждый ответ в 500
 * (docs/architecture.md, раздел 8).
 */
export async function validateEnvOrExit() {
  try {
    await import('@/server/env');
  } catch (error) {
    // В сообщении EnvError только имена переменных, без значений.
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
