import {
  Globe,
  Headset,
  Mail,
  PenLine,
  BarChart3,
  Zap,
  Users,
  MessageSquare,
  CalendarClock,
  FileText,
  Send,
  type LucideIcon,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { AccentName, AgentStatus } from "./types";

type AnyIcon = LucideIcon | IconType;

/* ------------------------------------------------------------------ */
/* Agents                                                              */
/* ------------------------------------------------------------------ */

export interface Agent {
  id: string;
  name: string;
  /** Short capability line shown on the network card. */
  tagline: string;
  icon: AnyIcon;
  accent: AccentName;
  status: AgentStatus;
}

/**
 * Only the website, WhatsApp and customer-support agents are live.
 * Everything else is declared here so the UI can show what is planned,
 * but carries status "coming-soon".
 */
export const AGENTS: Agent[] = [
  {
    id: "website",
    name: "Website Agent",
    tagline: "Monitor · Respond · Optimize",
    icon: Globe,
    accent: "blue",
    status: "online",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Agent",
    tagline: "Message · Automate · Follow up",
    icon: FaWhatsapp,
    accent: "emerald",
    status: "online",
  },
  {
    id: "support",
    name: "Customer Support",
    tagline: "Handle Queries · AI Replies",
    icon: Headset,
    accent: "magenta",
    status: "online",
  },
  {
    id: "email",
    name: "Email Agent",
    tagline: "Read · Reply · Organize",
    icon: Mail,
    accent: "indigo",
    status: "coming-soon",
  },
  {
    id: "crm",
    name: "CRM & Leads",
    tagline: "Capture · Nurture · Convert",
    icon: Users,
    accent: "cyan-soft",
    status: "coming-soon",
  },
  {
    id: "content",
    name: "Content Creator",
    tagline: "Blog · Social · SEO",
    icon: PenLine,
    accent: "teal",
    status: "coming-soon",
  },
  {
    id: "calendar",
    name: "Calendar Agent",
    tagline: "Schedule · Remind · Plan",
    icon: CalendarClock,
    accent: "amber",
    status: "coming-soon",
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    tagline: "Track · Analyze · Report",
    icon: BarChart3,
    accent: "violet",
    status: "coming-soon",
  },
  {
    id: "automation",
    name: "Automation Agent",
    tagline: "Automate · Save Time",
    icon: Zap,
    accent: "rose",
    status: "coming-soon",
  },
];

/* ------------------------------------------------------------------ */
/* Stats — replaces the reference's CPU / Memory / Storage / Uptime    */
/* ------------------------------------------------------------------ */

export interface Stat {
  id: string;
  label: string;
  /** Absolute count for the period. */
  value: number;
  /** Share of `total`, used to fill the dial. Null renders a plain count. */
  total: number | null;
  accent: AccentName;
}

export const STATS: Stat[] = [
  {
    id: "conversations",
    label: "Conversations",
    value: 1284,
    total: null,
    accent: "cyan",
  },
  {
    id: "resolved",
    label: "Resolved by AI",
    value: 1042,
    total: 1284,
    accent: "emerald",
  },
  {
    id: "orders",
    label: "Orders answered",
    // Two words each, so every dial label wraps cleanly onto two lines
    // rather than breaking mid-phrase.
    value: 316,
    total: 1284,
    accent: "violet",
  },
  {
    id: "handed-off",
    label: "Handed to human",
    value: 242,
    total: 1284,
    accent: "amber",
  },
];

export const STATS_PERIOD = "Last 30 days";

/* ------------------------------------------------------------------ */
/* Recent activity                                                     */
/* ------------------------------------------------------------------ */

export interface ActivityItem {
  id: string;
  text: string;
  timeAgo: string;
  icon: AnyIcon;
  accent: AccentName;
}

export const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "a1",
    text: "Replied to customer on WhatsApp",
    timeAgo: "2 min ago",
    icon: FaWhatsapp,
    accent: "emerald",
  },
  {
    id: "a2",
    text: "New website inquiry received",
    timeAgo: "8 min ago",
    icon: Globe,
    accent: "blue",
  },
  {
    id: "a3",
    text: "Support ticket resolved by AI",
    timeAgo: "15 min ago",
    icon: Headset,
    accent: "magenta",
  },
  {
    id: "a4",
    text: "Order #2417 confirmed with customer",
    timeAgo: "32 min ago",
    icon: FileText,
    accent: "cyan",
  },
  {
    id: "a5",
    text: "Conversation handed to human agent",
    timeAgo: "1 hour ago",
    icon: Users,
    accent: "amber",
  },
];

/* ------------------------------------------------------------------ */
/* Live console                                                        */
/* ------------------------------------------------------------------ */

/** What kind of event a console line reports — drives its colour. */
export type ConsoleLineKind = "info" | "agent" | "success" | "warning";

export interface ConsoleLine {
  id: string;
  timestamp: string;
  message: string;
  kind: ConsoleLineKind;
}

/**
 * Seed lines shown before the mock stream (below) starts generating more.
 * Kept short: the stream is what gives the console its "live" feel.
 */
export const CONSOLE_LINES: ConsoleLine[] = [
  { id: "c1", timestamp: "12:43:01", message: "BOSS initialized successfully.", kind: "success" },
  { id: "c2", timestamp: "12:43:02", message: "Connecting to WhatsApp...", kind: "info" },
  { id: "c3", timestamp: "12:43:03", message: "Website agent online.", kind: "success" },
];

/**
 * A rotating pool of plausible events, grouped by what BOSS is doing. The
 * console picks from `idle` most of the time and switches pools while
 * listening/thinking/speaking so the log visibly reflects the orb's state
 * rather than running an unrelated ticker beside it.
 */
export const CONSOLE_EVENT_POOL: Record<
  "idle" | "listening" | "thinking" | "speaking",
  { message: string; kind: ConsoleLineKind }[]
> = {
  idle: [
    { message: "New inquiry detected from website.", kind: "info" },
    { message: "Routing to Website agent...", kind: "agent" },
    { message: "Reply sent successfully.", kind: "success" },
    { message: "WhatsApp message received.", kind: "info" },
    { message: "Routing to WhatsApp agent...", kind: "agent" },
    { message: "Order #2417 confirmed with customer.", kind: "success" },
    { message: "Support ticket opened.", kind: "info" },
    { message: "Routing to Customer Support agent...", kind: "agent" },
    { message: "Support query resolved.", kind: "success" },
    { message: "Queue depth normal.", kind: "info" },
    { message: "No response after 2 attempts — escalating.", kind: "warning" },
    { message: "Conversation handed to human agent.", kind: "warning" },
    { message: "Awaiting next event...", kind: "info" },
  ],
  listening: [
    { message: "Listening...", kind: "agent" },
    { message: "Capturing audio stream.", kind: "info" },
    { message: "Transcribing speech...", kind: "agent" },
  ],
  thinking: [
    { message: "Thinking...", kind: "agent" },
    { message: "Routing to Website agent...", kind: "agent" },
    { message: "Composing response...", kind: "agent" },
  ],
  speaking: [
    { message: "Speaking...", kind: "agent" },
    { message: "Reply sent.", kind: "success" },
  ],
};

/* ------------------------------------------------------------------ */
/* Upcoming tasks                                                      */
/* ------------------------------------------------------------------ */

export interface TaskItem {
  id: string;
  title: string;
  due: string;
  done: boolean;
}

export const UPCOMING_TASKS: TaskItem[] = [
  { id: "t1", title: "Follow up with new leads", due: "Today, 2:00 PM", done: false },
  { id: "t2", title: "Update website content", due: "Today, 4:00 PM", done: false },
  { id: "t3", title: "Review support transcripts", due: "Tomorrow, 10:00 AM", done: false },
  { id: "t4", title: "Check unanswered orders", due: "Tomorrow, 12:00 PM", done: false },
  { id: "t5", title: "Weekly performance review", due: "Tomorrow, 3:00 PM", done: false },
];

/* ------------------------------------------------------------------ */
/* Quick actions (right rail)                                          */
/* ------------------------------------------------------------------ */

export interface QuickAction {
  id: string;
  label: string;
  icon: AnyIcon;
  accent: AccentName;
  /** Non-live actions render muted with a "Soon" hint. */
  live: boolean;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { id: "q1", label: "Send WhatsApp", icon: Send, accent: "emerald", live: true },
  { id: "q2", label: "Manage Website", icon: Globe, accent: "blue", live: true },
  { id: "q3", label: "Open Inbox", icon: MessageSquare, accent: "magenta", live: true },
  { id: "q4", label: "Support Queue", icon: Headset, accent: "cyan", live: true },
  // Kept short: with the "Soon" badge alongside, longer labels truncate in
  // the two-column quick-actions grid.
  { id: "q5", label: "Content", icon: PenLine, accent: "teal", live: false },
  { id: "q6", label: "Analytics", icon: BarChart3, accent: "violet", live: false },
];

export const TAGLINE =
  "Intelligence is not just information, but the ability to use it.";
