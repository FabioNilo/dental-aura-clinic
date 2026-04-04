import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Calendar, TrendingUp } from "lucide-react";
import { useOrcamentosPaciente } from "@/features/financeiro/api";
import { ORCAMENTO_STATUS, type OrcamentoStatusType } from "@/features/financeiro/types";
import { NovoOrcamentoModal } from "./NovoOrcamentoModal";

export function OrcamentoManager() {
  const [pacienteFilter, setPacienteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrcamentoStatusType | null>(null);
  const [novoOrcamentoAberto, setNovoOrcamentoAberto] = useState(false);
  const queryClient = useQueryClient();

  // Exemplo: buscar orçamentos de um paciente específico
  const orcamentosQuery = useOrcamentosPaciente(pacienteFilter || "", {
    status: statusFilter,
  });

  const orcamentos = orcamentosQuery.data || [];

  const handleSucesso = () => {
    // Recarrega todas as queries
    queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
    queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente"] });
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Botão de Novo */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Orçamentos</h2>
          <p className="text-sm text-muted-foreground">Cotações de procedimentos para pacientes</p>
        </div>
        <Button className="gap-2" onClick={() => setNovoOrcamentoAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="paciente-filter">Paciente ID</Label>
              <Input
                id="paciente-filter"
                placeholder="Cole UUID do paciente"
                value={pacienteFilter}
                onChange={(e) => setPacienteFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                id="status-filter"
                className="w-full px-3 py-2 border rounded-md"
                value={statusFilter || ""}
                onChange={(e) =>
                  setStatusFilter(
                    (e.target.value as OrcamentoStatusType) || null
                  )
                }
              >
                <option value="">Todos</option>
                <option value={ORCAMENTO_STATUS.rascunho}>Rascunho</option>
                <option value={ORCAMENTO_STATUS.enviado}>Enviado</option>
                <option value={ORCAMENTO_STATUS.aceito}>Aceito</option>
                <option value={ORCAMENTO_STATUS.rejeitado}>Rejeitado</option>
                <option value={ORCAMENTO_STATUS.convertido_em_fatura}>Converter Fatura</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Orçamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Orçamentos</CardTitle>
          <CardDescription>Total: {orcamentos.length} orçamentos</CardDescription>
        </CardHeader>
        <CardContent>
          {orcamentosQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Carregando orçamentos...</p>
            </div>
          ) : orcamentos.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {pacienteFilter
                    ? "Nenhum orçamento para este paciente"
                    : "Filtro um paciente para ver seus orçamentos"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {orcamentos.map((orcamento) => (
                <div
                  key={orcamento.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">Orçamento {orcamento.id.slice(0, 8)}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(orcamento.data_emissao).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        R$ {orcamento.valor_total.toFixed(2)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                        {orcamento.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Novo Orçamento */}
      <NovoOrcamentoModal
        open={novoOrcamentoAberto}
        onOpenChange={setNovoOrcamentoAberto}
        onSucesso={handleSucesso}
      />
    </div>
  );
}
