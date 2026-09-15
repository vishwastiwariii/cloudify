import { Suspense } from "react";
import { AppShellProvider } from "@/components/app-shell/app-shell-context";
import { AppShellGate } from "@/components/app-shell/app-shell-gate";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { ModalRoot } from "@/components/app-shell/modal-root";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <AppShellGate>
        <div className="grid min-h-screen [grid-template-columns:264px_minmax(0,1fr)]">
          <Sidebar />
          <main className="flex min-w-0 flex-col">
            {/* useSearchParams in Topbar requires a Suspense boundary during static generation */}
            <Suspense>
              <Topbar />
            </Suspense>
            <div className="flex-1 px-7.5 pt-8.5 pb-15">{children}</div>
          </main>
        </div>
        <ModalRoot />
      </AppShellGate>
    </AppShellProvider>
  );
}
