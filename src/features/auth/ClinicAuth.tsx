import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { setClinicAuthToken } from "@/lib/api";
import type { ClinicUser } from "@/features/integrations/dental-api";
import { signInClinicAdmin, signOutClinicAdmin } from "./clinic-auth-service";

type ClinicSession = {
  clinic: {
    id: string;
    name: string;
    slug: string;
  };
  token: string;
  user: ClinicUser;
};

type StoredClinicSession = ClinicSession & {
  isAdmin: boolean;
};

type ClinicAuthContextValue = {
  clinic: ClinicSession["clinic"] | null;
  isAdmin: boolean;
  isLoading: boolean;
  session: ClinicSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  user: ClinicUser | null;
};

const ClinicAuthContext = createContext<ClinicAuthContextValue | null>(null);
const STORAGE_KEY = "dental-aura:clinic-session";

function readStoredSession(): StoredClinicSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredClinicSession;
    if (!parsed?.token || !parsed?.user?.id || !parsed?.clinic?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(value: StoredClinicSession | null) {
  if (typeof window === "undefined") return;

  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    setClinicAuthToken(null);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  setClinicAuthToken(value.token);
}

export function ClinicAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClinicSession | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback(async (nextSession: StoredClinicSession | null) => {
    setSession(
      nextSession
        ? {
            clinic: nextSession.clinic,
            token: nextSession.token,
            user: nextSession.user,
          }
        : null,
    );
    setIsAdmin(Boolean(nextSession?.isAdmin));
    setIsLoading(false);
    if (nextSession?.token) {
      setClinicAuthToken(nextSession.token);
    }
    return Boolean(nextSession?.isAdmin);
  }, []);

  useEffect(() => {
    void syncSession(readStoredSession());
  }, [syncSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const result = await signInClinicAdmin(email, password);

        if (!result.isAdmin) {
          throw new Error("Sua conta nao possui acesso de administrador da clinica.");
        }

        const nextSession: StoredClinicSession = {
          clinic: result.clinic,
          isAdmin: true,
          token: result.token,
          user: result.user,
        };

        storeSession(nextSession);
        await syncSession(nextSession);
      } finally {
        setIsLoading(false);
      }
    },
    [syncSession],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await signOutClinicAdmin();
      storeSession(null);
      await syncSession(null);
    } finally {
      setIsLoading(false);
    }
  }, [syncSession]);

  const value = useMemo(
    () => ({
      clinic: session?.clinic ?? null,
      isAdmin,
      isLoading,
      session,
      signIn,
      signOut,
      user: session?.user ?? null,
    }),
    [isAdmin, isLoading, session, signIn, signOut],
  );

  return <ClinicAuthContext.Provider value={value}>{children}</ClinicAuthContext.Provider>;
}

export function useClinicAuth() {
  const context = useContext(ClinicAuthContext);

  if (!context) {
    throw new Error("useClinicAuth must be used within ClinicAuthProvider.");
  }

  return context;
}

function AuthLoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="bg-card border border-border/60 rounded-2xl shadow-card px-8 py-10 text-center max-w-sm w-full">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-primary">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <h1 className="text-xl font-bold font-headline">Carregando painel</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Validando sua sessao e a clinica vinculada.
        </p>
      </div>
    </div>
  );
}

export function RequireClinicAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading, session } = useClinicAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoadingState />;
  }

  if (!session || !isAdmin) {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/admin/login"
      />
    );
  }

  return <>{children}</>;
}

export const RequireAdmin = RequireClinicAdmin;

export function AccessDeniedState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-headline">Acesso administrativo necessario</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta conta nao possui permissao administrativa para a clinica selecionada.
        </p>
      </div>
    </div>
  );
}
