/** Serializa llamadas y garantiza al menos `intervalMs` entre dos de ellas. */
export function createRateLimiter(intervalMs: number): () => Promise<void> {
  let nextAllowedAt = 0;
  let tail: Promise<void> = Promise.resolve();

  return () => {
    const scheduled = tail.then(async () => {
      const wait = Math.max(0, nextAllowedAt - Date.now());
      if (wait > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, wait));
      }
      nextAllowedAt = Date.now() + intervalMs;
    });

    // Un fallo en el scheduling no debe bloquear las siguientes llamadas.
    tail = scheduled.catch(() => undefined);
    return scheduled;
  };
}
