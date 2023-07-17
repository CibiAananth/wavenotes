import ThemeToggle from '@/components/ui/theme-toggle';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 h-screen">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h2 className="text-3xl font-semibold">Bienvenue!</h2>
      <h3 className="text-md mt-2">
        Create recordings and get transcriptions in real-time
      </h3>
      {children}
    </div>
  );
}
