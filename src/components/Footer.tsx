const Footer = () => {
  return (
    <footer id="contato" className="w-full border-t border-border bg-secondary">
      <div className="flex flex-col md:flex-row justify-between items-center px-6 lg:px-20 py-12 gap-8 max-w-7xl mx-auto">
        <span className="text-lg font-extrabold font-headline text-primary">
          Clínica Sorriso
        </span>

        <div className="flex flex-wrap justify-center gap-8">
          {["Privacidade", "Termos de Uso", "Trabalhe Conosco"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-xs uppercase tracking-widest font-medium text-muted-foreground hover:text-primary underline decoration-primary/40 underline-offset-4 transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest font-medium text-muted-foreground">
          © 2024 Clínica Sorriso. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
