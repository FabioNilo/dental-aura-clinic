import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getErrorMessage } from "@/lib/errors";
import {
  resolveAdminRole,
  signInClinicAdmin,
  signOutClinicAdmin,
} from "./clinic-auth-service";

type ClinicAuthContextValue = {
  isAdmin: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<boolean>;
};

const ClinicAuthContext = createContext<ClinicAuthContextValue | null>(null);

export function ClinicAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setIsAdmin(false);
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);

    try {
      const admin = await resolveAdminRole(nextSession.user);
      setIsAdmin(admin);
      return admin;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        await syncSession(existingSession);
      } catch (error) {
        console.error(getErrorMessage(error, "Falha ao carregar a sessao inicial."));
        if (active) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [syncSession]);

  const refreshRole = useCallback(async () => {
    const admin = await resolveAdminRole(user);
    setIsAdmin(admin);
    return admin;
  }, [user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);

      try {
        const { session: nextSession, user: nextUser } = await signInClinicAdmin(email, password);
        const admin = await resolveAdminRole(nextUser);

        if (!admin) {
          await signOutClinicAdmin();
          throw new Error("Sua conta nao possui acesso de administrador.");
        }

        setSession(nextSession);
        setUser(nextUser);
        setIsAdmin(true);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await signOutClinicAdmin();

      setSession(null);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      isAdmin,
      isLoading,
      session,
      user,
      signIn,
      signOut,
      refreshRole,
    }),
    [isAdmin, isLoading, refreshRole, session, signIn, signOut, user],
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
          Validando sua sessao e as permissoes de administrador.
        </p>
      </div>
    </div>
  );
}

export function RequireAdmin({ children }: { children: ReactNode }) {
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

export function AccessDeniedState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md rounded-2xl border border-destructive/20 bg-card p-8 shadow-card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold font-headline">Acesso administrativo necessario</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Esta conta nao possui a role <code>admin</code> na base de autenticacao ativa.
        </p>
      </div>
    </div>
  );
}
