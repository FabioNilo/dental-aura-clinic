import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useBuscarPacientes, type PacienteComCPF } from "@/features/financeiro/api";
import { Loader2, X } from "lucide-react";

interface PacienteAutocompleteProps {
  onSelect: (paciente: PacienteComCPF) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PacienteAutocomplete({
  onSelect,
  placeholder = "Digite o nome do paciente...",
  disabled = false,
}: PacienteAutocompleteProps) {
  const [busca, setBusca] = useState("");
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [selecionado, setSelecionado] = useState<PacienteComCPF | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: pacientes = [], isLoading } = useBuscarPacientes(busca);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (paciente: PacienteComCPF) => {
    setSelecionado(paciente);
    setBusca("");
    setMostrarSugestoes(false);
    onSelect(paciente);
  };

  const handleLimpar = () => {
    setSelecionado(null);
    setBusca("");
  };

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex-1">
          <p className="font-medium text-sm">{selecionado.nome}</p>
          <p className="text-xs text-muted-foreground">
            CPF: {selecionado.cpf || "Não informado"} | Tel: {selecionado.telefone || "N/A"}
          </p>
        </div>
        <button
          onClick={handleLimpar}
          className="p-1 hover:bg-blue-100 rounded"
          title="Mudar paciente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setMostrarSugestoes(true);
          }}
          onFocus={() => setMostrarSugestoes(true)}
          disabled={disabled}
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {mostrarSugestoes && busca.length >= 2 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Buscando pacientes...
            </div>
          ) : pacientes.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum paciente encontrado
            </div>
          ) : (
            <ul className="divide-y">
              {pacientes.map((paciente) => (
                <li
                  key={paciente.id}
                  onClick={() => handleSelect(paciente)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <p className="font-medium text-sm">{paciente.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    CPF: {paciente.cpf || "Não informado"} | Tel: {paciente.telefone || "N/A"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
