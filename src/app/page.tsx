import { AppShell } from "@/components/shell/app-shell";
import { VoiceStage } from "@/components/shell/voice-stage";
import { UpcomingTasks } from "@/components/panels/upcoming-tasks";
import { RecentActivity } from "@/components/panels/recent-activity";

export default function DashboardPage() {
  return (
    <AppShell
      rail={
        <>
          {/* Right column: Upcoming Tasks -> Recent Activity. Quick Actions
              was cut (not needed) and the Active Agents list is gone for
              good — live vs coming-soon status is already shown on the
              agent network. */}
          <UpcomingTasks className="min-h-0 flex-1" enterDelayMs={0} />
          <RecentActivity className="min-h-0 flex-1" enterDelayMs={60} />
        </>
      }
    >
      <VoiceStage />
    </AppShell>
  );
}
