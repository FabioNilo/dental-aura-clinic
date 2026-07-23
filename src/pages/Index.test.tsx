import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";
import { TestMemoryRouter } from "@/test/router";

describe("Index page", () => {
  it("renders the management platform landing with real navigation links", () => {
    const { container } = render(
      <TestMemoryRouter>
        <Index />
      </TestMemoryRouter>,
    );

    expect(screen.getAllByText("Dental Aura").length).toBeGreaterThan(0);
    expect(screen.getByText("Plataforma de gestão odontológica")).toBeInTheDocument();
    expect(screen.getByText("Principais dúvidas")).toBeInTheDocument();
    expect(screen.getByText("Acessar painel da clínica")).toHaveAttribute("href", "/admin/login");
    expect(screen.getByText("Área interna")).toHaveAttribute("href", "/platform/login");
    expect(container.querySelectorAll('a[href="#"]').length).toBe(0);
    expect(container.querySelector("header#inicio")).not.toBeNull();
    expect(container.querySelector("section#produto")).not.toBeNull();
    expect(container.querySelector("section#modulos")).not.toBeNull();
    expect(container.querySelector("section#duvidas")).not.toBeNull();
  });
});
