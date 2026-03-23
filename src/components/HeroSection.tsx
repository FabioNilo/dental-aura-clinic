import { Shield, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-clinic.jpg";

const HeroSection = () => {
  return (
    <header id="inicio" className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Interior moderno de clínica odontológica premium"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase">
            <Shield size={14} className="text-primary" />
            Referência em Precisão
          </div>

          <h1 className="text-5xl md:text-7xl font-headline font-extrabold text-foreground leading-[1.1] tracking-tight">
            Sua Saúde Bucal{" "}
            <br />
            <span className="text-primary">em Boas Mãos</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
            Cuidado especializado com a precisão e tecnologia que você merece.
            Unimos ciência e estética para o seu melhor sorriso.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <a
              href="#agendar"
              className="bg-gradient-to-br from-primary to-primary-container text-primary-foreground px-8 py-4 rounded-xl font-headline font-bold text-lg shadow-primary-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Agendar Consulta
            </a>
            <a
              href="#servicos"
              className="bg-card border border-border text-primary px-8 py-4 rounded-xl font-headline font-bold text-lg hover:bg-accent transition-colors inline-flex items-center gap-2"
            >
              Ver Especialidades
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeroSection;
