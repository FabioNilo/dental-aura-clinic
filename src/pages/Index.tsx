import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Headphones,
  HelpCircle,
  LockKeyhole,
  MessageCircle,
  Stethoscope,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import heroImage from "@/assets/hero-clinic.jpg";
import { Button } from "@/components/ui/button";

const modules = [
  {
    icon: MessageCircle,
    label: "Atendimento e solicitações",
    text: "Centralize pedidos de novos pacientes, retornos, remarcações e cancelamentos em uma fila organizada.",
  },
  {
    icon: CalendarCheck2,
    label: "Agenda inteligente",
    text: "Acompanhe horários, profissionais, status da consulta e histórico do paciente no mesmo lugar.",
  },
  {
    icon: Wallet,
    label: "Financeiro da clínica",
    text: "Monte orçamentos, emita cobranças, registre pagamentos e acompanhe pendências sem planilhas soltas.",
  },
  {
    icon: ClipboardList,
    label: "Prontuário e tratamentos",
    text: "Registre consultas, diagnósticos, planos de tratamento, sessões realizadas e evolução clínica.",
  },
];

const highlights = [
  "Visão clara do dia da clínica",
  "Menos retrabalho entre recepção, dentistas e financeiro",
  "Histórico do paciente sempre acessível para a equipe",
  "Controle de clínicas, usuários e permissões em uma área reservada",
];

const workflowSteps = [
  {
    icon: Headphones,
    title: "Receba e organize",
    text: "A equipe acompanha solicitações de atendimento, novos pacientes e pedidos de remarcação.",
  },
  {
    icon: CalendarCheck2,
    title: "Confirme a agenda",
    text: "Transforme solicitações em consultas com profissional, procedimento, horário e observações.",
  },
  {
    icon: Stethoscope,
    title: "Atenda com contexto",
    text: "Dentistas visualizam dados do paciente, prontuários anteriores e tratamentos em andamento.",
  },
  {
    icon: CreditCard,
    title: "Feche o financeiro",
    text: "Orçamentos, faturas, pagamentos e inadimplência ficam conectados à rotina do atendimento.",
  },
];

const faqs = [
  {
    answer:
      "Sim. A plataforma foi pensada para recepção, coordenação, dentistas e financeiro trabalharem no mesmo ambiente, cada pessoa com seu acesso.",
    question: "Minha equipe consegue usar sem conhecimento técnico?",
  },
  {
    answer:
      "Sim. Existe uma área reservada para cadastrar clínicas, ativar ou desativar acessos e criar usuários vinculados a cada unidade.",
    question: "Consigo gerenciar mais de uma clínica?",
  },
  {
    answer:
      "A plataforma reúne dados cadastrais, agenda, solicitações, financeiro, prontuários e tratamentos em uma experiência única para a operação.",
    question: "Quais informações ficam centralizadas?",
  },
  {
    answer:
      "Sim. A clínica pode acompanhar orçamentos, faturas, pagamentos recebidos, valores pendentes, cupons e pacientes com débito.",
    question: "O financeiro também faz parte da plataforma?",
  },
  {
    answer:
      "Sim. O acesso é separado por clínica. Cada equipe visualiza apenas as informações vinculadas à sua própria operação.",
    question: "As informações de cada clínica ficam separadas?",
  },
];

const stats = [
  { label: "rotina conectada", value: "360°" },
  { label: "áreas em um painel", value: "4+" },
  { label: "acesso por clínica", value: "seguro" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <a className="flex items-center gap-3" href="#inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="text-lg font-black font-headline">Dental Aura</span>
          </a>

          <div className="hidden items-center gap-7 md:flex">
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary" href="#produto">
              Plataforma
            </a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary" href="#modulos">
              Funcionalidades
            </a>
            <a className="text-sm font-semibold text-muted-foreground hover:text-primary" href="#duvidas">
              Dúvidas
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/admin/login">
                <LockKeyhole className="h-4 w-4" />
                Entrar
              </a>
            </Button>
            <Button asChild className="hidden sm:inline-flex" size="sm">
              <a href="/platform/login">
                Área interna
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      <header id="inicio" className="relative overflow-hidden pt-24">
        <div className="absolute inset-0 -z-10">
          <img
            alt="Clínica odontológica moderna usando tecnologia de gestão"
            className="h-full w-full object-cover opacity-16"
            height={1080}
            src={heroImage}
            width={1920}
          />
          <div className="absolute inset-0 bg-background/88" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:pb-20">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" />
              Plataforma de gestão odontológica
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-black leading-tight font-headline sm:text-5xl lg:text-6xl">
              Organize sua clínica do primeiro contato ao recebimento.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              Dental Aura é uma plataforma de gestão para clínicas odontológicas que reúne agenda,
              pacientes, prontuários, tratamentos e financeiro em um painel simples para a equipe.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/admin/login">
                  Acessar painel da clínica
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#modulos">Ver funcionalidades</a>
              </Button>
            </div>
          </div>

          <div aria-label="Preview do painel da clínica" className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Painel da clínica
                </p>
                <h2 className="mt-1 text-xl font-bold font-headline">Aura Dental Center</h2>
              </div>
              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-bold text-success">
                Operação em dia
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-md border border-border bg-background p-4">
                  <div className="text-2xl font-black text-primary">{stat.value}</div>
                  <div className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-md border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Funil de atendimento</span>
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div className="mt-5 space-y-3">
                  {["Novo contato", "Avaliação da equipe", "Confirmação", "Consulta marcada"].map(
                    (item, index) => (
                      <div key={item} className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${92 - index * 15}%` }}
                          />
                        </div>
                        <span className="w-36 text-xs font-medium text-muted-foreground">{item}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="rounded-md border border-border bg-background p-4">
                <span className="text-sm font-bold">Próximos horários</span>
                <div className="mt-4 space-y-3">
                  {["09:00 Ana Souza", "10:30 Pedro Lima", "14:00 Maria Reis"].map((item) => (
                    <div key={item} className="rounded-md bg-muted px-3 py-2 text-sm font-medium">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="produto" className="border-y border-border bg-muted/35 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-3 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Plataforma</p>
            <h2 className="mt-3 text-3xl font-black font-headline">Uma gestão mais clara para a rotina odontológica.</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground lg:col-span-2">
            A Dental Aura ajuda clínicas a reduzirem informações espalhadas entre mensagens,
            agenda, fichas e controles financeiros. Cada unidade tem seu próprio acesso, sua equipe
            e seus dados organizados para acompanhar o paciente com mais cuidado e previsibilidade.
          </p>
        </div>
      </section>

      <section id="modulos" className="py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-black font-headline">Um painel para a rotina real da clínica.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <article key={module.label} className="rounded-lg border border-border bg-card p-5 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-primary">
                  <module.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold font-headline">{module.label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{module.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/35 py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Como funciona</p>
            <h2 className="mt-3 text-3xl font-black font-headline">Da recepção ao fechamento financeiro.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step) => (
              <article key={step.title} className="rounded-lg border border-border bg-card p-5 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold font-headline">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="duvidas" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
              Principais dúvidas
            </p>
            <h2 className="mt-3 text-3xl font-black font-headline">
              Respostas rápidas para quem está avaliando a plataforma.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              A ideia é que a clínica entenda o valor sem precisar conhecer detalhes técnicos.
            </p>
          </div>
          <div className="grid gap-3">
            {faqs.map((faq) => (
              <article key={faq.question} className="rounded-lg border border-border bg-card p-5 shadow-card">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-bold font-headline">{faq.question}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-foreground py-14 text-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-background/70">
              Dental Aura
            </p>
            <h2 className="mt-3 text-3xl font-black font-headline">
              Sua clínica com mais organização, controle e previsibilidade.
            </h2>
          </div>
          <Button asChild className="w-fit bg-background text-foreground hover:bg-background/90" size="lg">
            <a href="/admin/login">
              Acessar painel
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
