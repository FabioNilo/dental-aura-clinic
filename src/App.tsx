import { Suspense, lazy } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClinicAuthProvider, RequireAdmin } from "@/features/auth/ClinicAuth";
import { queryClient } from "@/lib/react-query";

const routerFuture = {
  v7_relativeSplatPath: true,
  v7_startTransition: true,
} as const;

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout.tsx"));
const Agenda = lazy(() => import("./pages/admin/Agenda.tsx"));
const Overview = lazy(() => import("./pages/admin/Overview.tsx"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const Pacientes = lazy(() => import("./pages/admin/Pacientes.tsx"));
const PacienteDetalhes = lazy(() =>
  import("./pages/admin/PacienteDetalhes.tsx").then((module) => ({
    default: module.PacienteDetalhes,
  })),
);
const Profissionais = lazy(() => import("./pages/admin/Profissionais.tsx"));
const Solicitacoes = lazy(() => import("./pages/admin/Solicitacoes.tsx"));
const Servicos = lazy(() => import("./pages/admin/Servicos.tsx"));
const Financeiro = lazy(() => import("./pages/admin/Financeiro.tsx"));

const RouteLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6 text-sm text-muted-foreground">
    Carregando painel...
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClinicAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={routerFuture}>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<Overview />} />
                <Route path="agenda" element={<Agenda />} />
                <Route path="pacientes" element={<Pacientes />} />
                <Route path="pacientes/:pacienteId" element={<PacienteDetalhes />} />
                <Route path="solicitacoes" element={<Solicitacoes />} />
                <Route path="profissionais" element={<Profissionais />} />
                <Route path="servicos" element={<Servicos />} />
                <Route path="financeiro" element={<Financeiro />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </ClinicAuthProvider>
  </QueryClientProvider>
);

export default App;
