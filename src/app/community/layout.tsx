import { Chrome } from "@/components/chrome";

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <Chrome current="community">{children}</Chrome>;
}
