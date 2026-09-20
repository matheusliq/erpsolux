import { Button } from "@/components/ui/button";
import { ShieldCheck, Medal, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Model8() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="ghost" className="text-zinc-500">← Modelos</Button></Link>
      </nav>

      <section className="pt-32 pb-24 px-6 container mx-auto text-center max-w-4xl">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 text-primary rounded-full mb-8">
          <ShieldCheck className="w-10 h-10" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          A única do ES que garante a ancoragem do piso em contrato.
        </h1>
        
        <p className="text-xl text-zinc-500 mb-16 max-w-2xl mx-auto leading-relaxed">
          Sem falsas promessas e sem "mão de tinta" amadora. Temos equipe própria, politrizes diamantadas e resina certificada.
        </p>

        {/* Trust Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 opacity-60 grayscale items-center justify-items-center">
          <div className="text-2xl font-black">BYD</div>
          <div className="text-xl font-bold tracking-widest">CLUBE DE TIRO</div>
          <div className="text-xl font-black font-serif">CONSTRUTORA X</div>
          <div className="text-xl font-bold">GALPÃO LOG</div>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 md:p-12 text-left mb-16 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <Medal className="w-8 h-8 text-primary" />
            <h3 className="text-2xl font-bold">O Selo Solux de Garantia</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <p className="text-zinc-600 flex gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/> Se a resina soltar por erro de ancoragem, nós refazemos de graça.</p>
            <p className="text-zinc-600 flex gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0"/> Cronograma rígido. Atrasou um dia por nossa culpa? Multa para nós.</p>
          </div>
        </div>

        <Button size="lg" className="bg-zinc-900 hover:bg-zinc-800 text-white h-16 px-12 text-xl shadow-xl">
          Falar com um Especialista Agora
        </Button>
        <p className="text-zinc-400 mt-4 text-sm font-medium">Resposta em até 15 minutos via WhatsApp.</p>
      </section>
    </div>
  );
}
