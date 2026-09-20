import { Button } from "@/components/ui/button";
import { Download, Cpu, Layers } from "lucide-react";
import Link from "next/link";

export default function Model6() {
  return (
    <div className="min-h-screen bg-[#0a192f] text-blue-50 font-mono relative">
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50">← Modelos</Button></Link>
      </nav>

      {/* Blueprint Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(100, 150, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 150, 255, 0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="container relative z-10 mx-auto px-6 py-32 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-8">
          <div className="text-blue-400 tracking-[0.3em] uppercase text-xs flex items-center gap-2">
            <Cpu className="w-4 h-4" /> [ PROJETO TÉCNICO ]
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Engenharia Aplicada.
          </h1>
          <p className="text-blue-200 text-lg font-light leading-relaxed">
            Não acreditamos em soluções amadoras. Nosso processo envolve cálculo de porosidade do concreto, preparação por politrizes industriais e polimerização em 3 camadas.
          </p>
          
          <ul className="space-y-6 text-blue-100">
            <li className="flex items-start gap-4 p-4 border border-blue-800/50 bg-blue-900/20 backdrop-blur-sm">
              <span className="text-blue-400 font-bold">01.</span> Lixamento Diamantado e Aspiração (Zero Pó)
            </li>
            <li className="flex items-start gap-4 p-4 border border-blue-800/50 bg-blue-900/20 backdrop-blur-sm">
              <span className="text-blue-400 font-bold">02.</span> Primer Selador de Alta Ancoragem
            </li>
            <li className="flex items-start gap-4 p-4 border border-blue-800/50 bg-blue-900/20 backdrop-blur-sm">
              <span className="text-blue-400 font-bold">03.</span> Topcoat PU com Bloqueio Químico
            </li>
          </ul>

          <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 tracking-widest uppercase border border-blue-400 shadow-[4px_4px_0px_rgba(59,130,246,0.5)] rounded-none">
            <Download className="mr-2 w-5 h-5" /> Baixar Especificações Técnicas
          </Button>
        </div>

        <div className="p-8 border-2 border-blue-500/30 bg-blue-950/50 backdrop-blur-md relative">
          <Layers className="absolute -top-6 -right-6 w-24 h-24 text-blue-500/20" />
          <h3 className="text-blue-400 font-bold mb-6 tracking-widest uppercase text-sm border-b border-blue-800 pb-2">Esquema Estrutural</h3>
          
          <div className="space-y-2">
            <div className="w-full py-4 bg-blue-400/20 border border-blue-400/50 text-center text-blue-200 text-xs tracking-widest">TOPCOAT PU (ACABAMENTO)</div>
            <div className="w-full py-4 bg-blue-500/20 border border-blue-500/50 text-center text-blue-200 text-xs tracking-widest">RESINA BASE</div>
            <div className="w-full py-2 bg-blue-600/20 border border-blue-600/50 text-center text-blue-200 text-xs tracking-widest">PRIMER ANCORAGEM</div>
            <div className="w-full py-12 bg-zinc-800/80 border-t-2 border-dashed border-zinc-600 text-center text-zinc-400 text-xs tracking-widest mt-4">CONCRETO ESCARIFICADO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
