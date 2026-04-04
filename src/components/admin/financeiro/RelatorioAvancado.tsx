import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText } from "lucide-react";
import { useRelatorioFinanceiro, usePacientesComDebito, useFaturas } from "@/features/financeiro/api";
import { toast } from "@/hooks/use-toast";
import type { FaturaFilters, FaturaStatusType, PacienteComDebito, Fatura } from "@/features/financeiro/types";

type ViewType = "resumo" | "devedores" | "faturas" | "mensalista";

export function RelatorioAvancado() {
  const [viewType, setViewType] = useState<ViewType>("resumo");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const { data: relatorio } = useRelatorioFinanceiro(dataInicio, dataFim);
  const { data: pacientesComDebito = [] } = usePacientesComDebito();

  const filters: FaturaFilters = {
    data_inicio: dataInicio,
    data_fim: dataFim,
    status:
      statusFiltro === "todos"
        ? undefined
        : (statusFiltro as FaturaStatusType),
  };
  const { data: faturas = [] } = useFaturas(filters);

  const handleExportPDF = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Export PDF será implementado em breve",
    });
  };

  const handleExportCSV = () => {
    let csv = "";
    let filename = "";

    switch (viewType) {
      case "resumo":
        if (!relatorio) return;
        csv = `RELATÓRIO FINANCEIRO - PERÍODO
Período,${relatorio.periodo.inicio} a ${relatorio.periodo.fim}
---
Total Faturado,R$ ${relatorio.total_faturado.toFixed(2)}
Total Recebido,R$ ${relatorio.total_recebido.toFixed(2)}
Total Pendente,R$ ${relatorio.total_pendente.toFixed(2)}
Total Vencido,R$ ${relatorio.total_vencido.toFixed(2)}
Total Desconto,R$ ${relatorio.total_desconto_aplicado.toFixed(2)}
---
Taxa de Recebimento,${relatorio.taxa_recebimento.toFixed(2)}%
Quantidade de Faturas,${relatorio.quantidade_faturas}
Faturas Pagas,${relatorio.quantidade_faturas_pagas}
Faturas Pendentes,${relatorio.quantidade_faturas_pendentes}`;
        filename = `relatorio-resumo-${dataInicio}-${dataFim}.csv`;
        break;

      case "devedores":
        csv = "RELATÓRIO DE DEVEDORES\nPaciente ID,Total Devido,Dias em Atraso,Faturas Vencidas,Status\n";
        pacientesComDebito.forEach((p) => {
          csv += `${p.paciente_id},R$ ${p.total_devido.toFixed(2)},${p.dias_atraso},${p.quantidade_faturas_vencidas},"${p.dias_atraso > 30 ? "Crítico" : p.dias_atraso > 0 ? "Atraso" : "OK"}"\n`;
        });
        filename = `relatorio-devedores-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "faturas":
        csv = "RELATÓRIO DE FATURAS\nNumero NF,Data Emissão,Vencimento,Status,Valor Total,Valor Pago,Saldo\n";
        faturas.forEach((f) => {
          const saldo = f.valor_total - f.valor_pago;
          csv += `${f.numero_nf || "N/A"},${f.data_emissao},${f.data_vencimento || "N/A"},${f.status},R$ ${f.valor_total.toFixed(2)},R$ ${f.valor_pago.toFixed(2)},R$ ${saldo.toFixed(2)}\n`;
        });
        filename = `relatorio-faturas-${dataInicio}-${dataFim}.csv`;
        break;
    }

    if (!csv) {
      toast({
        title: "Aviso",
        description: "Nenhum dado para exportar",
        variant: "destructive",
      });
      return;
    }

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
        <p className="text-sm text-muted-foreground">Gere relatórios personalizados e exporte dados</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={viewType} onValueChange={(v) => setViewType(v as ViewType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resumo">Resumo Financeiro</SelectItem>
                  <SelectItem value="devedores">Devedores</SelectItem>
                  <SelectItem value="faturas">Faturas</SelectItem>
                  <SelectItem value="mensalista">Mensalista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Data Início</label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            {viewType === "faturas" && (
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="emitida">Emitida</SelectItem>
                    <SelectItem value="parcialmente_paga">Parcialmente Paga</SelectItem>
                    <SelectItem value="paga">Paga</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF (em breve)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo por Tipo */}
      {viewType === "resumo" && relatorio && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
              <CardDescription>
                {relatorio.periodo.inicio} a {relatorio.periodo.fim}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Faturado:</span>
                <span className="font-bold text-blue-600">
                  R$ {relatorio.total_faturado.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Recebido:</span>
                <span className="font-bold text-green-600">
                  R$ {relatorio.total_recebido.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Pendente:</span>
                <span className="font-bold text-yellow-600">
                  R$ {relatorio.total_pendente.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Total Vencido:</span>
                <span className="font-bold text-red-600">
                  R$ {relatorio.total_vencido.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Desconto Aplicado:</span>
                <span className="font-bold">
                  R$ {relatorio.total_desconto_aplicado.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicadores</CardTitle>
              <CardDescription>Métricas de desempenho</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Taxa de Recebimento:</span>
                <span className="font-bold text-lg">{relatorio.taxa_recebimento.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Quantidade de Faturas:</span>
                <span className="font-bold text-lg">{relatorio.quantidade_faturas}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Faturas Pagas:</span>
                <span className="font-bold text-green-600">{relatorio.quantidade_faturas_pagas}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faturas Pendentes:</span>
                <span className="font-bold text-yellow-600">{relatorio.quantidade_faturas_pendentes}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewType === "devedores" && (
        <Card>
          <CardHeader>
            <CardTitle>Pacientes com Débito</CardTitle>
            <CardDescription>Classificados por valor devido</CardDescription>
          </CardHeader>
          <CardContent>
            {pacientesComDebito.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum débito registrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente ID</TableHead>
                    <TableHead>Total Devido</TableHead>
                    <TableHead>Dias em Atraso</TableHead>
                    <TableHead>Faturas Vencidas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientesComDebito.map((p: PacienteComDebito) => (
                    <TableRow key={p.paciente_id}>
                      <TableCell className="font-mono text-sm">{p.paciente_id}</TableCell>
                      <TableCell className="font-bold">
                        R$ {p.total_devido.toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>{p.dias_atraso} dias</TableCell>
                      <TableCell>{p.quantidade_faturas_vencidas}</TableCell>
                      <TableCell>
                        {p.dias_atraso > 30 ? (
                          <Badge variant="destructive">Crítico</Badge>
                        ) : p.dias_atraso > 0 ? (
                          <Badge variant="secondary">Atraso</Badge>
                        ) : (
                          <Badge>OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewType === "faturas" && (
        <Card>
          <CardHeader>
            <CardTitle>Faturas ({faturas.length})</CardTitle>
            <CardDescription>
              Período: {dataInicio} a {dataFim}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {faturas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma fatura encontrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número NF</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((f: Fatura) => {
                    const saldo = f.valor_total - f.valor_pago;
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="font-mono">{f.numero_nf || "N/A"}</TableCell>
                        <TableCell>
                          {new Date(f.data_emissao).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {f.data_vencimento
                            ? new Date(f.data_vencimento).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge>{f.status}</Badge>
                        </TableCell>
                        <TableCell>R$ {f.valor_total.toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell className="text-green-600">
                          R$ {f.valor_pago.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className={saldo > 0 ? "text-red-600 font-bold" : ""}>
                          R$ {saldo.toFixed(2).replace(".", ",")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewType === "mensalista" && (
        <Card>
          <CardHeader>
            <CardTitle>Análise Mensalista</CardTitle>
            <CardDescription>Em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8 text-muted-foreground">
            Relatório de clientes mensalistas será implementado em breve
          </CardContent>
        </Card>
      )}
    </div>
  );
}
