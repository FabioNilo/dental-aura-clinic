import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Servicos from "@/pages/admin/Servicos";

const createServicoMock = vi.fn();
const updateServicoMock = vi.fn();
const refetchMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/features/servicos/api", () => ({
  useServicosAdminQuery: () => ({
    data: [
      {
        ativo: true,
        created_at: "2026-04-03T12:00:00.000Z",
        descricao: "Atendimento inicial",
        duracao_minutos: 60,
        id: "serv-1",
        nome: "Consulta geral",
        preco: 180,
        updated_at: "2026-04-03T12:00:00.000Z",
      },
    ],
    isLoading: false,
    refetch: refetchMock,
  }),
  useCreateServico: () => ({
    isPending: false,
    mutateAsync: createServicoMock,
  }),
  useUpdateServico: () => ({
    isPending: false,
    mutateAsync: updateServicoMock,
  }),
}));

describe("Servicos page", () => {
  beforeEach(() => {
    createServicoMock.mockReset();
    updateServicoMock.mockReset();
    refetchMock.mockReset();
    createServicoMock.mockResolvedValue({
      ativo: true,
      created_at: "2026-04-03T12:00:00.000Z",
      descricao: "Clareamento supervisionado em consultorio",
      duracao_minutos: 90,
      id: "serv-2",
      nome: "Clareamento",
      preco: 450,
      updated_at: "2026-04-03T12:00:00.000Z",
    });
  });

  it("creates a new service with the filled form values", async () => {
    render(
      <MemoryRouter>
        <Servicos />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /novo servi./i }));
    fireEvent.change(screen.getByLabelText(/nome do servi./i), {
      target: { value: "Clareamento" },
    });
    fireEvent.change(screen.getByLabelText(/descri./i), {
      target: { value: "Clareamento supervisionado em consultorio" },
    });
    fireEvent.change(screen.getByLabelText(/dura..o m.dia \(min\)/i), {
      target: { value: "90" },
    });
    fireEvent.change(screen.getByLabelText(/pre.o base/i), {
      target: { value: "450,00" },
    });
    fireEvent.click(screen.getByRole("button", { name: /criar servi./i }));

    await waitFor(() => {
      expect(createServicoMock).toHaveBeenCalledWith({
        ativo: true,
        descricao: "Clareamento supervisionado em consultorio",
        duracao_minutos: 90,
        id: undefined,
        nome: "Clareamento",
        preco: 450,
      });
    });
  });
});
