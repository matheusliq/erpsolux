import { Button } from "@/components/ui/button";
import { Quote, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Model7() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-serif">
      <nav className="fixed top-0 w-full p-4 z-50 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200">
        <Link href="/landing"><Button variant="ghost" className="text-stone-500 font-sans">← Modelos</Button></Link>
      </nav>

      <article className="max-w-3xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center mb-16">
          <Quote className="w-12 h-12 text-stone-300 mx-auto mb-6" />
          <p className="text-3xl italic text-stone-600 leading-snug">
            "A BYD Vitória precisava de um piso que refletisse a tecnologia de ponta dos seus carros. O desafio? Uma área com concreto poroso e apenas 4 dias de prazo."
          </p>
        </div>

        <h1 className="text-5xl font-bold text-stone-900 mb-10 leading-tight">
          Como transformamos uma oficina amadora no padrão Classe A em tempo recorde.
        </h1>

        <div className="space-y-8 text-xl text-stone-700 leading-relaxed">
          <p>
            A terceirização de obras para marcas premium não permite margem para erro. Quando a construtora Réuli nos chamou, a dor era clara: eles precisavam de um serviço impecável, sem gerar sujeira para a concessionária já quase pronta, e com um valor que preservasse a margem de lucro deles.
          </p>

          <img src="https://images.unsplash.com/photo-1580983501068-d01c876ce13f?q=80&w=2070&auto=format&fit=crop" alt="Piso BYD" className="w-full rounded-lg shadow-xl my-12" />

          <p>
            Em vez de uma "mão de tinta" comum que descascaria no primeiro mês, entramos com o <strong>Padrão Solux de Engenharia</strong>. Isolamento total no primeiro dia, lixamento mecânico pesado (sem poeira no ar) e primer de alta ancoragem.
          </p>

          <p>
            No quarto dia, entregamos a chave com o piso brilhando. O resultado? Uma oficina que impressiona os clientes e zero dor de cabeça para a construtora.
          </p>
        </div>

        <div className="mt-16 pt-16 border-t border-stone-200 text-center font-sans">
          <h3 className="text-2xl font-bold mb-6">Sua obra também merece esse padrão.</h3>
          <Button size="lg" className="bg-stone-900 hover:bg-stone-800 text-white h-14 px-8 text-lg rounded-none">
            Agendar Reunião sobre seu Projeto <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </article>
    </div>
  );
}
