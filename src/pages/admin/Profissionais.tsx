import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseMedical,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import {
  type ProfissionalRecord,
  type ProfissionalStatusFilter,
  useCreateProfissional,
  useProfissionalById,
  useProfissionaisListQuery,
  useUpdateProfissional,
} from "@/features/profissionais/api";

const PAGE_SIZE = 20;

type FormState = {
  ativo: boolean;
  cro: string;
  email: string;
  especialidade: string;
  nome: string;
  telefone: string;
};

function emptyFormState(): FormState {
  return {
    ativo: true,
    cro: "",
    email: "",
    especialidade: "",
    nome: "",
    telefone: "",
  };
}

function mapProfissionalToForm(profissional: ProfissionalRecord): FormState {
  return {
    ativo: profissional.ativo,
    cro: profissional.cro ?? "",
    email: profissional.email ?? "",
    especialidade: profissional.especialidade ?? "",
    nome: profissional.nome,
    telefone: profissional.telefone ?? "",
  };
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const Profissionais = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProfissionalStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyFormState);

  const deferredSearch = useDeferredValue(search);

  const profissionaisQuery = useProfissionaisListQuery({
    page,
    pageSize: PAGE_SIZE,
    search: deferredSearch,
    status,
  });
  const selectedProfissionalQuery = useProfissionalById(isCreatingNew ? null : selectedId);
  const createProfissional = useCreateProfissional();
  const updateProfissional = useUpdateProfissional();

  const profissionais = useMemo(() => profissionaisQuery.data?.items ?? [], [profissionaisQuery.data]);
  const totalCount = profissionaisQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const selected = isCreatingNew ? null : selectedProfissionalQuery.data ?? null;

  useEffect(() => {
    if (!isCreatingNew && !selectedId && profissionais.length > 0) {
      setSelectedId(profissionais[0].id);
    }
  }, [isCreatingNew, profissionais, selectedId]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, status]);

  useEffect(() => {
    if (selected) {
      setForm(mapProfissionalToForm(selected));
      return;
    }

    if (isCreatingNew) {
      setForm(emptyFormState());
    }
  }, [isCreatingNew, selected?.id]);

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
        description: "Informe o nome do profissional antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ativo: form.ativo,
      cro: normalizeOptionalValue(form.cro),
      email: normalizeOptionalValue(form.email),
      especialidade: normalizeOptionalValue(form.especialidade),
      id: selected?.id,
      nome: form.nome.trim(),
      telefone: normalizeOptionalValue(form.telefone),
    };

    try {
      const saved = selected
        ? await updateProfissional.mutateAsync(payload)
        : await createProfissional.mutateAsync(payload);

      setIsCreatingNew(false);
      setSelectedId(saved.id);

      toast({
        title: selected ? "Profissional atualizado" : "Profissional criado",
        description: `${saved.nome} foi salvo com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar o profissional.";

      toast({
        title: "Falha ao salvar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleQuickToggle = async (profissional: (typeof profissionais)[number]) => {
    try {
      await updateProfissional.mutateAsync({
        ativo: !profissional.ativo,
        cro: profissional.cro,
        email: profissional.email,
        especialidade: profissional.especialidade,
        id: profissional.id,
        nome: profissional.nome,
        telefone: profissional.telefone,
      });

      if (selectedId === profissional.id) {
        setForm((current) => ({
          ...current,
          ativo: !profissional.ativo,
        }));
      }

      toast({
        title: !profissional.ativo ? "Profissional reativado" : "Profissional inativado",
        description: `${profissional.nome} foi atualizado.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o status do profissional.";

      toast({
        title: "Falha ao atualizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isSaving = createProfissional.isPending || updateProfissional.isPending;

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-foreground">Time clinico</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cadastre os profissionais disponiveis para agendamento e mantenha especialidade, CRO e contatos operacionais centralizados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
            {totalCount} cadastrados
          </Badge>
          <Badge className="border-border bg-background text-muted-foreground" variant="outline">
            Pagina {page} de {totalPages}
          </Badge>
        </div>
      </section>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.08fr)_minmax(460px,0.92fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Profissionais cadastrados</CardTitle>
                <CardDescription>
                  Busque por nome, especialidade, CRO ou contato e ajuste quem aparece no fluxo operacional.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void profissionaisQuery.refetch()} type="button" variant="outline">
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button onClick={handleNew} type="button">
                  <Plus className="h-4 w-4" />
                  Novo profissional
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, CRO ou especialidade"
                  value={search}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissional-status-filter">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="profissional-status-filter"
                  onChange={(event) => setStatus(event.target.value as ProfissionalStatusFilter)}
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
            {profissionaisQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando profissionais...
              </div>
            ) : profissionais.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum profissional encontrado com os filtros atuais.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profissionais.map((profissional) => (
                        <TableRow
                          className={profissional.id === selectedId ? "bg-accent/40" : ""}
                          key={profissional.id}
                          onClick={() => {
                            setIsCreatingNew(false);
                            setSelectedId(profissional.id);
                          }}
                        >
                          <TableCell>
                            <div>
                              <p className="font-semibold text-foreground">{profissional.nome}</p>
                              <p className="text-xs text-muted-foreground">
                                {profissional.cro ? `CRO ${profissional.cro}` : "CRO nao informado"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{profissional.especialidade ?? "Nao informada"}</TableCell>
                          <TableCell>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p>{profissional.telefone ?? "Sem telefone"}</p>
                              <p className="line-clamp-1">{profissional.email ?? "Sem e-mail"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                profissional.ativo
                                  ? "border-success/20 bg-success-light text-success"
                                  : "border-border bg-background text-muted-foreground"
                              }
                              variant="outline"
                            >
                              {profissional.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleQuickToggle(profissional);
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {profissional.ativo ? "Inativar" : "Reativar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {profissionais.length} de {totalCount} registros.
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
                      Proxima
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
              {selected ? "Editar profissional" : "Novo profissional"}
            </CardTitle>
            <CardDescription>
              Defina os dados minimos necessarios para que o time apareca na confirmacao das solicitacoes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!isCreatingNew && selectedId && selectedProfissionalQuery.isLoading && !selected ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando detalhe do profissional...
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BriefcaseMedical className="h-4 w-4 text-primary" />
                    Contexto do cadastro
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Profissionais ativos aparecem como opcao no fluxo de confirmacao e na agenda operacional da clinica.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profissional-nome">Nome do profissional</Label>
                  <Input
                    id="profissional-nome"
                    onChange={(event) => handleChange("nome", event.target.value)}
                    placeholder="Ex.: Dra. Juliana Sampaio"
                    value={form.nome}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profissional-especialidade">Especialidade</Label>
                    <Input
                      id="profissional-especialidade"
                      onChange={(event) => handleChange("especialidade", event.target.value)}
                      placeholder="Ortodontia"
                      value={form.especialidade}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profissional-cro">CRO</Label>
                    <Input
                      id="profissional-cro"
                      onChange={(event) => handleChange("cro", event.target.value)}
                      placeholder="SP 12345"
                      value={form.cro}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profissional-telefone">Telefone</Label>
                    <Input
                      id="profissional-telefone"
                      onChange={(event) => handleChange("telefone", event.target.value)}
                      placeholder="(11) 99999-9999"
                      value={form.telefone}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profissional-email">E-mail</Label>
                    <Input
                      id="profissional-email"
                      onChange={(event) => handleChange("email", event.target.value)}
                      placeholder="juliana@clinica.com"
                      type="email"
                      value={form.email}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Disponivel para agendamento</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Profissionais inativos deixam de aparecer na confirmacao das solicitacoes.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{form.ativo ? "Ativo" : "Inativo"}</span>
                    <Switch checked={form.ativo} onCheckedChange={(checked) => handleChange("ativo", checked)} />
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
                    {selected ? "Salvar profissional" : "Criar profissional"}
                  </Button>
                  <Button onClick={handleNew} type="button" variant="outline">
                    Limpar formulario
                  </Button>
                </div>

                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    Uso no fluxo
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary/80" />
                      Mantenha o telefone atualizado para contato interno rapido.
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary/80" />
                      O e-mail ajuda na organizacao do time e nas futuras automacoes.
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profissionais;
