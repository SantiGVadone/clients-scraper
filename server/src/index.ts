import { env } from "./config/env";
import { createApp } from "./composition-root";

async function main(): Promise<void> {
  const app = createApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((error: unknown) => {
  console.error("No se pudo iniciar el servidor:", error);
  process.exitCode = 1;
});
