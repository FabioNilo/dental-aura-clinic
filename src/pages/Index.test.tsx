import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Index from "@/pages/Index";
import { TestMemoryRouter } from "@/test/router";

describe("Index page", () => {
  it("renders real navigation anchors and no dead href=\"#\" links", () => {
    const { container } = render(
      <TestMemoryRouter>
        <Index />
      </TestMemoryRouter>,
    );

    expect(container.querySelectorAll('a[href="#agendar"]').length).toBeGreaterThanOrEqual(4);
    expect(container.querySelectorAll('a[href="#"]').length).toBe(0);
    expect(container.querySelector('section#agendar')).not.toBeNull();
    expect(container.querySelector('header#inicio')).not.toBeNull();
    expect(container.querySelector('section#servicos')).not.toBeNull();
    expect(container.querySelector('section#ortodontia')).not.toBeNull();
  });
});
