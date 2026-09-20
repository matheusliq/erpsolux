import { Button } from "@/components/ui/button";
import { LineChart, Clock, PiggyBank, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function Model4() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      <nav className="absolute top-0 w-full p-4 z-50 flex justify-between">
        <Link href="/landing"><Button variant="ghost" className="text-zinc-500">← Modelos</Button></Link>
      </nav>

      <section className="pt-32 pb-24 px-6 container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-zinc-900">
            Pisos industriais são ativos.<br/>Calcule o seu <span className="text-primary">ROI.</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
            Decisões baseadas em dados. O sistema Solux de Poliuretano se paga no primeiro ano ao eliminar as manutenções trimestrais do epóxi comum.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <div className="flex items-center gap-3 text-zinc-400 font-semibold mb-4 uppercase text-sm">
              <TrendingUp className="w-5 h-5" /> Durabilidade
            </div>
            <div className="text-5xl font-black text-zinc-900 mb-2">5+ <span className="text-2xl text-zinc-400">Anos</span></div>
            <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 bg-emerald-50 w-max px-2 py-1 rounded">
              ↑ 300% maior que epóxi comum
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200">
            <div className="flex items-center gap-3 text-zinc-400 font-semibold mb-4 uppercase text-sm">
              <Clock className="w-5 h-5" /> Tempo de Obra
            </div>
            <div className="text-5xl font-black text-zinc-900 mb-2">4 <span className="text-2xl text-zinc-400">Dias</span></div>
            <div className="text-emerald-600 text-sm font-medium flex items-center gap-1 bg-emerald-50 w-max px-2 py-1 rounded">
              ↓ Evita paralisação da fábrica
            </div>
          </div>

          {/* Card 3 (Action) */}
          <div className="bg-primary p-8 rounded-2xl shadow-lg text-primary-foreground flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-primary-foreground/70 font-semibold mb-4 uppercase text-sm">
                <PiggyBank className="w-5 h-5" /> Economia Projetada
              </div>
              <div className="text-5xl font-black mb-2">R$ 12k+</div>
              <div className="text-primary-foreground/80 text-sm">Em repinturas evitadas por ano</div>
            </div>
            <Button variant="secondary" className="mt-8 w-full font-bold h-12 text-primary">
              Acessar Tabela B2B
            </Button>
          </div>
        </div>

        <div className="mt-16 flex justify-center">
           <Button variant="outline" size="lg" className="border-zinc-300 text-zinc-600 h-14 px-8 text-lg hover:bg-zinc-100">
             Agendar Visita Técnica <ArrowRight className="ml-2 w-5 h-5"/>
           </Button>
        </div>
      </section>
    </div>
  );
}
