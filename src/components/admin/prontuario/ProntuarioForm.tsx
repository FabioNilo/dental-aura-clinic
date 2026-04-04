import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  useCreateProntuario,
  useUpdateProntuario,
  useProntuarioById,
} from "@/features/prontuarios/api";
import type { CreateProntuarioInput, ProntuarioRecord } from "@/features/prontuarios/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ProntuarioFormProps {
  pacienteId: string;
  prontuarioId?: string | null;
  agendamentoId?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  onSuccess?: (prontuario: ProntuarioRecord) => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

type FormState = {
  queixa_principal: string;
  historico_doencas: string;
  alergias: string;
  medicacoes_atuais: string;
  exame_fisico: string;
  diagnostico: string;
  conduta: string;
  observacoes_gerais: string;
};

function emptyFormState(): FormState {
  return {
    queixa_principal: "",
    historico_doencas: "",
    alergias: "",
    medicacoes_atuais: "",
    exame_fisico: "",
    diagnostico: "",
    conduta: "",
    observacoes_gerais: "",
  };
}

function mapProntuarioToForm(prontuario: any): FormState {
  return {
    queixa_principal: prontuario.queixa_principal ?? "",
    historico_doencas: prontuario.historico_doencas ?? "",
    alergias: prontuario.alergias ?? "",
    medicacoes_atuais: prontuario.medicacoes_atuais ?? "",
    exame_fisico: prontuario.exame_fisico ?? "",
    diagnostico: prontuario.diagnostico ?? "",
    conduta: prontuario.conduta ?? "",
    observacoes_gerais: prontuario.observacoes_gerais ?? "",
  };
}

function normalizeOptionalValue(value: string) {
  return value.trim() || null;
}

export function ProntuarioForm({
  pacienteId,
  prontuarioId,
  agendamentoId,
  profissionalId,
  profissionalNome,
  onSuccess,
  onCancel,
  readOnly = false,
}: ProntuarioFormProps) {
  const [form, setForm] = useState<FormState>(emptyFormState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const prontuarioQuery = useProntuarioById(prontuarioId);
  const createProntuario = useCreateProntuario();
  const updateProntuario = useUpdateProntuario();

  // Load data if editing
  useEffect(() => {
    if (prontuarioId && prontuarioQuery.data) {
      setForm(mapProntuarioToForm(prontuarioQuery.data as any));
    } else {
      setForm(emptyFormState());
    }
  }, [prontuarioId, prontuarioQuery.data]);

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: CreateProntuarioInput = {
        paciente_id: pacienteId,
        profissional_id: profissionalId || undefined,
        profissional_nome: profissionalNome || undefined,
        agendamento_id: agendamentoId,
        queixa_principal: normalizeOptionalValue(form.queixa_principal),
        historico_doencas: normalizeOptionalValue(form.historico_doencas),
        alergias: normalizeOptionalValue(form.alergias),
        medicacoes_atuais: normalizeOptionalValue(form.medicacoes_atuais),
        exame_fisico: normalizeOptionalValue(form.exame_fisico),
        diagnostico: normalizeOptionalValue(form.diagnostico),
        conduta: normalizeOptionalValue(form.conduta),
        observacoes_gerais: normalizeOptionalValue(form.observacoes_gerais),
      };

      let result;
      if (prontuarioId && prontuarioQuery.data) {
        // Update
        result = await updateProntuario.mutateAsync({
          id: prontuarioId,
          ...payload,
        });
        toast({
          title: "Prontuário atualizado",
          description: "Os dados foram salvos com sucesso.",
        });
      } else {
        // Create
        result = await createProntuario.mutateAsync(payload);
        toast({
          title: "Prontuário criado",
          description: "Novo prontuário registrado com sucesso.",
        });
      }
      onSuccess?.(result as any);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Algo deu errado";
      console.error("Erro ao salvar prontuário:", errorMessage);
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (prontuarioQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEditing = !!prontuarioId;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Editar Prontuário" : "Novo Prontuário"}</CardTitle>
          <CardDescription>Preencha os dados da consulta odontológica</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Queixa Principal */}
          <div className="grid gap-2">
            <Label htmlFor="queixa_principal">Queixa Principal</Label>
            <Textarea
              id="queixa_principal"
              placeholder="Ex: Dor no dente 26, sensibilidade..."
              value={form.queixa_principal}
              onChange={(e) => handleChange("queixa_principal", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Histórico de Doenças */}
          <div className="grid gap-2">
            <Label htmlFor="historico_doencas">Histórico de Doenças</Label>
            <Textarea
              id="historico_doencas"
              placeholder="Histórico médico/odontológico relevante..."
              value={form.historico_doencas}
              onChange={(e) => handleChange("historico_doencas", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Alergias */}
          <div className="grid gap-2">
            <Label htmlFor="alergias">Alergias</Label>
            <Textarea
              id="alergias"
              placeholder="Alergias conhecidas (medicamentos, materiais, etc...)"
              value={form.alergias}
              onChange={(e) => handleChange("alergias", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Medicações Atuais */}
          <div className="grid gap-2">
            <Label htmlFor="medicacoes_atuais">Medicações Atuais</Label>
            <Textarea
              id="medicacoes_atuais"
              placeholder="Medicamentos que o paciente está tomando..."
              value={form.medicacoes_atuais}
              onChange={(e) => handleChange("medicacoes_atuais", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Exame Físico */}
          <div className="grid gap-2">
            <Label htmlFor="exame_fisico">Exame Físico</Label>
            <Textarea
              id="exame_fisico"
              placeholder="Achados do exame intraoral e extraoral..."
              value={form.exame_fisico}
              onChange={(e) => handleChange("exame_fisico", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Diagnóstico */}
          <div className="grid gap-2">
            <Label htmlFor="diagnostico">Diagnóstico</Label>
            <Textarea
              id="diagnostico"
              placeholder="Diagnóstico clínico..."
              value={form.diagnostico}
              onChange={(e) => handleChange("diagnostico", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Conduta */}
          <div className="grid gap-2">
            <Label htmlFor="conduta">Conduta / Plano de Tratamento</Label>
            <Textarea
              id="conduta"
              placeholder="Plano de tratamento proposto..."
              value={form.conduta}
              onChange={(e) => handleChange("conduta", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Observações Gerais */}
          <div className="grid gap-2">
            <Label htmlFor="observacoes_gerais">Observações Gerais</Label>
            <Textarea
              id="observacoes_gerais"
              placeholder="Anotações adicionais..."
              value={form.observacoes_gerais}
              onChange={(e) => handleChange("observacoes_gerais", e.target.value)}
              disabled={readOnly}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          {!readOnly && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || createProntuario.isPending || updateProntuario.isPending}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  "Atualizar Prontuário"
                ) : (
                  "Criar Prontuário"
                )}
              </Button>
              {onCancel && (
                <Button onClick={onCancel} variant="outline">
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
