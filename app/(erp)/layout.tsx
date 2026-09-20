import Sidebar from "@/components/Sidebar";

export default function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden w-full print:block print:h-auto print:overflow-visible">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-16 md:pt-0 print:block print:overflow-visible print:pt-0">
        {children}
      </main>
    </div>
  );
}
