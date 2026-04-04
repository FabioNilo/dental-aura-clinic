import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Contact,
  FileText,
  Loader2,
  MapPin,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  UserRound,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  type PacienteRecord,
  type PacienteStatusFilter,
  useCreatePaciente,
  usePacientesAdminQuery,
  useUpdatePaciente,
} from "@/features/pacientes/api";
import { ProntuarioModal } from "@/components/admin/prontuario";

type FormState = {
  ativo: boolean;
  cpf: string;
  data_nascimento: string;
  email: string;
  endereco: string;
  nome: string;
  observacoes: string;
  telefone: string;
};

function emptyFormState(): FormState {
  return {
    ativo: true,
    cpf: "",
    data_nascimento: "",
    email: "",
    endereco: "",
    nome: "",
    observacoes: "",
    telefone: "",
  };
}

function mapPacienteToForm(paciente: PacienteRecord): FormState {
  return {
    ativo: paciente.ativo,
    cpf: paciente.cpf ?? "",
    data_nascimento: paciente.data_nascimento ?? "",
    email: paciente.email ?? "",
    endereco: paciente.endereco ?? "",
    nome: paciente.nome,
    observacoes: paciente.observacoes ?? "",
    telefone: paciente.telefone ?? "",
  };
}

function normalizeOptionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

const Pacientes = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PacienteStatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [prontuarioModalOpen, setProntuarioModalOpen] = useState(false);
  const [pacienteSelecionadoParaProntuario, setPacienteSelecionadoParaProntuario] = useState<PacienteRecord | null>(null);

  const deferredSearch = useDeferredValue(search);

  const pacientesQuery = usePacientesAdminQuery({
    search: deferredSearch,
    status,
  });
  const createPaciente = useCreatePaciente();
  const updatePaciente = useUpdatePaciente();

  const pacientes = useMemo(() => pacientesQuery.data ?? [], [pacientesQuery.data]);
  const selected = useMemo(
    () => (isCreatingNew ? null : pacientes.find((item) => item.id === selectedId) ?? null),
    [isCreatingNew, pacientes, selectedId],
  );

  useEffect(() => {
    if (!isCreatingNew && !selectedId && pacientes.length > 0) {
      setSelectedId(pacientes[0].id);
    }
  }, [isCreatingNew, pacientes, selectedId]);

  useEffect(() => {
    if (selected) {
      setForm(mapPacienteToForm(selected));
      return;
    }

    setForm(emptyFormState());
  }, [selected]);

  const activeCount = pacientes.filter((item) => item.ativo).length;

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
        description: "Informe o nome do paciente antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ativo: form.ativo,
      cpf: normalizeOptionalValue(form.cpf),
      data_nascimento: normalizeOptionalValue(form.data_nascimento),
      email: normalizeOptionalValue(form.email),
      endereco: normalizeOptionalValue(form.endereco),
      id: selected?.id,
      nome: form.nome.trim(),
      observacoes: normalizeOptionalValue(form.observacoes),
      telefone: normalizeOptionalValue(form.telefone),
    };

    try {
      const saved = selected
        ? await updatePaciente.mutateAsync(payload)
        : await createPaciente.mutateAsync(payload);

      setIsCreatingNew(false);
      setSelectedId(saved.id);

      toast({
        title: selected ? "Paciente atualizado" : "Paciente criado",
        description: `${saved.nome} foi salvo com sucesso.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel salvar o paciente.";

      toast({
        title: "Falha ao salvar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleQuickToggle = async (paciente: PacienteRecord) => {
    try {
      await updatePaciente.mutateAsync({
        ativo: !paciente.ativo,
        cpf: paciente.cpf,
        data_nascimento: paciente.data_nascimento,
        email: paciente.email,
        endereco: paciente.endereco,
        id: paciente.id,
        nome: paciente.nome,
        observacoes: paciente.observacoes,
        telefone: paciente.telefone,
      });

      if (selectedId === paciente.id) {
        setForm((current) => ({
          ...current,
          ativo: !paciente.ativo,
        }));
      }

      toast({
        title: !paciente.ativo ? "Paciente reativado" : "Paciente inativado",
        description: `${paciente.nome} foi atualizado.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel atualizar o status do paciente.";

      toast({
        title: "Falha ao atualizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const isSaving = createPaciente.isPending || updatePaciente.isPending;

  return (
    <div className="space-y-10">
      <section className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-foreground">Pacientes</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Centralize cadastros, dados de contato e observacoes basicas para dar contexto ao funil de solicitacoes e aos agendamentos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-card">
          <Badge className="border-primary/15 bg-accent text-primary" variant="outline">
            {activeCount} ativos
          </Badge>
          <Badge className="border-border bg-background text-muted-foreground" variant="outline">
            {pacientes.length} cadastrados
          </Badge>
        </div>
      </section>

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.08fr)_minmax(500px,0.92fr)]">
        <Card className="border-border/60 shadow-card">
          <CardHeader className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Pacientes cadastrados</CardTitle>
                <CardDescription>
                  Busque por nome, telefone, e-mail ou CPF para localizar rapidamente um cadastro.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => void pacientesQuery.refetch()} type="button" variant="outline">
                  <RefreshCcw className="h-4 w-4" />
                  Atualizar
                </Button>
                <Button onClick={handleNew} type="button">
                  <Plus className="h-4 w-4" />
                  Novo paciente
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, telefone, e-mail ou CPF"
                  value={search}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paciente-status-filter">Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  id="paciente-status-filter"
                  onChange={(event) => setStatus(event.target.value as PacienteStatusFilter)}
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
            {pacientesQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando pacientes...
              </div>
            ) : pacientes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum paciente encontrado com os filtros atuais.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[860px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacientes.map((paciente) => (
                      <TableRow
                        className={paciente.id === selectedId ? "bg-accent/40" : ""}
                        key={paciente.id}
                        onClick={() => {
                          setIsCreatingNew(false);
                          setSelectedId(paciente.id);
                        }}
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-foreground">{paciente.nome}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {paciente.endereco ?? "Endereco nao informado"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>{paciente.telefone ?? "Sem telefone"}</p>
                            <p className="line-clamp-1">{paciente.email ?? "Sem e-mail"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{paciente.cpf ?? "Nao informado"}</TableCell>
                        <TableCell>{paciente.data_nascimento ?? "Nao informada"}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              paciente.ativo
                                ? "border-success/20 bg-success-light text-success"
                                : "border-border bg-background text-muted-foreground"
                            }
                            variant="outline"
                          >
                            {paciente.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={(event) => {
                                event.stopPropagation();
                                setPacienteSelecionadoParaProntuario(paciente);
                                setProntuarioModalOpen(true);
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Prontuário
                            </Button>
                            <Button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleQuickToggle(paciente);
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {paciente.ativo ? "Inativar" : "Reativar"}
                            </Button>
                          </div>
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
              {selected ? "Editar paciente" : "Novo paciente"}
            </CardTitle>
            <CardDescription>
              Mantenha um cadastro leve, suficiente para contato, contexto basico e operacao da agenda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <UserRound className="h-4 w-4 text-primary" />
                Contexto do cadastro
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Esses dados ajudam a equipe a reconhecer historico, contato e preferencias antes de confirmar a consulta.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paciente-nome">Nome do paciente</Label>
              <Input
                id="paciente-nome"
                onChange={(event) => handleChange("nome", event.target.value)}
                placeholder="Ex.: Maria Souza"
                value={form.nome}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paciente-telefone">Telefone</Label>
                <Input
                  id="paciente-telefone"
                  onChange={(event) => handleChange("telefone", event.target.value)}
                  placeholder="(11) 99999-9999"
                  value={form.telefone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paciente-email">E-mail</Label>
                <Input
                  id="paciente-email"
                  onChange={(event) => handleChange("email", event.target.value)}
                  placeholder="maria@clinica.com"
                  type="email"
                  value={form.email}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paciente-cpf">CPF</Label>
                <Input
                  id="paciente-cpf"
                  onChange={(event) => handleChange("cpf", event.target.value)}
                  placeholder="000.000.000-00"
                  value={form.cpf}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paciente-nascimento">Data de nascimento</Label>
                <Input
                  id="paciente-nascimento"
                  onChange={(event) => handleChange("data_nascimento", event.target.value)}
                  type="date"
                  value={form.data_nascimento}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paciente-endereco">Endereco</Label>
              <Input
                id="paciente-endereco"
                onChange={(event) => handleChange("endereco", event.target.value)}
                placeholder="Rua, numero, bairro e cidade"
                value={form.endereco}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paciente-observacoes">Observacoes</Label>
              <Textarea
                id="paciente-observacoes"
                onChange={(event) => handleChange("observacoes", event.target.value)}
                placeholder="Registre preferencias, contexto ou historico operacional relevante"
                value={form.observacoes}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/70 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Cadastro ativo</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pacientes inativos saem do uso operacional, mas preservam o historico.
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
                {selected ? "Salvar paciente" : "Criar paciente"}
              </Button>
              <Button onClick={handleNew} type="button" variant="outline">
                Limpar formulario
              </Button>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary/80" />
                  O telefone ajuda a vincular solicitacoes captadas por IA.
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary/80" />
                  A data de nascimento melhora a identificacao em recepcao e retornos.
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary/80" />
                  O endereco pode ser util para visitas e orientacoes de acesso.
                </p>
                <p className="flex items-center gap-2">
                  <Contact className="h-4 w-4 text-primary/80" />
                  Observacoes operacionais evitam perda de contexto entre recepcao e atendimento.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prontuário Modal */}
      {pacienteSelecionadoParaProntuario && (
        <ProntuarioModal
          pacienteId={pacienteSelecionadoParaProntuario.id}
          pacienteNome={pacienteSelecionadoParaProntuario.nome}
          isOpen={prontuarioModalOpen}
          onClose={() => {
            setProntuarioModalOpen(false);
            setPacienteSelecionadoParaProntuario(null);
          }}
          onViewCompleto={(prontuarioId) => {
            navigate(`/admin/pacientes/${pacienteSelecionadoParaProntuario.id}`);
          }}
          onCreateNew={() => {
            navigate(`/admin/pacientes/${pacienteSelecionadoParaProntuario.id}`);
            setProntuarioModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Pacientes;
