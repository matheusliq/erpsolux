export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden">
      {children}
    </div>
  );
}
