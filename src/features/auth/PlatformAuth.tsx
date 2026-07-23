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
import { Loader2 } from "lucide-react";
import { setPlatformAuthToken } from "@/lib/api";
import { platformApi, type PlatformUser } from "@/features/integrations/dental-api";

type PlatformSession = {
  admin: PlatformUser;
  token: string;
};

type PlatformAuthContextValue = {
  admin: PlatformUser | null;
  isLoading: boolean;
  session: PlatformSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const PlatformAuthContext = createContext<PlatformAuthContextValue | null>(null);
const STORAGE_KEY = "dental-aura:platform-session";

function readStoredSession(): PlatformSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PlatformSession;
    if (!parsed?.token || parsed?.admin?.role !== "platform_admin") return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(value: PlatformSession | null) {
  if (typeof window === "undefined") return;

  if (!value) {
    window.localStorage.removeItem(STORAGE_KEY);
    setPlatformAuthToken(null);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  setPlatformAuthToken(value.token);
}

export function PlatformAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<PlatformSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback((nextSession: PlatformSession | null) => {
    setSession(nextSession);
    setIsLoading(false);
    if (nextSession?.token) {
      setPlatformAuthToken(nextSession.token);
    }
  }, []);

  useEffect(() => {
    syncSession(readStoredSession());
  }, [syncSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const result = await platformApi.login(email, password);

      if (result.admin.role !== "platform_admin") {
        throw new Error("Sua conta nao possui acesso de plataforma.");
      }

      storeSession(result);
      syncSession(result);
    } finally {
      setIsLoading(false);
    }
  }, [syncSession]);

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await platformApi.logout();
    } finally {
      storeSession(null);
      syncSession(null);
    }
  }, [syncSession]);

  const value = useMemo(
    () => ({
      admin: session?.admin ?? null,
      isLoading,
      session,
      signIn,
      signOut,
    }),
    [isLoading, session, signIn, signOut],
  );

  return <PlatformAuthContext.Provider value={value}>{children}</PlatformAuthContext.Provider>;
}

export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext);

  if (!context) {
    throw new Error("usePlatformAuth must be used within PlatformAuthProvider.");
  }

  return context;
}

export function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  const { admin, isLoading, session } = usePlatformAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || admin?.role !== "platform_admin") {
    return (
      <Navigate
        replace
        state={{ from: `${location.pathname}${location.search}` }}
        to="/platform/login"
      />
    );
  }

  return <>{children}</>;
}
