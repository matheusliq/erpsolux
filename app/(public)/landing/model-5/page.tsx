import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import Link from "next/link";

export default function Model5() {
  return (
    <div className="min-h-screen relative flex items-center justify-center text-center bg-black overflow-hidden">
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10">← Modelos</Button></Link>
      </nav>

      {/* Simulated Video Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-40 scale-105 animate-[pulse_10s_ease-in-out_infinite]" alt="Video simulation" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
      </div>

      <div className="relative z-10 px-6 max-w-4xl space-y-8">
        <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
          A arte da preparação mecânica.
        </h1>
        <p className="text-xl md:text-2xl text-zinc-300 font-light drop-shadow-md max-w-3xl mx-auto">
          Nós não "pintamos" pisos. Nós transformamos o concreto bruto em uma superfície inquebrável através de tecnologia e escarificação diamantada.
        </p>
        
        <div className="pt-8">
          <Button size="lg" className="bg-white hover:bg-zinc-200 text-black font-bold px-10 h-16 text-lg rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] transition-all hover:scale-105">
            <PlayCircle className="mr-3 w-6 h-6" /> Assistir ao Processo (1 min)
          </Button>
        </div>
      </div>
    </div>
  );
}
