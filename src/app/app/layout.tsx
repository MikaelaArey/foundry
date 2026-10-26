import { Chrome } from "@/components/chrome";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Chrome requireAuth next="/app">
      {children}
    </Chrome>
  );
}
