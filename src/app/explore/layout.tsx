import { Chrome } from "@/components/chrome";

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <Chrome current="explore">{children}</Chrome>;
}
