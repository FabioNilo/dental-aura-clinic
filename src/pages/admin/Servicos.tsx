import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Clock3, Loader2, Plus, RefreshCcw, Search, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  type ServicoRecord,
  type ServicoStatusFilter,
  useCreateServico,
  useServicosAdminQuery,
  useUpdateServico,
} from "@/features/servicos/api";

type FormState = {
  ativo: boolean;
  descricao: string;
  duracao_minutos: string;
  nome: string;
  preco: string;
};

function emptyFormState(): FormState {
  return {
    ativo: true,
    descricao: "",
    duracao_minutos: "",
    nome: "",
    preco: "",
  };
}

function mapServicoToForm(servico: ServicoRecord): FormState {
  return {
    ativo: servico.ativo,
    descricao: servico.descricao ?? "",
    duracao_minutos: servico.duracao_minutos ? String(servico.duracao_minutos) : "",
    nome: servico.nome,
    preco: servico.preco !== null ? String(servico.preco) : "",
  };
}

function parseOptionalInteger(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalPrice(value: string) {
  const trimmed = value.trim().replace(/\./g, "").replace(",", ".");
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Nao informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const Servicos = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServicoStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyFormState);

  const deferredSearch = useDeferredValue(search);

  const servicosQuery = useServicosAdminQuery({
    search: deferredSearch,
    status,
  });
  const createServico = useCreateServico();
  const updateServico = useUpdateServico();

  const servicos = useMemo(
    () => servicosQuery.data ?? [],
    [servicosQuery.data],
  );
  const selected = useMemo(
    () => (isCreatingNew ? null : servicos.find((item) => item.id === selectedId) ?? null),
    [isCreatingNew, selectedId, servicos],
  );

  useEffect(() => {
    if (!isCreatingNew && !selectedId && servicos.length > 0) {
      setSelectedId(servicos[0].id);
    }
  }, [isCreatingNew, selectedId, servicos]);

  useEffect(() => {
    if (selected) {
      setForm(mapServicoToForm(selected));
      return;
    }

    setForm(emptyFormState());
  }, [selected]);

  const activeCount = servicos.filter((item) => item.ativo).length;

  const handleNew = () => {
    setIsCreatingNew(true);
    setSelectedId(null);
    setForm(emptyFormState());
  };

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.nome.trim()) {
      toast({
        title: "Nome obrigatorio",
        description: "Informe o nome do servico antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ativo: form.ativo,
      descricao: form.descricao.trim() || null,
      duracao_minutos: parseOptionalInteger(form.duracao_minutos),
      id: selected?.id,
      nome: form.nome.trim(),
      preco: parseOptionalPrice(form.preco),
    };

    try {
      const saved = selected
        ? await updateServico.mutateAsync(payload)
        : await createServico.mutateAsync(payload);

      setIsCreatingNew(false);
      setSelectedId(saved.id);

      toast({
        title: selected ? "Servico atualizado" : "Servico criado",
        description: `${saved.nome} foi salvo com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar o servico.";

      toast({
        title: "Falha ao salvar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleQuickToggle = async (servico: ServicoRecord) => {
    try {
      await updateServico.mutateAsync({
        ativo: !servico.ativo,
        descricao: servico.descricao,
        duracao_minutos: servico.duracao_minutos,
        id: servico.id,
        nome: servico.nome,
        preco: servico.preco,
      });

      if (selectedId === servico.id) {
        setForm((current) => ({
          ...current,
          ativo: !servico.ativo,
        }));
      }

      toast({
        title: !servico.ativo ? "Servico reativado" : "Servico inativado",
        description: `${servico.nome} foi atualizado.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o status do servico.";

      toast({
        title: "Falha ao atualizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isSaving = createServico.isPending || updateServico.isPending;

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-foreground">Catalogo de serviços</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre os procedimentos ativos da clinica para alimentar a confirmação de solicitações e padronizar duracao e preco base.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
            {activeCount} ativos
          </Badge>
          <Badge className="border-border bg-background text-muted-foreground" variant="outline">
            {servicos.length} cadastrados
          </Badge>
        </div>
      </section>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Serviços cadastrados</CardTitle>
                <CardDescription>
                  Busque por nome ou descrição e ajuste o status operacional de cada item.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void servicosQuery.refetch()} type="button" variant="outline">
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button onClick={handleNew} type="button">
                  <Plus className="h-4 w-4" />
                  Novo serviço
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome ou descricao"
                  value={search}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servico-status-filter">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="servico-status-filter"
                  onChange={(event) => setStatus(event.target.value as ServicoStatusFilter)}
                  value={status}
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {servicosQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando serviços...
              </div>
            ) : servicos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum serviço encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicos.map((servico) => (
                    <TableRow
                      className={servico.id === selectedId ? "bg-accent/40" : ""}
                      key={servico.id}
                      onClick={() => {
                        setIsCreatingNew(false);
                        setSelectedId(servico.id);
                      }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{servico.nome}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {servico.descricao ?? "Sem descricao cadastrada."}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{servico.duracao_minutos ? `${servico.duracao_minutos} min` : "Padrao"}</TableCell>
                      <TableCell>{formatCurrency(servico.preco)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            servico.ativo
                              ? "border-success/20 bg-success-light text-success"
                              : "border-border bg-background text-muted-foreground"
                          }
                          variant="outline"
                        >
                          {servico.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleQuickToggle(servico);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          {servico.ativo ? "Inativar" : "Reativar"}
                        </Button>
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
            <CardTitle className="text-2xl font-headline">
              {selected ? "Editar serviço" : "Novo serviço"}
            </CardTitle>
            <CardDescription>
              Defina nome, descrição, duração média e preço de referência para o procedimento.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Stethoscope className="h-4 w-4 text-primary" />
                Contexto do cadastro
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Estes dados alimentam a confirmação da fila de solicitações e servem como base para a agenda.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-nome">Nome do serviço</Label>
              <Input
                id="servico-nome"
                onChange={(event) => handleChange("nome", event.target.value)}
                placeholder="Ex.: Consulta geral"
                value={form.nome}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico-descricao">Descrição</Label>
              <Textarea
                id="servico-descricao"
                onChange={(event) => handleChange("descricao", event.target.value)}
                placeholder="Descreva rapidamente quando esse serviço é utilizado"
                value={form.descricao}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="servico-duracao">Duração média (min)</Label>
                <Input
                  id="servico-duracao"
                  inputMode="numeric"
                  onChange={(event) => handleChange("duracao_minutos", event.target.value)}
                  placeholder="60"
                  value={form.duracao_minutos}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico-preco">Preco base</Label>
                <Input
                  id="servico-preco"
                  inputMode="decimal"
                  onChange={(event) => handleChange("preco", event.target.value)}
                  placeholder="180,00"
                  value={form.preco}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Disponível para uso no painel</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Serviços inativos deixam de aparecer como opção operacional.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{form.ativo ? "Ativo" : "Inativo"}</span>
                <Switch
                  checked={form.ativo}
                  onCheckedChange={(checked) => handleChange("ativo", checked)}
                />
              </div>
            </div>

            {selected ? (
              <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Registro selecionado
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Criado em</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(selected.created_at))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Atualizado em</p>
                    <p className="text-sm font-medium text-foreground">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(selected.updated_at))}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" disabled={isSaving} onClick={() => void handleSubmit()} type="button">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {selected ? "Salvar servico" : "Criar servico"}
              </Button>
              <Button onClick={handleNew} type="button" variant="outline">
                Limpar formulario
              </Button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clock3 className="h-4 w-4 text-primary" />
                Uso no fluxo
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Quando uma solicitação for confirmada, o serviço escolhido define a duração inicial do agendamento e o catálogo exibido ao time administrativo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Servicos;
