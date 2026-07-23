import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Building2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePlatformAuth } from "@/features/auth/PlatformAuth";
import { getErrorMessage } from "@/lib/errors";

type LocationState = {
  from?: string;
};

const PlatformLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { admin, isLoading, session, signIn } = usePlatformAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from ?? "/platform/clinics";

  useEffect(() => {
    if (!isLoading && session && admin?.role === "platform_admin") {
      navigate(redirectTo, { replace: true });
    }
  }, [admin, isLoading, navigate, redirectTo, session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    try {
      await signIn(email.trim().toLowerCase(), password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, "Nao foi possivel iniciar a sessao de plataforma.");
      setSubmitError(message);
      toast({
        title: "Falha no login",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            <ShieldCheck className="h-4 w-4" />
            Platform admin
          </div>
          <h1 className="mt-8 max-w-xl text-5xl font-extrabold font-headline leading-tight text-foreground">
            Controle as clinicas, usuarios e planos do SaaS odontologico.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
            Esta area e separada do painel operacional das clinicas. Aqui o time interno cadastra
            tenants e vincula administradores ao PostgreSQL da aplicacao via n8n.
          </p>
        </div>

        <Card className="w-full border-border/60 shadow-card-hover">
          <CardHeader className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <CardTitle className="text-3xl font-headline">Entrar na plataforma</CardTitle>
            <CardDescription>Acesso interno para administracao multi-clinica.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="platform-email">Email</Label>
                <Input
                  autoComplete="email"
                  id="platform-email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@dental-aura.com"
                  type="email"
                  value={email}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform-password">Senha</Label>
                <Input
                  autoComplete="current-password"
                  id="platform-password"
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
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                Acessar plataforma
              </Button>
            </form>

            <Link className="mt-6 inline-flex text-sm font-medium text-primary hover:underline" to="/">
              Voltar para o site
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformLogin;
