import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClinicAuthProvider, RequireAdmin } from "@/features/auth/ClinicAuth";
import { queryClient } from "@/lib/react-query";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import Agenda from "./pages/admin/Agenda.tsx";
import Overview from "./pages/admin/Overview.tsx";
import AdminLogin from "./pages/admin/AdminLogin.tsx";
import Pacientes from "./pages/admin/Pacientes.tsx";
import { PacienteDetalhes } from "./pages/admin/PacienteDetalhes.tsx";
import Profissionais from "./pages/admin/Profissionais.tsx";
import Solicitacoes from "./pages/admin/Solicitacoes.tsx";
import Servicos from "./pages/admin/Servicos.tsx";
import Financeiro from "./pages/admin/Financeiro.tsx";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ClinicAuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
        </BrowserRouter>
      </TooltipProvider>
    </ClinicAuthProvider>
  </QueryClientProvider>
);

export default App;
