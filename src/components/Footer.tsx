const footerLinks = [
  { label: "Inicio", href: "#inicio" },
  { label: "Servicos", href: "#servicos" },
  { label: "Agendar", href: "#agendar" },
  { label: "Contato", href: "#contato" },
];

const Footer = () => {
  return (
    <footer id="contato" className="w-full border-t border-border bg-secondary">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 py-12 md:flex-row lg:px-20">
        <span className="text-lg font-extrabold font-headline text-primary">
          Clinica Sorriso
        </span>

        <div className="flex flex-wrap justify-center gap-8">
          {footerLinks.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs uppercase tracking-widest font-medium text-muted-foreground underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
          © 2024 Clinica Sorriso. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
