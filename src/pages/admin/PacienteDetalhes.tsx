import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { usePacientesAdminQuery } from "@/features/pacientes/api";
import { useProntuariosPaciente, useProntuarioById } from "@/features/prontuarios/api";
import { ProntuarioForm, TratamentoSection } from "@/components/admin/prontuario";
import type { PacienteRecord } from "@/features/pacientes/api";

export function PacienteDetalhes() {
  const { pacienteId } = useParams<{ pacienteId: string }>();
  const navigate = useNavigate();
  const [selectedProntuarioId, setSelectedProntuarioId] = useState<string | null>(null);

  const pacientesQuery = usePacientesAdminQuery({ search: "", status: "all" });
  const prontuariosQuery = useProntuariosPaciente({
    paciente_id: pacienteId!,
  });
  const selectedProntuarioQuery = useProntuarioById(selectedProntuarioId);

  const paciente = useMemo(() => {
    return (pacientesQuery.data ?? []).find((p) => p.id === pacienteId);
  }, [pacientesQuery.data, pacienteId]);

  const prontuarios = useMemo(() => prontuariosQuery.data ?? [], [prontuariosQuery.data]);

  useEffect(() => {
    if (prontuarios.length > 0 && !selectedProntuarioId) {
      setSelectedProntuarioId(prontuarios[0].id);
    }
  }, [prontuarios, selectedProntuarioId]);

  if (!pacienteId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Paciente não encontrado</p>
      </div>
    );
  }

  if (pacientesQuery.isLoading || prontuariosQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Paciente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{paciente.nome}</h1>
            <p className="text-sm text-muted-foreground">ID: {paciente.id}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Paciente */}
        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paciente.telefone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm font-medium">{paciente.telefone}</p>
                  </div>
                </div>
              )}

              {paciente.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium break-all">{paciente.email}</p>
                  </div>
                </div>
              )}

              {paciente.data_nascimento && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                    <p className="text-sm font-medium">
                      {new Date(paciente.data_nascimento).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}

              {paciente.cpf && (
                <div>
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="text-sm font-medium">{paciente.cpf}</p>
                </div>
              )}

              {paciente.endereco && (
                <div>
                  <p className="text-xs text-muted-foreground">Endereço</p>
                  <p className="text-sm font-medium">{paciente.endereco}</p>
                </div>
              )}

              {paciente.observacoes && (
                <div>
                  <p className="text-xs text-muted-foreground">Observações</p>
                  <p className="text-sm">{paciente.observacoes}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium">
                  {paciente.ativo ? "✓ Ativo" : "✗ Inativo"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prontuários Recentes */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Prontuários</CardTitle>
              <CardDescription>{prontuarios.length} registrado(s)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {prontuarios.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum prontuário
                </p>
              ) : (
                prontuarios.map((prontuario) => (
                  <button
                    key={prontuario.id}
                    onClick={() => setSelectedProntuarioId(prontuario.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedProntuarioId === prontuario.id
                        ? "bg-primary/10 border border-primary"
                        : "border border-transparent hover:bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {new Date(prontuario.data_consulta).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {prontuario.queixa_principal || "Sem queixa"}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Prontuários - Konten Utama */}
        <main className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="prontuario" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prontuario">Prontuário</TabsTrigger>
              <TabsTrigger value="novo">Novo Prontuário</TabsTrigger>
            </TabsList>

            <TabsContent value="prontuario" className="space-y-4 mt-4">
              {selectedProntuarioQuery.isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : selectedProntuarioId && selectedProntuarioQuery.data ? (
                <>
                  <ProntuarioForm
                    pacienteId={paciente.id}
                    prontuarioId={selectedProntuarioId}
                    profissionalId={selectedProntuarioQuery.data.profissional_id}
                    onSuccess={() => {
                      toast({
                        title: "Sucesso",
                        description: "Prontuário atualizado com sucesso.",
                      });
                    }}
                  />

                  <TratamentoSection
                    prontuarioId={selectedProntuarioId}
                    pacienteId={paciente.id}
                  />
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Selecione um prontuário para.VIEW</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="novo" className="mt-4">
              <ProntuarioForm
                pacienteId={paciente.id}
                profissionalId={paciente.id} // Aqui você pode criar um padrão ou deixar o usuário escolher
                onSuccess={() => {
                  toast({
                    title: "Sucesso",
                    description: "Novo prontuário criado com sucesso.",
                  });
                  // Recarregar prontuários
                  prontuariosQuery.refetch();
                }}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
