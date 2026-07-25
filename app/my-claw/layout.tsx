import { MyClawProvider } from "@/components/my-claw/provider";
import { MyClawShell } from "@/components/my-claw/shell/my-claw-shell";

export default function MyClawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MyClawProvider>
      <div className="h-screen overflow-hidden bg-slate-50">
        <MyClawShell>{children}</MyClawShell>
      </div>
    </MyClawProvider>
  );
}
