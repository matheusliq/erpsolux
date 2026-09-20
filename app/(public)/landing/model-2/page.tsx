import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function Model2() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans">
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="ghost" className="text-zinc-500">← Modelos</Button></Link>
      </nav>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 max-w-5xl mx-auto">
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-zinc-900 leading-tight">
            A perfeição mora <br/>na <span className="font-semibold text-primary">superfície.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-500 font-light max-w-3xl mx-auto leading-relaxed">
            Revestimentos premium em Poliuretano para concessionárias, showrooms e clínicas. 
            Estética impecável, assepsia total e execução sem paralisações.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all">
              Agendar Consultoria <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-medium border-zinc-200 hover:bg-zinc-50">
              Explorar Portfólio
            </Button>
          </div>
        </div>

        <div className="w-full mt-24 rounded-[2rem] overflow-hidden shadow-2xl relative bg-zinc-100 border border-zinc-200">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop" className="w-full h-[500px] object-cover" alt="Clean Floor" />
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <div className="text-left">
              <p className="font-bold text-zinc-900 leading-tight">Zero Emendas</p>
              <p className="text-sm text-zinc-500">Fácil limpeza e manutenção</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
