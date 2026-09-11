import { AppShell } from "@/components/shell/app-shell";
import { GreetingRow } from "@/components/shell/greeting-row";
import { VoiceStage } from "@/components/shell/voice-stage";
import { ActiveAgents } from "@/components/panels/active-agents";
import { StatsPanel } from "@/components/panels/stats-panel";
import { QuickActionsPanel } from "@/components/panels/quick-actions-panel";
import { RecentActivity } from "@/components/panels/recent-activity";
import { LiveConsole } from "@/components/panels/live-console";
import { UpcomingTasks } from "@/components/panels/upcoming-tasks";

export default function DashboardPage() {
  return (
    <AppShell
      rail={
        <>
          <ActiveAgents className="min-h-0 flex-1" />
          <StatsPanel className="shrink-0" />
          <QuickActionsPanel className="shrink-0" />
        </>
      }
    >
      <GreetingRow />
      <VoiceStage>
        <div className="mt-3 grid shrink-0 grid-cols-3 gap-4">
          <RecentActivity className="h-[200px]" />
          <LiveConsole className="h-[200px]" />
          <UpcomingTasks className="h-[200px]" />
        </div>
      </VoiceStage>
    </AppShell>
  );
}
