import { ArrowRight, Stethoscope, HeartPulse, ScanLine } from "lucide-react";

const services = [
  {
    icon: Stethoscope,
    title: "Limpeza Geral",
    description:
      "Profilaxia avançada para remoção de tártaro e manchas, mantendo sua gengiva saudável e hálito fresco.",
  },
  {
    icon: HeartPulse,
    title: "Tratamento de Cáries",
    description:
      "Restaurações estéticas imperceptíveis com materiais de última geração que devolvem a função e forma original.",
  },
  {
    icon: ScanLine,
    title: "Checkup Digital",
    description:
      "Diagnóstico por imagem de alta resolução para detecção precoce de problemas, garantindo tratamentos menos invasivos.",
  },
];

const ServicesSection = () => {
  return (
    <section id="servicos" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-3xl font-headline font-extrabold text-foreground mb-4">
            Serviços Clínicos
          </h2>
          <p className="text-muted-foreground font-medium">
            Excelência em cada detalhe do seu tratamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className="group p-8 rounded-4xl bg-card border border-border hover:shadow-card-hover transition-all duration-500"
            >
              <div className="w-14 h-14 bg-surface-high rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <service.icon size={28} />
              </div>
              <h3 className="text-xl font-headline font-bold text-foreground mb-3">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                {service.description}
              </p>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-4 transition-all"
              >
                Saiba mais <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
