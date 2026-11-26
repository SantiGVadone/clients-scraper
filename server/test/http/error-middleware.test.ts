import Fastify from "fastify";
import { describe, expect, it } from "vitest";
import { NotImplementedError } from "../../src/domain/errors";
import { registerErrorHandler } from "../../src/http/error-middleware";
import { searchQuerySchema } from "../../src/http/schemas/search";

describe("error middleware", () => {
  it("traduce errores de dominio a status sin exponer el stack", async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get("/boom", async () => {
      throw new NotImplementedError("google");
    });

    const response = await app.inject({ method: "GET", url: "/boom" });
    expect(response.statusCode).toBe(501);
    expect(response.json()).toMatchObject({
      error: { code: "NOT_IMPLEMENTED", message: expect.stringContaining("google") },
    });
    expect(JSON.stringify(response.json())).not.toContain("stack");
  });

  it("traduce errores de validación a 400 con los caminos inválidos", async () => {
    const app = Fastify();
    registerErrorHandler(app);
    app.get("/search", async (request) => searchQuerySchema.parse(request.query));

    const response = await app.inject({ method: "GET", url: "/search?query=" });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("VALIDATION_ERROR");
  });
});
