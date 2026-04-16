import { useEffect, useState } from "react";
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
import { useFaturas, useFinanceiroDevedores, useFinanceiroResumo } from "@/features/financeiro/api";
import { toast } from "@/hooks/use-toast";
import type { FaturaFilters, FaturaListItem, FaturaStatusType, PacienteComDebito } from "@/features/financeiro/types";

type ViewType = "resumo" | "devedores" | "faturas" | "mensalista";

const PAGE_SIZE = 20;

export function RelatorioAvancado() {
  const [viewType, setViewType] = useState<ViewType>("resumo");
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const { data: relatorio } = useFinanceiroResumo({
    dataFim,
    dataInicio,
  });
  const { data: pacientesComDebito = [] } = useFinanceiroDevedores({ limit: 20 });

  const filters: FaturaFilters = {
    data_fim: dataFim,
    data_inicio: dataInicio,
    page,
    pageSize: PAGE_SIZE,
    status: statusFiltro === "todos" ? undefined : (statusFiltro as FaturaStatusType),
  };
  const { data: faturasResult } = useFaturas(filters);
  const faturas = faturasResult?.items ?? [];
  const totalFaturas = faturasResult?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalFaturas / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [dataFim, dataInicio, statusFiltro, viewType]);

  const handleExportPDF = () => {
    toast({
      title: "Em desenvolvimento",
      description: "Export PDF sera implementado em breve",
    });
  };

  const handleExportCSV = () => {
    let csv = "";
    let filename = "";

    switch (viewType) {
      case "resumo":
        if (!relatorio) {
          return;
        }

        csv = `RELATORIO FINANCEIRO - PERIODO
Periodo,${relatorio.periodo.inicio} a ${relatorio.periodo.fim}
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
        csv = "RELATORIO DE DEVEDORES\nPaciente,Paciente ID,Total Devido,Dias em Atraso,Faturas Vencidas,Status\n";
        pacientesComDebito.forEach((p) => {
          const status = p.dias_atraso > 30 ? "Critico" : p.dias_atraso > 0 ? "Atraso" : "OK";
          csv += `"${p.nome}",${p.paciente_id},R$ ${p.total_devido.toFixed(2)},${p.dias_atraso},${p.quantidade_faturas_vencidas},${status}\n`;
        });
        filename = `relatorio-devedores-${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "faturas":
        csv = "RELATORIO DE FATURAS\nNumero NF,Data Emissao,Vencimento,Status,Valor Total,Valor Pago,Saldo\n";
        faturas.forEach((f) => {
          const saldo = f.valor_total - f.valor_pago;
          csv += `${f.numero_nf || "N/A"},${f.data_emissao},${f.data_vencimento || "N/A"},${f.status},R$ ${f.valor_total.toFixed(2)},R$ ${f.valor_pago.toFixed(2)},R$ ${saldo.toFixed(2)}\n`;
        });
        filename = `relatorio-faturas-${dataInicio}-${dataFim}-pagina-${page}.csv`;
        break;

      default:
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
      description: "Relatorio exportado com sucesso",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Relatorios Financeiros</h2>
        <p className="text-sm text-muted-foreground">Gere relatorios personalizados e exporte dados</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium">Tipo de Relatorio</label>
              <Select value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
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
              <label className="text-sm font-medium">Data Inicio</label>
              <Input onChange={(e) => setDataInicio(e.target.value)} type="date" value={dataInicio} />
            </div>

            <div>
              <label className="text-sm font-medium">Data Fim</label>
              <Input onChange={(e) => setDataFim(e.target.value)} type="date" value={dataFim} />
            </div>

            {viewType === "faturas" ? (
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
            ) : null}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportCSV} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={handleExportPDF} size="sm" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF (em breve)
            </Button>
          </div>
        </CardContent>
      </Card>

      {viewType === "resumo" && relatorio ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Periodo</CardTitle>
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
              <CardDescription>Metricas de desempenho</CardDescription>
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
      ) : null}

      {viewType === "devedores" ? (
        <Card>
          <CardHeader>
            <CardTitle>Pacientes com Debito</CardTitle>
            <CardDescription>Classificados por valor devido</CardDescription>
          </CardHeader>
          <CardContent>
            {pacientesComDebito.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Nenhum debito registrado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Total Devido</TableHead>
                    <TableHead>Dias em Atraso</TableHead>
                    <TableHead>Faturas Vencidas</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pacientesComDebito.map((paciente: PacienteComDebito) => (
                    <TableRow key={paciente.paciente_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{paciente.nome}</p>
                          <p className="font-mono text-xs text-muted-foreground">{paciente.paciente_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        R$ {paciente.total_devido.toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>{paciente.dias_atraso} dias</TableCell>
                      <TableCell>{paciente.quantidade_faturas_vencidas}</TableCell>
                      <TableCell>
                        {paciente.dias_atraso > 30 ? (
                          <Badge variant="destructive">Critico</Badge>
                        ) : paciente.dias_atraso > 0 ? (
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
      ) : null}

      {viewType === "faturas" ? (
        <Card>
          <CardHeader>
            <CardTitle>Faturas ({totalFaturas})</CardTitle>
            <CardDescription>
              Periodo: {dataInicio} a {dataFim}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {faturas.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">Nenhuma fatura encontrada</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero NF</TableHead>
                    <TableHead>Data Emissao</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faturas.map((fatura: FaturaListItem) => {
                    const saldo = fatura.valor_total - fatura.valor_pago;
                    return (
                      <TableRow key={fatura.id}>
                        <TableCell className="font-mono">{fatura.numero_nf || "N/A"}</TableCell>
                        <TableCell>{new Date(fatura.data_emissao).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {fatura.data_vencimento
                            ? new Date(fatura.data_vencimento).toLocaleDateString("pt-BR")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge>{fatura.status}</Badge>
                        </TableCell>
                        <TableCell>R$ {fatura.valor_total.toFixed(2).replace(".", ",")}</TableCell>
                        <TableCell className="text-green-600">
                          R$ {fatura.valor_pago.toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell className={saldo > 0 ? "font-bold text-red-600" : ""}>
                          R$ {saldo.toFixed(2).replace(".", ",")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {totalFaturas > 0 ? (
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
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {viewType === "mensalista" ? (
        <Card>
          <CardHeader>
            <CardTitle>Analise Mensalista</CardTitle>
            <CardDescription>Em desenvolvimento</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center text-muted-foreground">
            Relatorio de clientes mensalistas sera implementado em breve
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
