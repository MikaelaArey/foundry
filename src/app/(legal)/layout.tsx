import { Chrome } from "@/components/chrome";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Chrome>
      <article className="legal">{children}</article>
    </Chrome>
  );
}
