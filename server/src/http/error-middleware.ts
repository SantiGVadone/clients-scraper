import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainError, type DomainErrorCode } from "../domain/errors";

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  UNKNOWN_RUBRO: 400,
  UNKNOWN_PROVIDER: 400,
  ZONE_NOT_FOUND: 404,
  PROVIDER_UNAVAILABLE: 502,
  QUOTA_EXCEEDED: 429,
  UNSUPPORTED_FILTER: 400,
  NOT_IMPLEMENTED: 501,
};

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof DomainError) {
      reply.status(STATUS_BY_CODE[error.code]).send({
        error: { code: error.code, message: error.message },
      });
      return;
    }

    if (error instanceof ZodError) {
      reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Parámetros inválidos.",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    // El stack se registra en el servidor, nunca se envía al cliente.
    request.log.error(error);
    reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "Error interno del servidor." },
    });
  });
}
