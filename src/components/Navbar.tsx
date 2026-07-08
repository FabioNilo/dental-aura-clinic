import { useState } from "react";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Início", href: "#inicio", active: true },
  { label: "Serviços", href: "#servicos" },
  { label: "Ortodontia", href: "#ortodontia" },
  { label: "Agendar", href: "#agendar" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-card/90 backdrop-blur-xl shadow-sm">
      <div className="flex justify-between items-center px-6 lg:px-8 py-4 max-w-7xl mx-auto">
        <span className="text-xl font-extrabold tracking-tight font-headline text-primary">
          Clínica Sorriso
        </span>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm font-semibold tracking-tight font-headline transition-colors ${
                link.active
                  ? "text-primary border-b-2 border-primary pb-1"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href="#agendar"
          className="hidden md:inline-flex bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-headline font-bold text-sm shadow-primary-glow hover:scale-105 transition-transform"
        >
          Agendar Consulta
        </a>

        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border px-6 pb-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="block text-sm font-semibold font-headline text-foreground hover:text-primary"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#agendar"
            className="block bg-primary text-primary-foreground text-center px-6 py-3 rounded-xl font-headline font-bold text-sm"
          >
            Agendar Consulta
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
