import { Bot, Send, Smile } from "lucide-react";

const WhatsAppSection = () => {
  return (
    <section id="sobre" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="bg-foreground rounded-4xl p-10 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row gap-16 items-center">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-glow border border-primary/30 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-primary-glow animate-pulse-soft" />
              Disponível 24/7
            </div>

            <h2 className="text-4xl md:text-5xl font-headline font-extrabold text-primary-foreground leading-tight">
              Agendamento Inteligente
              <br />
              via WhatsApp
            </h2>

            <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">
              Conheça nossa Assistente de IA. Agende, cancele ou tire dúvidas
              sobre procedimentos em segundos, a qualquer hora do dia ou da
              noite.
            </p>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-full border-4 border-foreground bg-surface-high"
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="text-primary-foreground font-bold">+2.000</span>{" "}
                agendamentos este mês
              </p>
            </div>
          </div>

          {/* Chat mockup */}
          <div className="relative z-10 w-full max-w-sm">
            <div className="bg-card/95 backdrop-blur-xl rounded-4xl p-6 shadow-card-hover border border-border/20">
              {/* Header */}
              <div className="flex items-center gap-3 mb-8 border-b border-border pb-4">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <Bot size={20} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Assistente Clínica</h4>
                  <p className="text-[10px] text-success font-bold">Online agora</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-8">
                <div className="bg-surface-high p-4 rounded-2xl rounded-tl-none text-sm text-foreground max-w-[85%]">
                  Olá! Sou a assistente da Clínica Sorriso. Como posso ajudar
                  seu sorriso hoje?
                </div>
                <div className="bg-gradient-to-br from-primary to-primary-container p-4 rounded-2xl rounded-tr-none text-sm text-primary-foreground ml-auto max-w-[85%] shadow-primary-glow">
                  Quero agendar uma limpeza para amanhã à tarde.
                </div>
                <div className="bg-surface-high p-4 rounded-2xl rounded-tl-none text-sm text-foreground max-w-[85%]">
                  Perfeito! Temos horários com o Dr. Ricardo às 14h ou 16h. Qual
                  prefere?
                </div>
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 bg-surface-container p-3 rounded-full border border-border">
                <Smile size={18} className="text-muted-foreground ml-1" />
                <span className="text-xs text-muted-foreground flex-1">
                  Digite sua mensagem...
                </span>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Send size={14} className="text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatsAppSection;
