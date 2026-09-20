import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Model9() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center font-sans relative">
      <nav className="absolute top-0 w-full p-4 z-50">
        <Link href="/landing"><Button variant="ghost" className="text-zinc-500">← Modelos</Button></Link>
      </nav>

      <main className="text-center px-6 max-w-3xl w-full">
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-zinc-950 mb-6">
          Pintura<br/>Industrial.
        </h1>
        
        <p className="text-2xl text-zinc-500 mb-12 font-medium">
          Você precisa de um piso inquebrável. Nós fazemos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-lg mx-auto">
          <Input 
            type="text" 
            placeholder="Metragem aproximada (m²)" 
            className="h-16 text-lg rounded-xl border-2 border-zinc-200 focus-visible:ring-primary text-center sm:text-left"
          />
          <Button className="h-16 px-10 text-xl font-bold rounded-xl shadow-lg hover:scale-105 transition-transform w-full sm:w-auto">
            Orçar
          </Button>
        </div>
      </main>
    </div>
  );
}
