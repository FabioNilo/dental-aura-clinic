import { Link } from "react-router-dom";
import {
  Bot,
  Calendar,
  CheckCircle,
  ClipboardList,
  Clock,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  useAtividadesRecentes,
  useOverviewChartData,
  useOverviewKpis,
  useProximosAgendamentos,
} from "@/hooks/useOverviewData";

const activityIcons: Record<string, { icon: typeof CheckCircle; iconBg: string; iconColor: string }> = {
  agendamento_confirmado: {
    icon: CheckCircle,
    iconBg: "bg-success-light",
    iconColor: "text-success",
  },
  solicitacao_cancelada: {
    icon: Clock,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
  solicitacao_remarcacao: {
    icon: ClipboardList,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
};

const defaultActivityIcon = {
  icon: Calendar,
  iconBg: "bg-muted",
  iconColor: "text-muted-foreground",
};

const quickActions = [
  {
    bg: "bg-accent",
    color: "text-primary",
    cta: "/admin/solicitacoes",
    icon: ClipboardList,
    label: "Abrir fila de solicitacoes",
    sub: "Revisar entradas do n8n e do time",
  },
  {
    bg: "bg-success-light",
    color: "text-success",
    cta: "/admin/solicitacoes",
    icon: CheckCircle,
    label: "Confirmar proximas entradas",
    sub: "Transformar pedidos em agendamentos",
  },
  {
    bg: "bg-secondary",
    color: "text-muted-foreground",
    cta: "/admin",
    icon: Users,
    label: "Acompanhar capacidade",
    sub: "Monitorar carga operacional do dia",
  },
];

const Overview = () => {
  const { data: kpis, isLoading: loadingKpis } = useOverviewKpis();
  const { data: chartData, isLoading: loadingChart } = useOverviewChartData();
  const { data: atividades, isLoading: loadingAtividades } = useAtividadesRecentes();
  const { data: proximos, isLoading: loadingProximos } = useProximosAgendamentos();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold font-headline text-foreground tracking-tight">
          Operacao da clinica
        </h1>
        <p className="mt-2 text-muted-foreground">
          Acompanhe o volume da entrada por IA, o que ja foi confirmado e o que ainda depende de decisao humana.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-4">
        <KPICard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-accent"
          iconColor="text-primary"
          label="Pacientes ativos"
          value={loadingKpis ? "..." : (kpis?.total_pacientes ?? 0).toLocaleString("pt-BR")}
        />
        <KPICard
          badge={<span className="rounded-full bg-muted px-2 py-1 text-sm font-bold text-muted-foreground">Hoje</span>}
          icon={<ClipboardList className="h-5 w-5" />}
          iconBg="bg-surface-high"
          iconColor="text-muted-foreground"
          label="Solicitacoes recebidas"
          value={loadingKpis ? "..." : String(kpis?.solicitacoes_hoje ?? 0).padStart(2, "0")}
        />
        <div className="rounded-xl bg-gradient-to-br from-primary to-primary-glow p-6 text-primary-foreground shadow-primary-glow">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Bot className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-sm font-bold">IA + n8n</span>
          </div>
          <p className="mb-1 text-sm font-medium text-primary-foreground/70">Confirmacoes hoje</p>
          <h3 className="text-2xl font-bold font-headline">
            {loadingKpis ? "..." : String(kpis?.confirmacoes_ia_hoje ?? 0).padStart(2, "0")}
          </h3>
        </div>
        <div className="rounded-xl border border-destructive/10 bg-destructive/10 p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Clock className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-card/50 px-2 py-1 text-sm font-bold text-destructive">Pendente</span>
          </div>
          <p className="mb-1 text-sm font-medium text-destructive/80">Fila operacional</p>
          <h3 className="text-2xl font-bold font-headline text-destructive">
            {loadingKpis ? "..." : String(kpis?.pendencias_operacionais ?? 0).padStart(2, "0")}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="rounded-[28px] border border-border/50 bg-card p-6 shadow-card sm:p-7 xl:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold font-headline">Entradas da semana</h4>
                <p className="text-sm text-muted-foreground">Solicitacoes criadas nos ultimos 7 dias</p>
              </div>
            </div>
            <div className="h-64">
              {loadingChart ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart barCategoryGap="20%" data={chartData ?? []}>
                    <XAxis
                      axisLine={false}
                      dataKey="day"
                      tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {(chartData ?? []).map((entry, index) => (
                        <Cell
                          fill={index === (chartData?.length ?? 1) - 1 ? "hsl(var(--primary-container))" : "hsl(var(--accent))"}
                          key={`${entry.day}-${index}`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/50 bg-card p-6 shadow-card sm:p-7 xl:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-lg font-bold font-headline">Atividade recente</h4>
            </div>
            {loadingAtividades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !atividades || atividades.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma atividade recente.</p>
            ) : (
              <div className="space-y-6">
                {atividades.map((activity, index) => {
                  const config = activityIcons[activity.tipo] ?? defaultActivityIcon;
                  const Icon = config.icon;
                  const isLast = index === atividades.length - 1;

                  return (
                    <div className="flex gap-4" key={activity.id}>
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.iconBg} ${config.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {!isLast ? <div className="my-2 w-px flex-1 bg-border" /> : null}
                      </div>
                      <div className={!isLast ? "pb-6" : ""}>
                        <p className="text-sm font-bold">{activity.titulo}</p>
                        {activity.descricao ? (
                          <p className="text-sm text-muted-foreground">{activity.descricao}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[28px] bg-surface-high p-6 shadow-card sm:p-7 xl:p-8">
            <h4 className="mb-6 text-lg font-bold font-headline">Acoes rapidas</h4>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((item) => (
                <Link key={item.label} to={item.cta}>
                  <button className="group flex w-full items-center gap-4 rounded-2xl bg-card p-4 transition-all duration-300 hover:bg-primary sm:p-5">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} ${item.color} group-hover:bg-primary-foreground/20 group-hover:text-primary-foreground`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold group-hover:text-primary-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">
                        {item.sub}
                      </p>
                    </div>
                  </button>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/50 bg-card p-6 shadow-card sm:p-7 xl:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h4 className="text-lg font-bold font-headline">Proximos agendamentos</h4>
              <Link to="/admin/solicitacoes">
                <Button size="sm" variant="outline">
                  Abrir fila
                </Button>
              </Link>
            </div>
            {loadingProximos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !proximos || proximos.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento proximo.</p>
            ) : (
              <div className="space-y-4">
                {proximos.map((appointment, index) => (
                  <div
                    className={`flex items-center gap-4 border-l-4 pl-4 py-1 ${index === 0 ? "border-primary" : "border-muted-foreground"}`}
                    key={appointment.id}
                  >
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${index === 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {appointment.time}
                      </p>
                      <p className="text-sm font-bold">{appointment.name}</p>
                      <p className="text-xs text-muted-foreground">{appointment.detail}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                      {appointment.initials}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-primary/10 bg-card p-6 shadow-card">
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-primary/5" />
            <div className="mb-3 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Leitura do MVP</span>
            </div>
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              "O gargalo atual nao e capturar demanda, e sim validar rapidamente cada entrada. Priorize a fila de solicitacoes antes de expandir a agenda."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({
  badge,
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  badge?: React.ReactNode;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) => (
  <div className="rounded-[28px] border border-border/50 bg-card p-6 shadow-card sm:p-7">
    <div className="mb-4 flex items-center justify-between">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>{icon}</div>
      {badge}
    </div>
    <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
    <h3 className="text-2xl font-bold font-headline">{value}</h3>
  </div>
);

export default Overview;
