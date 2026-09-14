import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Blocks,
  Globe,
  Headset,
  Mail,
  Calendar,
  ListChecks,
  Database,
  Zap,
  BarChart3,
  Settings,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import type { NavItem } from "./types";

/**
 * Sidebar navigation. Website, WhatsApp and Customer support are the only
 * shipped surfaces; the rest render muted with a "Coming soon" hint.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Websites", href: "/websites", icon: Globe },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageSquare },
  { label: "Customer Support", href: "/support", icon: Headset },
  { label: "Agents", href: "/agents", icon: Users, comingSoon: true },
  { label: "Chats", href: "/chats", icon: MessageSquare, comingSoon: true },
  // "Apps & Integrations" truncates next to the SOON badge; "Integrations"
  // carries the same meaning and fits.
  { label: "Integrations", href: "/apps", icon: Blocks, comingSoon: true },
  { label: "Emails", href: "/emails", icon: Mail, comingSoon: true },
  { label: "Calendar", href: "/calendar", icon: Calendar, comingSoon: true },
  { label: "Tasks", href: "/tasks", icon: ListChecks, comingSoon: true },
  {
    label: "Knowledge Base",
    href: "/knowledge",
    icon: Database,
    comingSoon: true,
  },
  { label: "Automation", href: "/automation", icon: Zap, comingSoon: true },
  { label: "Analytics", href: "/analytics", icon: BarChart3, comingSoon: true },
  { label: "Settings", href: "/settings", icon: Settings, comingSoon: true },
];

/** WhatsApp keeps its brand glyph from react-icons. */
export const WhatsAppIcon = FaWhatsapp;
