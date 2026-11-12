// Вызывается один раз при старте сервера Next.js, до первого запроса.
// Код для Node.js – в отдельном модуле, чтобы он не попадал в Edge-сборку.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvOrExit } = await import('./instrumentation-node');
    await validateEnvOrExit();
  }
}
