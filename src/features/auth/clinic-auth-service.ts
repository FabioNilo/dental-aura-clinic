import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import { getAuthProviderMode, getN8nAuthUrl, hasN8nAuthBridge } from "./auth-config";

type AuthSource = "n8n" | "supabase";

export type ClinicAuthResult = {
  session: Session;
  source: AuthSource;
  user: User;
};

type RoleLookupSubject = Pick<User, "email" | "id"> | null;

type ClinicRoleResult = {
  data: Array<{ id: string }> | null;
  error: unknown;
};

type ClinicAwaitableQuery = {
  eq: (column: string, value: string) => ClinicAwaitableQuery;
  then: (
    onfulfilled?: (value: ClinicRoleResult) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) => unknown;
};

type ClinicRoleQueryBuilder = {
  eq: (column: string, value: string | boolean) => ClinicRoleQueryBuilder | ClinicAwaitableQuery;
  limit: (count: number) => ClinicAwaitableQuery;
};

type ClinicSchemaClient = {
  from: (table: string) => {
    select: (columns: string) => ClinicRoleQueryBuilder;
  };
};

type N8nSessionShape = {
  access_token?: string;
  expires_at?: number;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  user?: User;
};

type N8nAuthResponseShape = {
  auth?: {
    session?: N8nSessionShape;
    user?: User;
  };
  data?: {
    session?: N8nSessionShape;
    user?: User;
  };
  message?: string;
  ok?: boolean;
  session?: N8nSessionShape;
  user?: User;
};

async function parseResponsePayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as N8nAuthResponseShape;
  } catch {
    return { message: text } as N8nAuthResponseShape;
  }
}

function extractN8nSession(payload: N8nAuthResponseShape | null | undefined) {
  const session =
    payload?.session ?? payload?.auth?.session ?? payload?.data?.session ?? null;
  const user = payload?.user ?? payload?.auth?.user ?? payload?.data?.user ?? session?.user ?? null;

  if (!session?.access_token || !session.refresh_token) {
    return null;
  }

  return {
    session,
    user,
  };
}

async function signInWithSupabase(email: string, password: string): Promise<ClinicAuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (!data.session || !data.user) {
    throw new Error("Nao foi possivel criar a sessao administrativa.");
  }

  return {
    session: data.session,
    source: "supabase",
    user: data.user,
  };
}

async function signInWithN8n(email: string, password: string): Promise<ClinicAuthResult> {
  if (!hasN8nAuthBridge()) {
    throw new Error("Fluxo de login via n8n nao configurado.");
  }

  const n8nUrl = getN8nAuthUrl();
  const response = await fetch(n8nUrl, {
    body: JSON.stringify({
      app: "dental-aura-clinic",
      email,
      password,
      source: "admin_login",
    }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        "O endpoint de login via n8n recusou a autenticacao administrativa.",
    );
  }

  const sessionShape = extractN8nSession(payload);

  if (!sessionShape) {
    throw new Error(
      "O n8n precisa devolver access_token e refresh_token para abrir a sessao administrativa.",
    );
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: sessionShape.session.access_token,
    refresh_token: sessionShape.session.refresh_token,
  });

  if (error) {
    throw error;
  }

  if (!data.session || !data.user) {
    throw new Error("Nao foi possivel sincronizar a sessao do n8n com o cliente Supabase.");
  }

  return {
    session: data.session,
    source: "n8n",
    user: data.user,
  };
}

async function lookupPublicAdminRole(userId: string) {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    if (error) {
      return {
        error: getErrorMessage(error, "Falha ao validar a role admin em public.user_roles."),
        matched: false,
      } as const;
    }

    return {
      error: null,
      matched: Boolean(data?.length),
    } as const;
  } catch (error) {
    return {
      error: getErrorMessage(error, "Falha ao validar a role admin em public.user_roles."),
      matched: false,
    } as const;
  }
}

async function lookupClinicAdminRole(subject: RoleLookupSubject) {
  if (!subject) {
    return {
      error: null,
      matched: false,
    } as const;
  }

  try {
    const clinicClient = (supabase as typeof supabase & { schema?: (schema: string) => ClinicSchemaClient }).schema?.("clinic");

    if (!clinicClient) {
      return {
        error: "O cliente Supabase nao possui suporte ao schema clinic.",
        matched: false,
      } as const;
    }

    const baseQuery = clinicClient
      .from("access_roles")
      .select("id")
      .eq("active", true)
      .eq("role", "admin")
      .limit(1);

    const primaryQuery = subject.id
      ? baseQuery.eq("supabase_user_id", subject.id)
      : baseQuery;

    let { data, error } = await primaryQuery;

    if (error) {
      return {
        error: getErrorMessage(error, "Falha ao validar a role admin em clinic.access_roles."),
        matched: false,
      } as const;
    }

    if (data?.length) {
      return {
        error: null,
        matched: true,
      } as const;
    }

    if (!subject.email) {
      return {
        error: null,
        matched: false,
      } as const;
    }

    const fallbackQuery = clinicClient
      .from("access_roles")
      .select("id")
      .eq("active", true)
      .eq("role", "admin")
      .eq("email", subject.email)
      .limit(1);

    ({ data, error } = await fallbackQuery);

    if (error) {
      return {
        error: getErrorMessage(error, "Falha ao validar a role admin em clinic.access_roles."),
        matched: false,
      } as const;
    }

    return {
      error: null,
      matched: Boolean(data?.length),
    } as const;
  } catch (error) {
    return {
      error: getErrorMessage(error, "Falha ao validar a role admin em clinic.access_roles."),
      matched: false,
    } as const;
  }
}

export async function resolveAdminRole(subject: RoleLookupSubject) {
  if (!subject?.id && !subject?.email) {
    return false;
  }

  const errors: string[] = [];

  if (subject.id) {
    const publicLookup = await lookupPublicAdminRole(subject.id);

    if (publicLookup.matched) {
      return true;
    }

    if (publicLookup.error) {
      errors.push(publicLookup.error);
    }
  }

  const clinicLookup = await lookupClinicAdminRole(subject);

  if (clinicLookup.matched) {
    return true;
  }

  if (clinicLookup.error) {
    errors.push(clinicLookup.error);
  }

  if (errors.length > 0) {
    console.error(
      `Falha ao validar acesso administrativo. Verifique as tabelas public.user_roles e clinic.access_roles. Detalhes: ${errors.join(" | ")}`,
    );
  }

  return false;
}

export async function signInClinicAdmin(email: string, password: string): Promise<ClinicAuthResult> {
  const providerMode = getAuthProviderMode();
  const shouldTryN8n = providerMode === "n8n" || providerMode === "hybrid";

  if (shouldTryN8n && hasN8nAuthBridge()) {
    try {
      return await signInWithN8n(email, password);
    } catch (error) {
      if (providerMode === "n8n") {
        throw error;
      }

      console.warn(
        `Login via n8n indisponivel, usando Supabase como fallback. Detalhes: ${getErrorMessage(
          error,
          "Falha ao autenticar via n8n.",
        )}`,
      );
    }
  }

  return signInWithSupabase(email, password);
}

export async function signOutClinicAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
