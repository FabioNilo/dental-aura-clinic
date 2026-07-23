import { CalendarClock, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useClinicAuth } from "@/features/auth/ClinicAuth";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Visao geral",
    subtitle: "Resumo operacional do funil de atendimento da clinica.",
  },
  "/admin/agenda": {
    title: "Agenda",
    subtitle: "Compromissos do dia, carga operacional e atualizacao de status.",
  },
  "/admin/solicitacoes": {
    title: "Solicitacoes",
    subtitle: "Entradas vindas do atendimento virtual, site e operacao manual.",
  },
  "/admin/pacientes": {
    title: "Pacientes",
    subtitle: "Cadastro base de contatos, contexto e historico operacional.",
  },
  "/admin/profissionais": {
    title: "Profissionais",
    subtitle: "Cadastro base do time clinico usado nas confirmacoes e na agenda.",
  },
  "/admin/servicos": {
    title: "Servicos",
    subtitle: "Cadastro base de procedimentos usados pela operacao da clinica.",
  },
};

const AdminTopbar = () => {
  const location = useLocation();
  const { clinic, user } = useClinicAuth();
  
  // Detectar se é rota de paciente detalhes
  const isPacienteDetalhes = location.pathname.match(/^\/admin\/pacientes\/[^/]+$/);
  
  const meta = isPacienteDetalhes 
    ? {
        title: "Detalhes do Paciente",
        subtitle: "Prontuário completo, histórico de tratamentos e consultas.",
      }
    : pageMeta[location.pathname] ?? pageMeta["/admin"];
  const initials =
    (user?.email ?? "AD")
      .split("@")[0]
      .split(/[.\-_]/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "AD";

  return (
    <header className="sticky top-3 z-30 px-4 pt-3 sm:px-6 lg:px-8 xl:top-4 xl:px-10 2xl:px-12">
      <div className="glass-panel flex flex-col gap-4 rounded-[28px] border border-border/60 bg-background/85 px-4 py-4 shadow-card backdrop-blur lg:flex-row lg:items-center lg:justify-between lg:px-6 xl:px-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {clinic?.name ?? "Painel odontologico"}
            </p>
            <h2 className="mt-1 text-lg font-bold font-headline text-foreground sm:text-xl">{meta.title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-card lg:min-w-[280px] lg:justify-end">
          <div className="min-w-0 text-left lg:text-right">
            <p className="flex items-center gap-2 text-sm font-bold leading-tight text-foreground lg:justify-end">
              <ShieldCheck className="h-4 w-4 text-success" />
              Admin da clinica
            </p>
            <p className="truncate text-[11px] font-medium text-muted-foreground">{user?.email ?? "Sessao ativa"}</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
