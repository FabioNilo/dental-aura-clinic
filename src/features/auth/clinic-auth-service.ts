import { clinicLogin, clinicLogout, type ClinicLoginResponse } from "@/features/integrations/dental-api";

export type ClinicAuthResult = ClinicLoginResponse & {
  isAdmin: boolean;
  source: "n8n";
};

export async function signInClinicAdmin(email: string, password: string): Promise<ClinicAuthResult> {
  const result = await clinicLogin(email, password);
  const isAdmin = result.user.role === "clinic_admin";

  if (!result.token || !result.clinic?.id || !result.user?.id) {
    throw new Error("O n8n precisa devolver token, clinic e user para abrir a sessao da clinica.");
  }

  return {
    ...result,
    isAdmin,
    source: "n8n",
  };
}

export async function signOutClinicAdmin() {
  try {
    await clinicLogout();
  } catch {
    return undefined;
  }
}
