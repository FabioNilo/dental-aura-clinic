import { CheckCircle2, Diamond } from "lucide-react";
import draJuliana from "@/assets/dra-juliana.jpg";

const OrthodonticsSection = () => {
  return (
    <section id="ortodontia" className="py-24 bg-surface-container overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
          {/* Image */}
          <div className="flex-1 relative">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10 rounded-4xl overflow-hidden shadow-card-hover">
              <img
                src={draJuliana}
                alt="Dra. Juliana Costa — Especialista em Ortodontia Invisível"
                className="w-full h-[500px] object-cover"
                loading="lazy"
                width={800}
                height={1000}
              />
              <div className="absolute bottom-6 left-6 right-6 glass-panel p-5 rounded-2xl border border-border/30">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-2 rounded-lg">
                    <Diamond size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary">
                      Status
                    </p>
                    <h4 className="text-base font-headline font-bold text-foreground">
                      Invisalign Diamond Provider
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground leading-tight">
                Ortodontia Invisível{" "}
                <br />
                com <span className="text-primary">Dra. Juliana Costa</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Especialista em transformar sorrisos com a tecnologia dos
                alinhadores Invisalign. Conforto, estética e resultados rápidos
                sem o uso de braquetes metálicos.
              </p>
            </div>

            <div className="space-y-5">
              {[
                {
                  title: "Escaneamento iTero®",
                  desc: "Veja o resultado final antes mesmo de começar o tratamento.",
                },
                {
                  title: "Aparelhos Autoligáveis",
                  desc: "Tratamentos convencionais até 40% mais rápidos e higiênicos.",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="mt-1 w-6 h-6 rounded-full bg-success-light flex items-center justify-center">
                    <CheckCircle2 size={16} className="text-success" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#agendar"
              className="inline-flex bg-primary text-primary-foreground px-10 py-4 rounded-xl font-headline font-bold shadow-primary-glow hover:scale-105 transition-transform"
            >
              Avaliação Ortodôntica
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrthodonticsSection;
