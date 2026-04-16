import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Check } from "lucide-react";
import { PacienteAutocomplete } from "./PacienteAutocomplete";
import { useCriarOrcamento, useServicos, type PacienteComCPF } from "@/features/financeiro/api";
import type { Servico } from "@/features/financeiro/types";
import { toast } from "@/hooks/use-toast";

interface NovoOrcamentoModalProps {
  onOpenChange: (open: boolean) => void;
  onSucesso?: () => void;
  open: boolean;
}

interface ItemOrcamento {
  preco_unitario: number;
  quantidade: number;
  servico_id: string;
  servico_nome: string;
  tempId?: string;
}

export function NovoOrcamentoModal({ open, onOpenChange, onSucesso }: NovoOrcamentoModalProps) {
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteComCPF | null>(null);
  const [servicoId, setServicoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [salvando, setSalvando] = useState(false);

  const { data: servicos = [] } = useServicos();
  const criarOrcamento = useCriarOrcamento();

  const servicoSelecionado = servicos.find((servico: Servico) => servico.id === servicoId);

  const handleAdicionarItem = () => {
    if (!servicoId || !servicoSelecionado) {
      toast({ title: "Erro", description: "Selecione um servico", variant: "destructive" });
      return;
    }

    if (!quantidade || Number.parseInt(quantidade, 10) <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que 0",
        variant: "destructive",
      });
      return;
    }

    const novoItem: ItemOrcamento = {
      preco_unitario: servicoSelecionado.preco,
      quantidade: Number.parseInt(quantidade, 10),
      servico_id: servicoId,
      servico_nome: servicoSelecionado.nome,
      tempId: Math.random().toString(),
    };

    setItens((current) => [...current, novoItem]);
    setServicoId("");
    setQuantidade("1");
  };

  const handleRemoverItem = (tempId: string | undefined) => {
    setItens((current) => current.filter((item) => item.tempId !== tempId));
  };

  const handleSalvar = async () => {
    if (!pacienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um paciente",
        variant: "destructive",
      });
      return;
    }

    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao orcamento",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);

    try {
      const valorTotal = itens.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);

      await criarOrcamento.mutateAsync({
        desconto_tipo: null,
        desconto_valor: 0,
        itens: itens.map((item) => ({
          descricao: item.servico_nome,
          preco_unitario: item.preco_unitario,
          quantidade: item.quantidade,
          servico_id: item.servico_id,
        })),
        paciente_id: pacienteSelecionado.id,
        prontuario_id: null,
        status: "rascunho",
        valor_total: valorTotal,
      });

      toast({
        title: "Sucesso",
        description: "Orcamento criado com sucesso",
      });

      setPacienteSelecionado(null);
      setItens([]);
      setServicoId("");
      setQuantidade("1");
      onOpenChange(false);
      onSucesso?.();
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao criar orcamento",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const valorTotal = itens.reduce((sum, item) => sum + item.preco_unitario * item.quantidade, 0);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Orcamento</DialogTitle>
          <DialogDescription>Crie um novo orcamento para o paciente</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="paciente">Paciente *</Label>
            <PacienteAutocomplete
              onSelect={setPacienteSelecionado}
              placeholder="Digite o nome do paciente..."
            />
          </div>

          {pacienteSelecionado ? (
            <>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <h3 className="text-sm font-medium">Adicionar Itens</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="servico">Servico</Label>
                      <Select onValueChange={setServicoId} value={servicoId}>
                        <SelectTrigger id="servico">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos.map((servico: Servico) => (
                            <SelectItem key={servico.id} value={servico.id}>
                              {servico.nome} - R$ {servico.preco.toFixed(2).replace(".", ",")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        min="1"
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="1"
                        type="number"
                        value={quantidade}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button className="w-full gap-2" disabled={!servicoId} onClick={handleAdicionarItem}>
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {servicoSelecionado ? (
                    <div className="text-sm text-muted-foreground">
                      Subtotal: R$ {(servicoSelecionado.preco * Number.parseInt(quantidade || "1", 10))
                        .toFixed(2)
                        .replace(".", ",")}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {itens.length > 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="mb-4 text-sm font-medium">Itens do Orcamento</h3>
                    <div className="space-y-3">
                      {itens.map((item) => (
                        <div
                          className="flex items-center justify-between rounded-md bg-gray-50 p-3"
                          key={item.tempId}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.servico_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantidade}x R$ {item.preco_unitario.toFixed(2).replace(".", ",")} = R${" "}
                              {(item.preco_unitario * item.quantidade).toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <Button
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleRemoverItem(item.tempId)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex items-center justify-between border-t-2 pt-3 font-bold">
                        <span>Total:</span>
                        <span>R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancelar
          </Button>
          <Button
            className="gap-2"
            disabled={!pacienteSelecionado || itens.length === 0 || salvando}
            onClick={handleSalvar}
          >
            {salvando ? (
              <>Salvando...</>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Criar Orcamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
