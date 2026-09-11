import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

interface AppShellProps {
  /** Centre column: greeting, agent network, bottom panels, command bar. */
  children: ReactNode;
  /** Right rail: active agents, system status, quick actions. */
  rail: ReactNode;
}

export function AppShell({ children, rail }: AppShellProps) {
  return (
    <div className="relative z-10 flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />

        {/* Centre + right rail */}
        <div className="flex min-h-0 flex-1 gap-5 overflow-hidden px-6 py-5">
          <main className="scrollbar-none relative flex min-w-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>

          <aside className="hidden w-[350px] shrink-0 flex-col gap-4 overflow-hidden xl:flex">
            {rail}
          </aside>
        </div>
      </div>
    </div>
  );
}
