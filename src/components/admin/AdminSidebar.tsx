import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Settings2,
  Calendar,
  Bot,
  HeadphonesIcon,
  Bell,
  Plus,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Visão Geral", icon: LayoutDashboard, href: "/admin" },
  { label: "Pacientes", icon: Users, href: "/admin/pacientes" },
  { label: "Profissionais", icon: Stethoscope, href: "/admin/profissionais" },
  { label: "Serviços", icon: Settings2, href: "/admin/servicos" },
  { label: "Agendamentos", icon: Calendar, href: "/admin/agendamentos" },
  { label: "Conversas da IA", icon: Bot, href: "/admin/conversas-ia" },
  { label: "Encaminhamento Humano", icon: HeadphonesIcon, href: "/admin/encaminhamento" },
  { label: "Notificações", icon: Bell, href: "/admin/notificacoes" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-muted/50 flex flex-col py-6 z-50">
      <div className="px-6 mb-10">
        <h1 className="text-xl font-black text-primary font-headline">Clinical Precision</h1>
        <p className="text-xs font-medium text-muted-foreground">Painel Administrativo</p>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors font-headline text-sm",
                isActive
                  ? "text-primary font-bold bg-card shadow-card"
                  : "text-muted-foreground hover:text-primary hover:bg-muted/80"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 mt-auto space-y-1">
        <button className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground py-3 rounded-xl font-bold text-sm mb-6 shadow-primary-glow hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Agendamento
        </button>
        <Link
          to="/admin/configuracoes"
          className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-primary transition-colors"
        >
          <Settings className="h-5 w-5" />
          <span className="font-headline text-sm">Configurações</span>
        </Link>
        <button className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors w-full">
          <LogOut className="h-5 w-5" />
          <span className="font-headline text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
