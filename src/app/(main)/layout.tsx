import NavBar from '@/components/ui/NavBar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-layout">
      <NavBar />
      <main className="page-container">
        {children}
      </main>
    </div>
  );
}
