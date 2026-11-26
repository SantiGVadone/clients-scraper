export type DomainErrorCode =
  | "UNKNOWN_RUBRO"
  | "UNKNOWN_PROVIDER"
  | "ZONE_NOT_FOUND"
  | "PROVIDER_UNAVAILABLE"
  | "QUOTA_EXCEEDED"
  | "UNSUPPORTED_FILTER"
  | "NOT_IMPLEMENTED";

/** Base de los errores de negocio. El middleware HTTP traduce el code a status. */
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;

  protected constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class UnknownRubroError extends DomainError {
  readonly code = "UNKNOWN_RUBRO" as const;

  constructor(readonly available: readonly string[]) {
    super(`Rubro no disponible. Rubros disponibles: ${available.join(", ")}.`);
  }
}

export class UnknownProviderError extends DomainError {
  readonly code = "UNKNOWN_PROVIDER" as const;

  constructor(provider: string) {
    super(`Proveedor desconocido: "${provider}".`);
  }
}

export class ZoneNotFoundError extends DomainError {
  readonly code = "ZONE_NOT_FOUND" as const;

  constructor(zone: string) {
    super(`No se encontró la zona: "${zone}".`);
  }
}

export class ProviderUnavailableError extends DomainError {
  readonly code = "PROVIDER_UNAVAILABLE" as const;

  constructor(provider: string, options?: ErrorOptions) {
    super(` El proveedor "${provider}" no está disponible.`.trim(), options);
  }
}

export class QuotaExceededError extends DomainError {
  readonly code = "QUOTA_EXCEEDED" as const;

  constructor(provider: string) {
    super(`Se agotó el cupo del proveedor "${provider}".`);
  }
}

export class UnsupportedFilterError extends DomainError {
  readonly code = "UNSUPPORTED_FILTER" as const;

  constructor(filter: string, provider: string) {
    super(`El proveedor "${provider}" no soporta el filtro "${filter}".`);
  }
}

export class NotImplementedError extends DomainError {
  readonly code = "NOT_IMPLEMENTED" as const;

  constructor(provider: string) {
    super(`El proveedor "${provider}" todavía no está implementado.`);
  }
}
