import {
  BookOpen,
  Building2,
  CalendarCheck2,
  CalendarDays,
  CogIcon,
  CreditCard,
  FileText,
  LayoutDashboard,
  LucideIcon,
  Mail,
  Settings,
  Star,
  Users,
} from "lucide-react";

export type AdminPortalRole = "ADMIN" | "SUPER_ADMIN";

export type SidebarItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  /** If set, only admins whose role is in this list will see the item. */
  roles?: AdminPortalRole[];
  subItems?: { label: string; href: string }[];
};

export const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  {
    icon: CalendarDays,
    label: "Events",
    href: "/admin/events",
    subItems: [
      { label: "All Events", href: "/admin/events" },
      { label: "Registrations", href: "/admin/registrations" },
    ],
  },
  {
    icon: Building2,
    label: "Organization",
    href: "/admin/organization",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/admin/settings",
    subItems: [
      { label: "Payment Settings", href: "/admin/settings/payment" },
      { label: "Account Settings", href: "/admin/settings" },
    ],
  },
];

/** Flat list for command palette search */
export const adminSearchItems = sidebarItems.flatMap((item) => {
  if (item.subItems?.length) {
    return item.subItems.map((sub) => ({
      label: sub.label,
      href: sub.href,
      icon: item.icon,
      group: item.label,
    }));
  }
  return [{ label: item.label, href: item.href, icon: item.icon, group: "Main" }];
});
