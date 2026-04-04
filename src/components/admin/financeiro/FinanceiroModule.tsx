import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, DollarSign, Settings, TrendingUp, BarChart3 } from "lucide-react";
import { OrcamentoManager } from "./OrcamentoManager.tsx";
import { FaturaManager } from "./FaturaManager.tsx";
import { DashboardFinanceiro } from "./DashboardFinanceiro.tsx";
import { CupomManager } from "./CupomManager.tsx";
import { RelatorioAvancado } from "./RelatorioAvancado";

export function FinanceiroModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie orçamentos, faturas, pagamentos e relatórios financeiros
        </p>
      </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Orçamentos</span>
          </TabsTrigger>
          <TabsTrigger value="faturas" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="cupons" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Cupons</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <DashboardFinanceiro />
        </TabsContent>

        {/* Orçamentos Tab */}
        <TabsContent value="orcamentos" className="space-y-4">
          <OrcamentoManager />
        </TabsContent>

        {/* Faturas Tab */}
        <TabsContent value="faturas" className="space-y-4">
          <FaturaManager />
        </TabsContent>

        {/* Relatórios Tab */}
        <TabsContent value="relatorios" className="space-y-4">
          <RelatorioAvancado />
        </TabsContent>

        {/* Cupons Tab */}
        <TabsContent value="cupons" className="space-y-4">
          <CupomManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
