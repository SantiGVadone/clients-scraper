import type { ProviderName } from "../domain/place";
import { ProviderUnavailableError, QuotaExceededError } from "../domain/errors";

/** Inyectable para que los tests nunca lleguen a la red. */
export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export function ensureSuccessfulResponse(response: Response, provider: ProviderName): void {
  if (response.status === 429) {
    throw new QuotaExceededError(provider);
  }
  if (!response.ok) {
    throw new ProviderUnavailableError(provider, {
      cause: new Error(`HTTP ${response.status} desde ${provider}`),
    });
  }
}
