import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, AlertCircle, Download } from "lucide-react";
import { useRelatorioFinanceiro, usePacientesComDebito } from "@/features/financeiro/api";
import { toast } from "@/hooks/use-toast";

export function DashboardFinanceiro() {
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });

  const [dataFim, setDataFim] = useState(new Date().toISOString().split("T")[0]);

  const { data: relatorio, isLoading: relLoading } = useRelatorioFinanceiro(dataInicio, dataFim);
  const { data: pacientesComDebito = [], isLoading: debtLoading } = usePacientesComDebito();

  const handleExportCSV = () => {
    if (!relatorio) {
      toast({
        title: "Aviso",
        description: "Nenhum dado para exportar",
        variant: "destructive",
      });
      return;
    }

    const csv = `Período,${relatorio.periodo.inicio} a ${relatorio.periodo.fim}
Total Faturado,R$ ${relatorio.total_faturado.toFixed(2)}
Total Recebido,R$ ${relatorio.total_recebido.toFixed(2)}
Total Pendente,R$ ${relatorio.total_pendente.toFixed(2)}
Total Vencido,R$ ${relatorio.total_vencido.toFixed(2)}
Taxa de Recebimento,${relatorio.taxa_recebimento.toFixed(2)}%
Quantidade de Faturas,${relatorio.quantidade_faturas}
Faturas Pagas,${relatorio.quantidade_faturas_pagas}
Faturas Pendentes,${relatorio.quantidade_faturas_pendentes}`;

    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(csv));
    element.setAttribute("download", `relatorio-financeiro-${dataInicio}-${dataFim}.csv`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Sucesso",
      description: "Relatório exportado com sucesso",
    });
  };

  const cards = [
    {
      title: "Total Faturado",
      value: relatorio ? `R$ ${relatorio.total_faturado.toFixed(2).replace(".", ",")}` : "R$ 0,00",
      icon: DollarSign,
      color: "text-blue-500",
      description: "Período selecionado",
    },
    {
      title: "Total Recebido",
      value: relatorio ? `R$ ${relatorio.total_recebido.toFixed(2).replace(".", ",")}` : "R$ 0,00",
      icon: TrendingUp,
      color: "text-green-500",
      description: "Período selecionado",
    },
    {
      title: "Pendente",
      value: relatorio ? `R$ ${relatorio.total_pendente.toFixed(2).replace(".", ",")}` : "R$ 0,00",
      icon: Clock,
      color: "text-yellow-500",
      description: "Aguardando pagamento",
    },
    {
      title: "Vencido",
      value: relatorio ? `R$ ${relatorio.total_vencido.toFixed(2).replace(".", ",")}` : "R$ 0,00",
      icon: AlertCircle,
      color: "text-red-500",
      description: "Acima da data de vencimento",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Financeiro</h2>
        <p className="text-sm text-muted-foreground">Resumo de faturamento e recebimentos</p>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por Período</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div className="flex gap-2">
            <Input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
            <Input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const IconComponent = card.icon;
          return (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {card.title}
                  <IconComponent className={`h-4 w-4 ${card.color}`} />
                </CardTitle>
                <CardDescription className="text-xs">{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Estatísticas */}
      {relatorio && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Período</CardTitle>
            <CardDescription>Resumo detalhado</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Recebimento</p>
              <p className="text-3xl font-bold text-green-600">{relatorio.taxa_recebimento.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantidade de Faturas</p>
              <p className="text-3xl font-bold">{relatorio.quantidade_faturas}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Faturas Pagas / Pendentes</p>
              <p className="text-3xl font-bold">
                {relatorio.quantidade_faturas_pagas} / {relatorio.quantidade_faturas_pendentes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Pacientes com Débito */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Devedores</CardTitle>
          <CardDescription>Pacientes com maiores débitos pendentes</CardDescription>
        </CardHeader>
        <CardContent>
          {debtLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : pacientesComDebito.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum débito registrado</div>
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
                {pacientesComDebito.slice(0, 10).map((paciente) => (
                  <TableRow key={paciente.paciente_id}>
                    <TableCell className="font-mono text-sm">{paciente.paciente_id}</TableCell>
                    <TableCell className="font-bold">
                      R$ {paciente.total_devido.toFixed(2).replace(".", ",")}
                    </TableCell>
                    <TableCell>{paciente.dias_atraso} dias</TableCell>
                    <TableCell>{paciente.quantidade_faturas_vencidas}</TableCell>
                    <TableCell>
                      {paciente.dias_atraso > 30 ? (
                        <Badge variant="destructive">Crítico</Badge>
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

      {/* Resumo de Conversão */}
      {relatorio && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Período</CardTitle>
            <CardDescription>
              {relatorio.periodo.inicio} a {relatorio.periodo.fim}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>Total Desconto Aplicado:</span>
              <span className="font-bold">
                R$ {relatorio.total_desconto_aplicado.toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Faturado - Recebido (Gap):</span>
              <span className="font-bold text-yellow-600">
                R$ {(relatorio.total_faturado - relatorio.total_recebido).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Análise:</span>
              <span className="text-sm text-muted-foreground">
                {relatorio.taxa_recebimento > 80
                  ? "✅ Saúde financeira ótima"
                  : relatorio.taxa_recebimento > 50
                    ? "⚠️ Saúde financeira regular"
                    : "❌ Atenção necessária"}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
