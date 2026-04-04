import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function FaturaManager() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Faturas / Notas de Serviço</h2>
          <p className="text-sm text-muted-foreground">Gerencie documentos fiscais e pagamentos</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Fatura
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta seção logo permitirá criar, visualizar e gerenciar faturas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-12 w-12 mx-auto text-muted-foreground mb-2 animate-spin" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
