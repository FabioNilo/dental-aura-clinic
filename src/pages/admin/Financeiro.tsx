import { FinanceiroModule } from "@/components/admin/financeiro/FinanceiroModule";

/**
 * Página de Gestão Financeira
 * Centraliza all financial operations: budgets, invoices, payments, reports
 */
export default function Financeiro() {
  return (
    <div className="flex-1">
      <FinanceiroModule />
    </div>
  );
}
