import { describe, it, expect } from "vitest";
import { AiResponseSchema } from "../lib/schema";

describe("AiResponseSchema", () => {
  it("aceita um JSON válido", () => {
    const data = {
      tipo: "esclarecimento",
      mensagem: "Com base nas orientações da Dra. Clara em 10/09/2025...",
      metadados: { medico: "Dra. Clara Cardoso", data_consulta: "10/09/2025" }
    };
    expect(() => AiResponseSchema.parse(data)).not.toThrow();
  });
  it("rejeita tipo inválido", () => {
    const bad = { tipo: "qualquer", mensagem: "x", metadados: { medico: "", data_consulta: "10/09/2025" } };
    expect(() => AiResponseSchema.parse(bad)).toThrow();
  });
});
