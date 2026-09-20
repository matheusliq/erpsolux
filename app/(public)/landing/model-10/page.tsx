import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, Shield } from "lucide-react";
import Link from "next/link";

export default function Model10() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <nav className="fixed top-0 w-full p-4 z-50 bg-zinc-50/90 backdrop-blur-sm border-b border-zinc-200 flex justify-between items-center">
        <div className="font-black text-xl tracking-tighter">SOLUX<span className="text-primary">.</span></div>
        <Link href="/landing"><Button variant="ghost" className="text-zinc-500">← Modelos</Button></Link>
      </nav>

      <section className="pt-32 pb-24 px-6 container mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
                <Star className="w-5 h-5 fill-current" />
              </div>
              <span className="text-sm font-semibold text-zinc-500">Nota 5.0 no Google ES</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-950 tracking-tight leading-[1.1]">
              Terceirização de Pintura <span className="underline decoration-primary decoration-8 underline-offset-8">Sem Risco.</span>
            </h1>

            <p className="text-xl text-zinc-600 leading-relaxed max-w-lg">
              Proteja sua margem de lucro e entregue obras com padrão internacional. Assumimos a execução técnica do seu piso, do lixamento à resina final.
            </p>

            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-lg text-zinc-800 font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                Preparação Mecânica Inclusa (Zero Tinta Soltando)
              </li>
              <li className="flex items-center gap-3 text-lg text-zinc-800 font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                Tabela B2B para Construtoras (Lucro Garantido)
              </li>
              <li className="flex items-center gap-3 text-lg text-zinc-800 font-medium">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                Entrega Rigorosa (Multa em contrato por atraso)
              </li>
            </ul>

            <div className="pt-4">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-bold shadow-xl hover:scale-105 transition-transform">
                Quero Ser Parceiro Solux
              </Button>
            </div>
          </div>

          <div className="w-full lg:w-1/2 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl relative aspect-[4/3] bg-zinc-200 border-8 border-white">
              <img src="https://images.unsplash.com/photo-1580983501068-d01c876ce13f?q=80&w=2070&auto=format&fit=crop" alt="Piso Finalizado" className="w-full h-full object-cover" />
            </div>
            
            {/* Floating Trust Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-zinc-100 flex items-center gap-4 animate-bounce-slow">
              <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <div className="text-zinc-950 font-bold text-lg">Garantia Técnica</div>
                <div className="text-zinc-500 text-sm">Contrato de Ancoragem</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>
    </div>
  );
}
