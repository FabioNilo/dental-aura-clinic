import { supabase } from "@/integrations/supabase/client";

export type SchemaClientLike = Pick<typeof supabase, "from" | "rpc">;

export function getClinicSchemaClient() {
  return (supabase as typeof supabase & { schema?: (schema: string) => SchemaClientLike }).schema?.(
    "clinic",
  );
}

export function isSchemaLookupError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code ?? "") : "";
  const message = "message" in error ? String(error.message ?? "") : "";

  return (
    code === "PGRST202" ||
    code === "PGRST203" ||
    code === "PGRST204" ||
    message.includes("Could not find the function") ||
    message.includes("Could not find the table") ||
    message.includes("Could not find the schema") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("table")
  );
}

export async function withClinicFallback<T>(operation: (client: SchemaClientLike) => Promise<T>) {
  const clinicClient = getClinicSchemaClient();

  if (clinicClient) {
    try {
      return await operation(clinicClient);
    } catch (error) {
      if (!isSchemaLookupError(error)) {
        throw error;
      }
    }
  }

  return operation(supabase);
}
