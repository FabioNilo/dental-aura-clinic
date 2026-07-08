import { useState, useMemo } from "react";
import { Loader2, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  useTratamentosAbertos,
  useCreateTratamento,
  useUpdateTratamento,
  useRegistrarSessaoTratamento,
  useCancelaTratamento,
} from "@/features/prontuarios/api";
import {
  TRATAMENTO_STATUS,
  type CreateTratamentoInput,
  type TratamentoRecord,
  type TratamentoStatusType,
} from "@/features/prontuarios/types";

export interface TratamentoSectionProps {
  prontuarioId: string;
  pacienteId: string;
  readOnly?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  diagnostico: "bg-slate-100 text-slate-800",
  orcamento: "bg-blue-100 text-blue-800",
  data: "bg-yellow-100 text-yellow-800",
  em_andamento: "bg-purple-100 text-purple-800",
  concluido: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  diagnostico: <AlertCircle className="h-4 w-4" />,
  orcamento: <Clock className="h-4 w-4" />,
  data: <Clock className="h-4 w-4" />,
  em_andamento: <Clock className="h-4 w-4" />,
  concluido: <CheckCircle2 className="h-4 w-4" />,
  cancelado: <AlertCircle className="h-4 w-4" />,
};

type CreateFormState = {
  dente_numero: string;
  procedimento_descricao: string;
  status: string;
  data_diagnostico: string;
  data_orcamento: string;
  data_prevista: string;
  num_sessoes_total: string;
};

function emptyFormState(): CreateFormState {
  return {
    dente_numero: "",
    procedimento_descricao: "",
    status: TRATAMENTO_STATUS.diagnostico,
    data_diagnostico: new Date().toISOString().split("T")[0],
    data_orcamento: "",
    data_prevista: "",
    num_sessoes_total: "",
  };
}

export function TratamentoSection({
  prontuarioId,
  pacienteId,
  readOnly = false,
}: TratamentoSectionProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(emptyFormState());
  const [selectedTratamento, setSelectedTratamento] = useState<TratamentoRecord | null>(null);
  const [notasSessao, setNotasSessao] = useState("");

  const tratamentosQuery = useTratamentosAbertos({
    prontuario_id: prontuarioId,
  });

  const createTratamento = useCreateTratamento();
  const updateTratamento = useUpdateTratamento();
  const registrarSessao = useRegistrarSessaoTratamento();
  const cancelaTratamento = useCancelaTratamento();

  const tratamentos = useMemo(() => tratamentosQuery.data ?? [], [tratamentosQuery.data]);

  const handleAddTratamento = async () => {
    if (!form.procedimento_descricao.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Descreva o procedimento",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: CreateTratamentoInput = {
        prontuario_id: prontuarioId,
        paciente_id: pacienteId,
        dente_numero: form.dente_numero || null,
        procedimento_descricao: form.procedimento_descricao.trim(),
        status: form.status as TratamentoStatusType,
        data_diagnostico: form.data_diagnostico || null,
        data_orcamento: form.data_orcamento || null,
        data_prevista: form.data_prevista || null,
        num_sessoes_total: form.num_sessoes_total ? parseInt(form.num_sessoes_total) : null,
      };

      await createTratamento.mutateAsync(payload);
      toast({
        title: "Tratamento adicionado",
        description: "Novo procedimento registrado com sucesso.",
      });
      setForm(emptyFormState());
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao adicionar",
        description: error instanceof Error ? error.message : "Não foi possível adicionar.",
        variant: "destructive",
      });
    }
  };

  const handleRegistrarSessao = async (tratamentoId: string) => {
    try {
      await registrarSessao.mutateAsync({
        tratamento_id: tratamentoId,
        notas_sessao: notasSessao || null,
      });
      toast({
        title: "Sessão registrada",
        description: "Sessão de tratamento registrada com sucesso.",
      });
      setNotasSessao("");
      setSelectedTratamento(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao registrar",
        description: error instanceof Error ? error.message : "Não foi possível registrar.",
        variant: "destructive",
      });
    }
  };

  const handleCancelaTratamento = async (tratamentoId: string) => {
    if (!window.confirm("Tem certeza que deseja cancelar este tratamento?")) {
      return;
    }

    try {
      await cancelaTratamento.mutateAsync(tratamentoId);
      toast({
        title: "Tratamento cancelado",
        description: "O procedimento foi marcado como cancelado.",
      });
      setSelectedTratamento(null);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao cancelar",
        description: error instanceof Error ? error.message : "Não foi possível cancelar.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tratamentos</CardTitle>
        <CardDescription>e procedimentos planejados ou em andamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tratamentosQuery.isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tratamentos.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">Nenhum tratamento registrado</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead>Data Prev.</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tratamentos.map((tratamento) => (
                  <TableRow key={tratamento.id}>
                    <TableCell className="font-medium">
                      {tratamento.dente_numero || "-"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tratamento.procedimento_descricao}
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 w-fit px-2 py-1 rounded ${STATUS_COLORS[tratamento.status] || "bg-gray-100"}`}>
                        {STATUS_ICONS[tratamento.status]}
                        <span className="text-xs font-medium capitalize">
                          {tratamento.status.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {tratamento.num_sessoes_realizadas || 0}
                      {tratamento.num_sessoes_total ? `/${tratamento.num_sessoes_total}` : ""}
                    </TableCell>
                    <TableCell className="text-sm">
                      {tratamento.data_prevista
                        ? new Date(tratamento.data_prevista).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {!readOnly && (
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedTratamento(tratamento);
                              setNotasSessao(tratamento.notas_sessao || "");
                            }}
                          >
                            Sessão
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCancelaTratamento(tratamento.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Register Session Flow */}
        {selectedTratamento && !readOnly && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">Registrar Sessão - {selectedTratamento.procedimento_descricao}</h4>
            <div className="space-y-2">
              <Label htmlFor="notas_sessao">Anotações desta Sessão</Label>
              <Textarea
                id="notas_sessao"
                placeholder="O que foi realizado nesta sessão..."
                value={notasSessao}
                onChange={(e) => setNotasSessao(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleRegistrarSessao(selectedTratamento.id)}
                disabled={registrarSessao.isPending}
              >
                {registrarSessao.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Registrar Sessão"
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedTratamento(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Create Treatment Flow */}
        {!readOnly && (
          <div className="border-t pt-4">
            {isCreating ? (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Novo Tratamento</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dente_numero" className="text-xs">Dente (FDI)</Label>
                    <Input
                      id="dente_numero"
                      placeholder="Ex: 11, 26"
                      value={form.dente_numero}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dente_numero: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-xs">Status</Label>
                    <Select value={form.status} onValueChange={(val) =>
                      setForm((f) => ({ ...f, status: val }))
                    }>
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TRATAMENTO_STATUS.diagnostico}>Diagnóstico</SelectItem>
                        <SelectItem value={TRATAMENTO_STATUS.orcamento}>Orçamento</SelectItem>
                        <SelectItem value={TRATAMENTO_STATUS.data}>Data</SelectItem>
                        <SelectItem value={TRATAMENTO_STATUS.em_andamento}>Em Andamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="procedimento_descricao" className="text-xs">Procedimento</Label>
                  <Textarea
                    id="procedimento_descricao"
                    placeholder="Descrição do procedimento..."
                    value={form.procedimento_descricao}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, procedimento_descricao: e.target.value }))
                    }
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="data_diagnostico" className="text-xs">Data Diagnóstico</Label>
                    <Input
                      id="data_diagnostico"
                      type="date"
                      value={form.data_diagnostico}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, data_diagnostico: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="data_orcamento" className="text-xs">Data Orçamento</Label>
                    <Input
                      id="data_orcamento"
                      type="date"
                      value={form.data_orcamento}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, data_orcamento: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="data_prevista" className="text-xs">Data Prevista</Label>
                    <Input
                      id="data_prevista"
                      type="date"
                      value={form.data_prevista}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, data_prevista: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="num_sessoes_total" className="text-xs">Total de Sessões</Label>
                    <Input
                      id="num_sessoes_total"
                      type="number"
                      placeholder="Ex: 3"
                      value={form.num_sessoes_total}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, num_sessoes_total: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddTratamento}
                    disabled={createTratamento.isPending}
                  >
                    {createTratamento.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      "Adicionar Tratamento"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      setForm(emptyFormState());
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreating(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tratamento
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
