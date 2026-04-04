import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, DollarSign, Receipt, Ticket } from "lucide-react";
import { OrcamentoManager } from "./OrcamentoManager";
import { FaturaManager } from "./FaturaManager";
import { DashboardFinanceiro } from "./DashboardFinanceiro";
import { CupomManager } from "./CupomManager";

export default function FinanceiroLayout() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie orçamentos, faturas, pagamentos e promoções
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Orçamentos</span>
          </TabsTrigger>
          <TabsTrigger value="faturas" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="cupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            <span className="hidden sm:inline">Cupons</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <DashboardFinanceiro />
        </TabsContent>

        {/* Orçamentos Tab */}
        <TabsContent value="orcamentos">
          <OrcamentoManager />
        </TabsContent>

        {/* Faturas Tab */}
        <TabsContent value="faturas">
          <FaturaManager />
        </TabsContent>

        {/* Cupons Tab */}
        <TabsContent value="cupons">
          <CupomManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
