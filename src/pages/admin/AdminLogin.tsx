import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinicAuth } from "@/features/auth/ClinicAuth";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

type LocationState = {
  from?: string;
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading, session, signIn } = useClinicAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from ?? "/admin";

  useEffect(() => {
    if (!isLoading && session && isAdmin) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAdmin, isLoading, navigate, redirectTo, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await signIn(email, password);

      toast({
        title: "Acesso liberado",
        description: "Sessão administrativa iniciada com sucesso.",
      });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getErrorMessage(
        error,
        "Não foi possível iniciar a sessão administrativa.",
      );

      setSubmitError(message);
      toast({
        title: "Falha no login",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/40 px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[2rem] border border-border/60 bg-card/80 p-10 shadow-card backdrop-blur lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <ShieldCheck className="h-4 w-4" />
            Painel odontológico
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-extrabold font-headline leading-tight text-foreground">
            Operação da clínica com entrada por IA e validação humana.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Acesso restrito ao time administrativo para revisar solicitações, confirmar agendamentos e acompanhar a operação da agenda.
          </p>
          <div className="mt-10 grid gap-4">
            <div className="rounded-2xl border border-border/60 bg-background/90 p-5">
              <p className="text-sm font-semibold text-foreground">Fluxo do MVP</p>
              <p className="mt-2 text-sm text-muted-foreground">
                WhatsApp ou n8n cria a solicitação, o admin valida os dados e só então nasce o agendamento oficial.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/90 p-5">
              <p className="text-sm font-semibold text-foreground">Segurança</p>
              <p className="mt-2 text-sm text-muted-foreground">
                O painel exige sessão no Supabase Auth e permissão <code>admin</code> em <code>public.user_roles</code>.
              </p>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-xl border-border/60 shadow-card-hover">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <CardTitle className="text-3xl font-headline">Entrar no painel admin</CardTitle>
            <CardDescription>
              Use sua conta do Supabase Auth com permissão administrativa para acessar o MVP da clínica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="admin-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@clinica.com"
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  autoComplete="current-password"
                  id="admin-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  type="password"
                  value={password}
                />
              </div>

              {submitError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {submitError}
                </div>
              ) : null}

              <Button className="w-full font-semibold" disabled={isLoading} size="lg" type="submit">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Acessar painel
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Se esta conta não entrar, verifique se o usuário possui a role <code>admin</code> na tabela <code>user_roles</code>.
            </p>

            <Link className="mt-6 inline-flex text-sm font-medium text-primary hover:underline" to="/">
              Voltar para o site institucional
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
