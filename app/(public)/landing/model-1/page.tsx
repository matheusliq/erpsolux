import { Button } from "@/components/ui/button";
import { ArrowRight, HardHat, ShieldCheck, Factory } from "lucide-react";
import Link from "next/link";

export default function Model1() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      {/* Topbar navigation back to hub */}
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="outline" className="bg-transparent border-zinc-800 text-zinc-400 hover:text-white">← Voltar aos Modelos</Button></Link>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-zinc-950/80 z-10 mix-blend-multiply"></div>
          <img src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-50" alt="Industrial" />
        </div>
        
        <div className="container relative z-20 mx-auto px-6 lg:px-12">
          <div className="max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 text-primary border border-primary/30 font-bold uppercase tracking-widest text-xs">
              <Factory className="w-4 h-4" /> Engenharia de Superfícies
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9]">
              Pisos Industriais <br/><span className="text-primary">Inquebráveis.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-2xl leading-relaxed">
              Lixamento diamantado pesado, ancoragem extrema e resina de altíssima performance. A solução definitiva para galpões que não podem parar.
            </p>
            
            <div className="pt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-14 text-lg rounded-none uppercase tracking-wide">
                Solicitar Engenheiro
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-white rounded-none px-8 h-14 uppercase tracking-wide">
                Ver Especificações
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-zinc-900 py-24 border-t border-zinc-800">
        <div className="container mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <HardHat className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-bold uppercase">Execução Zero Pó</h3>
            <p className="text-zinc-400">Maquinário com aspiração acoplada. Sua operação continua limpa durante o processo.</p>
          </div>
          <div className="space-y-4">
            <ShieldCheck className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-bold uppercase">Ancoragem Química</h3>
            <p className="text-zinc-400">Esqueça tintas descascando. Criamos ranhuras mecânicas no concreto para o PU penetrar.</p>
          </div>
          <div className="space-y-4">
            <Factory className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-bold uppercase">Trafego Pesado</h3>
            <p className="text-zinc-400">Resistência incomparável contra empilhadeiras de 5 toneladas e desgaste abrasivo contínuo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
