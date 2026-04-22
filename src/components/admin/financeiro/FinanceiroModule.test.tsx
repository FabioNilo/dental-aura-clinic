import { createContext, useContext, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FinanceiroModule } from "@/components/admin/financeiro/FinanceiroModule";

type TabsContextValue = {
  onValueChange?: (value: string) => void;
  value?: string;
};

const TabsContext = createContext<TabsContextValue>({});

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({
    children,
    onValueChange,
    value,
  }: {
    children?: ReactNode;
    onValueChange?: (value: string) => void;
    value?: string;
  }) => (
    <TabsContext.Provider value={{ onValueChange, value }}>
      <div>{children}</div>
    </TabsContext.Provider>
  ),
  TabsContent: ({ children, value }: { children?: ReactNode; value: string }) => {
    const context = useContext(TabsContext);
    return context.value === value ? <div>{children}</div> : null;
  },
  TabsList: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: { children?: ReactNode; value: string }) => {
    const context = useContext(TabsContext);

    return (
      <button onClick={() => context.onValueChange?.(value)} role="tab" type="button">
        {children}
      </button>
    );
  },
}));

vi.mock("@/components/admin/financeiro/OrcamentoManager.tsx", () => ({
  OrcamentoManager: () => <div>orcamentos-content</div>,
}));

vi.mock("@/components/admin/financeiro/FaturaManager.tsx", () => ({
  FaturaManager: () => <div>faturas-content</div>,
}));

vi.mock("@/components/admin/financeiro/DashboardFinanceiro.tsx", () => ({
  DashboardFinanceiro: () => <div>dashboard-content</div>,
}));

vi.mock("@/components/admin/financeiro/CupomManager.tsx", () => ({
  CupomManager: () => <div>cupons-content</div>,
}));

vi.mock("@/components/admin/financeiro/RelatorioAvancado", () => ({
  RelatorioAvancado: () => <div>relatorios-content</div>,
}));

describe("FinanceiroModule", () => {
  it("shows the dashboard first and switches tabs", () => {
    render(<FinanceiroModule />);

    expect(screen.getByText("dashboard-content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /faturas/i }));
    expect(screen.getByText("faturas-content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /cupons/i }));
    expect(screen.getByText("cupons-content")).toBeInTheDocument();
  });
});
