import { requestJson, setClinicAuthToken, setPlatformAuthToken } from "@/lib/api";
import type { PaginatedResult } from "@/types/api";
import {
  dentalAuraWebhookPaths,
  type ApiEnvelope,
  type ClinicLoginResponse,
  type CreatePlatformUserPayload,
  type ListResponse,
  type PlatformClinic,
  type PlatformLoginResponse,
  type UpsertPlatformClinicPayload,
} from "./n8n-contracts";

function unwrap<T>(response: unknown): T {
  if (response && typeof response === "object" && "success" in response && "data" in response) {
    const envelope = response as ApiEnvelope<T>;

    if (envelope.success === false) {
      throw new Error(envelope.error ?? envelope.message ?? "A API retornou uma resposta de erro.");
    }

    return envelope.data;
  }

  return response as T;
}

function appendQuery(path: string, params: Record<string, unknown>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      return;
    }
    search.set(key, String(value));
  });

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function requestClinic<T>(path: string, init: RequestInit = {}) {
  const response = await requestJson<unknown>(path, init, { auth: "clinic" });
  return unwrap<T>(response);
}

async function requestPlatform<T>(path: string, init: RequestInit = {}) {
  const response = await requestJson<unknown>(path, init, { auth: "platform" });
  return unwrap<T>(response);
}

export async function clinicLogin(email: string, password: string): Promise<ClinicLoginResponse> {
  const result = await requestJson<unknown>(
    dentalAuraWebhookPaths.clinic.auth.login,
    {
      body: JSON.stringify({
        app: "dental-aura-clinic",
        email,
        password,
        source: "clinic_login",
      }),
      method: "POST",
    },
    { auth: false },
  );

  const payload = unwrap<ClinicLoginResponse>(result);
  setClinicAuthToken(payload.token);
  return payload;
}

export async function clinicLogout() {
  await requestClinic<{ ok: boolean }>(dentalAuraWebhookPaths.clinic.auth.logout, {
    method: "POST",
  });
  setClinicAuthToken(null);
}

export async function platformLogin(email: string, password: string): Promise<PlatformLoginResponse> {
  const result = await requestJson<unknown>(
    dentalAuraWebhookPaths.platform.auth.login,
    {
      body: JSON.stringify({
        app: "dental-aura-clinic",
        email,
        password,
        source: "platform_login",
      }),
      method: "POST",
    },
    { auth: false },
  );

  const payload = unwrap<PlatformLoginResponse>(result);
  setPlatformAuthToken(payload.token);
  return payload;
}

export async function platformLogout() {
  await requestPlatform<{ ok: boolean }>(dentalAuraWebhookPaths.platform.auth.logout, {
    method: "POST",
  });
  setPlatformAuthToken(null);
}

export const clinicApi = {
  overview: {
    kpis: <T>() => requestClinic<T>(dentalAuraWebhookPaths.clinic.overview.kpis),
    chartWeek: <T>() => requestClinic<T>(dentalAuraWebhookPaths.clinic.overview.chartWeek),
    activities: <T>() => requestClinic<T>(dentalAuraWebhookPaths.clinic.overview.activities),
    upcomingAppointments: <T>() =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.overview.upcomingAppointments),
  },
  appointments: {
    list: <T>(filters: Record<string, unknown>) =>
      requestClinic<T>(appendQuery(dentalAuraWebhookPaths.clinic.appointments.list, filters)),
    updateStatus: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.appointments.byId(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
  },
  requests: {
    list: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.requests.list, filters),
      ),
    byId: <T>(id: string) => requestClinic<T | null>(dentalAuraWebhookPaths.clinic.requests.byId(id)),
    byAppointment: <T>(appointmentId: string) =>
      requestClinic<T | null>(dentalAuraWebhookPaths.clinic.requests.byAppointment(appointmentId)),
    create: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.requests.create, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    confirm: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.requests.confirm(id), {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    reschedule: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.requests.reschedule(id), {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    cancel: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.requests.cancel(id), {
        body: JSON.stringify(payload),
        method: "POST",
      }),
  },
  patients: {
    list: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.patients.list, filters),
      ),
    byId: <T>(id: string) => requestClinic<T | null>(dentalAuraWebhookPaths.clinic.patients.byId(id)),
    create: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.patients.create, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    update: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.patients.byId(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    context: <T>(filters: Record<string, unknown>) =>
      requestClinic<T>(appendQuery(dentalAuraWebhookPaths.clinic.patients.context, filters)),
  },
  professionals: {
    list: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.professionals.list, filters),
      ),
    options: <T>() => requestClinic<T[]>(dentalAuraWebhookPaths.clinic.professionals.options),
    byId: <T>(id: string) =>
      requestClinic<T | null>(dentalAuraWebhookPaths.clinic.professionals.byId(id)),
    create: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.professionals.create, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    update: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.professionals.byId(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
  },
  services: {
    list: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.services.list, filters),
      ),
    options: <T>() => requestClinic<T[]>(dentalAuraWebhookPaths.clinic.services.options),
    byId: <T>(id: string) => requestClinic<T | null>(dentalAuraWebhookPaths.clinic.services.byId(id)),
    create: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.services.create, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    update: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.services.byId(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
  },
  finance: {
    services: <T>() => requestClinic<T[]>(dentalAuraWebhookPaths.clinic.finance.services),
    createService: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.services, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    updateService: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(`${dentalAuraWebhookPaths.clinic.finance.services}/${encodeURIComponent(id)}`, {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    searchPatients: <T>(q: string) =>
      requestClinic<T[]>(appendQuery(dentalAuraWebhookPaths.clinic.finance.patientsSearch, { q })),
    budgets: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.finance.budgets, filters),
      ),
    budgetById: <T>(id: string) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.budgetById(id)),
    createBudget: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.budgets, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    updateBudget: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.budgetById(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    convertBudgetToInvoice: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.budgetConvertToInvoice(id), {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    invoices: <T>(filters: Record<string, unknown>) =>
      requestClinic<PaginatedResult<T>>(
        appendQuery(dentalAuraWebhookPaths.clinic.finance.invoices, filters),
      ),
    invoiceById: <T>(id: string) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.invoiceById(id)),
    createInvoice: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.invoices, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    updateInvoice: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.invoiceById(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    registerPayment: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.payments, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    coupons: <T>() => requestClinic<T[]>(dentalAuraWebhookPaths.clinic.finance.coupons),
    createCoupon: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.coupons, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    validateCoupon: <T>(codigo: string) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.finance.couponValidate, {
        body: JSON.stringify({ codigo }),
        method: "POST",
      }),
    summary: <T>(filters: Record<string, unknown>) =>
      requestClinic<T>(appendQuery(dentalAuraWebhookPaths.clinic.finance.summary, filters)),
    debtors: <T>(filters: Record<string, unknown>) =>
      requestClinic<T[]>(appendQuery(dentalAuraWebhookPaths.clinic.finance.debtors, filters)),
  },
  records: {
    byPatient: <T>(patientId: string, filters: Record<string, unknown>) =>
      requestClinic<T[]>(
        appendQuery(dentalAuraWebhookPaths.clinic.records.byPatient(patientId), filters),
      ),
    byId: <T>(id: string) => requestClinic<T>(dentalAuraWebhookPaths.clinic.records.byId(id)),
    create: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.create, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    update: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.byId(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    treatments: <T>(filters: Record<string, unknown>) =>
      requestClinic<T[]>(
        appendQuery(dentalAuraWebhookPaths.clinic.records.treatments, filters),
      ),
    createTreatment: <T>(payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.treatments, {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    updateTreatment: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.treatmentById(id), {
        body: JSON.stringify(payload),
        method: "PATCH",
      }),
    registerTreatmentSession: <T>(id: string, payload: Record<string, unknown>) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.treatmentRegisterSession(id), {
        body: JSON.stringify(payload),
        method: "POST",
      }),
    cancelTreatment: <T>(id: string) =>
      requestClinic<T>(dentalAuraWebhookPaths.clinic.records.treatmentCancel(id), {
        method: "POST",
      }),
  },
};

export const platformApi = {
  login: platformLogin,
  logout: platformLogout,
  listClinics: (q?: string) =>
    requestPlatform<ListResponse<PlatformClinic>>(
      appendQuery(dentalAuraWebhookPaths.platform.clinics.list, { q }),
    ),
  createClinic: (payload: UpsertPlatformClinicPayload) =>
    requestPlatform<PlatformClinic>(dentalAuraWebhookPaths.platform.clinics.create, {
      body: JSON.stringify(payload),
      method: "POST",
    }),
  updateClinic: (id: string, payload: UpsertPlatformClinicPayload) =>
    requestPlatform<PlatformClinic>(dentalAuraWebhookPaths.platform.clinics.byId(id), {
      body: JSON.stringify(payload),
      method: "PATCH",
    }),
  deactivateClinic: (id: string) =>
    requestPlatform<{ ok: boolean; clinic: PlatformClinic }>(
      dentalAuraWebhookPaths.platform.clinics.byId(id),
      {
        method: "DELETE",
      },
    ),
  createUser: (payload: CreatePlatformUserPayload) =>
    requestPlatform<{ ok: boolean }>(dentalAuraWebhookPaths.platform.users.create, {
      body: JSON.stringify(payload),
      method: "POST",
    }),
};

export type {
  ClinicLoginResponse,
  ClinicUser,
  CreatePlatformUserPayload,
  PlatformClinic,
  PlatformLoginResponse,
  PlatformUser,
  UpsertPlatformClinicPayload,
} from "./n8n-contracts";
