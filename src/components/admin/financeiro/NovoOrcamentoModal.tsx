import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check } from "lucide-react";
import { PacienteAutocomplete } from "./PacienteAutocomplete";
import { useCriarOrcamento, useServiços, type PacienteComCPF } from "@/features/financeiro/api";
import { type Servico } from "@/features/financeiro/types";
import { toast } from "@/hooks/use-toast";

interface NovoOrcamentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSucesso?: () => void;
}

interface ItemOrcamento {
  temId?: string;
  servico_id: string;
  servico_nome: string;
  preco_unitario: number;
  quantidade: number;
}

export function NovoOrcamentoModal({ open, onOpenChange, onSucesso }: NovoOrcamentoModalProps) {
  const [pacienteSelecionado, setPacienteSelecionado] = useState<PacienteComCPF | null>(null);
  const [servico_id, setServico_id] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [salvando, setSalvando] = useState(false);

  const { data: servicos = [] } = useServiços();
  const criarOrcamento = useCriarOrcamento();

  const servicoSelecionado = servicos.find((s: Servico) => s.id === servico_id);

  const handleAdicionarItem = () => {
    if (!servico_id || !servicoSelecionado) {
      toast({ title: "Erro", description: "Selecione um serviço", variant: "destructive" });
      return;
    }

    if (!quantidade || parseInt(quantidade) <= 0) {
      toast({
        title: "Erro",
        description: "Quantidade deve ser maior que 0",
        variant: "destructive",
      });
      return;
    }

    const novoItem: ItemOrcamento = {
      temId: Math.random().toString(),
      servico_id,
      servico_nome: servicoSelecionado.nome,
      preco_unitario: servicoSelecionado.preco,
      quantidade: parseInt(quantidade),
    };

    setItens([...itens, novoItem]);
    setServico_id("");
    setQuantidade("1");
  };

  const handleRemoverItem = (temId: string | undefined) => {
    setItens(itens.filter((item) => item.temId !== temId));
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
        description: "Adicione pelo menos um item ao orçamento",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      const valorTotal = itens.reduce(
        (sum, item) => sum + item.preco_unitario * item.quantidade,
        0
      );

      await criarOrcamento.mutateAsync({
        paciente_id: pacienteSelecionado.id,
        prontuario_id: null,
        status: "rascunho",
        valor_total: valorTotal,
        desconto_tipo: null,
        desconto_valor: 0,
        itens: itens.map((item: ItemOrcamento) => ({
          servico_id: item.servico_id,
          descricao: item.servico_nome,
          preco_unitario: item.preco_unitario,
          quantidade: item.quantidade,
        })),
      });

      toast({
        title: "Sucesso",
        description: "Orçamento criado com sucesso",
      });

      // Limpar
      setPacienteSelecionado(null);
      setItens([]);
      setServico_id("");
      setQuantidade("1");
      onOpenChange(false);
      onSucesso?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar orçamento",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  const calculoValorTotal = itens.reduce(
    (sum, item) => sum + item.preco_unitario * item.quantidade,
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Orçamento</DialogTitle>
          <DialogDescription>Crie um novo orçamento para o paciente</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Paciente */}
          <div>
            <Label htmlFor="paciente">Paciente *</Label>
            <PacienteAutocomplete
              onSelect={setPacienteSelecionado}
              placeholder="Digite o nome do paciente..."
            />
          </div>

          {pacienteSelecionado && (
            <>
              {/* Adição de Itens */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-medium text-sm">Adicionar Itens</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="servico">Serviço</Label>
                      <Select value={servico_id} onValueChange={setServico_id}>
                        <SelectTrigger id="servico">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos.map((s: Servico) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome} - R$ {s.preco.toFixed(2).replace(".", ",")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quantidade">Quantidade</Label>
                      <Input
                        id="quantidade"
                        type="number"
                        min="1"
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="1"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={handleAdicionarItem}
                        disabled={!servico_id}
                        className="w-full gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {servicoSelecionado && (
                    <div className="text-sm text-muted-foreground">
                      Subtotal: R${" "}
                      {(
                        servicoSelecionado.preco * parseInt(quantidade || "1")
                      )
                        .toFixed(2)
                        .replace(".", ",")}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de Itens */}
              {itens.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-medium text-sm mb-4">Itens do Orçamento</h3>
                    <div className="space-y-3">
                      {itens.map((item, idx) => (
                        <div
                          key={item.temId}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.servico_nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantidade}x R$ {item.preco_unitario.toFixed(2).replace(".", ",")} =
                              R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace(".", ",")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoverItem(item.temId)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      <div className="pt-3 border-t-2 flex justify-between items-center font-bold">
                        <span>Total:</span>
                        <span>R$ {calculoValorTotal.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={!pacienteSelecionado || itens.length === 0 || salvando}
            className="gap-2"
          >
            {salvando ? (
              <>Salvando...</>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Criar Orçamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
