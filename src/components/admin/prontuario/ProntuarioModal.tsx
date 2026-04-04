import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useProntuariosPaciente } from "@/features/prontuarios/api";
import type { ProntuarioRecord } from "@/features/prontuarios/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ProntuarioModalProps {
  pacienteId: string;
  pacienteNome: string;
  isOpen: boolean;
  onClose: () => void;
  onViewCompleto?: (prontuarioId: string) => void;
  onCreateNew?: () => void;
}

export function ProntuarioModal({
  pacienteId,
  pacienteNome,
  isOpen,
  onClose,
  onViewCompleto,
  onCreateNew,
}: ProntuarioModalProps) {
  const [selectedProntuario, setSelectedProntuario] = useState<ProntuarioRecord | null>(null);

  const prontuariosQuery = useProntuariosPaciente({
    paciente_id: pacienteId,
    limit: 3,
  });

  const prontuarios = prontuariosQuery.data ?? [];

  useEffect(() => {
    if (prontuarios.length > 0 && !selectedProntuario) {
      setSelectedProntuario(prontuarios[0]);
    }
  }, [prontuarios, selectedProntuario]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">Prontuário - {pacienteNome}</DialogTitle>
              <DialogDescription>
                {prontuarios.length === 0
                  ? "Nenhum prontuário registrado"
                  : `${prontuarios.length} prontuário(s) encontrado(s)`}
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Separator />

        {prontuariosQuery.isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : prontuarios.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Nenhum prontuário para este paciente</p>
            <Button onClick={onCreateNew} variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Criar Prontuário
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List of pronouns */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Prontuários Recentes</h3>
              <div className="grid gap-2">
                {prontuarios.map((prontuario) => (
                  <button
                    key={prontuario.id}
                    onClick={() => setSelectedProntuario(prontuario)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedProntuario?.id === prontuario.id
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-input"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {new Date(prontuario.data_consulta).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {prontuario.queixa_principal || "Sem queixa registrada"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          há{" "}
                          {formatDistanceToNow(new Date(prontuario.created_at), {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Selected prontuario details */}
            {selectedProntuario && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Detalhes</h3>

                {selectedProntuario.queixa_principal && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Queixa Principal
                    </label>
                    <p className="text-sm mt-1">{selectedProntuario.queixa_principal}</p>
                  </div>
                )}

                {selectedProntuario.diagnostico && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">
                      Diagnóstico
                    </label>
                    <p className="text-sm mt-1">{selectedProntuario.diagnostico}</p>
                  </div>
                )}

                {selectedProntuario.conduta && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Conduta</label>
                    <p className="text-sm mt-1">{selectedProntuario.conduta}</p>
                  </div>
                )}

                {selectedProntuario.alergias && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground">Alergias</label>
                    <p className="text-sm mt-1">{selectedProntuario.alergias}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => {
                      onViewCompleto?.(selectedProntuario.id);
                      onClose();
                    }}
                    variant="default"
                    size="sm"
                    className="flex-1"
                  >
                    Ver Completo
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            <div className="flex gap-2">
              <Button onClick={onCreateNew} variant="outline" size="sm" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Novo Prontuário
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
