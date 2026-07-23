export const dentalAuraWebhookPaths = {
  clinic: {
    auth: {
      login: "/dental-aura/clinic/auth/login",
      logout: "/dental-aura/clinic/auth/logout",
    },
    overview: {
      kpis: "/dental-aura/clinic/overview/kpis",
      chartWeek: "/dental-aura/clinic/overview/chart-week",
      activities: "/dental-aura/clinic/overview/activities",
      upcomingAppointments: "/dental-aura/clinic/overview/upcoming-appointments",
    },
    appointments: {
      list: "/dental-aura/clinic/appointments",
      byId: (id: string) => `/dental-aura/clinic/appointments/${encodeURIComponent(id)}`,
    },
    requests: {
      list: "/dental-aura/clinic/requests",
      create: "/dental-aura/clinic/requests",
      confirm: (id: string) => `/dental-aura/clinic/requests/${encodeURIComponent(id)}/confirm`,
      reschedule: (id: string) => `/dental-aura/clinic/requests/${encodeURIComponent(id)}/reschedule`,
      cancel: (id: string) => `/dental-aura/clinic/requests/${encodeURIComponent(id)}/cancel`,
      byAppointment: (appointmentId: string) =>
        `/dental-aura/clinic/requests/by-appointment/${encodeURIComponent(appointmentId)}`,
      byId: (id: string) => `/dental-aura/clinic/requests/${encodeURIComponent(id)}`,
    },
    patients: {
      list: "/dental-aura/clinic/patients",
      create: "/dental-aura/clinic/patients",
      context: "/dental-aura/clinic/patients/context",
      byId: (id: string) => `/dental-aura/clinic/patients/${encodeURIComponent(id)}`,
    },
    professionals: {
      list: "/dental-aura/clinic/professionals",
      create: "/dental-aura/clinic/professionals",
      options: "/dental-aura/clinic/professionals/options",
      byId: (id: string) => `/dental-aura/clinic/professionals/${encodeURIComponent(id)}`,
    },
    services: {
      list: "/dental-aura/clinic/services",
      create: "/dental-aura/clinic/services",
      options: "/dental-aura/clinic/services/options",
      byId: (id: string) => `/dental-aura/clinic/services/${encodeURIComponent(id)}`,
    },
    finance: {
      services: "/dental-aura/clinic/finance/services",
      patientsSearch: "/dental-aura/clinic/finance/patients-search",
      budgets: "/dental-aura/clinic/finance/budgets",
      budgetById: (id: string) => `/dental-aura/clinic/finance/budgets/${encodeURIComponent(id)}`,
      budgetConvertToInvoice: (id: string) =>
        `/dental-aura/clinic/finance/budgets/${encodeURIComponent(id)}/convert-to-invoice`,
      invoices: "/dental-aura/clinic/finance/invoices",
      invoiceById: (id: string) => `/dental-aura/clinic/finance/invoices/${encodeURIComponent(id)}`,
      payments: "/dental-aura/clinic/finance/payments",
      coupons: "/dental-aura/clinic/finance/coupons",
      couponValidate: "/dental-aura/clinic/finance/coupons/validate",
      summary: "/dental-aura/clinic/finance/summary",
      debtors: "/dental-aura/clinic/finance/debtors",
    },
    records: {
      list: "/dental-aura/clinic/records",
      create: "/dental-aura/clinic/records",
      byId: (id: string) => `/dental-aura/clinic/records/${encodeURIComponent(id)}`,
      byPatient: (patientId: string) => `/dental-aura/clinic/records/patients/${encodeURIComponent(patientId)}`,
      treatments: "/dental-aura/clinic/records/treatments",
      treatmentById: (id: string) => `/dental-aura/clinic/records/treatments/${encodeURIComponent(id)}`,
      treatmentRegisterSession: (id: string) =>
        `/dental-aura/clinic/records/treatments/${encodeURIComponent(id)}/sessions`,
      treatmentCancel: (id: string) =>
        `/dental-aura/clinic/records/treatments/${encodeURIComponent(id)}/cancel`,
    },
  },
  platform: {
    auth: {
      login: "/dental-aura/platform/auth/login",
      logout: "/dental-aura/platform/auth/logout",
    },
    clinics: {
      list: "/dental-aura/platform/clinics",
      create: "/dental-aura/platform/clinics",
      byId: (id: string) => `/dental-aura/platform/clinics/${encodeURIComponent(id)}`,
    },
    users: {
      create: "/dental-aura/platform/users",
      byId: (id: string) => `/dental-aura/platform/users/${encodeURIComponent(id)}`,
    },
  },
} as const;

export const n8nWebhookPaths = dentalAuraWebhookPaths;

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ClinicUser = {
  clinic_id: string;
  clinic_name: string;
  clinic_slug: string;
  email: string;
  id: string;
  name?: string | null;
  role: "clinic_admin" | "clinic_staff" | "dentist";
};

export type ClinicLoginResponse = {
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
  token: string;
  user: ClinicUser;
};

export type PlatformUser = {
  email: string;
  id: string;
  name?: string | null;
  role: "platform_admin";
};

export type PlatformLoginResponse = {
  admin: PlatformUser;
  token: string;
};

export type PlatformClinic = {
  active: boolean;
  city?: string | null;
  created_at?: string;
  document?: string | null;
  email?: string | null;
  id: string;
  name: string;
  phone?: string | null;
  plan: "starter" | "growth" | "enterprise";
  slug: string;
  updated_at?: string;
};

export type UpsertPlatformClinicPayload = {
  active?: boolean;
  city?: string | null;
  document?: string | null;
  email?: string | null;
  name: string;
  phone?: string | null;
  plan?: PlatformClinic["plan"];
  slug: string;
};

export type CreatePlatformUserPayload = {
  clinic_id: string;
  email: string;
  name?: string | null;
  password?: string;
  role: ClinicUser["role"];
};

export type ListResponse<T> = {
  count?: number;
  items: T[];
  page?: number;
  pageSize?: number;
  total?: number;
};
