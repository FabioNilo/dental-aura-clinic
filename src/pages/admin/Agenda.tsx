import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  History,
  Loader2,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { usePacienteOperacaoContext } from "@/features/pacientes/api";
import { formatClinicDateTime, formatClinicTimeRange, getClinicNowDateValue } from "@/lib/datetime";
import {
  AGENDAMENTO_STATUS_OPTIONS,
  type AgendamentoStatus,
  useAgendamentosAdminQuery,
  useUpdateAgendamentoStatus,
} from "@/features/agendamentos/api";
import { useProfissionaisOptions, useSolicitacaoVinculadaQuery } from "@/features/solicitacoes/api";

const statusMeta: Record<
  AgendamentoStatus,
  { badgeClassName: string; label: string }
> = {
  cancelado: {
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    label: "Cancelado",
  },
  concluido: {
    badgeClassName: "border-success/20 bg-success-light text-success",
    label: "Concluido",
  },
  confirmado: {
    badgeClassName: "border-primary/20 bg-accent text-primary",
    label: "Confirmado",
  },
  faltou: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    label: "Faltou",
  },
  remarcado: {
    badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
    label: "Remarcado",
  },
};

const solicitacaoStatusMeta: Record<string, { badgeClassName: string; label: string }> = {
  aguardando_confirmacao: {
    badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
    label: "Aguardando confirmacao",
  },
  agendado: {
    badgeClassName: "border-primary/20 bg-accent text-primary",
    label: "Agendado",
  },
  cancelado: {
    badgeClassName: "border-destructive/20 bg-destructive/10 text-destructive",
    label: "Cancelado",
  },
  cancelamento_solicitado: {
    badgeClassName: "border-rose-200 bg-rose-100 text-rose-700",
    label: "Cancelamento solicitado",
  },
  em_triagem: {
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    label: "Em triagem",
  },
  novo: {
    badgeClassName: "border-primary/20 bg-primary/10 text-primary",
    label: "Novo",
  },
  remarcacao_solicitada: {
    badgeClassName: "border-sky-200 bg-sky-100 text-sky-700",
    label: "Remarcacao solicitada",
  },
};

const Agenda = () => {
  const [searchParams] = useSearchParams();
  const targetAgendamentoId = searchParams.get("agendamentoId");
  const initialDate = searchParams.get("date") ?? getClinicNowDateValue();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState(initialDate);
  const [status, setStatus] = useState<AgendamentoStatus | "all">("all");
  const [profissionalId, setProfissionalId] = useState("");
  const [novoStatus, setNovoStatus] = useState<AgendamentoStatus>("confirmado");
  const [observacoes, setObservacoes] = useState("");

  const agendamentosQuery = useAgendamentosAdminQuery({
    date,
    profissionalId,
    status,
  });
  const profissionaisQuery = useProfissionaisOptions();
  const updateStatusMutation = useUpdateAgendamentoStatus();
  const agendamentos = useMemo(() => agendamentosQuery.data ?? [], [agendamentosQuery.data]);
  const selected = useMemo(
    () => agendamentos.find((item) => item.id === selectedId) ?? agendamentos[0] ?? null,
    [agendamentos, selectedId],
  );
  const solicitacaoVinculadaQuery = useSolicitacaoVinculadaQuery(selected?.id ?? null);
  const pacienteContextQuery = usePacienteOperacaoContext({
    enabled: Boolean(selected?.paciente_id),
    pacienteId: selected?.paciente_id ?? null,
  });

  useEffect(() => {
    if (targetAgendamentoId && agendamentos.some((item) => item.id === targetAgendamentoId)) {
      setSelectedId(targetAgendamentoId);
      return;
    }

    if (!selectedId && agendamentos.length > 0) {
      setSelectedId(agendamentos[0].id);
    }
  }, [agendamentos, selectedId, targetAgendamentoId]);

  useEffect(() => {
    if (selected) {
      setNovoStatus(selected.status as AgendamentoStatus);
      setObservacoes(selected.observacoes ?? "");
    }
  }, [selected?.id, selected?.observacoes, selected?.status]);

  const resumo = {
    cancelados: agendamentos.filter((item) => item.status === "cancelado").length,
    confirmados: agendamentos.filter((item) => item.status === "confirmado").length,
    concluidos: agendamentos.filter((item) => item.status === "concluido").length,
    total: agendamentos.length,
  };

  const handleSaveStatus = async () => {
    if (!selected) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: selected.id,
        observacoes: observacoes.trim() || null,
        status: novoStatus,
      });

      toast({
        title: "Agenda atualizada",
        description: `Status de ${selected.paciente_nome} atualizado para ${statusMeta[novoStatus].label.toLowerCase()}.`,
      });

      await agendamentosQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o agendamento.";

      toast({
        title: "Falha ao atualizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-foreground">Agenda operacional</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Veja os compromissos do dia, filtre por profissional e atualize o status do atendimento sem sair do painel.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
            {resumo.total} no dia
          </Badge>
          <Badge className="border-success/20 bg-success-light text-success" variant="outline">
            {resumo.confirmados} confirmados
          </Badge>
        </div>
      </section>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.12fr)_minmax(470px,0.88fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Compromissos do dia</CardTitle>
                <CardDescription>
                  Filtre a agenda para acompanhar carga, andamento e excecoes operacionais.
                </CardDescription>
              </div>
              <Button onClick={() => void agendamentosQuery.refetch()} type="button" variant="outline">
                <RefreshCcw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="agenda-date-filter">Data</Label>
                <Input
                  id="agenda-date-filter"
                  onChange={(event) => setDate(event.target.value)}
                  type="date"
                  value={date}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-profissional-filter">Profissional</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="agenda-profissional-filter"
                  onChange={(event) => setProfissionalId(event.target.value)}
                  value={profissionalId}
                >
                  <option value="">Todos</option>
                  {(profissionaisQuery.data ?? []).map((profissional) => (
                    <option key={profissional.id} value={profissional.id}>
                      {profissional.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-status-filter">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="agenda-status-filter"
                  onChange={(event) => setStatus(event.target.value as AgendamentoStatus | "all")}
                  value={status}
                >
                  <option value="all">Todos</option>
                  {AGENDAMENTO_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {statusMeta[option].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {agendamentosQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando agenda...
              </div>
            ) : agendamentos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum agendamento encontrado para os filtros escolhidos.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horario</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Servico</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agendamentos.map((agendamento) => (
                      <TableRow
                        className={agendamento.id === selected?.id ? "bg-accent/40" : ""}
                        key={agendamento.id}
                        onClick={() => setSelectedId(agendamento.id)}
                      >
                        <TableCell className="font-semibold">
                          {formatClinicTimeRange(agendamento.data_hora, agendamento.duracao_minutos)}
                        </TableCell>
                        <TableCell>{agendamento.paciente_nome}</TableCell>
                        <TableCell>{agendamento.profissional_nome}</TableCell>
                        <TableCell>{agendamento.servico_nome}</TableCell>
                        <TableCell>
                          <Badge className={statusMeta[agendamento.status as AgendamentoStatus].badgeClassName} variant="outline">
                            {statusMeta[agendamento.status as AgendamentoStatus].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card 2xl:sticky 2xl:top-32">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">Detalhe do agendamento</CardTitle>
            <CardDescription>
              Veja o compromisso selecionado e atualize o status conforme a operacao do dia.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!selected ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Selecione um agendamento na lista para continuar.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {formatClinicDateTime(selected.data_hora)}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold font-headline">{selected.paciente_nome}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.servico_nome} com {selected.profissional_nome}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {solicitacaoVinculadaQuery.data ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link to={`/admin/solicitacoes?solicitacaoId=${solicitacaoVinculadaQuery.data.id}`}>
                          Abrir solicitacao
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Badge className={statusMeta[selected.status as AgendamentoStatus].badgeClassName} variant="outline">
                      {statusMeta[selected.status as AgendamentoStatus].label}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock
                    icon={Clock3}
                    label="Faixa horaria"
                    value={formatClinicTimeRange(selected.data_hora, selected.duracao_minutos)}
                  />
                  <InfoBlock icon={CalendarClock} label="Origem" value={selected.origem} />
                  <InfoBlock label="Criado em" value={formatClinicDateTime(selected.created_at)} />
                  <InfoBlock label="Atualizado em" value={formatClinicDateTime(selected.updated_at)} />
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    Contexto da solicitacao
                  </p>
                  {solicitacaoVinculadaQuery.isLoading ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando solicitacao vinculada...
                    </div>
                  ) : solicitacaoVinculadaQuery.data ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {solicitacaoVinculadaQuery.data.codigo_externo}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {solicitacaoVinculadaQuery.data.procedimento_nome} · entrada via{" "}
                            {solicitacaoVinculadaQuery.data.origem}/{solicitacaoVinculadaQuery.data.canal_origem}
                          </p>
                        </div>
                        <Badge
                          className={
                            (solicitacaoStatusMeta[solicitacaoVinculadaQuery.data.status] ?? solicitacaoStatusMeta.agendado)
                              .badgeClassName
                          }
                          variant="outline"
                        >
                          {(solicitacaoStatusMeta[solicitacaoVinculadaQuery.data.status] ?? solicitacaoStatusMeta.agendado)
                            .label}
                        </Badge>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoBlock
                          label="Preferencia inicial"
                          value={`${solicitacaoVinculadaQuery.data.dia_desejado ?? "Sem dia"} · ${
                            solicitacaoVinculadaQuery.data.turno_desejado ?? "Sem turno"
                          }`}
                        />
                        <InfoBlock
                          label="Confirmado em"
                          value={formatClinicDateTime(solicitacaoVinculadaQuery.data.data_hora_confirmada)}
                        />
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                        {solicitacaoVinculadaQuery.data.observacoes_cliente ?? "Sem observacoes da solicitacao."}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Este agendamento ainda nao tem uma solicitacao operacional vinculada.
                    </div>
                  )}
                </div>

                <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserRound className="h-4 w-4 text-primary" />
                    Historico recente do paciente
                  </p>
                  {pacienteContextQuery.isLoading ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando historico do paciente...
                    </div>
                  ) : pacienteContextQuery.data?.paciente ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <History className="h-4 w-4 text-primary" />
                          Agendamentos
                        </p>
                        {pacienteContextQuery.data.recentesAgendamentos.filter((item) => item.id !== selected.id).length ===
                        0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum outro agendamento recente encontrado.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {pacienteContextQuery.data.recentesAgendamentos
                              .filter((item) => item.id !== selected.id)
                              .slice(0, 4)
                              .map((item) => (
                                <div className="rounded-xl border border-border/60 bg-card px-3 py-3" key={item.id}>
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-foreground">{item.servico_nome}</p>
                                    <Badge className="border-border bg-background text-muted-foreground" variant="outline">
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatClinicDateTime(item.data_hora)} · {item.profissional_nome}
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                        <p className="text-sm font-semibold text-foreground">Solicitacoes</p>
                        {pacienteContextQuery.data.recentesSolicitacoes.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhuma solicitacao recente associada a este paciente.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {pacienteContextQuery.data.recentesSolicitacoes.slice(0, 4).map((item) => (
                              <div className="rounded-xl border border-border/60 bg-card px-3 py-3" key={item.id}>
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-semibold text-foreground">{item.codigo_externo}</p>
                                  <Badge
                                    className={
                                      (solicitacaoStatusMeta[item.status] ?? solicitacaoStatusMeta.agendado)
                                        .badgeClassName
                                    }
                                    variant="outline"
                                  >
                                    {(solicitacaoStatusMeta[item.status] ?? solicitacaoStatusMeta.agendado).label}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {item.procedimento_nome} · {formatClinicDateTime(item.created_at)}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Nao foi possivel carregar historico adicional para este paciente.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Atualizacao operacional
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use esse painel para registrar o que aconteceu com o compromisso no dia.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda-status-update">Status do agendamento</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    id="agenda-status-update"
                    onChange={(event) => setNovoStatus(event.target.value as AgendamentoStatus)}
                    value={novoStatus}
                  >
                    {AGENDAMENTO_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {statusMeta[option].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agenda-observacoes">Observacoes</Label>
                  <Textarea
                    id="agenda-observacoes"
                    onChange={(event) => setObservacoes(event.target.value)}
                    placeholder="Anote atrasos, observacoes da recepcao ou desfecho do atendimento"
                    value={observacoes}
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={updateStatusMutation.isPending}
                  onClick={() => void handleSaveStatus()}
                  type="button"
                >
                  {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Salvar atualizacao
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export default Agenda;
