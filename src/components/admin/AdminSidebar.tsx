import {
  Bot,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  Settings2,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClinicAuth } from "@/features/auth/ClinicAuth";

const navItems = [
  { label: "Visao geral", icon: LayoutDashboard, href: "/admin" },
  { label: "Agenda", icon: CalendarCheck2, href: "/admin/agenda" },
  { label: "Solicitacoes", icon: Bot, href: "/admin/solicitacoes" },
  { label: "Pacientes", icon: Users, href: "/admin/pacientes" },
  { label: "Profissionais", icon: Stethoscope, href: "/admin/profissionais" },
  { label: "Servicos", icon: Settings2, href: "/admin/servicos" },
  { label: "Financeiro", icon: Wallet, href: "/admin/financeiro" },
];

const upcomingModules = [
  { label: "Prontuario", icon: Stethoscope },
];

const AdminSidebar = () => {
  const location = useLocation();
  const { clinic, signOut } = useClinicAuth();

  return (
    <aside className="border-b border-border/60 bg-background/85 backdrop-blur xl:fixed xl:inset-y-0 xl:left-0 xl:z-40 xl:w-72 xl:border-b-0 xl:border-r">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:h-full xl:px-6 xl:py-6">
        <div className="px-1 xl:mb-6 xl:px-2">
          <h1 className="text-xl font-black font-headline text-primary">Dental Aura</h1>
          <p className="text-xs font-medium text-muted-foreground">
            {clinic?.name ?? "Painel da clinica"}
          </p>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-1 xl:flex-col xl:gap-1 xl:overflow-visible xl:px-0 xl:pb-0">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/admin" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-headline transition-colors xl:mx-2 xl:rounded-lg xl:border-transparent",
                  isActive
                    ? "border-primary/10 bg-card font-bold text-primary shadow-card"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/80 hover:text-primary xl:bg-transparent",
                )}
                to={item.href}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="hidden xl:mx-4 xl:mt-8 xl:block xl:rounded-2xl xl:border xl:border-border/60 xl:bg-card/70 xl:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Em breve
            </p>
            <div className="mt-4 space-y-3">
              {upcomingModules.map((item) => (
                <div key={item.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex flex-col gap-3 border-t border-border/50 pt-3 xl:mt-auto xl:border-t-0 xl:px-4 xl:pt-0">
          <Link to="/admin/solicitacoes">
            <Button className="w-full rounded-xl font-semibold shadow-primary-glow" size="lg">
              Revisar solicitacoes IA
            </Button>
          </Link>
          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-colors hover:bg-destructive/5 hover:text-destructive"
            onClick={() => void signOut()}
            type="button"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-headline text-sm">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
