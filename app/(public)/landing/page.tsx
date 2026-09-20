import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export default function LandingHub() {
  const models = [
    { id: 1, name: "O Brutalismo Industrial", desc: "Dark Mode de Alta Performance" },
    { id: 2, name: "O Corporativo Clean", desc: "Estilo Apple / Premium" },
    { id: 3, name: "Antes e Depois Interativo", desc: "Foco Extremo em Conversão" },
    { id: 4, name: "Dashbord B2B / Foco em ROI", desc: "Para Investidores e Compras" },
    { id: 5, name: "A Imersão em Vídeo", desc: "Wow Factor (Simulação)" },
    { id: 6, name: "Engenharia de Superfícies", desc: "Estilo Planta Baixa / Blueprint" },
    { id: 7, name: "Storytelling", desc: "Estudo de Caso da BYD" },
    { id: 8, name: "Autoridade e Garantia", desc: "Trust-First / Selos" },
    { id: 9, name: "Minimalismo Direto", desc: "Foco 100% no Google Ads" },
    { id: 10, name: "Híbrido de Alta Conversão", desc: "O Padrão Ouro Atual" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-20 px-4">
      <div className="max-w-4xl w-full text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Solux <span className="text-primary">Models</span>
        </h1>
        <p className="text-muted-foreground text-xl">
          Navegue pelas 10 experiências completas de Landing Page criadas sob a identidade visual oficial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {models.map((m) => (
          <Link href={`/landing/model-${m.id}`} key={m.id} className="block group">
            <div className="p-6 border border-border rounded-xl bg-card hover:border-primary/50 transition-colors h-full flex flex-col justify-between">
              <div>
                <div className="text-sm font-bold text-muted-foreground mb-2">MODELO {m.id}</div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{m.name}</h2>
                <p className="text-muted-foreground">{m.desc}</p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button variant="ghost" size="icon" className="group-hover:translate-x-2 transition-transform">
                  <ChevronRight className="w-5 h-5 text-primary" />
                </Button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
