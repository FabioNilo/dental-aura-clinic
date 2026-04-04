import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  FileJson2,
  History,
  Loader2,
  NotebookPen,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
  SOLICITACAO_PENDING_STATUSES,
  SOLICITACAO_STATUS_OPTIONS,
  type SolicitacaoRecord,
  useCancelarSolicitacao,
  useConfirmarSolicitacao,
  useCreateSolicitacao,
  useProfissionaisOptions,
  useRemarcarSolicitacao,
  useServicosOptions,
  useSolicitacoesQuery,
} from "@/features/solicitacoes/api";

type ActionMode = "cancelar" | "confirmar" | "remarcar" | null;
type CreateFormState = {
  diaDesejado: string;
  nomeCliente: string;
  observacoesAdmin: string;
  observacoesCliente: string;
  procedimentoNome: string;
  telefoneCliente: string;
  tipoAtendimento: "" | "convenio" | "particular";
  turnoDesejado: "" | "comercial" | "manha" | "noite" | "tarde";
};

const PAGE_SIZE = 10;
const CREATE_SOLICITACAO_DEFAULTS: CreateFormState = {
  diaDesejado: "",
  nomeCliente: "",
  observacoesAdmin: "",
  observacoesCliente: "",
  procedimentoNome: "Consulta geral",
  telefoneCliente: "",
  tipoAtendimento: "",
  turnoDesejado: "",
};

const statusMeta: Record<
  string,
  { badgeClassName: string; helper: string; label: string }
> = {
  novo: {
    badgeClassName: "bg-primary/10 text-primary border-primary/20",
    helper: "Entrada nova aguardando triagem.",
    label: "Novo",
  },
  em_triagem: {
    badgeClassName: "bg-amber-100 text-amber-700 border-amber-200",
    helper: "Em avaliacao administrativa.",
    label: "Em triagem",
  },
  aguardando_confirmacao: {
    badgeClassName: "bg-sky-100 text-sky-700 border-sky-200",
    helper: "Falta definir o horario final.",
    label: "Aguardando confirmacao",
  },
  agendado: {
    badgeClassName: "bg-success-light text-success border-success/20",
    helper: "Ja convertido em agendamento oficial.",
    label: "Agendado",
  },
  remarcacao_solicitada: {
    badgeClassName: "bg-orange-100 text-orange-700 border-orange-200",
    helper: "Precisa de nova definicao de horario.",
    label: "Remarcacao solicitada",
  },
  cancelamento_solicitado: {
    badgeClassName: "bg-rose-100 text-rose-700 border-rose-200",
    helper: "Paciente pediu cancelamento.",
    label: "Cancelamento solicitado",
  },
  cancelado: {
    badgeClassName: "bg-destructive/10 text-destructive border-destructive/20",
    helper: "Solicitacao encerrada.",
    label: "Cancelado",
  },
};

function formatDate(date: string | null) {
  if (!date) {
    return "Nao informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(date: string | null) {
  if (!date) {
    return "Nao definido";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Nao informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(value);
}

function formatJsonBlock(value: unknown) {
  if (!value) {
    return "Sem payload registrado.";
  }

  return JSON.stringify(value, null, 2);
}

function toDateTimeLocalValue(selected: SolicitacaoRecord | null) {
  if (selected?.data_hora_confirmada) {
    return selected.data_hora_confirmada.slice(0, 16);
  }

  if (selected?.dia_desejado) {
    return `${selected.dia_desejado}T09:00`;
  }

  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const Solicitacoes = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof SOLICITACAO_STATUS_OPTIONS)[number] | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [profissionalId, setProfissionalId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [observacoesAdmin, setObservacoesAdmin] = useState("");
  const [createForm, setCreateForm] = useState<CreateFormState>(CREATE_SOLICITACAO_DEFAULTS);

  const deferredSearch = useDeferredValue(search);
  const targetSolicitacaoId = searchParams.get("solicitacaoId");

  const solicitacoesQuery = useSolicitacoesQuery({
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch,
    status,
  });
  const profissionaisQuery = useProfissionaisOptions();
  const servicosQuery = useServicosOptions();
  const createSolicitacaoMutation = useCreateSolicitacao();
  const confirmarMutation = useConfirmarSolicitacao();
  const remarcarMutation = useRemarcarSolicitacao();
  const cancelarMutation = useCancelarSolicitacao();

  const items = solicitacoesQuery.data?.items ?? [];
  const totalCount = solicitacoesQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const selected = useMemo(
    () => (isCreatingNew ? null : items.find((item) => item.id === selectedId) ?? items[0] ?? null),
    [isCreatingNew, items, selectedId],
  );
  const pacienteContextQuery = usePacienteOperacaoContext({
    enabled: !isCreatingNew && Boolean(selected),
    pacienteId: selected?.paciente_id ?? null,
    telefone: selected?.telefone_cliente ?? null,
  });

  const isPendingSelected = selected ? SOLICITACAO_PENDING_STATUSES.includes(selected.status as never) : false;

  useEffect(() => {
    if (isCreatingNew) {
      return;
    }

    if (targetSolicitacaoId && items.some((item) => item.id === targetSolicitacaoId)) {
      setSelectedId(targetSolicitacaoId);
      return;
    }

    if (!selected && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [isCreatingNew, items, selected, targetSolicitacaoId]);

  useEffect(() => {
    if (selected) {
      setDataHora(toDateTimeLocalValue(selected));
      setObservacoesAdmin(selected.observacoes_admin ?? "");
      setProfissionalId(selected.profissional_id ?? "");
      setServicoId(selected.servico_id ?? "");
      setActionMode(null);
    }
  }, [selected?.id]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  const handleSelect = (id: string) => {
    startTransition(() => {
      setIsCreatingNew(false);
      setSelectedId(id);
    });
  };

  const handleCreateFieldChange = <K extends keyof CreateFormState>(
    field: K,
    value: CreateFormState[K],
  ) => {
    setCreateForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleNewSolicitacao = () => {
    setIsCreatingNew(true);
    setActionMode(null);
    setCreateForm(CREATE_SOLICITACAO_DEFAULTS);
  };

  const handleCriarSolicitacao = async () => {
    if (!createForm.nomeCliente.trim() || !createForm.telefoneCliente.trim()) {
      toast({
        title: "Dados incompletos",
        description: "Informe nome e telefone para abrir a solicitacao manual.",
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await createSolicitacaoMutation.mutateAsync({
        diaDesejado: createForm.diaDesejado || null,
        nomeCliente: createForm.nomeCliente.trim(),
        observacoesAdmin: createForm.observacoesAdmin.trim() || null,
        observacoesCliente: createForm.observacoesCliente.trim() || null,
        procedimentoNome: createForm.procedimentoNome.trim() || "Consulta geral",
        telefoneCliente: createForm.telefoneCliente.trim(),
        tipoAtendimento: createForm.tipoAtendimento || null,
        turnoDesejado: createForm.turnoDesejado || null,
      });

      setIsCreatingNew(false);
      setSearch("");
      setStatus("all");
      setPage(1);
      setSelectedId(created.id);

      toast({
        title: "Solicitacao criada",
        description: `${created.nome_cliente} entrou na fila operacional com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel criar a solicitacao manual.";

      toast({
        title: "Falha ao criar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleConfirmar = async () => {
    if (!selected) {
      return;
    }

    if (!profissionalId || !servicoId || !dataHora) {
      toast({
        title: "Dados incompletos",
        description: "Selecione profissional, servico e data/hora para confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await confirmarMutation.mutateAsync({
        dataHora: new Date(dataHora).toISOString(),
        observacoesAdmin,
        profissionalId,
        servicoId,
        solicitacaoId: selected.id,
      });

      toast({
        title: "Solicitacao confirmada",
        description: "O agendamento oficial foi criado com sucesso.",
      });

      setActionMode(null);
      await solicitacoesQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel confirmar a solicitacao.";

      toast({
        title: "Falha ao confirmar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleRemarcar = async () => {
    if (!selected) {
      return;
    }

    try {
      await remarcarMutation.mutateAsync({
        observacoesAdmin,
        solicitacaoId: selected.id,
      });

      toast({
        title: "Solicitacao atualizada",
        description: "A solicitacao foi marcada para remarcacao.",
      });

      setActionMode(null);
      await solicitacoesQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel marcar a remarcacao.";

      toast({
        title: "Falha ao remarcar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleCancelar = async () => {
    if (!selected) {
      return;
    }

    try {
      await cancelarMutation.mutateAsync({
        observacoesAdmin,
        solicitacaoId: selected.id,
      });

      toast({
        title: "Solicitacao cancelada",
        description: "A solicitacao e o agendamento vinculado foram encerrados.",
      });

      setActionMode(null);
      await solicitacoesQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel cancelar a solicitacao.";

      toast({
        title: "Falha ao cancelar",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-foreground">Fila de solicitações</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Revise o que entrou pelo atendimento virtual, acompanhe o contexto capturado pela IA e transforme a entrada em agendamento oficial com segurança.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
            {totalCount} registros
          </Badge>
          <Badge className="border-border bg-background text-muted-foreground" variant="outline">
            Página {page} de {totalPages}
          </Badge>
        </div>
      </section>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.12fr)_minmax(470px,0.88fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Entradas operacionais</CardTitle>
                <CardDescription>
                  Busca por nome, telefone, código externo ou procedimento.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void solicitacoesQuery.refetch()} type="button" variant="outline">
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button onClick={handleNewSolicitacao} type="button">
                  <Plus className="h-4 w-4" />
                  Nova solicitação
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por paciente, telefone, código ou procedimento"
                  value={search}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="status-filter"
                  onChange={(event) => setStatus(event.target.value as typeof status)}
                  value={status}
                >
                  <option value="all">Todos</option>
                  {SOLICITACAO_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {statusMeta[option]?.label ?? option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {solicitacoesQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando solicitações...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhuma solicitação encontrada com os filtros atuais.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Desejado</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const meta = statusMeta[item.status] ?? statusMeta.novo;
                      const isSelected = item.id === selected?.id;

                      return (
                        <TableRow
                          className={isSelected ? "bg-accent/40" : ""}
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                        >
                          <TableCell className="font-semibold">{item.codigo_externo}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{item.nome_cliente}</p>
                              <p className="text-xs text-muted-foreground">{item.telefone_cliente}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.procedimento_nome}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{formatDate(item.dia_desejado)}</p>
                              <p className="text-xs capitalize text-muted-foreground">
                                {item.turno_desejado ?? "Sem turno"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={meta.badgeClassName} variant="outline">
                              {meta.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {items.length} de {totalCount} registros.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      disabled={page === 1}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      type="button"
                      variant="outline"
                    >
                      Anterior
                    </Button>
                    <Button
                      disabled={page >= totalPages}
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      type="button"
                      variant="outline"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-card 2xl:sticky 2xl:top-32">
          <CardHeader>
            <CardTitle className="text-2xl font-headline">
              {isCreatingNew ? "Nova solicitação manual" : "Detalhe da solicitação"}
            </CardTitle>
            <CardDescription>
              {isCreatingNew
                ? "Registre uma entrada manual para alimentar a fila operacional do painel."
                : "Veja o resumo capturado pela IA e aplique a próxima ação operacional."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isCreatingNew ? (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Entrada criada pelo time admin</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Use esse fluxo quando o contato chegar por telefone, recepção ou atendimento humano e ainda precisar entrar na fila para confirmação.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-nome-cliente">Nome do paciente</Label>
                    <Input
                      id="create-nome-cliente"
                      onChange={(event) => handleCreateFieldChange("nomeCliente", event.target.value)}
                      placeholder="Ex.: Maria Souza"
                      value={createForm.nomeCliente}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-telefone-cliente">Telefone</Label>
                    <Input
                      id="create-telefone-cliente"
                      onChange={(event) => handleCreateFieldChange("telefoneCliente", event.target.value)}
                      placeholder="(11) 99999-9999"
                      value={createForm.telefoneCliente}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-procedimento">Procedimento</Label>
                  <Input
                    id="create-procedimento"
                    onChange={(event) => handleCreateFieldChange("procedimentoNome", event.target.value)}
                    placeholder="Consulta geral"
                    value={createForm.procedimentoNome}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="create-dia-desejado">Dia desejado</Label>
                    <Input
                      id="create-dia-desejado"
                      onChange={(event) => handleCreateFieldChange("diaDesejado", event.target.value)}
                      type="date"
                      value={createForm.diaDesejado}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-turno-desejado">Turno desejado</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      id="create-turno-desejado"
                      onChange={(event) =>
                        handleCreateFieldChange("turnoDesejado", event.target.value as CreateFormState["turnoDesejado"])
                      }
                      value={createForm.turnoDesejado}
                    >
                      <option value="">Não informado</option>
                      <option value="manha">Manhã</option>
                      <option value="tarde">Tarde</option>
                      <option value="noite">Noite</option>
                      <option value="comercial">Horário comercial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-tipo-atendimento">Tipo de atendimento</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      id="create-tipo-atendimento"
                      onChange={(event) =>
                        handleCreateFieldChange(
                          "tipoAtendimento",
                          event.target.value as CreateFormState["tipoAtendimento"],
                        )
                      }
                      value={createForm.tipoAtendimento}
                    >
                      <option value="">Não informado</option>
                      <option value="particular">Particular</option>
                      <option value="convenio">Convênio</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-observacoes-cliente">Observações do contato</Label>
                  <Textarea
                    id="create-observacoes-cliente"
                    onChange={(event) => handleCreateFieldChange("observacoesCliente", event.target.value)}
                    placeholder="Anote dores, urgencia, disponibilidade ou contexto trazido pelo paciente"
                    value={createForm.observacoesCliente}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="create-observacoes-admin">Observações admin</Label>
                  <Textarea
                    id="create-observacoes-admin"
                    onChange={(event) => handleCreateFieldChange("observacoesAdmin", event.target.value)}
                    placeholder="Detalhes internos para a equipe administrativa"
                    value={createForm.observacoesAdmin}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    className="flex-1"
                    disabled={createSolicitacaoMutation.isPending}
                    onClick={() => void handleCriarSolicitacao()}
                    type="button"
                  >
                    {createSolicitacaoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Criar solicitação
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreatingNew(false);
                      setCreateForm(CREATE_SOLICITACAO_DEFAULTS);
                    }}
                    type="button"
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : !selected ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Selecione uma solicitação na lista para continuar.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {selected.codigo_externo}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold font-headline">{selected.nome_cliente}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Entrada via {selected.origem} / {selected.canal_origem}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {selected.agendamento_id && selected.data_hora_confirmada ? (
                      <Button asChild size="sm" type="button" variant="outline">
                        <Link
                          to={`/admin/agenda?agendamentoId=${selected.agendamento_id}&date=${selected.data_hora_confirmada.slice(0, 10)}`}
                        >
                          Abrir agenda
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Badge
                      className={(statusMeta[selected.status] ?? statusMeta.novo).badgeClassName}
                      variant="outline"
                    >
                      {(statusMeta[selected.status] ?? statusMeta.novo).label}
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock icon={Phone} label="Telefone" value={selected.telefone_cliente} />
                  <InfoBlock
                    icon={CalendarClock}
                    label="Preferência inicial"
                    value={`${formatDate(selected.dia_desejado)} · ${selected.turno_desejado ?? "Sem turno"}`}
                  />
                  <InfoBlock label="Procedimento" value={selected.procedimento_nome} />
                  <InfoBlock label="Confirmado para" value={formatDateTime(selected.data_hora_confirmada)} />
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-sm font-semibold text-foreground">Contexto da fila</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {(statusMeta[selected.status] ?? statusMeta.novo).helper}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Criado em {formatDateTime(selected.created_at)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <UserRound className="h-4 w-4 text-primary" />
                      Paciente e historico
                    </p>
                    {pacienteContextQuery.data?.paciente ? (
                      <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
                        {selected.paciente_id
                          ? "Paciente vinculado"
                          : pacienteContextQuery.data.matchedByPhone
                            ? "Paciente encontrado por telefone"
                            : "Paciente identificado"}
                      </Badge>
                    ) : (
                      <Badge className="border-border bg-background text-muted-foreground" variant="outline">
                        Ainda sem cadastro associado
                      </Badge>
                    )}
                  </div>

                  {pacienteContextQuery.isLoading ? (
                    <div className="flex items-center justify-center rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando contexto do paciente...
                    </div>
                  ) : pacienteContextQuery.data?.paciente ? (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoBlock
                          icon={Phone}
                          label="Contato principal"
                          value={pacienteContextQuery.data.paciente.telefone ?? selected.telefone_cliente}
                        />
                        <InfoBlock
                          label="Cadastro"
                          value={pacienteContextQuery.data.paciente.email ?? "Sem e-mail informado"}
                        />
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <History className="h-4 w-4 text-primary" />
                            Agendamentos recentes
                          </p>
                          {pacienteContextQuery.data.recentesAgendamentos.filter(
                            (item) => item.id !== selected.agendamento_id,
                          ).length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Nenhum agendamento anterior encontrado para este paciente.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {pacienteContextQuery.data.recentesAgendamentos
                                .filter((item) => item.id !== selected.agendamento_id)
                                .slice(0, 4)
                                .map((item) => (
                                  <div
                                    className="rounded-xl border border-border/60 bg-card px-3 py-3"
                                    key={item.id}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-foreground">{item.servico_nome}</p>
                                      <Badge className="border-border bg-background text-muted-foreground" variant="outline">
                                        {item.status}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {formatDateTime(item.data_hora)} · {item.profissional_nome}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3 rounded-2xl border border-border/60 bg-background/70 p-4">
                          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <NotebookPen className="h-4 w-4 text-primary" />
                            Solicitacoes recentes
                          </p>
                          {pacienteContextQuery.data.recentesSolicitacoes.filter((item) => item.id !== selected.id).length ===
                          0 ? (
                            <p className="text-sm text-muted-foreground">
                              Nenhuma outra solicitacao encontrada para este paciente.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {pacienteContextQuery.data.recentesSolicitacoes
                                .filter((item) => item.id !== selected.id)
                                .slice(0, 4)
                                .map((item) => (
                                  <div
                                    className="rounded-xl border border-border/60 bg-card px-3 py-3"
                                    key={item.id}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-foreground">{item.codigo_externo}</p>
                                      <Badge
                                        className={(statusMeta[item.status] ?? statusMeta.novo).badgeClassName}
                                        variant="outline"
                                      >
                                        {(statusMeta[item.status] ?? statusMeta.novo).label}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {item.procedimento_nome} · {formatDateTime(item.created_at)}
                                    </p>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Ainda nao existe um cadastro de paciente vinculado por ID ou telefone para esta solicitacao.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Observações do paciente</p>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                    {selected.observacoes_cliente ?? "Sem observações do paciente."}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={selected.status === "agendado" || selected.status === "cancelado"}
                      onClick={() => setActionMode("confirmar")}
                      type="button"
                      variant={actionMode === "confirmar" ? "default" : "outline"}
                    >
                      Confirmar
                    </Button>
                    <Button
                      disabled={selected.status === "cancelado"}
                      onClick={() => setActionMode("remarcar")}
                      type="button"
                      variant={actionMode === "remarcar" ? "default" : "outline"}
                    >
                      Remarcar
                    </Button>
                    <Button
                      disabled={selected.status === "cancelado"}
                      onClick={() => setActionMode("cancelar")}
                      type="button"
                      variant={actionMode === "cancelar" ? "destructive" : "outline"}
                    >
                      Cancelar
                    </Button>
                  </div>

                  {!actionMode ? (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      Escolha uma ação acima para continuar o tratamento operacional desta solicitação.
                    </div>
                  ) : null}

                  {actionMode === "confirmar" ? (
                    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profissional-select">Profissional</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            id="profissional-select"
                            onChange={(event) => setProfissionalId(event.target.value)}
                            value={profissionalId}
                          >
                            <option value="">Selecione</option>
                            {(profissionaisQuery.data ?? []).map((profissional) => (
                              <option key={profissional.id} value={profissional.id}>
                                {profissional.nome}
                                {profissional.especialidade ? ` · ${profissional.especialidade}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="servico-select">Serviço</Label>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            id="servico-select"
                            onChange={(event) => setServicoId(event.target.value)}
                            value={servicoId}
                          >
                            <option value="">Selecione</option>
                            {(servicosQuery.data ?? []).map((servico) => (
                              <option key={servico.id} value={servico.id}>
                                {servico.nome}
                                {servico.preco ? ` · ${formatCurrency(servico.preco)}` : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="data-hora-confirmada">Data e hora</Label>
                        <Input
                          id="data-hora-confirmada"
                          onChange={(event) => setDataHora(event.target.value)}
                          type="datetime-local"
                          value={dataHora}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes-admin">Observações admin</Label>
                        <Textarea
                          id="observacoes-admin"
                          onChange={(event) => setObservacoesAdmin(event.target.value)}
                          placeholder="Observações internas sobre a confirmação"
                          value={observacoesAdmin}
                        />
                      </div>

                      <Button
                        className="w-full"
                        disabled={confirmarMutation.isPending || !isPendingSelected}
                        onClick={() => void handleConfirmar()}
                        type="button"
                      >
                        {confirmarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Confirmar solicitação
                      </Button>
                    </div>
                  ) : null}

                  {actionMode === "remarcar" ? (
                    <ActionNoteForm
                      busy={remarcarMutation.isPending}
                      buttonLabel="Marcar para remarcação"
                      icon={<Loader2 className="h-4 w-4 animate-spin" />}
                      label="Observações da remarcação"
                      onChange={setObservacoesAdmin}
                      onSubmit={() => void handleRemarcar()}
                      value={observacoesAdmin}
                    />
                  ) : null}

                  {actionMode === "cancelar" ? (
                    <ActionNoteForm
                      busy={cancelarMutation.isPending}
                      buttonLabel="Cancelar solicitação"
                      icon={<Loader2 className="h-4 w-4 animate-spin" />}
                      label="Motivo do cancelamento"
                      onChange={setObservacoesAdmin}
                      onSubmit={() => void handleCancelar()}
                      value={observacoesAdmin}
                      variant="destructive"
                    />
                  ) : null}
                </div>

                <Separator />

                <JsonPanel
                  icon={NotebookPen}
                  title="Resumo estruturado"
                  value={formatJsonBlock(selected.resumo_atendimento)}
                />
                <JsonPanel
                  icon={FileJson2}
                  title="Payload bruto"
                  value={formatJsonBlock(selected.payload_externo)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function ActionNoteForm({
  busy,
  buttonLabel,
  icon,
  label,
  onChange,
  onSubmit,
  value,
  variant = "default",
}: {
  busy: boolean;
  buttonLabel: string;
  icon: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  value: string;
  variant?: "default" | "destructive";
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/70 p-5">
      <div className="space-y-2">
        <Label>{label}</Label>
        <Textarea
          onChange={(event) => onChange(event.target.value)}
          placeholder="Explique o que aconteceu para manter o histórico operacional"
          value={value}
        />
      </div>
      <Button className="w-full" disabled={busy} onClick={onSubmit} type="button" variant={variant}>
        {busy ? icon : null}
        {buttonLabel}
      </Button>
    </div>
  );
}

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

function JsonPanel({
  icon: Icon,
  title,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
}) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </p>
      <pre className="max-h-64 overflow-auto rounded-2xl border border-border/60 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        {value}
      </pre>
    </div>
  );
}

export default Solicitacoes;
