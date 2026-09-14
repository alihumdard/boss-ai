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
          {/* Plain flex column, normal flow: greeting (auto) -> network
              (flex-1, takes whatever is left) -> voice console (auto,
              content-sized). No grid fr-rows here — those forced the voice
              console's content into a fixed-height cell too short for it,
              which is what made the mic/rings/console overlap the network. */}
          <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </main>

          {/* Active Agents (flex-1, its own internal scroll) + System Status
              (fixed height) exactly fill this column, so it never needs to
              scroll itself and System Status is always fully visible. */}
          <aside className="hidden w-[350px] shrink-0 flex-col gap-4 overflow-hidden xl:flex">
            {rail}
          </aside>
        </div>
      </div>
    </div>
  );
}
