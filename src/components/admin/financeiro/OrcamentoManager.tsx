import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Calendar, TrendingUp } from "lucide-react";
import { useOrcamentosPaciente } from "@/features/financeiro/api";
import { ORCAMENTO_STATUS, type OrcamentoStatusType } from "@/features/financeiro/types";
import { NovoOrcamentoModal } from "./NovoOrcamentoModal";

const PAGE_SIZE = 20;

export function OrcamentoManager() {
  const [pacienteFilter, setPacienteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrcamentoStatusType | null>(null);
  const [page, setPage] = useState(1);
  const [novoOrcamentoAberto, setNovoOrcamentoAberto] = useState(false);
  const queryClient = useQueryClient();

  const orcamentosQuery = useOrcamentosPaciente(pacienteFilter || "", {
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter ?? undefined,
  });

  const orcamentos = orcamentosQuery.data?.items ?? [];
  const totalCount = orcamentosQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [pacienteFilter, statusFilter]);

  const handleSucesso = () => {
    queryClient.invalidateQueries({ queryKey: ["orcamentos-paciente"] });
    queryClient.invalidateQueries({ queryKey: ["orcamento"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Orcamentos</h2>
          <p className="text-sm text-muted-foreground">Cotacoes de procedimentos para pacientes</p>
        </div>
        <Button className="gap-2" onClick={() => setNovoOrcamentoAberto(true)}>
          <Plus className="h-4 w-4" />
          Novo Orcamento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="paciente-filter">Paciente ID</Label>
              <Input
                id="paciente-filter"
                onChange={(e) => setPacienteFilter(e.target.value)}
                placeholder="Cole UUID do paciente"
                value={pacienteFilter}
              />
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <select
                className="w-full rounded-md border px-3 py-2"
                id="status-filter"
                onChange={(e) => setStatusFilter((e.target.value as OrcamentoStatusType) || null)}
                value={statusFilter || ""}
              >
                <option value="">Todos</option>
                <option value={ORCAMENTO_STATUS.rascunho}>Rascunho</option>
                <option value={ORCAMENTO_STATUS.enviado}>Enviado</option>
                <option value={ORCAMENTO_STATUS.aceito}>Aceito</option>
                <option value={ORCAMENTO_STATUS.rejeitado}>Rejeitado</option>
                <option value={ORCAMENTO_STATUS.convertido_em_fatura}>Convertido em Fatura</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lista de Orcamentos</CardTitle>
          <CardDescription>
            {pacienteFilter
              ? `Mostrando ${orcamentos.length} de ${totalCount} orcamentos`
              : "Informe um paciente para carregar a lista paginada"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orcamentosQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <p className="text-muted-foreground">Carregando orcamentos...</p>
            </div>
          ) : orcamentos.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <FileText className="mb-2 mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum orcamento encontrado</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pacienteFilter
                    ? "Nenhum orcamento para este paciente"
                    : "Filtre um paciente para ver seus orcamentos"}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {orcamentos.map((orcamento) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
                    key={orcamento.id}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">Orcamento {orcamento.id.slice(0, 8)}</p>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(orcamento.data_emissao).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          R$ {orcamento.valor_total.toFixed(2)}
                        </span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          {orcamento.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Pagina {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <Button
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    size="sm"
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

      <NovoOrcamentoModal
        onOpenChange={setNovoOrcamentoAberto}
        onSucesso={handleSucesso}
        open={novoOrcamentoAberto}
      />
    </div>
  );
}
