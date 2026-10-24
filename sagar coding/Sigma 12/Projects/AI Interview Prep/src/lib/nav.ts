import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Mic,
  Code2,
  BarChart3,
  ShieldCheck,
  User,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export type DashboardRoute =
  | 'overview'
  | 'resume'
  | 'mock'
  | 'voice'
  | 'sandbox'
  | 'analytics'
  | 'admin'
  | 'profile'
  | 'settings';

export interface NavItem {
  id: DashboardRoute;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  hidden?: boolean; // hidden from sidebar but routable
}

export const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'resume', label: 'Resume Prep', icon: FileText },
  { id: 'mock', label: 'AI Mock Interview', icon: MessageSquare },
  { id: 'voice', label: 'Voice Round', icon: Mic },
  { id: 'sandbox', label: 'Code Sandbox', icon: Code2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'admin', label: 'Admin Panel', icon: ShieldCheck, adminOnly: true },
  { id: 'profile', label: 'Profile & Settings', icon: User, hidden: true },
  { id: 'settings', label: 'Profile & Settings', icon: Settings, hidden: true },
];
