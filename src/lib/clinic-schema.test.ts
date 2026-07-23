import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  clinicClientMock,
  schemaMock,
  supabaseMock,
} = vi.hoisted(() => {
  const clinicClientMock = { from: vi.fn(), rpc: vi.fn() };
  const schemaMock = vi.fn();
  const supabaseMock = {
    from: vi.fn(),
    rpc: vi.fn(),
    schema: schemaMock,
  };

  return {
    clinicClientMock,
    schemaMock,
    supabaseMock,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: supabaseMock,
}));

import { getClinicSchemaClient, isSchemaLookupError, withClinicFallback } from "@/lib/clinic-schema";

describe("clinic-schema helper", () => {
  beforeEach(() => {
    schemaMock.mockReset();
    supabaseMock.from.mockReset();
    supabaseMock.rpc.mockReset();
  });

  it("returns the clinic schema client when the schema exists", () => {
    schemaMock.mockReturnValue(clinicClientMock);

    expect(getClinicSchemaClient()).toBe(clinicClientMock);
    expect(schemaMock).toHaveBeenCalledWith("clinic");
  });

  it("detects schema lookup errors that should trigger fallback", () => {
    expect(isSchemaLookupError({ code: "PGRST202" })).toBe(true);
    expect(isSchemaLookupError({ message: "Could not find the table" })).toBe(true);
    expect(isSchemaLookupError(new Error("boom"))).toBe(false);
  });

  it("falls back to public when clinic schema lookup fails", async () => {
    schemaMock.mockReturnValue(clinicClientMock);

    const operation = vi.fn(async (client) => {
      if (client === clinicClientMock) {
        throw { code: "PGRST202", message: "Could not find the table" };
      }

      return client;
    });

    await expect(withClinicFallback(operation)).resolves.toBe(supabaseMock);
    expect(operation).toHaveBeenCalledTimes(2);
    expect(operation.mock.calls[0]?.[0]).toBe(clinicClientMock);
    expect(operation.mock.calls[1]?.[0]).toBe(supabaseMock);
  });

  it("rethrows non schema errors", async () => {
    schemaMock.mockReturnValue(clinicClientMock);

    const operation = vi.fn(async () => {
      throw new Error("falha real");
    });

    await expect(withClinicFallback(operation)).rejects.toThrow("falha real");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
