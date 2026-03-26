import {
  Users,
  Calendar,
  Bot,
  AlertTriangle,
  UserPlus,
  FileText,
  Package,
  CheckCircle,
  Sparkles,
  Clock,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  useTotalPacientes,
  useConsultasHoje,
  useAgendamentosIA,
  useEncaminhamentosUrgentes,
  useChartData,
  useAtividadesRecentes,
  useProximosAgendamentos,
} from "@/hooks/useOverviewData";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const activityIcons: Record<string, { icon: typeof CheckCircle; iconBg: string; iconColor: string }> = {
  consulta_finalizada: { icon: CheckCircle, iconBg: "bg-success-light", iconColor: "text-success" },
  agendamento_ia: { icon: Bot, iconBg: "bg-accent", iconColor: "text-primary" },
  cancelamento: { icon: XCircle, iconBg: "bg-destructive/10", iconColor: "text-destructive" },
  novo_agendamento: { icon: Clock, iconBg: "bg-accent", iconColor: "text-primary" },
};

const defaultActivityIcon = { icon: Calendar, iconBg: "bg-muted", iconColor: "text-muted-foreground" };

const quickActions = [
  { icon: UserPlus, bg: "bg-accent", color: "text-primary", label: "Cadastrar Paciente", sub: "Adicionar novo registro" },
  { icon: FileText, bg: "bg-secondary", color: "text-muted-foreground", label: "Gerar Faturamento", sub: "Relatório financeiro do dia" },
  { icon: Package, bg: "bg-success-light", color: "text-success", label: "Estoque Dental", sub: "Verificar insumos" },
];

const Overview = () => {
  const { data: totalPacientes, isLoading: loadingPacientes } = useTotalPacientes();
  const { data: consultasHoje, isLoading: loadingConsultas } = useConsultasHoje();
  const { data: agendamentosIA, isLoading: loadingIA } = useAgendamentosIA();
  const { data: urgentes, isLoading: loadingUrgentes } = useEncaminhamentosUrgentes();
  const { data: chartData, isLoading: loadingChart } = useChartData();
  const { data: atividades, isLoading: loadingAtividades } = useAtividadesRecentes();
  const { data: proximos, isLoading: loadingProximos } = useProximosAgendamentos();

  return (
    <>
      {/* Page Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold font-headline text-foreground tracking-tight">
          Visão Geral
        </h2>
        <p className="text-muted-foreground font-medium mt-1">
          Bem-vindo de volta. Aqui está o que está acontecendo na clínica hoje.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard
          icon={<Users className="h-5 w-5" />}
          iconBg="bg-accent"
          iconColor="text-primary"
          label="Total de Pacientes"
          value={loadingPacientes ? "..." : (totalPacientes ?? 0).toLocaleString("pt-BR")}
        />
        <KPICard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-surface-high"
          iconColor="text-muted-foreground"
          badge={<span className="text-muted-foreground font-bold text-sm bg-muted px-2 py-1 rounded-full">Hoje</span>}
          label="Consultas de Hoje"
          value={loadingConsultas ? "..." : String(consultasHoje ?? 0).padStart(2, "0")}
        />
        <div className="bg-gradient-to-br from-primary to-primary-glow p-6 rounded-xl shadow-primary-glow text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-bold text-sm bg-white/10 px-2 py-1 rounded-full">IA Ativa</span>
          </div>
          <p className="text-primary-foreground/70 text-sm font-medium mb-1">Novos Agendamentos IA</p>
          <h3 className="text-2xl font-bold font-headline">
            {loadingIA ? "..." : String(agendamentosIA ?? 0).padStart(2, "0")}
          </h3>
        </div>
        <div className="bg-destructive/10 p-6 rounded-xl shadow-card border border-destructive/5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-destructive font-bold text-sm bg-card/50 px-2 py-1 rounded-full">Urgente</span>
          </div>
          <p className="text-destructive/80 text-sm font-medium mb-1">Encaminhamentos</p>
          <h3 className="text-2xl font-bold font-headline text-destructive">
            {loadingUrgentes ? "..." : String(urgentes ?? 0).padStart(2, "0")}
          </h3>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart */}
          <div className="bg-card rounded-xl p-8 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-bold font-headline">Tendência de Agendamentos</h4>
                <p className="text-sm text-muted-foreground">Volume dos últimos 7 dias</p>
              </div>
            </div>
            <div className="h-64">
              {loadingChart ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData ?? []} barCategoryGap="20%">
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {(chartData ?? []).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "hsl(var(--primary-container))"
                              : "hsl(var(--accent))"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl p-8 shadow-card border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-bold font-headline">Atividade Recente</h4>
            </div>
            {loadingAtividades ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !atividades || atividades.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma atividade recente.
              </p>
            ) : (
              <div className="space-y-6">
                {atividades.map((a, i) => {
                  const config = activityIcons[a.tipo] ?? defaultActivityIcon;
                  const Icon = config.icon;
                  const isLast = i === atividades.length - 1;
                  return (
                    <div key={a.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center ${config.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border my-2" />}
                      </div>
                      <div className={!isLast ? "pb-6" : ""}>
                        <p className="text-sm font-bold">{a.titulo}</p>
                        {a.descricao && <p className="text-sm text-muted-foreground">{a.descricao}</p>}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3 */}
        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-surface-high rounded-xl p-8 shadow-card">
            <h4 className="text-lg font-bold font-headline mb-6">Ações Rápidas</h4>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((qa, i) => (
                <button
                  key={i}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl hover:bg-primary group transition-all duration-300"
                >
                  <div className={`w-10 h-10 rounded-lg ${qa.bg} group-hover:bg-primary-foreground/20 flex items-center justify-center ${qa.color} group-hover:text-primary-foreground`}>
                    <qa.icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold group-hover:text-primary-foreground">{qa.label}</p>
                    <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{qa.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Next Appointments */}
          <div className="bg-card rounded-xl p-8 shadow-card border border-border/50">
            <h4 className="text-lg font-bold font-headline mb-6">Próximos Agendamentos</h4>
            {loadingProximos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !proximos || proximos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum agendamento próximo.
              </p>
            ) : (
              <div className="space-y-4">
                {proximos.map((ap, i) => (
                  <div key={ap.id} className={`flex items-center gap-4 border-l-4 ${i === 0 ? "border-primary" : "border-muted-foreground"} pl-4 py-1`}>
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>{ap.time}</p>
                      <p className="text-sm font-bold">{ap.name}</p>
                      <p className="text-xs text-muted-foreground">{ap.detail}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary text-xs font-bold">
                      {ap.initials}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="w-full mt-6 py-3 text-sm font-bold border border-border rounded-lg hover:bg-muted transition-colors">
              Ver Agenda Completa
            </button>
          </div>

          {/* AI Insight */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-primary/10 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Insight</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              "A procura por Clareamento Dental subiu 15% esta semana. Considere criar uma campanha
              promocional para pacientes recorrentes."
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

const KPICard = ({
  icon, iconBg, iconColor, badge, label, value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badge?: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="bg-card p-6 rounded-xl shadow-card border border-border/50">
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center ${iconColor}`}>
        {icon}
      </div>
      {badge}
    </div>
    <p className="text-muted-foreground text-sm font-medium mb-1">{label}</p>
    <h3 className="text-2xl font-bold font-headline">{value}</h3>
  </div>
);

export default Overview;
